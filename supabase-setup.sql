-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tenants table
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  aadhar_number text,
  pan_number text,
  aadhar_file_url text,
  pan_file_url text,
  house_number text not null,
  house_location text,
  monthly_rent numeric(10,2) not null,
  advance_amount numeric(10,2) default 0,
  agreement_start_date date,
  rent_due_day integer,
  has_spouse boolean default false,
  has_children boolean default false,
  children_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Create rent_payments table
create table rent_payments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  month date not null,
  expected_date date not null,
  paid_date date,
  amount numeric(10,2) not null,
  payment_mode text,
  remarks text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table tenants enable row level security;
alter table rent_payments enable row level security;

-- Create policies for tenants
create policy "User can manage own tenants"
on tenants
for all
using (auth.uid() = user_id);

-- Create policies for rent_payments
create policy "User can manage own rent payments"
on rent_payments
for all
using (
  exists (
    select 1 from tenants
    where tenants.id = rent_payments.tenant_id
    and tenants.user_id = auth.uid()
  )
);

-- ============================================
-- STORAGE SETUP
-- ============================================

-- Create storage bucket for tenant files
insert into storage.buckets (id, name, public)
values ('tenant-files', 'tenant-files', true)
on conflict (id) do nothing;

-- Create storage policy for authenticated users to upload files
create policy "Allow authenticated uploads to tenant-files"
on storage.objects
for insert
with check (
  bucket_id = 'tenant-files' 
  and auth.role() = 'authenticated'
);

-- Create storage policy for authenticated users to view files
create policy "Allow authenticated view of tenant-files"
on storage.objects
for select
using (
  bucket_id = 'tenant-files' 
  and auth.role() = 'authenticated'
);

-- Create storage policy for authenticated users to delete their own files
create policy "Allow authenticated delete of tenant-files"
on storage.objects
for delete
using (
  bucket_id = 'tenant-files' 
  and auth.role() = 'authenticated'
);
