-- src/shared/db/migrations/001_initial_schema.sql
-- FIXED: Complete schema with proper user initialization

-- Users table with starting berries
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    guild_id TEXT,
    level INTEGER DEFAULT 0,
    base_cp INTEGER DEFAULT 100,
    total_cp INTEGER DEFAULT 100,
    berries BIGINT DEFAULT 5000,  -- Start with 5000 berries
    total_earned BIGINT DEFAULT 5000,  -- Track the starting berries as earned
    total_spent BIGINT DEFAULT 0,
    pity_count INTEGER DEFAULT 0,
    last_income TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Devil Fruits table
CREATE TABLE IF NOT EXISTS user_devil_fruits (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    fruit_id VARCHAR(100) NOT NULL,
    fruit_name VARCHAR(255) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    fruit_rarity VARCHAR(50) NOT NULL,
    fruit_element VARCHAR(50) DEFAULT 'Unknown',
    fruit_fruit_type VARCHAR(50) DEFAULT 'Unknown',
    fruit_power TEXT NOT NULL,
    fruit_description TEXT,
    base_cp INTEGER NOT NULL,
    duplicate_count INTEGER DEFAULT 1,
    total_cp INTEGER NOT NULL,
    obtained_at TIMESTAMP DEFAULT NOW()
);

-- Income history table
CREATE TABLE IF NOT EXISTS income_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    cp_at_time INTEGER NOT NULL,
    income_type VARCHAR(50) DEFAULT 'automatic',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Command usage table
CREATE TABLE IF NOT EXISTS command_usage (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    command_name VARCHAR(100) NOT NULL,
    guild_id TEXT,
    success BOOLEAN DEFAULT true,
    execution_time INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System logs table for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL,
    component VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User levels table (for future level system)
CREATE TABLE IF NOT EXISTS user_levels (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    experience BIGINT DEFAULT 0,
    prestige_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_berries ON users(berries);
CREATE INDEX IF NOT EXISTS idx_users_total_cp ON users(total_cp);
CREATE INDEX IF NOT EXISTS idx_users_pity_count ON users(pity_count);

CREATE INDEX IF NOT EXISTS idx_devil_fruits_user_id ON user_devil_fruits(user_id);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_rarity ON user_devil_fruits(fruit_rarity);
CREATE INDEX IF NOT EXISTS idx_devil_fruits_obtained_at ON user_devil_fruits(obtained_at);

CREATE INDEX IF NOT EXISTS idx_income_history_user_id ON income_history(user_id);
CREATE INDEX IF NOT EXISTS idx_income_history_created_at ON income_history(created_at);

CREATE INDEX IF NOT EXISTS idx_command_usage_user_id ON command_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_command_usage_command_name ON command_usage(command_name);
CREATE INDEX IF NOT EXISTS idx_command_usage_created_at ON command_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(level);
