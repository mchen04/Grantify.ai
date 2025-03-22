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
  title text not null,
  description text,
  funding_amount numeric,
  deadline timestamp with time zone,
  eligibility_criteria text,
  application_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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
create index grants_deadline_idx on public.grants (deadline);
create index grants_funding_amount_idx on public.grants (funding_amount);

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