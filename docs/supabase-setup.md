# Supabase Configuration Guide

## Database Schema

### Users Table
```sql
create table public.users (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Grants Table
```sql
create table public.grants (
  id uuid default uuid_generate_v4() primary key,
  opportunity_id text unique,
  opportunity_number text,
  title text not null,
  category text,
  funding_type text,
  activity_category text[],
  eligible_applicants text[],
  agency_name text,
  agency_code text,
  post_date timestamp with time zone,
  close_date timestamp with time zone,
  total_funding bigint,
  award_ceiling bigint,
  award_floor bigint,
  cost_sharing boolean default false,
  description text,
  additional_info_url text,
  grantor_contact_name text,
  grantor_contact_email text,
  grantor_contact_phone text,
  processing_status text not null default 'not_processed' check (processing_status in ('processed', 'not_processed')),
  source text not null default 'grants.gov',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on column grants.processing_status is 'Indicates whether the grant has been processed by AI for text cleaning';
comment on column grants.source is 'Indicates the source of the grant data (e.g., grants.gov, Horizon Europe)';
```

### Pipeline Runs Table
```sql
create table public.pipeline_runs (
  id uuid default uuid_generate_v4() primary key,
  status text not null check (status in ('completed', 'failed', 'in_progress')),
  details jsonb default '{}'::jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### User Preferences Table
```sql
create table public.user_preferences (
  user_id uuid references public.users primary key,
  notification_settings jsonb default '{}'::jsonb,
  search_preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Authentication Setup

### Configuration
1. Enable Email Authentication
2. Configure Password Reset
3. Set up OAuth Providers (if needed)
4. Configure Email Templates

### Row Level Security (RLS)
```sql
-- Users table RLS
alter table public.users enable row level security;

create policy "Users can view their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);

-- Grants table RLS
alter table public.grants enable row level security;

create policy "Grants are viewable by all authenticated users"
  on public.grants for select
  using (auth.role() = 'authenticated');

-- User Preferences RLS
alter table public.user_preferences enable row level security;

create policy "Users can manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id);
```

## Database Functions

### Search Function
```sql
create function public.search_grants(
  search_query text,
  min_amount numeric default null,
  max_amount numeric default null,
  deadline_after timestamp with time zone default null
) returns setof public.grants
language sql
security definer
as $$
  select *
  from public.grants
  where
    (search_query is null or
     title ilike '%' || search_query || '%' or
     description ilike '%' || search_query || '%')
    and (min_amount is null or funding_amount >= min_amount)
    and (max_amount is null or funding_amount <= max_amount)
    and (deadline_after is null or deadline >= deadline_after)
  order by deadline asc;
$$;
```

## Indexes
```sql
-- Grants table indexes
create index grants_title_idx on public.grants using gin (to_tsvector('english', title));
create index grants_description_idx on public.grants using gin (to_tsvector('english', description));
create index grants_deadline_idx on public.grants (close_date);
create index grants_funding_amount_idx on public.grants (total_funding);
create index grants_opportunity_id_idx on public.grants (opportunity_id);
create index grants_processing_status_idx on public.grants (processing_status);
create index grants_source_idx on public.grants (source);

-- Users table indexes
create index users_email_idx on public.users (email);
```

## Triggers
```sql
-- Updated at trigger
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.grants
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.user_preferences
  for each row
  execute function public.set_updated_at();
```

## Backup Configuration
- Enable Point-in-Time Recovery
- Configure Daily Backups
- Set Backup Retention Period
- Configure Backup Notifications

## Security Settings
- Enable SSL Enforcement
- Configure Network Restrictions
- Set up Database Passwords
- Configure Connection Pooling

## Monitoring
- Enable Query Performance Insights
- Set up Database Alerts
- Configure Log Management
- Enable Performance Analytics

## API Configuration
- Generate API Keys
- Configure CORS Settings
- Set up Rate Limiting
- Enable API Documentation