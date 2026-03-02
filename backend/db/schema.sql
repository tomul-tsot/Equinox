CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT,
    location TEXT,
    lat REAL,
    lng REAL,
    color TEXT,
    signals TEXT, -- JSON string
    status TEXT DEFAULT 'feed', -- 'feed' or 'history'
    is_new INTEGER DEFAULT 1, -- 1 for true, 0 for false
    resolved_at TEXT
);
