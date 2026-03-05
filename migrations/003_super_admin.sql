-- Major Pain: Ensure player_id 1 (MtyThor) is super-admin

UPDATE major_pain_users SET is_super_admin = true, is_admin = true WHERE player_id = 1;
