-- MERAMU P6 — ACTUAL HARVEST
-- Records the actual harvest result after F2 bottling is completed.
-- This migration intentionally keeps the batch in `harvest`;
-- Allocation / Finished is a later lifecycle step.

alter table public.batches
    add column if not exists harvest_ready_at timestamptz null,
    add column if not exists actual_harvest_at timestamptz null,
    add column if not exists harvest_volume numeric(14,3) null,
    add column if not exists harvest_operator text null,
    add column if not exists harvest_notes text null;

create index if not exists idx_batches_actual_harvest_at
    on public.batches(actual_harvest_at);

create or replace function public.complete_meramu_harvest(
    p_batch_id uuid,
    p_actual_harvest_at timestamptz,
    p_harvest_volume numeric,
    p_harvest_operator text default null,
    p_harvest_notes text default null
)
returns public.batches
language plpgsql
security definer
set search_path = public
as $$
declare
    v_batch public.batches%rowtype;
    v_bottling public.batch_bottling%rowtype;
begin
    if p_harvest_volume is null or p_harvest_volume <= 0 then
        raise exception 'Volume panen harus lebih dari 0 L.';
    end if;

    select *
    into v_batch
    from public.batches
    where id = p_batch_id
    for update;

    if not found then
        raise exception 'Batch tidak ditemukan.';
    end if;

    if lower(coalesce(v_batch.current_stage, '')) <> 'harvest' then
        raise exception 'Batch % belum berada di stage Harvest.', v_batch.batch_code;
    end if;

    if v_batch.actual_harvest_at is not null then
        raise exception 'Actual Harvest batch % sudah pernah dicatat.', v_batch.batch_code;
    end if;

    select *
    into v_bottling
    from public.batch_bottling
    where batch_id = p_batch_id
      and bottling_status = 'completed'
    limit 1;

    if not found then
        raise exception 'Bottling F2 belum selesai untuk batch %.', v_batch.batch_code;
    end if;

    if v_bottling.output_volume_l is not null
       and p_harvest_volume > v_bottling.output_volume_l + 0.0005 then
        raise exception 'Volume panen (%) melebihi output Bottling F2 (% L).',
            p_harvest_volume, v_bottling.output_volume_l;
    end if;

    update public.batches
    set actual_harvest_at = coalesce(p_actual_harvest_at, now()),
        harvest_ready_at = coalesce(harvest_ready_at, now()),
        harvest_volume = p_harvest_volume,
        harvest_operator = nullif(trim(coalesce(p_harvest_operator, '')), ''),
        harvest_notes = nullif(trim(coalesce(p_harvest_notes, '')), ''),
        status = case when lower(coalesce(status, '')) = 'cancelled' then status else 'active' end,
        updated_at = now()
    where id = p_batch_id
    returning * into v_batch;

    return v_batch;
end;
$$;

revoke all on function public.complete_meramu_harvest(
    uuid, timestamptz, numeric, text, text
) from public;

grant execute on function public.complete_meramu_harvest(
    uuid, timestamptz, numeric, text, text
) to anon, authenticated;
