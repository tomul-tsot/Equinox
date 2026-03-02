// Run with: node test-api.mjs
import https from "https";

const API_KEY = process.argv[2];
if (!API_KEY) {
    console.error("Usage: node test-api.mjs YOUR_API_KEY");
    process.exit(1);
}

const body = JSON.stringify({
    contents: [{ parts: [{ text: "Say hello in one word." }] }],
});

const options = {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
    },
};

console.log("Testing API key against gemini-2.0-flash...");
const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
        console.log("HTTP Status:", res.statusCode);
        try {
            const json = JSON.parse(data);
            if (json.candidates) {
                console.log("✅ SUCCESS — Gemini response:", json.candidates[0].content.parts[0].text);
            } else if (json.error) {
                console.log("❌ API Error:", json.error.code, json.error.message);
                if (json.error.details) {
                    json.error.details.forEach((d) => {
                        if (d.violations) d.violations.forEach((v) => console.log("  Violation:", v.quotaMetric, "limit:", v.quotaValue));
                    });
                }
            }
        } catch {
            console.log("Raw response:", data.slice(0, 500));
        }
    });
});
req.on("error", (e) => console.error("Request error:", e.message));
req.write(body);
req.end();
