-- Insert missing profile for existing user
INSERT INTO public.profiles (user_id, display_name, onboarding_completed)
VALUES ('a8588c4d-9028-4c7b-b3d8-e96bea1ff94b', 'nickjptaylor@gmail.com', true)
ON CONFLICT (user_id) DO UPDATE SET onboarding_completed = true;

-- Ensure the trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();