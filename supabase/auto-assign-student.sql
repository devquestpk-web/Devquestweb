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
  -- Any other role (like 'admin' or 'team') will default to 'member'.
  IF requested_role = 'student' THEN
    assigned_role := 'student';
  ELSE
    assigned_role := 'member';
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
