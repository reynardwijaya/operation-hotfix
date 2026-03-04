-- Operation Hotfix - Initial DB Setup
-- Run this in Supabase SQL Editor

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text not null check (status in ('Pending', 'In Transit', 'Delivered')),
  cargo_details jsonb not null
);

alter table shipments enable row level security;

-- Allow anon to update shipment status
create policy "Allow anon update"
  on shipments
  for update
  using (true)
  with check (true);

-- Seed data
insert into shipments (status, cargo_details) values
  ('Pending',    '{"item": "Laptop Batch A", "weight_kg": 120}'),
  ('In Transit', '{"item": "Medical Supplies", "weight_kg": 45}'),
  ('Delivered',  '{"item": "Office Furniture", "weight_kg": 310}'),
  ('Pending',    '{"item": "Raw Chemicals", "weight_kg": 890}'),
  ('In Transit', '{"item": "Electronic Components", "weight_kg": 67}');
