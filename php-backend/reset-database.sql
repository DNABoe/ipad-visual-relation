-- ===========================================================
--  EMERGENCY RESET - RelEye Database
--  Run this in phpMyAdmin SQL tab to force first-time setup
-- ===========================================================

USE lpmjclyqtt_releye;

-- Delete all users (this will trigger first-time setup)
DELETE FROM users;

-- Delete all invitations
DELETE FROM invitations;

-- Delete activity log
DELETE FROM activity_log;

-- Verify reset
SELECT 
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM invitations) as invite_count,
    (SELECT COUNT(*) FROM activity_log) as log_count;

-- This should show:
-- user_count: 0
-- invite_count: 0  
-- log_count: 0
--
-- After this, visiting https://releye.boestad.com should show first-time admin setup
