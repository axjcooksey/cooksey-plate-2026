-- ===================================================================
-- Historical Tips → Tips Table Migration Script
-- Generated: 2025-08-20T12:18:30.235Z
-- Purpose: Migrate historical_tips data into tips table for application use
-- 
-- Key Mappings:
-- - user_name → user_id (via users table)
-- - round_number → round_id (via rounds table)
-- - squiggle_game_key → game_id (via games table)
-- ===================================================================

-- Backup existing tips data
DROP TABLE IF EXISTS tips_backup;
CREATE TABLE tips_backup AS SELECT * FROM tips;

-- Report backup status
SELECT 'TIPS BACKUP CREATED' as status, COUNT(*) as existing_tips FROM tips_backup;

-- Migration Query: historical_tips → tips
-- This query maps historical data to the application's tips table structure
INSERT INTO tips (
    user_id,
    game_id, 
    squiggle_game_key,
    round_id,
    selected_team,
    is_correct,
    margin_prediction,
    is_margin_game,
    margin_difference,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    g.id as game_id,
    ht.squiggle_game_key,
    r.id as round_id,
    ht.selected_team,
    ht.is_correct,
    NULL as margin_prediction,      -- Historical data doesn't have margins
    0 as is_margin_game,           -- Historical games weren't margin games
    NULL as margin_difference,      -- No margin data available
    ht.imported_at as created_at,   -- Use historical import time
    ht.imported_at as updated_at    -- Use historical import time
FROM historical_tips ht
JOIN users u ON ht.user_name = u.name
JOIN rounds r ON ht.round_number = r.round_number AND r.year = 2025
JOIN games g ON ht.squiggle_game_key = g.squiggle_game_key AND g.round_id = r.id
ORDER BY ht.round_number, ht.squiggle_game_key, u.name;

-- ===================================================================
-- MIGRATION VERIFICATION
-- ===================================================================

-- Overall migration summary
SELECT 
    'MIGRATION SUMMARY' as report,
    COUNT(*) as total_tips_migrated,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT round_id) as unique_rounds,
    COUNT(DISTINCT game_id) as unique_games,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_tips,
    ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy_rate
FROM tips 
WHERE created_at >= (SELECT MIN(imported_at) FROM historical_tips);

-- User comparison: historical_tips vs tips
SELECT 
    'USER COMPARISON' as report,
    ht_stats.user_name,
    ht_stats.historical_tips,
    t_stats.migrated_tips,
    CASE 
        WHEN ht_stats.historical_tips = t_stats.migrated_tips THEN '✅ MATCH'
        ELSE '⚠️ MISMATCH'
    END as status
FROM (
    SELECT user_name, COUNT(*) as historical_tips
    FROM historical_tips 
    GROUP BY user_name
) ht_stats
JOIN (
    SELECT u.name as user_name, COUNT(*) as migrated_tips
    FROM tips t
    JOIN users u ON t.user_id = u.id
    WHERE t.created_at >= (SELECT MIN(imported_at) FROM historical_tips)
    GROUP BY u.name
) t_stats ON ht_stats.user_name = t_stats.user_name
ORDER BY ht_stats.user_name;

-- Round comparison
SELECT 
    'ROUND COMPARISON' as report,
    r.round_number,
    ht_count.historical_count,
    t_count.tips_count,
    CASE 
        WHEN ht_count.historical_count = t_count.tips_count THEN '✅ MATCH'
        ELSE '⚠️ MISMATCH'
    END as status
FROM rounds r
LEFT JOIN (
    SELECT round_number, COUNT(*) as historical_count
    FROM historical_tips
    GROUP BY round_number
) ht_count ON r.round_number = ht_count.round_number
LEFT JOIN (
    SELECT r2.round_number, COUNT(*) as tips_count
    FROM tips t
    JOIN rounds r2 ON t.round_id = r2.id
    WHERE t.created_at >= (SELECT MIN(imported_at) FROM historical_tips)
    GROUP BY r2.round_number
) t_count ON r.round_number = t_count.round_number
WHERE r.year = 2025 AND r.round_number BETWEEN 0 AND 23
ORDER BY r.round_number;

-- Final success check
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM tips WHERE created_at >= (SELECT MIN(imported_at) FROM historical_tips)) = 
             (SELECT COUNT(*) FROM historical_tips)
        THEN 'SUCCESS: All historical tips migrated to tips table'
        ELSE 'ERROR: Tip count mismatch - check migration'
    END as migration_result;

-- Application readiness check
SELECT 
    'APPLICATION READINESS' as check_type,
    COUNT(DISTINCT t.user_id) as users_with_tips,
    COUNT(DISTINCT t.round_id) as rounds_with_tips,
    MIN(r.round_number) as earliest_round,
    MAX(r.round_number) as latest_round
FROM tips t
JOIN rounds r ON t.round_id = r.id
WHERE t.created_at >= (SELECT MIN(imported_at) FROM historical_tips);

