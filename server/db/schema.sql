-- INTELMAP Database Schema
-- Run this file once to create the database table:
--   psql -U your_user -d intelmap -f server/db/schema.sql

CREATE TABLE IF NOT EXISTS crises (
    id                  SERIAL PRIMARY KEY,
    raw_input           TEXT,
    source              VARCHAR(20),         -- 'manual' | 'news'
    crisis_type         VARCHAR(100),
    severity            VARCHAR(50),
    location            VARCHAR(255),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    explanation         TEXT,
    recommended_action  TEXT,
    confidence_score    INTEGER,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
