-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set proper ownership of trigger function
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Users table security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_select_self ON users;
DROP POLICY IF EXISTS users_insert_trigger ON users;
DROP POLICY IF EXISTS users_insert_self ON users;
DROP POLICY IF EXISTS users_update_self ON users;
DROP POLICY IF EXISTS users_service_role ON users;

-- Create policies
CREATE POLICY users_select_self ON users
  FOR SELECT USING (auth.uid() = id);  -- Users can only read their own data

CREATE POLICY users_insert_trigger ON users
  FOR INSERT WITH CHECK (true);  -- Allow trigger to insert new users

CREATE POLICY users_insert_self ON users
  FOR INSERT WITH CHECK (auth.uid() = id);  -- Users can insert their own records

CREATE POLICY users_update_self ON users
  FOR UPDATE USING (auth.uid() = id);  -- Users can only update their own data

-- Allow service role full access
CREATE POLICY users_service_role ON users
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions to service role
GRANT ALL ON users TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;