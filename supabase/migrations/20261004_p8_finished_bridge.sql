-- =========================================================
-- MERAMU P8 FINAL HOTFIX — legacy bottling bridge
-- =========================================================
-- P5 uses public.batch_bottling.
-- The existing Finished schema still requires
-- public.finished_batches.bottling_batch_id -> public.bottling_batches.id.
--
-- We keep both tables. This migration creates a small compatibility
-- record in bottling_batches for each P8 Finished Batch, while the real
-- F2 operational source remains batch_bottling.
-- =========================================================

-- Existing legacy table requires packaging_ingredient_id, but P8 does not
-- manage packaging ingredients. Make only this legacy field nullable so
-- P8 can create a traceable bridge without inventing a packaging item.
alter table public.bottling_batches
    alter column packaging_ingredient_id drop not null;


-- =========================================================
-- Replace P8 create function
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
    -- -------------------------------------------------------
    -- 1. Lock the P7 allocation and source batch.
    -- -------------------------------------------------------
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

    -- -------------------------------------------------------
    -- 2. Real P5 bottling record is the source of packaging.
    -- -------------------------------------------------------
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

    -- P7 allocation must not manufacture more bottles than the actual
    -- F2 bottling result.
    if v_allocation.planned_bottles > v_bottling.actual_bottles then
        raise exception
            'Allocation % meminta % botol, tetapi Bottling F2 hanya menghasilkan % botol.',
            v_allocation.allocation_code,
            v_allocation.planned_bottles,
            v_bottling.actual_bottles;
    end if;

    -- -------------------------------------------------------
    -- 3. Product + shelf life.
    -- -------------------------------------------------------
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

    -- -------------------------------------------------------
    -- 4. Idempotency: return an already-created Finished Batch.
    -- -------------------------------------------------------
    select * into v_finished
    from public.finished_batches
    where allocation_id = v_allocation.id
    limit 1;

    if found then
        return v_finished;
    end if;

    -- -------------------------------------------------------
    -- 5. Compatibility bridge:
    --    batch_allocation -> harvest_allocation -> bottling_batches
    -- -------------------------------------------------------
    select * into v_harvest_allocation
    from public.harvest_allocations
    where batch_id = v_batch.id
      and product_id = coalesce(v_allocation.product_id, v_batch.product_id)
      and status in ('draft', 'completed')
    order by created_at desc
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
            ) returning * into v_harvest_allocation;
        end if;
    end if;

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
        ) returning * into v_legacy_bottling;
    end if;

    -- -------------------------------------------------------
    -- 6. Finished Batch.
    -- -------------------------------------------------------
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
        v_allocation.id,
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
        v_allocation.notes,
        now(),
        now()
    ) returning * into v_finished;

    -- -------------------------------------------------------
    -- 7. One traceable unit per finished bottle.
    -- -------------------------------------------------------
    for v_i in 1..v_allocation.planned_bottles loop
        v_trace := v_code || '-' || lpad(v_i::text, 3, '0');

        insert into public.finished_units (
            finished_batch_id,
            unit_number,
            trace_code,
            status,
            created_at,
            updated_at
        ) values (
            v_finished.id,
            v_i,
            v_trace,
            'available',
            now(),
            now()
        );
    end loop;

    -- -------------------------------------------------------
    -- 8. Complete allocation + batch only after everything works.
    -- -------------------------------------------------------
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
