-- Create trigger function to handle new user creation
create or replace function public.handle_auth_user_created()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users    
  for each row execute function public.handle_auth_user_created();

-- Enable RLS but allow the trigger to work
alter table public.users enable row level security;

-- Ensure basic policies exist
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Auth trigger can create user" on public.users
  for insert with check (true);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);