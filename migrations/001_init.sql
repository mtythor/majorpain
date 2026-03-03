-- Major Pain: Initial schema
-- Single-row JSONB table (mirrors Brocation pattern)

CREATE TABLE major_pain_state (
  id INT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE major_pain_state ADD CONSTRAINT major_pain_single_row CHECK (id = 1);
