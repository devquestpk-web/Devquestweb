-- Securely auto-assign the 'student' role if requested during signup

CREATE OR REPLACE FUNCTION public.create_member_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
  assigned_role TEXT;
BEGIN
  -- Read the requested role from the user metadata provided during signup
  requested_role := NEW.raw_user_meta_data ->> 'role';
  
  -- For security, only allow the 'student' role to be auto-assigned.
  -- Team and Admin roles must be manually assigned by an administrator.
  -- By default, any new signup (including Google Auth) becomes a 'student'.
  IF requested_role = 'team' OR requested_role = 'admin' THEN
    assigned_role := 'member';
  ELSE
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
