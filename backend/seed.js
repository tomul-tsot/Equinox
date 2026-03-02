import { initDB } from './db/database.js';

const sampleIncidents = [
    {
        name: "Chennai Flood 2026",
        emoji: "🌊",
        location: "Tamil Nadu, India",
        lat: 13.0827,
        lng: 80.2707,
        color: "var(--blue)",
        signals: JSON.stringify([
            { source: "IoT_Sensor", type: "water_level", value: "4.2m above normal", location: "Adyar River Basin", timestamp: "16:40:12" },
            { source: "Social_Media", type: "distress_post", value: "Multiple homes submerged in Velachery", location: "South Chennai", timestamp: "16:41:05" },
            { source: "Emergency_Call", type: "SOS", value: "Evacuation needed for family of 5", location: "T Nagar", timestamp: "16:42:15" }
        ]),
        status: 'feed',
        is_new: 1
    },
    {
        name: "Earthquake – Himachal Pradesh",
        emoji: "⛰",
        location: "Shimla District, India",
        lat: 31.1048,
        lng: 77.1734,
        color: "var(--orange)",
        signals: JSON.stringify([
            { source: "Seismic_Sensor", type: "magnitude", value: "6.1 Richter Scale", location: "Epicenter 10km Deep", timestamp: "11:20:05" },
            { source: "Field_Report", type: "collapse", value: "Structural failure in 3 main market buildings", location: "Shimla Town", timestamp: "11:22:30" }
        ]),
        status: 'feed',
        is_new: 1
    },
    {
        name: "Resolved Incident: Bihar Flood (Sample)",
        emoji: "🌊",
        location: "Patna, Bihar",
        lat: 25.5941,
        lng: 85.1376,
        color: "var(--blue)",
        signals: JSON.stringify([]),
        status: 'history',
        is_new: 0,
        resolved_at: "10:30:00 PM"
    }
];

async function seed() {
    console.log('🌱 Seeding database...');
    const db = await initDB();

    // Clear existing data (optional, but good for reset)
    await db.run('DELETE FROM incidents');

    for (const incident of sampleIncidents) {
        await db.run(
            `INSERT INTO incidents (name, emoji, location, lat, lng, color, signals, status, is_new, resolved_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [incident.name, incident.emoji, incident.location, incident.lat, incident.lng, incident.color, incident.signals, incident.status, incident.is_new, incident.resolved_at]
        );
    }

    console.log('✅ Seeding complete!');
    await db.close();
}

seed().catch(console.error);
