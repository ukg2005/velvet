/*
  # Make user_id nullable in user_reviews

  Allows inserting reviews without requiring authentication
  for demo purposes.
*/

ALTER TABLE user_reviews ALTER COLUMN user_id DROP NOT NULL;
