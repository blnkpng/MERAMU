-- MERAMU P7 — ALLOCATION / ALOKASI HASIL PANEN
-- Harvest tetap menjadi sumber volume. Allocation hanya membagi volume
-- hasil panen menjadi rencana produk/kemasan untuk proses Finished berikutnya.

create table if not exists public.batch_allocations (
    id uuid primary key default gen_random_uuid(),
    allocation_code text not null unique,
    batch_id uuid not null references public.batches(id) on delete cascade,
    product_id uuid null references public.products(id) on delete restrict,
    allocation_date timestamptz not null default now(),
    allocated_volume numeric(14,3) not null check (allocated_volume > 0),
    bottle_size_ml numeric(10,2) not null check (bottle_size_ml > 0),
    planned_bottles integer not null check (planned_bottles > 0),
    variant_name text null,
    operator_name text not null,
    notes text null,
    status text not null default 'planned'
        check (status in ('planned','completed','cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_batch_allocations_batch_id
    on public.batch_allocations(batch_id);

create index if not exists idx_batch_allocations_product_id
    on public.batch_allocations(product_id);

create index if not exists idx_batch_allocations_date
    on public.batch_allocations(allocation_date);

alter table public.batch_allocations enable row level security;

drop policy if exists batch_allocations_select on public.batch_allocations;
drop policy if exists batch_allocations_insert on public.batch_allocations;
drop policy if exists batch_allocations_update on public.batch_allocations;

create policy batch_allocations_select
on public.batch_allocations
for select to anon, authenticated
using (true);

create policy batch_allocations_insert
on public.batch_allocations
for insert to anon, authenticated
with check (true);

create policy batch_allocations_update
on public.batch_allocations
for update to anon, authenticated
using (true)
with check (true);

grant select, insert, update on public.batch_allocations to anon, authenticated;

create or replace function public.create_meramu_allocation(
    p_batch_id uuid,
    p_allocation_date timestamptz,
    p_allocated_volume numeric,
    p_bottle_size_ml numeric,
    p_planned_bottles integer,
    p_variant_name text default null,
    p_operator_name text default null,
    p_notes text default null,
    p_product_id uuid default null
)
returns public.batch_allocations
language plpgsql
security definer
set search_path = public
as $$
declare
    v_batch public.batches%rowtype;
    v_existing numeric := 0;
    v_allocation public.batch_allocations%rowtype;
    v_code text;
    v_seq integer;
begin
    if p_allocated_volume is null or p_allocated_volume <= 0 then
        raise exception 'Volume alokasi harus lebih dari 0 L.';
    end if;

    if p_bottle_size_ml is null or p_bottle_size_ml <= 0 then
        raise exception 'Ukuran botol harus lebih dari 0 ml.';
    end if;

    if p_planned_bottles is null or p_planned_bottles <= 0 then
        raise exception 'Rencana botol harus lebih dari 0.';
    end if;

    if nullif(trim(coalesce(p_operator_name, '')), '') is null then
        raise exception 'Operator wajib diisi.';
    end if;

    select * into v_batch
    from public.batches
    where id = p_batch_id
    for update;

    if not found then
        raise exception 'Batch tidak ditemukan.';
    end if;

    if lower(coalesce(v_batch.current_stage, '')) <> 'harvest' then
        raise exception 'Batch % belum berada di stage Harvest.', v_batch.batch_code;
    end if;

    if v_batch.actual_harvest_at is null or v_batch.harvest_volume is null then
        raise exception 'Actual Harvest batch % belum dicatat.', v_batch.batch_code;
    end if;

    select coalesce(sum(allocated_volume), 0)
    into v_existing
    from public.batch_allocations
    where batch_id = p_batch_id
      and status <> 'cancelled';

    if v_existing + p_allocated_volume > v_batch.harvest_volume + 0.0005 then
        raise exception 'Volume alokasi (%) melebihi sisa hasil panen (% L).',
            p_allocated_volume, greatest(v_batch.harvest_volume - v_existing, 0);
    end if;

    select count(*) + 1
    into v_seq
    from public.batch_allocations
    where batch_id = p_batch_id;

    v_code := 'AL-' || v_batch.batch_code || '-' || lpad(v_seq::text, 2, '0');

    insert into public.batch_allocations (
        allocation_code,
        batch_id,
        product_id,
        allocation_date,
        allocated_volume,
        bottle_size_ml,
        planned_bottles,
        variant_name,
        operator_name,
        notes,
        status,
        created_at,
        updated_at
    ) values (
        v_code,
        p_batch_id,
        coalesce(p_product_id, v_batch.product_id),
        coalesce(p_allocation_date, now()),
        p_allocated_volume,
        p_bottle_size_ml,
        p_planned_bottles,
        nullif(trim(coalesce(p_variant_name, '')), ''),
        nullif(trim(coalesce(p_operator_name, '')), ''),
        nullif(trim(coalesce(p_notes, '')), ''),
        'planned',
        now(),
        now()
    )
    returning * into v_allocation;

    return v_allocation;
end;
$$;

revoke all on function public.create_meramu_allocation(
    uuid, timestamptz, numeric, numeric, integer, text, text, text, uuid
) from public;

grant execute on function public.create_meramu_allocation(
    uuid, timestamptz, numeric, numeric, integer, text, text, text, uuid
) to anon, authenticated;
