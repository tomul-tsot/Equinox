export const disasterScenarios = [
    {
        id: 1,
        name: "Chennai Flood 2026",
        emoji: "🌊",
        location: "Tamil Nadu, India",
        lat: 13.0827,
        lng: 80.2707,
        color: "var(--blue)",
        signals: [
            { source: "IoT_Sensor", type: "water_level", value: "4.2m above normal", location: "Adyar River Basin", timestamp: "16:40:12" },
            { source: "Social_Media", type: "distress_post", value: "Multiple homes submerged in Velachery", location: "South Chennai", timestamp: "16:41:05" },
            { source: "Emergency_Call", type: "SOS", value: "Evacuation needed for family of 5", location: "T Nagar", timestamp: "16:42:15" },
            { source: "Satellite", type: "imagery", value: "3.2 sq km inundation detected", location: "Chennai Metro Area", timestamp: "16:43:00" },
            { source: "IoT_Sensor", type: "power_grid", value: "Grid failure in 4 sectors", location: "Central Chennai", timestamp: "16:44:22" },
            { source: "Field_Report", type: "embankment", value: "Breach imminent at Kotturpuram", location: "Adyar River", timestamp: "16:45:10" }
        ]
    },
    {
        id: 2,
        name: "Earthquake – Himachal Pradesh",
        emoji: "⛰",
        location: "Shimla District, India",
        lat: 31.1048,
        lng: 77.1734,
        color: "var(--orange)",
        signals: [
            { source: "Seismic_Sensor", type: "magnitude", value: "6.1 Richter Scale", location: "Epicenter 10km Deep", timestamp: "11:20:05" },
            { source: "Field_Report", type: "collapse", value: "Structural failure in 3 main market buildings", location: "Shimla Town", timestamp: "11:22:30" },
            { source: "Social_Media", type: "panic", value: "Strong tremors felt, NH-5 blocked by slide", location: "Shimla-Solan Road", timestamp: "11:24:12" },
            { source: "Emergency_Call", type: "trapped", value: "People stuck under debris in market area", location: "District Hospital Perimeter", timestamp: "11:25:40" },
            { source: "Seismic_Sensor", type: "aftershock", value: "4.3 Magnitude aftershock detected", location: "Shimla Hills", timestamp: "11:47:00" }
        ]
    },
    {
        id: 3,
        name: "Wildfire – Bandipur Forest",
        emoji: "🔥",
        location: "Karnataka, India",
        lat: 11.6914,
        lng: 76.6214,
        color: "var(--red)",
        signals: [
            { source: "Satellite", type: "thermal", value: "800 hectare fire expansion detected", location: "Bandipur National Park", timestamp: "14:10:00" },
            { source: "IoT_Sensor", type: "air_quality", value: "AQI 487 (pm2.5)", location: "Mysuru Outskirts", timestamp: "14:15:30" },
            { source: "Field_Report", type: "wind_shift", value: "Wind speed 25km/h moving East", location: "Forest Sector 12", timestamp: "14:22:10" },
            { source: "Social_Media", type: "smoke", value: "Thick black smoke visible from 15km away", location: "NH-181 Corridor", timestamp: "14:25:45" },
            { source: "Emergency_Call", type: "distress", value: "Firefighters requesting air support", location: "Bandipur Core Zone", timestamp: "14:30:12" }
        ]
    },
    {
        id: 4,
        name: "Cyclone Landfall – Odisha Coast",
        emoji: "🌀",
        location: "Puri District, Odisha",
        lat: 19.8135,
        lng: 85.8312,
        color: "var(--purple)",
        signals: [
            { source: "Satellite", type: "pressure", value: "965 mbar falling rapidly", location: "Bay of Bengal Center", timestamp: "08:05:00" },
            { source: "IoT_Sensor", type: "wind_speed", value: "145 km/h sustained", location: "Puri Coastline", timestamp: "08:12:30" },
            { source: "Field_Report", type: "storm_surge", value: "2.5m surge inundating harbor", location: "Puri Fishing Harbor", timestamp: "08:20:15" },
            { source: "Social_Media", type: "evacuating", value: "Massive queue for evacuation buses", location: "NH-316 Corridor", timestamp: "08:25:50" },
            { source: "Emergency_Call", type: "missing", value: "12 fishing boats unaccounted for", location: "Puri District Interior", timestamp: "08:32:10" }
        ]
    },
    {
        id: 99,
        name: "Test Case: Insufficient Data",
        emoji: "⚠️",
        location: "Ambiguous Zone",
        lat: 20.0,
        lng: 70.0,
        color: "var(--yellow)",
        signals: [
            { source: "IoT_Sensor", type: "noise", value: "Minor fluctuation", location: "Zone X", timestamp: "09:00:00" },
            { source: "Field_Report", type: "status", value: "All clear", location: "Zone X", timestamp: "09:05:00" }
        ]
    },
    {
        id: 100,
        name: "Test Case: Analysis Failed",
        emoji: "❌",
        location: "Failure Simulation",
        lat: -10.0,
        lng: -10.0,
        color: "var(--red)",
        signals: [
            { source: "IoT_Sensor", type: "system", value: "Error simulation", location: "Null", timestamp: "00:00:00" }
        ]
    }
];
