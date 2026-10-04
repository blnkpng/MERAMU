-- =========================================================
-- MERAMU D1 FINAL — DELETE ENTIRE PRODUCTION
--
-- Production/Batch is the root of the operational production tree.
-- When a production is deleted, all production-owned child/process data
-- is deleted in one transaction. Master data (products, recipes,
-- recipe versions, ingredients, units, etc.) is NEVER deleted here.
--
-- p_execute = false -> preview only
-- p_execute = true  -> permanent delete
-- =========================================================

drop function if exists public.delete_meramu_production(uuid, boolean);

create or replace function public.delete_meramu_production(
    p_batch_id uuid,
    p_execute boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_batch public.batches%rowtype;
    v_finished_units bigint := 0;
    v_finished_batches bigint := 0;
    v_legacy_bottling bigint := 0;
    v_harvest_allocations bigint := 0;
    v_batch_allocations bigint := 0;
    v_batch_bottling bigint := 0;
    v_quality_checks bigint := 0;
    v_fermentation_logs bigint := 0;
    v_other_direct bigint := 0;
    v_total bigint := 0;
    v_fk record;
    v_deleted bigint := 0;
    v_detail jsonb;
begin
    select *
      into v_batch
      from public.batches
     where id = p_batch_id
     for update;

    if not found then
        return jsonb_build_object(
            'ok', false,
            'code', 'NOT_FOUND',
            'message', 'Produksi tidak ditemukan.'
        );
    end if;

    -- =====================================================
    -- PREVIEW COUNTS
    -- =====================================================
    select count(*) into v_fermentation_logs
      from public.fermentation_logs
     where batch_id = p_batch_id;

    select count(*) into v_quality_checks
      from public.quality_checks
     where batch_id = p_batch_id;

    select count(*) into v_batch_bottling
      from public.batch_bottling
     where batch_id = p_batch_id;

    select count(*) into v_batch_allocations
      from public.batch_allocations
     where batch_id = p_batch_id;

    select count(*) into v_harvest_allocations
      from public.harvest_allocations
     where batch_id = p_batch_id;

    select count(*) into v_legacy_bottling
      from public.bottling_batches bb
     where bb.allocation_id in (
         select ha.id
           from public.harvest_allocations ha
          where ha.batch_id = p_batch_id
     );

    select count(*) into v_finished_batches
      from public.finished_batches fb
     where fb.batch_id = p_batch_id
        or fb.allocation_id in (
            select ha.id
              from public.harvest_allocations ha
             where ha.batch_id = p_batch_id
        )
        or fb.bottling_batch_id in (
            select bb.id
              from public.bottling_batches bb
             where bb.allocation_id in (
                 select ha.id
                   from public.harvest_allocations ha
                  where ha.batch_id = p_batch_id
             )
        );

    select count(*) into v_finished_units
      from public.finished_units fu
     where fu.finished_batch_id in (
         select fb.id
           from public.finished_batches fb
          where fb.batch_id = p_batch_id
             or fb.allocation_id in (
                 select ha.id
                   from public.harvest_allocations ha
                  where ha.batch_id = p_batch_id
             )
             or fb.bottling_batch_id in (
                 select bb.id
                   from public.bottling_batches bb
                  where bb.allocation_id in (
                      select ha.id
                        from public.harvest_allocations ha
                       where ha.batch_id = p_batch_id
                  )
             )
     );

    -- Any other direct FK to batches is still part of the production tree.
    -- It is counted here so newly-added production modules are not silently
    -- left behind. Master tables are normally not children of batches.
    for v_fk in
        select
            n.nspname as schema_name,
            c.relname as table_name,
            a.attname as column_name
        from pg_constraint con
        join pg_class c on c.oid = con.conrelid
        join pg_namespace n on n.oid = c.relnamespace
        join pg_class parent on parent.oid = con.confrelid
        join pg_namespace parent_n on parent_n.oid = parent.relnamespace
        join pg_attribute a
          on a.attrelid = c.oid
         and a.attnum = con.conkey[1]
        where con.contype = 'f'
          and parent_n.nspname = 'public'
          and parent.relname = 'batches'
          and array_length(con.conkey, 1) = 1
          and array_length(con.confkey, 1) = 1
          and c.relkind = 'r'
          and not (n.nspname = 'public' and c.relname = 'batches')
          and c.relname not in (
              'fermentation_logs',
              'quality_checks',
              'batch_bottling',
              'batch_allocations',
              'harvest_allocations',
              'finished_batches'
          )
    loop
        execute format(
            'select count(*) from %I.%I where %I = $1',
            v_fk.schema_name,
            v_fk.table_name,
            v_fk.column_name
        ) into v_deleted using p_batch_id;

        v_other_direct := v_other_direct + coalesce(v_deleted, 0);
    end loop;

    v_total := 1
        + v_fermentation_logs
        + v_quality_checks
        + v_batch_bottling
        + v_batch_allocations
        + v_harvest_allocations
        + v_legacy_bottling
        + v_finished_batches
        + v_finished_units
        + v_other_direct;

    v_detail := jsonb_build_object(
        'production_batches', 1,
        'fermentation_logs', v_fermentation_logs,
        'quality_checks', v_quality_checks,
        'batch_bottling', v_batch_bottling,
        'batch_allocations', v_batch_allocations,
        'harvest_allocations', v_harvest_allocations,
        'bottling_batches', v_legacy_bottling,
        'finished_batches', v_finished_batches,
        'finished_units', v_finished_units,
        'other_direct_batch_dependencies', v_other_direct,
        'total_rows', v_total
    );

    if not p_execute then
        return jsonb_build_object(
            'ok', true,
            'code', 'PREVIEW',
            'batch_id', v_batch.id,
            'batch_code', v_batch.batch_code,
            'current_stage', v_batch.current_stage,
            'status', v_batch.status,
            'will_delete', v_detail,
            'message', 'Preview penghapusan produksi berhasil dibuat.'
        );
    end if;

    -- =====================================================
    -- PERMANENT DELETE — CHILDREN FIRST
    -- =====================================================
    -- Finished Units -> Finished Batch -> legacy Bottling -> Harvest Allocation
    delete from public.finished_units fu
     where fu.finished_batch_id in (
         select fb.id
           from public.finished_batches fb
          where fb.batch_id = p_batch_id
             or fb.allocation_id in (
                 select ha.id from public.harvest_allocations ha where ha.batch_id = p_batch_id
             )
             or fb.bottling_batch_id in (
                 select bb.id
                   from public.bottling_batches bb
                  where bb.allocation_id in (
                      select ha.id from public.harvest_allocations ha where ha.batch_id = p_batch_id
                  )
             )
     );

    delete from public.finished_batches fb
     where fb.batch_id = p_batch_id
        or fb.allocation_id in (
            select ha.id from public.harvest_allocations ha where ha.batch_id = p_batch_id
        )
        or fb.bottling_batch_id in (
            select bb.id
              from public.bottling_batches bb
             where bb.allocation_id in (
                 select ha.id from public.harvest_allocations ha where ha.batch_id = p_batch_id
             )
        );

    delete from public.bottling_batches bb
     where bb.allocation_id in (
         select ha.id from public.harvest_allocations ha where ha.batch_id = p_batch_id
     );

    delete from public.harvest_allocations
     where batch_id = p_batch_id;

    -- New P7 allocation + P5 operational bottling.
    delete from public.batch_allocations
     where batch_id = p_batch_id;

    delete from public.batch_bottling
     where batch_id = p_batch_id;

    -- F1/F2/QC process records.
    delete from public.quality_checks
     where batch_id = p_batch_id;

    delete from public.fermentation_logs
     where batch_id = p_batch_id;

    -- Delete any additional single-column direct FK rows pointing to this batch.
    -- This catches future production tables without touching master data.
    for v_fk in
        select
            n.nspname as schema_name,
            c.relname as table_name,
            a.attname as column_name
        from pg_constraint con
        join pg_class c on c.oid = con.conrelid
        join pg_namespace n on n.oid = c.relnamespace
        join pg_class parent on parent.oid = con.confrelid
        join pg_namespace parent_n on parent_n.oid = parent.relnamespace
        join pg_attribute a
          on a.attrelid = c.oid
         and a.attnum = con.conkey[1]
        where con.contype = 'f'
          and parent_n.nspname = 'public'
          and parent.relname = 'batches'
          and array_length(con.conkey, 1) = 1
          and array_length(con.confkey, 1) = 1
          and c.relkind = 'r'
          and not (n.nspname = 'public' and c.relname = 'batches')
          and c.relname not in (
              'fermentation_logs',
              'quality_checks',
              'batch_bottling',
              'batch_allocations',
              'harvest_allocations',
              'finished_batches'
          )
    loop
        execute format(
            'delete from %I.%I where %I = $1',
            v_fk.schema_name,
            v_fk.table_name,
            v_fk.column_name
        ) using p_batch_id;
    end loop;

    delete from public.batches
     where id = p_batch_id;

    if not found then
        raise exception 'Produksi % tidak berhasil dihapus.', v_batch.batch_code;
    end if;

    return jsonb_build_object(
        'ok', true,
        'code', 'DELETED',
        'batch_id', v_batch.id,
        'batch_code', v_batch.batch_code,
        'deleted', v_detail,
        'message', 'Seluruh data produksi berhasil dihapus. Master data tetap aman.'
    );

exception
    when foreign_key_violation then
        return jsonb_build_object(
            'ok', false,
            'code', 'DELETE_BLOCKED',
            'batch_id', p_batch_id,
            'batch_code', v_batch.batch_code,
            'message', 'Produksi tidak dapat dihapus karena masih memiliki relasi database yang belum ditangani. Tidak ada perubahan yang disimpan.'
        );
end;
$$;

revoke all on function public.delete_meramu_production(uuid, boolean) from public;
grant execute on function public.delete_meramu_production(uuid, boolean) to anon, authenticated;
