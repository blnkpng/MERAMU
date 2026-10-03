-- MERAMU P8 HOTFIX
-- Compatibility with existing finished_batches.bottling_batch_id

alter table public.finished_batches
    add column if not exists bottling_batch_id uuid;

create index if not exists idx_finished_batches_bottling_batch_id
    on public.finished_batches(bottling_batch_id);

drop function if exists public.create_meramu_p8_finished_from_allocation(uuid);

create or replace function public.create_meramu_p8_finished_from_allocation(
    p_allocation_id uuid
)
returns public.finished_batches
language plpgsql
security definer
set search_path = public
as $$
declare
    v_allocation public.batch_allocations%rowtype;
    v_batch public.batches%rowtype;
    v_product public.products%rowtype;
    v_bottling public.batch_bottling%rowtype;
    v_finished public.finished_batches%rowtype;
    v_product_shelf integer;
    v_recipe_shelf integer;
    v_shelf integer;
    v_production_date date;
    v_code text;
    v_seq integer;
    v_i integer;
    v_trace text;
begin
    select * into v_allocation from public.batch_allocations where id = p_allocation_id for update;
    if not found then raise exception 'Allocation tidak ditemukan.'; end if;
    if coalesce(v_allocation.status, '') <> 'planned' then
        raise exception 'Allocation % sudah berstatus % dan tidak dapat diproses ulang.', v_allocation.allocation_code, v_allocation.status;
    end if;

    select * into v_batch from public.batches where id = v_allocation.batch_id for update;
    if not found then raise exception 'Batch sumber allocation tidak ditemukan.'; end if;
    if lower(coalesce(v_batch.current_stage, '')) <> 'harvest' then
        raise exception 'Batch % harus berada di Harvest sebelum menjadi Finished.', v_batch.batch_code;
    end if;
    if v_allocation.planned_bottles <= 0 or v_allocation.bottle_size_ml <= 0 then
        raise exception 'Data jumlah botol atau ukuran botol tidak valid.';
    end if;

    select * into v_bottling
    from public.batch_bottling
    where batch_id = v_batch.id and bottling_status = 'completed'
    order by bottling_date desc limit 1;
    if not found then
        raise exception 'Bottling F2 untuk batch % belum ditemukan/selesai.', v_batch.batch_code;
    end if;

    select * into v_product from public.products where id = coalesce(v_allocation.product_id, v_batch.product_id);
    v_product_shelf := null; v_recipe_shelf := null;
    if v_product.id is not null then v_product_shelf := v_product.shelf_life_days; end if;
    if v_batch.recipe_version_id is not null then
        select rv.shelf_life_days into v_recipe_shelf from public.recipe_versions rv where rv.id = v_batch.recipe_version_id;
    end if;
    v_shelf := coalesce(v_product_shelf, v_recipe_shelf, 30);
    v_production_date := coalesce(v_allocation.allocation_date::date, current_date);

    select * into v_finished from public.finished_batches where allocation_id = v_allocation.id limit 1;
    if found then return v_finished; end if;

    select count(*) + 1 into v_seq from public.finished_batches where finished_code like 'FG-' || to_char(v_production_date, 'YYYYMMDD') || '-%';
    v_code := 'FG-' || to_char(v_production_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');

    insert into public.finished_batches (
        finished_code, batch_id, allocation_id, product_id, bottling_batch_id, status,
        quantity_bottles, bottle_size_ml, output_volume, waste_volume, production_date,
        best_before_date, expiry_date, operator_name, notes, created_at, updated_at
    ) values (
        v_code, v_batch.id, v_allocation.id, coalesce(v_allocation.product_id, v_batch.product_id), v_bottling.id, 'finished',
        v_allocation.planned_bottles, v_allocation.bottle_size_ml,
        round((v_allocation.planned_bottles * v_allocation.bottle_size_ml) / 1000.0, 3),
        greatest(v_allocation.allocated_volume - ((v_allocation.planned_bottles * v_allocation.bottle_size_ml) / 1000.0), 0),
        v_production_date, v_production_date + v_shelf, v_production_date + v_shelf,
        v_allocation.operator_name, v_allocation.notes, now(), now()
    ) returning * into v_finished;

    for v_i in 1..v_allocation.planned_bottles loop
        v_trace := v_code || '-' || lpad(v_i::text, 3, '0');
        insert into public.finished_units (finished_batch_id, unit_number, trace_code, status, created_at, updated_at)
        values (v_finished.id, v_i, v_trace, 'available', now(), now());
    end loop;

    update public.batch_allocations set status = 'completed', updated_at = now() where id = v_allocation.id;
    update public.batches set current_stage = 'completed', status = 'completed', updated_at = now() where id = v_batch.id and current_stage = 'harvest';
    return v_finished;
end;
$$;

revoke all on function public.create_meramu_p8_finished_from_allocation(uuid) from public;
grant execute on function public.create_meramu_p8_finished_from_allocation(uuid) to anon, authenticated;
