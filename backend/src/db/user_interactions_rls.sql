-- Create policy to allow public users to create their own interactions
CREATE POLICY "Allow public users to create their own interactions"
ON user_interactions FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow public users to update their own interactions
CREATE POLICY "Allow public users to update their own interactions"
ON user_interactions FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- Create policy to allow public users to read their own interactions
CREATE POLICY "Allow public users to read their own interactions"
ON user_interactions FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Create policy to allow public users to delete their own interactions
CREATE POLICY "Allow public users to delete their own interactions"
ON user_interactions FOR DELETE
TO public
USING (auth.uid() = user_id);