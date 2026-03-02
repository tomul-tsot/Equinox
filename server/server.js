import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crisisRoutes from "./routes/crisisRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api", crisisRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ status: "ok", project: "INTELMAP", timestamp: new Date().toISOString() });
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: "Not Found", message: `Route ${req.path} does not exist.` });
});

// ── Centralized error middleware ───────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status ?? 500;
    const message = err.message ?? "Internal Server Error";
    console.error(`❌ [${req.method} ${req.path}] ${status} — ${message}`);

    // Gemini quota / auth errors
    if (message.includes("429") || message.includes("quota")) {
        return res.status(429).json({
            error: "Gemini Quota Exceeded",
            message: "The Gemini API rate limit was hit. Please wait and try again.",
        });
    }
    if (message.includes("400") || message.includes("API key")) {
        return res.status(401).json({
            error: "Gemini Auth Error",
            message: "Invalid Gemini API key. Check your .env file.",
        });
    }

    return res.status(status).json({ error: "Server Error", message });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 INTELMAP server running on http://localhost:${PORT}`);
});
