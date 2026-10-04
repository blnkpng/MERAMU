-- =========================================================
-- MERAMU D1 — SAFE DELETE BATCH
--
-- Permanently deletes a batch ONLY when no table with a foreign-key
-- dependency currently contains rows for that batch.
-- Child/process data is NEVER deleted automatically.
-- =========================================================

drop function if exists public.delete_meramu_batch(uuid);

create or replace function public.delete_meramu_batch(
    p_batch_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_batch public.batches%rowtype;
    v_child_count bigint;
    v_blockers jsonb := '[]'::jsonb;
    v_fk record;
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
            'message', 'Batch tidak ditemukan.'
        );
    end if;

    -- Discover every single-column FK in the database that points to batches.id.
    -- This is safer than maintaining a hard-coded list as new production modules
    -- are added later.
    for v_fk in
        select
            n.nspname as schema_name,
            c.relname as table_name,
            a.attname as column_name
        from pg_constraint con
        join pg_class c
          on c.oid = con.conrelid
        join pg_namespace n
          on n.oid = c.relnamespace
        join pg_class parent
          on parent.oid = con.confrelid
        join pg_namespace parent_n
          on parent_n.oid = parent.relnamespace
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
        order by n.nspname, c.relname, a.attname
    loop
        execute format(
            'select count(*) from %I.%I where %I = $1',
            v_fk.schema_name,
            v_fk.table_name,
            v_fk.column_name
        )
        into v_child_count
        using p_batch_id;

        if coalesce(v_child_count, 0) > 0 then
            v_blockers := v_blockers || jsonb_build_array(
                jsonb_build_object(
                    'table', v_fk.table_name,
                    'column', v_fk.column_name,
                    'count', v_child_count
                )
            );
        end if;
    end loop;

    if jsonb_array_length(v_blockers) > 0 then
        return jsonb_build_object(
            'ok', false,
            'code', 'HAS_DEPENDENCIES',
            'batch_id', v_batch.id,
            'batch_code', v_batch.batch_code,
            'blockers', v_blockers,
            'message', 'Batch belum bisa dihapus karena masih memiliki data proses yang terhubung.'
        );
    end if;

    begin
        delete from public.batches
         where id = p_batch_id;

        if not found then
            return jsonb_build_object(
                'ok', false,
                'code', 'NOT_DELETED',
                'message', 'Batch tidak berhasil dihapus.'
            );
        end if;

        return jsonb_build_object(
            'ok', true,
            'code', 'DELETED',
            'batch_id', v_batch.id,
            'batch_code', v_batch.batch_code,
            'message', 'Batch berhasil dihapus permanen.'
        );

    exception
        when foreign_key_violation then
            return jsonb_build_object(
                'ok', false,
                'code', 'DEPENDENCY_DETECTED',
                'batch_id', v_batch.id,
                'batch_code', v_batch.batch_code,
                'message', 'Batch tidak dapat dihapus karena masih direferensikan oleh data lain.'
            );
    end;
end;
$$;

revoke all on function public.delete_meramu_batch(uuid) from public;
grant execute on function public.delete_meramu_batch(uuid) to anon, authenticated;
