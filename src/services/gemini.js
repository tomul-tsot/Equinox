import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const MODEL_PRIORITY = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
];

async function callGemini(prompt) {
    let lastError;
    for (const modelName of MODEL_PRIORITY) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            console.log(`✅ IntelMap AI — model: ${modelName}`);
            return result.response.text();
        } catch (err) {
            console.warn(`⚠ Model ${modelName} failed:`, err.message?.slice(0, 100));
            lastError = err;
            const msg = err.message ?? "";
            if (!msg.includes("404") && !msg.includes("not found")) {
                throw err; // stop on quota/auth errors immediately
            }
        }
    }
    throw lastError;
}

export async function analyzeDisasterSignals(signals, scenarioName) {
    const prompt = `
You are INTELMAP — an AI disaster response coordinator.
Analyze the following real-time crisis signals for: ${scenarioName}

Respond ONLY in this exact JSON format, no markdown, no extra text:

{
  "threat_level": "CRITICAL",
  "affected_zones": ["Zone A", "Zone B"],
  "primary_threat": "One sentence describing the single biggest immediate threat",
  "immediate_actions": [
    {"action": "Deploy water rescue units", "sector": "Adyar Basin", "priority": 1, "time_sensitive": true},
    {"action": "Set up emergency medical camp", "sector": "T Nagar", "priority": 2, "time_sensitive": false}
  ],
  "reasoning": "An exceptionally concise (MAX 50 WORDS) explanation of the chain of logic explaining which signals triggered which decisions.",
  "resource_allocation": {
    "rescue_units": 4,
    "medical_teams": 3,
    "supply_drops": 2,
    "evacuation_buses": 5
  },
  "signal_credibility": {
    "high": 3,
    "medium": 1,
    "low": 0
  },
  "estimated_affected_population": "25,000–40,000 civilians",
  "next_6_hours_prediction": "One sentence predicting how the situation evolves if no action is taken."
}

Crisis signals:
${JSON.stringify(signals, null, 2)}

Return ONLY valid JSON. No explanation. No markdown.
  `;

    const text = await callGemini(prompt);
    try {
        return JSON.parse(text);
    } catch {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    }
}

export async function analyzeCustomSignal(customText, existingSignals) {
    const newSignal = {
        source: "Field_Report",
        type: "custom_input",
        value: customText,
        location: "Field",
        timestamp: new Date().toLocaleTimeString(),
    };
    return analyzeDisasterSignals([...existingSignals, newSignal], "Live Field Update");
}
