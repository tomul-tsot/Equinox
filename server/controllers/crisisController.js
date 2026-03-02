import pool from "../config/db.js";
import { analyzeText } from "../services/geminiService.js";
import { fetchLiveData, randomKeyword } from "../services/externalApiService.js";

// ── POST /api/analyze ──────────────────────────────────────────────────────────
export async function analyzeSignal(req, res, next) {
    try {
        const { text } = req.body;

        if (!text || typeof text !== "string" || text.trim().length < 10) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Field 'text' is required and must be at least 10 characters.",
            });
        }

        const rawInput = text.trim();
        const analysis = await analyzeText(rawInput);

        const result = await pool.query(
            `INSERT INTO crises
        (raw_input, source, crisis_type, severity, location, latitude, longitude,
         explanation, recommended_action, confidence_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
            [
                rawInput,
                "manual",
                analysis.crisis_type,
                analysis.severity,
                analysis.location,
                analysis.latitude,
                analysis.longitude,
                analysis.explanation,
                analysis.recommended_action,
                analysis.confidence_score,
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
}

// ── GET /api/crises ────────────────────────────────────────────────────────────
export async function getAllCrises(req, res, next) {
    try {
        const result = await pool.query(
            "SELECT * FROM crises ORDER BY created_at DESC"
        );
        return res.json(result.rows);
    } catch (err) {
        next(err);
    }
}

// ── GET /api/crises/:id ────────────────────────────────────────────────────────
export async function getCrisisById(req, res, next) {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id, 10))) {
            return res.status(400).json({ error: "Bad Request", message: "ID must be a number." });
        }

        const result = await pool.query("SELECT * FROM crises WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Not Found", message: `Crisis #${id} not found.` });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
}

// ── POST /api/fetch-news ───────────────────────────────────────────────────────
// Fetches live data from the Python microservice (GDELT + DDGS),
// runs each article through Gemini, stores the result in PostgreSQL.
export async function fetchAndAnalyzeNews(req, res, next) {
    try {
        // Accept optional keyword from the request body, else random
        const keyword = req.body?.keyword || randomKeyword();

        let articles;
        try {
            const fetched = await fetchLiveData(keyword);
            articles = fetched.articles;
            console.log(`📡 Fetched ${articles.length} live articles for keyword: "${keyword}"`);
        } catch (err) {
            return res.status(502).json({
                error: "Python Microservice Error",
                message: `Failed to fetch live data: ${err.message}. Is the Python service running on port 8000?`,
            });
        }

        const results = [];
        const errors = [];

        // Process sequentially to respect Gemini rate limits
        for (const article of articles) {
            const rawInput = `${article.headline}. ${article.description}`.trim();

            try {
                const analysis = await analyzeText(rawInput);

                const dbResult = await pool.query(
                    `INSERT INTO crises
            (raw_input, source, crisis_type, severity, location, latitude, longitude,
             explanation, recommended_action, confidence_score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *`,
                    [
                        rawInput,
                        article.source,          // "gdelt" or "ddgs"
                        analysis.crisis_type,
                        analysis.severity,
                        analysis.location,
                        analysis.latitude,
                        analysis.longitude,
                        analysis.explanation,
                        analysis.recommended_action,
                        analysis.confidence_score,
                    ]
                );

                results.push({
                    ...dbResult.rows[0],
                    original_url: article.url,
                    original_timestamp: article.timestamp,
                });
            } catch (err) {
                errors.push({
                    headline: rawInput.slice(0, 100),
                    error: err.message,
                });
            }
        }

        if (results.length === 0) {
            return res.status(500).json({
                error: "All Articles Failed",
                message: "Gemini failed to process all fetched articles. No data stored.",
                errors,
            });
        }

        return res.json({
            keyword,
            processed: articles.length,
            stored: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err) {
        next(err);
    }
}
