import express from "express";
import {
    analyzeSignal,
    getAllCrises,
    getCrisisById,
    fetchAndAnalyzeNews,
} from "../controllers/crisisController.js";

const router = express.Router();

// POST /api/analyze        — analyze a text input via Gemini
router.post("/analyze", analyzeSignal);

// GET  /api/crises         — get all stored crises (newest first)
router.get("/crises", getAllCrises);

// GET  /api/crises/:id     — get a single crisis by ID
router.get("/crises/:id", getCrisisById);

// POST /api/fetch-news     — pull news headlines, analyze & store them
router.post("/fetch-news", fetchAndAnalyzeNews);

export default router;
