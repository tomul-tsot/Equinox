// Pre-seeded Gemini responses for demo mode
// These are used when the live API is unavailable (quota exceeded, etc.)
// They look identical to live Gemini responses

export const demoResponses = {
    1: {
        // Chennai Flood 2026
        threat_level: "CRITICAL",
        affected_zones: ["Adyar River Basin", "T Nagar", "Velachery", "South Chennai", "Kotturpuram"],
        primary_threat:
            "Rapid floodwater expansion at 200m/hour with 3.2 sq km already submerged and embankment breach imminent, threatening an estimated 40,000 civilians in low-lying zones.",
        immediate_actions: [
            {
                action: "Deploy water rescue boats to rooftop-stranded civilians",
                sector: "T Nagar",
                priority: 1,
                time_sensitive: true,
            },
            {
                action: "Evacuate family of 5 and surrounding residents",
                sector: "Sector 7, Velachery",
                priority: 2,
                time_sensitive: true,
            },
            {
                action: "Emergency power restoration to hospital backup grid",
                sector: "Central Chennai",
                priority: 3,
                time_sensitive: true,
            },
            {
                action: "Close Kotturpuram Bridge — structural failure risk",
                sector: "Kotturpuram",
                priority: 4,
                time_sensitive: false,
            },
            {
                action: "Establish elevated emergency supply depot",
                sector: "North Chennai",
                priority: 5,
                time_sensitive: false,
            },
        ],
        reasoning:
            "The IoT sensor reading of 4.2m above normal at Adyar River Basin, combined with satellite confirmation of 3.2 sq km submerged and expanding northward, signals an accelerating flood event. Social media distress posts and emergency SOS calls from Velachery provide ground-truth confirmation that civilian casualties are imminent. Power grid failure in 4 zones including hospital backup elevates this to CRITICAL — medical infrastructure failure during a flood event multiplies the death toll significantly.",
        resource_allocation: {
            rescue_units: 8,
            medical_teams: 4,
            supply_drops: 3,
            evacuation_buses: 12,
        },
        signal_credibility: {
            high: 4,
            medium: 2,
            low: 0,
        },
        estimated_affected_population: "35,000–45,000 civilians",
        next_6_hours_prediction:
            "Without immediate intervention, northward flood expansion will inundate 3 additional sectors within 4 hours; combined with hospital grid failure, projected casualties rise from dozens to several hundred.",
    },

    2: {
        // Earthquake – Himachal Pradesh
        threat_level: "HIGH",
        affected_zones: ["Shimla Town", "District Hospital", "NH-5 Corridor", "Shimla Hills"],
        primary_threat:
            "Building collapses across Shimla Town with civilians trapped under rubble, compounded by highway blockages cutting off external rescue access and aftershock risk destabilizing remaining structures.",
        immediate_actions: [
            {
                action: "Deploy NDRF urban search and rescue teams",
                sector: "Shimla Town Main Market",
                priority: 1,
                time_sensitive: true,
            },
            {
                action: "Set up field hospital — district hospital at capacity",
                sector: "District Hospital Perimeter",
                priority: 2,
                time_sensitive: true,
            },
            {
                action: "Clear NH-5 landslide blockage for supply convoy",
                sector: "NH-5 Corridor",
                priority: 3,
                time_sensitive: true,
            },
            {
                action: "Aerial reconnaissance for secondary slide risk zones",
                sector: "Shimla Hills",
                priority: 4,
                time_sensitive: false,
            },
        ],
        reasoning:
            "A 6.1 magnitude shallow earthquake (10km depth) maximizes surface destruction. Social media and emergency call data confirm structural collapses in the main market area with people trapped. The 4.3 magnitude aftershock detected 27 minutes later indicates the fault line remains active, making further collapses probable and rescue operations dangerous. Highway blockages on all 3 exit routes mean air support is the only reliable resupply channel until ground routes are cleared.",
        resource_allocation: {
            rescue_units: 6,
            medical_teams: 5,
            supply_drops: 4,
            evacuation_buses: 8,
        },
        signal_credibility: {
            high: 3,
            medium: 2,
            low: 0,
        },
        estimated_affected_population: "15,000–25,000 civilians",
        next_6_hours_prediction:
            "Secondary landslides on NH-5 are highly probable within 3 hours if aftershock activity continues; trapped survivors in collapsed buildings face a critical survival window of 6–72 hours.",
    },

    3: {
        // Wildfire – Bandipur
        threat_level: "CRITICAL",
        affected_zones: ["Bandipur National Park", "Mysuru Outskirts", "NH-181 Corridor", "3 Adjacent Villages"],
        primary_threat:
            "800-hectare wildfire moving east at 15 km/h with a wind shift expected in 90 minutes that will redirect the fire toward NH-181 highway and three populated villages refusing evacuation.",
        immediate_actions: [
            {
                action: "Immediate air evacuation of cut-off firefighter Unit 7",
                sector: "Sector 12, Bandipur",
                priority: 1,
                time_sensitive: true,
            },
            {
                action: "Forced evacuation of 3 non-compliant villages — 1,200 civilians",
                sector: "12km radius, Bandipur Belt",
                priority: 2,
                time_sensitive: true,
            },
            {
                action: "Close NH-181 ahead of wind-shift fire path",
                sector: "NH-181 Corridor",
                priority: 3,
                time_sensitive: true,
            },
            {
                action: "Deploy aerial water bombers on eastern fire front",
                sector: "Bandipur East",
                priority: 4,
                time_sensitive: false,
            },
        ],
        reasoning:
            "Satellite data confirms rapid fire expansion (800 ha) with wind-driven eastward spread. The firefighter distress call from Sector 12 indicates front-line units are in immediate mortal danger, making air rescue the top priority. The 90-minute window before wind shift is the critical factor — once the fire redirects toward the highway, evacuation routes for the three villages will be cut off, trapping 1,200 civilians. AQI of 487 also means respiratory casualties are already accumulating in Mysuru.",
        resource_allocation: {
            rescue_units: 4,
            medical_teams: 3,
            supply_drops: 2,
            evacuation_buses: 10,
        },
        signal_credibility: {
            high: 3,
            medium: 2,
            low: 0,
        },
        estimated_affected_population: "8,000–15,000 civilians",
        next_6_hours_prediction:
            "If the wind shift occurs without prior NH-181 closure and village evacuation, the fire will trap approximately 1,200 civilians with no road evacuation routes and air capacity insufficient for mass rescue.",
    },

    4: {
        // Cyclone – Odisha Coast
        threat_level: "CRITICAL",
        affected_zones: ["Puri Coastal Belt", "Puri Fishing Harbor", "NH-316 Corridor", "Puri District Interior"],
        primary_threat:
            "Category 3 cyclone making landfall in under 6 hours with a 4–5m storm surge will inundate the entire coastal belt; 60,000 civilians remain in the red zone with evacuation routes already flooding.",
        immediate_actions: [
            {
                action: "Emergency coast guard helicopter search for 12 missing fishing boats",
                sector: "Puri Fishing Harbor",
                priority: 1,
                time_sensitive: true,
            },
            {
                action: "Mass forced evacuation — deploy all available buses immediately",
                sector: "Puri Coastal Red Zone",
                priority: 2,
                time_sensitive: true,
            },
            {
                action: "Pre-position rescue boats at inland staging areas",
                sector: "Puri District Interior",
                priority: 3,
                time_sensitive: true,
            },
            {
                action: "Emergency road drainage on NH-316 to preserve evacuation window",
                sector: "NH-316",
                priority: 4,
                time_sensitive: true,
            },
        ],
        reasoning:
            "With 60% of the coastal population still in the red zone and NH-316 already flooding, the evacuation window is closing at an accelerating pace. The storm surge of 4–5m will completely inundate low-lying coastal settlements regardless of structure quality. The 12 unaccounted fishing boats represent an immediate life-safety crisis that coast guard must address before landfall makes maritime operations impossible. At 200mm/hour rainfall, NH-316 will likely become impassable within 2 hours.",
        resource_allocation: {
            rescue_units: 10,
            medical_teams: 6,
            supply_drops: 5,
            evacuation_buses: 20,
        },
        signal_credibility: {
            high: 4,
            medium: 1,
            low: 0,
        },
        estimated_affected_population: "60,000–80,000 civilians",
        next_6_hours_prediction:
            "Without immediate mass evacuation, the storm surge will strand 60,000 civilians in inundated structures; post-landfall rescue operations will be impossible for 12–18 hours, making this a mass-casualty event.",
    },
};
