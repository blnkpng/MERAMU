-- =========================================================
-- MERAMU P8 — ALLOCATION -> FINISHED / PRODUK JADI
-- =========================================================
-- P8 converts a planned batch allocation into a Finished Batch
-- and creates one traceable Finished Unit per planned bottle.
-- The batch is moved from Harvest to completed only after the
-- Finished Batch and all units are created successfully.

create table if not exists public.finished_batches (
    id uuid primary key default gen_random_uuid(),
    finished_code text not null unique,
    batch_id uuid not null references public.batches(id) on delete restrict,
    allocation_id uuid null references public.batch_allocations(id) on delete restrict,
    product_id uuid null references public.products(id) on delete restrict,
    status text not null default 'finished',
    quantity_bottles integer not null check (quantity_bottles > 0),
    bottle_size_ml numeric(10,2) not null check (bottle_size_ml > 0),
    output_volume numeric(14,3) not null check (output_volume >= 0),
    waste_volume numeric(14,3) not null default 0 check (waste_volume >= 0),
    production_date date not null default current_date,
    best_before_date date null,
    expiry_date date null,
    operator_name text null,
    notes text null,
    status_reason text null,
    released_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.finished_batches add column if not exists finished_code text;
alter table public.finished_batches add column if not exists batch_id uuid;
alter table public.finished_batches add column if not exists allocation_id uuid;
alter table public.finished_batches add column if not exists bottling_batch_id uuid;
alter table public.finished_batches add column if not exists product_id uuid;
alter table public.finished_batches add column if not exists status text default 'finished';
alter table public.finished_batches add column if not exists quantity_bottles integer;
alter table public.finished_batches add column if not exists bottle_size_ml numeric(10,2);
alter table public.finished_batches add column if not exists output_volume numeric(14,3);
alter table public.finished_batches add column if not exists waste_volume numeric(14,3) default 0;
alter table public.finished_batches add column if not exists production_date date default current_date;
alter table public.finished_batches add column if not exists best_before_date date;
alter table public.finished_batches add column if not exists expiry_date date;
alter table public.finished_batches add column if not exists operator_name text;
alter table public.finished_batches add column if not exists notes text;
alter table public.finished_batches add column if not exists status_reason text;
alter table public.finished_batches add column if not exists released_at timestamptz;
alter table public.finished_batches add column if not exists created_at timestamptz default now();
alter table public.finished_batches add column if not exists updated_at timestamptz default now();

create unique index if not exists uq_finished_batches_finished_code
    on public.finished_batches(finished_code);
create index if not exists idx_finished_batches_batch_id
    on public.finished_batches(batch_id);
create index if not exists idx_finished_batches_allocation_id
    on public.finished_batches(allocation_id);
create index if not exists idx_finished_batches_bottling_batch_id
    on public.finished_batches(bottling_batch_id);
create index if not exists idx_finished_batches_product_id
    on public.finished_batches(product_id);

create table if not exists public.finished_units (
    id uuid primary key default gen_random_uuid(),
    finished_batch_id uuid not null references public.finished_batches(id) on delete cascade,
    unit_number integer not null check (unit_number > 0),
    trace_code text not null unique,
    status text not null default 'available',
    status_reason text null,
    status_changed_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.finished_units add column if not exists finished_batch_id uuid;
alter table public.finished_units add column if not exists unit_number integer;
alter table public.finished_units add column if not exists trace_code text;
alter table public.finished_units add column if not exists status text default 'available';
alter table public.finished_units add column if not exists status_reason text;
alter table public.finished_units add column if not exists status_changed_at timestamptz;
alter table public.finished_units add column if not exists created_at timestamptz default now();
alter table public.finished_units add column if not exists updated_at timestamptz default now();

create unique index if not exists uq_finished_units_trace_code
    on public.finished_units(trace_code);
create unique index if not exists uq_finished_units_batch_number
    on public.finished_units(finished_batch_id, unit_number);
create index if not exists idx_finished_units_batch_id
    on public.finished_units(finished_batch_id);

alter table public.finished_batches enable row level security;
alter table public.finished_units enable row level security;

drop policy if exists finished_batches_select on public.finished_batches;
drop policy if exists finished_batches_insert on public.finished_batches;
drop policy if exists finished_batches_update on public.finished_batches;
drop policy if exists finished_units_select on public.finished_units;
drop policy if exists finished_units_insert on public.finished_units;
drop policy if exists finished_units_update on public.finished_units;

create policy finished_batches_select on public.finished_batches
for select to anon, authenticated using (true);
create policy finished_batches_insert on public.finished_batches
for insert to anon, authenticated with check (true);
create policy finished_batches_update on public.finished_batches
for update to anon, authenticated using (true) with check (true);

create policy finished_units_select on public.finished_units
for select to anon, authenticated using (true);
create policy finished_units_insert on public.finished_units
for insert to anon, authenticated with check (true);
create policy finished_units_update on public.finished_units
for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.finished_batches to anon, authenticated;
grant select, insert, update on public.finished_units to anon, authenticated;

-- =========================================================
-- Pending allocations
-- =========================================================

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
          where fb.allocation_id = a.id
      )
    order by a.allocation_date desc, a.created_at desc;
$$;

grant execute on function public.get_meramu_p8_pending_allocations() to anon, authenticated;

-- =========================================================
-- Create Finished from Allocation
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
    v_finished public.finished_batches%rowtype;
    v_bottling public.batch_bottling%rowtype;
    v_product_shelf integer;
    v_recipe_shelf integer;
    v_shelf integer;
    v_production_date date;
    v_code text;
    v_seq integer;
    v_i integer;
    v_trace text;
begin
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

    if v_allocation.planned_bottles <= 0 or v_allocation.bottle_size_ml <= 0 then
        raise exception 'Data jumlah botol atau ukuran botol tidak valid.';
    end if;

    -- Compatibility with the existing MERAMU finished_batches schema.
    -- Older versions require bottling_batch_id to be populated.
    select * into v_bottling
    from public.batch_bottling
    where batch_id = v_batch.id
      and bottling_status = 'completed'
    order by bottling_date desc
    limit 1;

    if not found then
        raise exception 'Bottling F2 untuk batch % belum ditemukan/selesai.', v_batch.batch_code;
    end if;

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

    -- Idempotency guard for repeated clicks / double submissions.
    select * into v_finished
    from public.finished_batches
    where allocation_id = v_allocation.id
    limit 1;

    if found then
        return v_finished;
    end if;

    select count(*) + 1
    into v_seq
    from public.finished_batches
    where finished_code like 'FG-' || to_char(v_production_date, 'YYYYMMDD') || '-%';

    v_code := 'FG-' || to_char(v_production_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');

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
        v_bottling.id,
        'finished',
        v_allocation.planned_bottles,
        v_allocation.bottle_size_ml,
        round((v_allocation.planned_bottles * v_allocation.bottle_size_ml) / 1000.0, 3),
        greatest(v_allocation.allocated_volume - ((v_allocation.planned_bottles * v_allocation.bottle_size_ml) / 1000.0), 0),
        v_production_date,
        v_production_date + v_shelf,
        v_production_date + v_shelf,
        v_allocation.operator_name,
        v_allocation.notes,
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

-- =========================================================
-- Finished reads
-- =========================================================

drop function if exists public.get_meramu_p8_finished_batches();
create or replace function public.get_meramu_p8_finished_batches()
returns table (
    id uuid,
    finished_code text,
    batch_id uuid,
    allocation_id uuid,
    product_id uuid,
    product_code text,
    product_name text,
    product_category text,
    status text,
    quantity_bottles integer,
    bottle_size_ml numeric,
    output_volume numeric,
    waste_volume numeric,
    production_date date,
    best_before_date date,
    expiry_date date,
    operator_name text,
    notes text,
    status_reason text,
    released_at timestamptz
)
language sql
security definer
set search_path = public
as $$
    select
        fb.id,
        fb.finished_code,
        fb.batch_id,
        fb.allocation_id,
        fb.product_id,
        p.code,
        p.name,
        p.category,
        fb.status,
        fb.quantity_bottles,
        fb.bottle_size_ml,
        fb.output_volume,
        fb.waste_volume,
        fb.production_date,
        fb.best_before_date,
        fb.expiry_date,
        fb.operator_name,
        fb.notes,
        fb.status_reason,
        fb.released_at
    from public.finished_batches fb
    left join public.products p on p.id = fb.product_id
    order by fb.production_date desc, fb.created_at desc;
$$;

grant execute on function public.get_meramu_p8_finished_batches() to anon, authenticated;

drop function if exists public.get_meramu_p8_finished_units(uuid);
create or replace function public.get_meramu_p8_finished_units(p_finished_batch_id uuid)
returns table (
    id uuid,
    finished_batch_id uuid,
    unit_number integer,
    trace_code text,
    status text,
    status_reason text,
    status_changed_at timestamptz,
    bottle_size_ml numeric,
    product_name text,
    best_before_date date,
    expiry_date date
)
language sql
security definer
set search_path = public
as $$
    select
        fu.id,
        fu.finished_batch_id,
        fu.unit_number,
        fu.trace_code,
        fu.status,
        fu.status_reason,
        fu.status_changed_at,
        fb.bottle_size_ml,
        p.name,
        fb.best_before_date,
        fb.expiry_date
    from public.finished_units fu
    join public.finished_batches fb on fb.id = fu.finished_batch_id
    left join public.products p on p.id = fb.product_id
    where fu.finished_batch_id = p_finished_batch_id
    order by fu.unit_number asc;
$$;

grant execute on function public.get_meramu_p8_finished_units(uuid) to anon, authenticated;

-- =========================================================
-- Status updates
-- =========================================================

drop function if exists public.update_meramu_p8_finished_status(uuid,text,text);
create or replace function public.update_meramu_p8_finished_status(
    p_finished_batch_id uuid,
    p_new_status text,
    p_reason text default null
)
returns public.finished_batches
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.finished_batches%rowtype;
    v_status text := lower(trim(coalesce(p_new_status, '')));
begin
    if v_status not in ('finished','released','hold','cancelled') then
        raise exception 'Status Finished tidak valid: %.', p_new_status;
    end if;

    select * into v_row from public.finished_batches where id = p_finished_batch_id for update;
    if not found then raise exception 'Finished Batch tidak ditemukan.'; end if;

    if lower(coalesce(v_row.status,'')) = 'released' then
        raise exception 'Finished Batch % sudah RELEASED dan terkunci.', v_row.finished_code;
    end if;

    update public.finished_batches
    set status = v_status,
        status_reason = nullif(trim(coalesce(p_reason,'')), ''),
        released_at = case when v_status = 'released' then coalesce(released_at, now()) else released_at end,
        updated_at = now()
    where id = v_row.id
    returning * into v_row;

    return v_row;
end;
$$;

grant execute on function public.update_meramu_p8_finished_status(uuid,text,text) to anon, authenticated;

drop function if exists public.update_meramu_p8_finished_unit_status(uuid,text,text);
create or replace function public.update_meramu_p8_finished_unit_status(
    p_finished_unit_id uuid,
    p_new_status text,
    p_reason text default null
)
returns public.finished_units
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.finished_units%rowtype;
    v_status text := lower(trim(coalesce(p_new_status, '')));
begin
    if v_status not in ('done','damaged','expired') then
        raise exception 'Status bottle tidak valid: %.', p_new_status;
    end if;

    select * into v_row from public.finished_units where id = p_finished_unit_id for update;
    if not found then raise exception 'Finished unit tidak ditemukan.'; end if;

    if lower(coalesce(v_row.status,'')) <> 'available' then
        raise exception 'Bottle % sudah % dan terkunci.', v_row.trace_code, upper(v_row.status);
    end if;

    update public.finished_units
    set status = v_status,
        status_reason = nullif(trim(coalesce(p_reason,'')), ''),
        status_changed_at = now(),
        updated_at = now()
    where id = v_row.id
    returning * into v_row;

    return v_row;
end;
$$;

grant execute on function public.update_meramu_p8_finished_unit_status(uuid,text,text) to anon, authenticated;

-- =========================================================
-- Public trace helpers for P8. These do not expose HPP/costs.
-- =========================================================

drop function if exists public.get_meramu_p8_public_trace(text);
create or replace function public.get_meramu_p8_public_trace(p_trace_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'product', jsonb_build_object(
            'name', p.name,
            'code', p.code,
            'category', p.category,
            'bottle_size_ml', fb.bottle_size_ml
        ),
        'finished', jsonb_build_object(
            'finished_code', fb.finished_code,
            'status', fb.status,
            'production_date', fb.production_date,
            'best_before_date', fb.best_before_date,
            'expiry_date', fb.expiry_date
        ),
        'bottle', jsonb_build_object(
            'trace_code', fu.trace_code,
            'unit_number', fu.unit_number,
            'status', fu.status
        ),
        'bottling', jsonb_build_object(
            'bottle_size_ml', bb.bottle_size_ml,
            'actual_bottles', bb.actual_bottles
        ),
        'allocation', jsonb_build_object(
            'allocation_code', ba.allocation_code,
            'allocated_volume', ba.allocated_volume,
            'variant_name', ba.variant_name
        ),
        'harvest', jsonb_build_object(
            'volume', b.harvest_volume,
            'date', b.actual_harvest_at
        )
    )
    from public.finished_units fu
    join public.finished_batches fb on fb.id = fu.finished_batch_id
    left join public.products p on p.id = fb.product_id
    left join public.batch_allocations ba on ba.id = fb.allocation_id
    left join public.batch_bottling bb on bb.batch_id = fb.batch_id
    left join public.batches b on b.id = fb.batch_id
    where fu.trace_code = p_trace_code
    limit 1;
$$;

grant execute on function public.get_meramu_p8_public_trace(text) to anon, authenticated;
