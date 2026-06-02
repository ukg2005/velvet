/*
  # Create Movies and Activity Tables for Home Discovery

  1. New Tables
    - `movies` - Store movie data for trending section
      - `id` (uuid, primary key)
      - `title` (text) - Movie title
      - `poster_path` (text) - URL to poster image
      - `release_date` (date) - Movie release date
      - `score` (numeric) - Rating score (0-10)
      - `created_at` (timestamp)
    
    - `user_reviews` - Store user activity reviews
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth user
      - `movie_id` (uuid) - Reference to movie
      - `rating` (numeric) - Star rating (0-10)
      - `review_text` (text) - Review content
      - `username` (text) - Display name
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Allow anyone to read movies (no auth required)
    - Allow authenticated users to read their own reviews
    - Allow authenticated users to create reviews
    - Allow users to update/delete their own reviews
*/

CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  poster_path text NOT NULL,
  release_date date NOT NULL,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 10),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating numeric NOT NULL CHECK (rating >= 0 AND rating <= 10),
  review_text text,
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movies are readable by everyone"
  ON movies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can read all reviews"
  ON user_reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON user_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON user_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON user_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_reviews_movie_id ON user_reviews(movie_id);
CREATE INDEX idx_user_reviews_created_at ON user_reviews(created_at DESC);
