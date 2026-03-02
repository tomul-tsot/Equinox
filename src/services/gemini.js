import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeDisasterSignals(signals, scenarioName) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are EQUINOX — an AI disaster response coordinator.
Analyze the following real-time crisis signals for: ${scenarioName}

Respond ONLY in this exact JSON format, no markdown, no extra text:

{
  "threat_level": "CRITICAL",
  "affected_zones": ["Zone A", "Zone B"],
  "primary_threat": "One sentence describing the single biggest immediate threat",
  "immediate_actions": [
    {"action": "Deploy water rescue units", "sector": "Adyar Basin", "priority": 1, "time_sensitive": true},
    {"action": "Set up emergency medical camp", "sector": "T Nagar", "priority": 2, "time_sensitive": false},
    {"action": "Evacuate coastal settlements", "sector": "South Chennai", "priority": 3, "time_sensitive": true}
  ],
  "reasoning": "2-3 sentences explaining the chain of logic: which signals triggered which decisions and why the priority ordering was chosen.",
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

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }
}

export async function analyzeCustomSignal(customText, existingSignals) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const newSignal = {
    source: "Field_Report",
    type: "custom_input",
    value: customText,
    location: "Field",
    timestamp: new Date().toLocaleTimeString(),
  };

  const allSignals = [...existingSignals, newSignal];

  return analyzeDisasterSignals(allSignals, "Live Field Update");
}
