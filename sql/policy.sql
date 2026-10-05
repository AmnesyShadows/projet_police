CREATE POLICY "Allow anon to read agents"
ON public.agents
FOR SELECT
TO anon
USING (true);