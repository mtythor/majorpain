-- Major Pain: Users table for per-player auth

CREATE TABLE IF NOT EXISTS major_pain_users (
  id SERIAL PRIMARY KEY,
  player_id INT NOT NULL UNIQUE CHECK (player_id >= 1 AND player_id <= 4),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  force_password_change BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS major_pain_users_username ON major_pain_users (username);
CREATE INDEX IF NOT EXISTS major_pain_users_player_id ON major_pain_users (player_id);
