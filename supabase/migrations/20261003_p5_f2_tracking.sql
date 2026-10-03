-- MERAMU P5 — F2 / Bottling lifecycle tracking
alter table public.batches
    add column if not exists f2_started_at timestamptz null,
    add column if not exists f2_completed_at timestamptz null;

create index if not exists idx_batches_f2_started_at
    on public.batches(f2_started_at);

create index if not exists idx_batches_f2_completed_at
    on public.batches(f2_completed_at);
