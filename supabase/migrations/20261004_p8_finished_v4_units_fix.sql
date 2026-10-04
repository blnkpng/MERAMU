
-- =========================================================
-- MERAMU P8 V4 HOTFIX
-- FIX: finished_units.bottle_size_ml is required by the live database.
-- Rebuilds the P8 RPC while preserving the V3 FK/bridge fixes.
-- =========================================================

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
    v_harvest_allocation public.harvest_allocations%rowtype;
    v_legacy_bottling public.bottling_batches%rowtype;
    v_finished public.finished_batches%rowtype;
    v_product_shelf integer;
    v_recipe_shelf integer;
    v_shelf integer;
    v_production_date date;
    v_code text;
    v_seq integer;
    v_i integer;
    v_trace text;
    v_harvest_code text;
    v_output numeric(14,3);
    v_waste numeric(14,3);
begin
    -- 1. P7 allocation
    select * into v_allocation
    from public.batch_allocations
    where id = p_allocation_id
    for update;

    if not found then
        raise exception 'Allocation tidak ditemukan.';
    end if;

    if coalesce(v_allocation.status, '') <> 'planned' then
        raise exception 'Allocation % sudah berstatus % dan tidak dapat diproses ulang.',
            v_allocation.allocation_code, v_allocation.status;
    end if;

    select * into v_batch
    from public.batches
    where id = v_allocation.batch_id
    for update;

    if not found then
        raise exception 'Batch sumber allocation tidak ditemukan.';
    end if;

    if lower(coalesce(v_batch.current_stage, '')) <> 'harvest' then
        raise exception 'Batch % harus berada di Harvest sebelum menjadi Finished.', v_batch.batch_code;
    end if;

    if coalesce(v_allocation.planned_bottles, 0) <= 0
       or coalesce(v_allocation.bottle_size_ml, 0) <= 0 then
        raise exception 'Data jumlah botol atau ukuran botol tidak valid.';
    end if;

    -- 2. Real P5 bottling is the production source.
    select * into v_bottling
    from public.batch_bottling
    where batch_id = v_batch.id
      and bottling_status = 'completed'
    order by bottling_date desc
    limit 1;

    if not found then
        raise exception 'Bottling F2 untuk batch % belum ditemukan/selesai.', v_batch.batch_code;
    end if;

    if coalesce(v_bottling.actual_bottles, 0) <= 0
       or coalesce(v_bottling.output_volume_l, 0) <= 0 then
        raise exception 'Output Bottling F2 untuk batch % tidak valid.', v_batch.batch_code;
    end if;

    if v_allocation.planned_bottles > v_bottling.actual_bottles then
        raise exception
            'Allocation % meminta % botol, tetapi Bottling F2 hanya menghasilkan % botol.',
            v_allocation.allocation_code,
            v_allocation.planned_bottles,
            v_bottling.actual_bottles;
    end if;

    -- 3. Product + shelf life.
    select * into v_product
    from public.products
    where id = coalesce(v_allocation.product_id, v_batch.product_id);

    v_product_shelf := null;
    v_recipe_shelf := null;

    if v_product.id is not null then
        v_product_shelf := v_product.shelf_life_days;
    end if;

    if v_batch.recipe_version_id is not null then
        select rv.shelf_life_days into v_recipe_shelf
        from public.recipe_versions rv
        where rv.id = v_batch.recipe_version_id;
    end if;

    v_shelf := coalesce(v_product_shelf, v_recipe_shelf, 30);
    v_production_date := coalesce(v_allocation.allocation_date::date, current_date);

    -- 4. Find the harvest allocation that satisfies the legacy FK.
    --    Existing KB-033 harvest allocation is preferred.
    select * into v_harvest_allocation
    from public.harvest_allocations
    where batch_id = v_batch.id
      and product_id = coalesce(v_allocation.product_id, v_batch.product_id)
      and status in ('draft', 'completed')
    order by
        case
            when allocation_code = 'ALLOC-' || v_batch.batch_code || '-01' then 0
            else 1
        end,
        created_at desc
    limit 1;

    if not found then
        v_harvest_code := 'ALLOC-' || v_batch.batch_code || '-P8';

        select * into v_harvest_allocation
        from public.harvest_allocations
        where allocation_code = v_harvest_code
        limit 1;

        if not found then
            insert into public.harvest_allocations (
                batch_id,
                product_id,
                allocation_code,
                allocated_volume,
                output_volume,
                status,
                notes,
                created_at,
                updated_at
            ) values (
                v_batch.id,
                coalesce(v_allocation.product_id, v_batch.product_id),
                v_harvest_code,
                v_allocation.allocated_volume,
                v_bottling.output_volume_l,
                'completed',
                'P8 compatibility bridge dari Batch Allocation ' || v_allocation.allocation_code,
                now(),
                now()
            )
            returning * into v_harvest_allocation;
        end if;
    end if;

    -- 5. Legacy bottling bridge.
    select * into v_legacy_bottling
    from public.bottling_batches
    where allocation_id = v_harvest_allocation.id
    order by created_at desc
    limit 1;

    if not found then
        v_output := round(
            (v_allocation.planned_bottles * v_allocation.bottle_size_ml) / 1000.0,
            3
        );
        v_waste := greatest(v_allocation.allocated_volume - v_output, 0);

        insert into public.bottling_batches (
            allocation_id,
            packaging_ingredient_id,
            bottle_size_ml,
            planned_bottles,
            actual_bottles,
            actual_output_volume,
            waste_volume,
            packaging_cost,
            bulk_hpp,
            total_hpp,
            hpp_per_bottle,
            status,
            bottling_date,
            operator_name,
            notes,
            created_at,
            updated_at
        ) values (
            v_harvest_allocation.id,
            null,
            v_allocation.bottle_size_ml,
            v_allocation.planned_bottles,
            v_allocation.planned_bottles,
            v_output,
            v_waste,
            0,
            0,
            0,
            0,
            'completed',
            v_bottling.bottling_date,
            coalesce(v_allocation.operator_name, v_bottling.operator_name),
            coalesce(v_allocation.notes, v_bottling.notes),
            now(),
            now()
        )
        returning * into v_legacy_bottling;
    end if;

    -- 6. Idempotency: finished_batches.allocation_id is the HARVEST allocation.
    select * into v_finished
    from public.finished_batches
    where allocation_id = v_harvest_allocation.id
    limit 1;

    if found then
        return v_finished;
    end if;

    select count(*) + 1 into v_seq
    from public.finished_batches
    where finished_code like 'FG-' || to_char(v_production_date, 'YYYYMMDD') || '-%';

    v_code := 'FG-' || to_char(v_production_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');

    v_output := round(
        (v_allocation.planned_bottles * v_allocation.bottle_size_ml) / 1000.0,
        3
    );
    v_waste := greatest(v_allocation.allocated_volume - v_output, 0);

    insert into public.finished_batches (
        finished_code,
        batch_id,
        allocation_id,
        product_id,
        bottling_batch_id,
        status,
        quantity_bottles,
        bottle_size_ml,
        output_volume,
        waste_volume,
        production_date,
        best_before_date,
        expiry_date,
        operator_name,
        notes,
        created_at,
        updated_at
    ) values (
        v_code,
        v_batch.id,
        v_harvest_allocation.id, -- IMPORTANT: FK -> harvest_allocations.id
        coalesce(v_allocation.product_id, v_batch.product_id),
        v_legacy_bottling.id,
        'finished',
        v_allocation.planned_bottles,
        v_allocation.bottle_size_ml,
        v_output,
        v_waste,
        v_production_date,
        v_production_date + v_shelf,
        v_production_date + v_shelf,
        v_allocation.operator_name,
        coalesce(v_allocation.notes, 'P8 dari ' || v_allocation.allocation_code),
        now(),
        now()
    )
    returning * into v_finished;

    for v_i in 1..v_allocation.planned_bottles loop
        v_trace := v_code || '-' || lpad(v_i::text, 3, '0');

        insert into public.finished_units (
            finished_batch_id,
            unit_number,
            trace_code,
            status,
            bottle_size_ml,
            created_at,
            updated_at
        ) values (
            v_finished.id,
            v_i,
            v_trace,
            'available',
            v_allocation.bottle_size_ml,
            now(),
            now()
        );
    end loop;

    update public.batch_allocations
    set status = 'completed',
        updated_at = now()
    where id = v_allocation.id;

    update public.batches
    set current_stage = 'completed',
        status = 'completed',
        updated_at = now()
    where id = v_batch.id
      and current_stage = 'harvest';

    return v_finished;
end;
$$;

revoke all on function public.create_meramu_p8_finished_from_allocation(uuid) from public;
grant execute on function public.create_meramu_p8_finished_from_allocation(uuid) to anon, authenticated;


-- Pending list must check the legacy FK relation through the batch,
-- not compare harvest_allocations.id with batch_allocations.id.
drop function if exists public.get_meramu_p8_pending_allocations();

create or replace function public.get_meramu_p8_pending_allocations()
returns table (
    id uuid,
    allocation_code text,
    batch_id uuid,
    batch_code text,
    product_id uuid,
    product_name text,
    allocation_date timestamptz,
    allocated_volume numeric,
    bottle_size_ml numeric,
    planned_bottles integer,
    variant_name text,
    operator_name text,
    notes text,
    status text
)
language sql
security definer
set search_path = public
as $$
    select
        a.id,
        a.allocation_code,
        a.batch_id,
        b.batch_code,
        a.product_id,
        p.name,
        a.allocation_date,
        a.allocated_volume,
        a.bottle_size_ml,
        a.planned_bottles,
        a.variant_name,
        a.operator_name,
        a.notes,
        a.status
    from public.batch_allocations a
    join public.batches b on b.id = a.batch_id
    left join public.products p on p.id = a.product_id
    where a.status = 'planned'
      and not exists (
          select 1
          from public.finished_batches fb
          where fb.batch_id = a.batch_id
            and fb.status <> 'cancelled'
      )
    order by a.allocation_date desc, a.created_at desc;
$$;

grant execute on function public.get_meramu_p8_pending_allocations() to anon, authenticated;
