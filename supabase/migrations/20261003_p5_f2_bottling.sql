-- MERAMU P5 — F2 / BOTTLING
-- One operational bottling record per production batch.

create table if not exists public.batch_bottling (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.batches(id) on delete cascade,
    bottling_date timestamptz not null default now(),
    bottle_size_ml numeric(10,2) not null check (bottle_size_ml > 0),
    planned_bottles integer null check (planned_bottles is null or planned_bottles >= 0),
    actual_bottles integer not null check (actual_bottles > 0),
    output_volume_l numeric(14,3) not null check (output_volume_l >= 0),
    waste_volume_l numeric(14,3) not null default 0 check (waste_volume_l >= 0),
    variant_name text null,
    operator_name text not null,
    notes text null,
    bottling_status text not null default 'completed'
        check (bottling_status in ('draft','completed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_batch_bottling_batch unique (batch_id)
);

create index if not exists idx_batch_bottling_batch_id
    on public.batch_bottling(batch_id);

create index if not exists idx_batch_bottling_date
    on public.batch_bottling(bottling_date);

alter table public.batch_bottling enable row level security;

drop policy if exists batch_bottling_select on public.batch_bottling;
drop policy if exists batch_bottling_insert on public.batch_bottling;
drop policy if exists batch_bottling_update on public.batch_bottling;

do $$ begin
    create policy batch_bottling_select
        on public.batch_bottling
        for select
        to anon, authenticated
        using (true);

    create policy batch_bottling_insert
        on public.batch_bottling
        for insert
        to anon, authenticated
        with check (true);

    create policy batch_bottling_update
        on public.batch_bottling
        for update
        to anon, authenticated
        using (true)
        with check (true);
exception when duplicate_object then null;
end $$;
