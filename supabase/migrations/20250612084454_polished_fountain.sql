/*
  # Add authentication policy for teachers table

  1. Security Changes
    - Add policy to allow anonymous users to query teachers table for authentication
    - This is required for the custom login flow to work
    
  2. Important Security Note
    - This policy allows reading teacher credentials for authentication
    - In production, passwords should be hashed and this should use a secure function
    - Consider using Supabase's built-in auth or a secure edge function for production
*/

-- Allow anonymous users to select from teachers table for authentication
CREATE POLICY "Allow anon select for custom login"
  ON public.teachers
  FOR SELECT
  TO anon
  USING (true);