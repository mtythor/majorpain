-- Major Pain: Notification state for push notification deduplication
-- Stores sent notification keys to avoid duplicate sends

CREATE TABLE IF NOT EXISTS major_pain_notification_state (
  id INT PRIMARY KEY DEFAULT 1,
  sent JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE major_pain_notification_state ADD CONSTRAINT major_pain_notification_state_single_row CHECK (id = 1);
