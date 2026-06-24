-- Remove the old signup trigger that was trying to insert into the non-existent "profiles" table
-- This trigger causes a database error "Database error saving new user" during registration.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
