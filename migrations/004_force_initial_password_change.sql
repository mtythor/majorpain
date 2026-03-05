-- Force password change for users who still have the default/initial password.
-- Run once after seed; users will be prompted to change on next login.

UPDATE major_pain_users SET force_password_change = true;
