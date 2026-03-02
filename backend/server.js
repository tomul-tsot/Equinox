import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/database.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5001;

app.use(cors());
app.use(express.json());

let db;

// ── API Endpoints ─────────────────────────────────────────────────────────────

// Get incidents for incident feed (status = 'feed')
app.get('/api/incidents/feed', async (req, res) => {
    try {
        const incidents = await db.all("SELECT * FROM incidents WHERE status = 'feed'");
        res.json(incidents.map(i => ({ ...i, signals: JSON.parse(i.signals) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get incidents for history (status = 'history')
app.get('/api/incidents/history', async (req, res) => {
    try {
        const incidents = await db.all("SELECT * FROM incidents WHERE status = 'history' ORDER BY id DESC");
        res.json(incidents.map(i => ({ ...i, signals: JSON.parse(i.signals) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark incident as "seen" (remove new badge)
app.patch('/api/incidents/:id/see', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run("UPDATE incidents SET is_new = 0 WHERE id = ?", [id]);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Move incident from feed to history (Manage)
app.patch('/api/incidents/:id/manage', async (req, res) => {
    try {
        const { id } = req.params;
        const resolvedAt = new Date().toLocaleTimeString();
        await db.run(
            "UPDATE incidents SET status = 'history', is_new = 0, resolved_at = ? WHERE id = ?",
            [resolvedAt, id]
        );
        res.json({ success: true, id, resolvedAt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restore incident from history back to feed
app.patch('/api/incidents/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run(
            "UPDATE incidents SET status = 'feed', resolved_at = NULL WHERE id = ?",
            [id]
        );
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
initDB().then(database => {
    db = database;
    app.listen(PORT, () => {
        console.log(`🚀 Persistence Backend running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});
