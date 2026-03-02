import axios from "axios";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

const CRISIS_KEYWORDS = [
    "fire", "flood", "earthquake", "explosion", "accident",
    "collapse", "landslide", "storm", "evacuation", "wildfire",
    "tsunami", "hurricane", "cyclone", "disaster", "crisis",
];

// Pick a random crisis keyword
export function randomKeyword() {
    return CRISIS_KEYWORDS[Math.floor(Math.random() * CRISIS_KEYWORDS.length)];
}

// Fetch live crisis data from the Python microservice
export async function fetchLiveData(query) {
    const keyword = query || randomKeyword();

    const response = await axios.get(`${PYTHON_SERVICE_URL}/fetch-live-data`, {
        params: { query: keyword },
        timeout: 30000,
    });

    if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(`Python service returned no data for keyword: ${keyword}`);
    }

    return { keyword, articles: response.data };
}
