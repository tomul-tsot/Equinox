import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model fallback priority list
const MODEL_PRIORITY = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
];

const SYSTEM_PROMPT = `You are INTELMAP, a crisis intelligence AI coordinator.
Analyze the provided crisis text and return ONLY a strict JSON object with no markdown, no code fences, and no extra text.

Return exactly this structure:
{
  "crisis_type": "string (e.g. Flood, Earthquake, Wildfire, Cyclone)",
  "severity": "string (one of: LOW, MEDIUM, HIGH, CRITICAL)",
  "location": "string (city, region, country)",
  "latitude": number (valid range: -90 to 90),
  "longitude": number (valid range: -180 to 180),
  "explanation": "string (2-3 sentences explaining the crisis and its immediate impact)",
  "recommended_action": "string (1-2 sentences on the most critical immediate action)",
  "confidence_score": number (integer, 0 to 100)
}`;

async function callGemini(prompt) {
    let lastError;
    for (const modelName of MODEL_PRIORITY) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_PROMPT,
            });
            const result = await model.generateContent(prompt);
            console.log(`✅ Gemini responded — model: ${modelName}`);
            return result.response.text();
        } catch (err) {
            console.warn(`⚠ Model ${modelName} failed: ${err.message?.slice(0, 120)}`);
            lastError = err;
            const msg = err.message ?? "";
            // Only fallback on 404 (model not found). Stop immediately on quota/auth errors.
            if (!msg.includes("404") && !msg.includes("not found")) {
                throw err;
            }
        }
    }
    throw lastError;
}

function parseGeminiJSON(text) {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
}

function validateAnalysis(data) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    const score = parseInt(data.confidence_score, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error(`Invalid latitude: ${data.latitude}`);
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error(`Invalid longitude: ${data.longitude}`);
    }
    if (isNaN(score) || score < 0 || score > 100) {
        throw new Error(`Invalid confidence_score: ${data.confidence_score}`);
    }

    return {
        crisis_type: String(data.crisis_type ?? "Unknown").slice(0, 100),
        severity: String(data.severity ?? "MEDIUM").slice(0, 50),
        location: String(data.location ?? "Unknown").slice(0, 255),
        latitude: lat,
        longitude: lng,
        explanation: String(data.explanation ?? "").slice(0, 2000),
        recommended_action: String(data.recommended_action ?? "").slice(0, 1000),
        confidence_score: score,
    };
}

export async function analyzeText(rawInput) {
    const text = await callGemini(rawInput);
    const parsed = parseGeminiJSON(text);
    return validateAnalysis(parsed);
}
