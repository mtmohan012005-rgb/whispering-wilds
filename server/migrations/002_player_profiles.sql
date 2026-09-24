-- ============================================================================
-- THE WHISPERING WILDS - MIGRATION 002: PLAYER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_profiles (
    user_id VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    active_title VARCHAR(100) DEFAULT 'Wanderer of Tamil Nadu',
    playtime_seconds INT DEFAULT 0,
    discoveries_count INT DEFAULT 0,
    codex_entries_count INT DEFAULT 0,
    achievements_count INT DEFAULT 0,
    customization_changes_used INT DEFAULT 0,
    avatar_config JSON,
    preferences JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_customization_ceiling CHECK (customization_changes_used <= 5)
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_title ON player_profiles(active_title);
