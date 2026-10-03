-- MERAMU P4 — F1 tracking
alter table public.batches
    add column if not exists f1_started_at timestamptz null,
    add column if not exists f1_completed_at timestamptz null;

create index if not exists idx_batches_f1_started_at on public.batches(f1_started_at);
create index if not exists idx_batches_f1_completed_at on public.batches(f1_completed_at);
