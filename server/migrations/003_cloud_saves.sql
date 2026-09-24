-- ============================================================================
-- THE WHISPERING WILDS - MIGRATION 003: CLOUD SAVES & VERSIONING
-- ============================================================================

CREATE TABLE IF NOT EXISTS cloud_saves (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    revision INT NOT NULL DEFAULT 1,
    checksum VARCHAR(64) NOT NULL,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    save_data JSONB NOT NULL,
    device_id VARCHAR(128),
    CONSTRAINT uk_user_save UNIQUE(user_id),
    CONSTRAINT chk_positive_revision CHECK (revision > 0)
);

CREATE INDEX IF NOT EXISTS idx_cloud_saves_user ON cloud_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_saves_rev ON cloud_saves(user_id, revision);
