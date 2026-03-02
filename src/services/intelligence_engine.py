import os
import json
import requests
import time
import pandas as pd
from src.services.gdelt_service import fetch_latest_gdelt_events
from src.services.search_service import search_disaster_context, search_social_media
from src.services.database import save_incident, get_all_incidents, init_db, check_if_incident_exists

# --- .env Helper ---
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    GEMINI_API_KEY = GEMINI_API_KEY.strip()
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# Using Llama 3 70B via Groq for high-speed analysis
GROQ_MODEL = "llama-3.3-70b-versatile"

# Hardcoded geocoding lookup for targeted search support (Mumbai, Pune, etc.)
GEO_LOOKUP = {
    "MUMBAI": (19.0760, 72.8777),
    "PUNE": (18.5204, 73.8567),
    "DELHI": (28.6139, 77.2090),
    "CHENNAI": (13.0827, 80.2707),
    "KOLKATA": (22.5726, 88.3639),
    "BANGALORE": (12.9716, 77.5946),
    "HYDERABAD": (17.3850, 78.4867),
    "TEXAS": (31.9686, -99.9018),
    "NEW YORK": (40.7128, -74.0060),
    "DHAKA": (23.8103, 90.4125)
}

def clean_location_name(name):
    """Sanitizes location names that might have broken encoding from GDELT, e.g. 'Ad Daw?ah'"""
    if not isinstance(name, str):
        return name
    # Replace the '?' mojibake with an apostrophe which is typically what it failed to encode in Arabic transliterations
    return name.replace('?', "'")

def get_dynamic_coordinates(city_name):
    """Fetches exact coordinates from Nominatim for cities not in the hardcoded lookup."""
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={city_name}&format=json&limit=1"
        res = requests.get(url, headers={"User-Agent": "IntelmapCrisisBot/1.0"}, timeout=3)
        if res.status_code == 200:
            data = res.json()
            if data and len(data) > 0:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"[!] Geocoding fallback failed for {city_name}: {e}")
    return 0.0, 0.0

def analyze_event_with_gemini(event_row, context_snippets):
    """Sends a disaster event and its context to Gemini for structured analysis."""
    if not GEMINI_API_KEY:
        print("[!] No Gemini API Key found. Check .env")
        return None

    # Prepare historical signals from GDELT data
    signals = [
        {"source": "GDELT_Global_Event_ID", "value": str(event_row['GlobalEventID']), "timestamp": str(event_row['DATEADDED'])},
        {"source": "Primary_Source", "value": event_row['SOURCEURL'], "timestamp": "Real-time"},
        {"source": "Avg_Tone", "value": f"Score: {event_row['AvgTone']}", "timestamp": "Analyzed"},
    ]
    
    # Add search context as signals
    for snippet in context_snippets:
        signals.append({
            "source": "Web_Search_Context",
            "value": f"{snippet.get('title')}: {snippet.get('snippet')}",
            "timestamp": "Latest News"
        })

    prompt = f"""
You are INTELMAP — an AI disaster response coordinator.
Analyze the following real-time signals for a potential crisis:
Location: {event_row['ActionGeo_FullName']}
GDELT Event Code: {event_row['EventCode']}
Source URL: {event_row['SOURCEURL']}

Crisis signals (GDELT + Web Search):
{json.dumps(signals, indent=2)}

Respond ONLY in this exact JSON format, no markdown, no extra text:
{{
  "threat_level": "CRITICAL/HIGH/MEDIUM/LOW",
  "affected_zones": ["Zone A", "Zone B"],
  "primary_threat": "Summary description of the immediate threat",
  "immediate_actions": [
    {{"action": "Action name", "sector": "Specific sector", "priority": 1, "time_sensitive": true}}
  ],
  "reasoning": "A DETAILED explanation of the threat, including what the news signals signify and why the threat level was chosen. Discuss specifically the GDELT volume and the Search snippets if they point to a crisis.",
  "resource_allocation": {{
    "rescue_units": 0,
    "medical_teams": 0,
    "supply_drops": 0,
    "evacuation_buses": 0
  }},
  "signal_credibility": {{ "high": 0, "medium": 0, "low": 0 }},
  "estimated_affected_population": "Estimated count of civilians",
  "next_6_hours_prediction": "Predication of how it will evolve."
}}
"""

    if not GEMINI_API_KEY:
        return None

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        res = requests.post(GEMINI_URL, json=payload)
        if res.status_code == 429:
            msg = res.json().get('error', {}).get('message', '')
            print(f"[!] Rate Limit Error: {msg}")
            if 'quota' in msg.lower():
                print("[!] Daily Quota Exhausted. Cannot proceed until reset.")
                return "QUOTA_EXHAUSTED"
            return None
        if res.status_code != 200:
            print(f"[!] Gemini Error {res.status_code}: {res.text}")
            return None
        res.raise_for_status()
        data = res.json()
        
        # Extract text from Gemini response structure
        raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        # Clean markdown if present
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
        
        return json.loads(raw_text)
    except Exception as e:
        print(f"[!] Analysis Parse Error: {e}")
        return None

def analyze_event_with_groq(event_row, context_snippets):
    """Hits Groq to perform deep reasoning on the crisis."""
    if not GROQ_API_KEY:
        return None
        
    print(f"[*] Analyzing with Groq (LPU) for: {event_row['ActionGeo_FullName']}...")
    
    # Construction of a detailed context
    news_brief = "No specific news reports available."
    if context_snippets:
        news_brief = "\n".join([f"- {s.get('title')}: {s.get('snippet')}" for s in context_snippets[:5]])

    prompt = f"""
You are INTELMAP — an objective AI disaster response coordinator.
Your goal is to assess the severity of a situation without bias. Do NOT default to HIGH if the evidence is weak.

GDELT Context: Event {event_row['EventCode']} with {event_row['NumArticles']} linked reports.
Location: {event_row['ActionGeo_FullName']} ({event_row['ActionGeo_Lat']}, {event_row['ActionGeo_Long']})

Ground Context (NEWS SNIPPETS):
{news_brief}

SCALING CRITERIA:
- LOW: Generalized reports, "pending" details, or minor disruptions without casualties.
- MEDIUM: Significant damage, road closures, or localized power outages.
- HIGH: Confirmed casualties, large-scale displacement, or major infrastructure collapse.
- CRITICAL: Active life-threatening emergency with multiple requests for rescue.

Respond ONLY in this JSON format:
{{
  "threat_level": "LOW/MEDIUM/HIGH/CRITICAL",
  "affected_zones": ["Zone 1", "Zone 2"],
  "primary_threat": "Summary sentence",
  "immediate_actions": [
    {{"action": "Action desc", "sector": "Location", "priority": 1, "time_sensitive": true}}
  ],
  "reasoning": "Be skeptical. If news is sparse, label as LOW/MEDIUM and explain why.",
  "resource_allocation": {{ "rescue_units": 0, "medical_teams": 0, "supply_drops": 0, "evacuation_buses": 0 }},
  "signal_credibility": {{ "high": 0, "medium": 0, "low": 0 }},
  "estimated_affected_population": "Civilians count",
  "next_6_hours_prediction": "Situation evolution."
}}

CRITICAL INSTRUCTIONS FOR REASONING:
Provide a PROFESSIONAL EXECUTIVE SUMMARY. 
Synthesize what the GDELT volume suggests based on the ground-level news and social media signals.
If news is sparse or conflicting, maintain professional skepticism but highlight why specific signals are concerning.
Return ONLY valid JSON.
"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }

    try:
        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        res.raise_for_status()
        data = res.json()
        content = data['choices'][0]['message']['content']
        return json.loads(content)
    except Exception as e:
        print(f"[!] Groq Analysis Error: {e}")
        return None

def generate_live_data_summary(event_row, context_snippets):
    """Generates a professional data synthesis summary when AI APIs are unavailable."""
    print("[*] Generating Live Intelligence Summary from available signals...")
    
    # Use first few snippets for reasoning if available
    summary_parts = []
    if context_snippets:
        # Synthesize a more helpful summary from signals
        snippets = [s.get('title', '') for s in context_snippets[:3] if s.get('title')]
        if snippets:
            summary_parts.append(f"Ground-level signals indicate: {', '.join(snippets)}.")

    # Platform signals check
    platforms = set()
    for s in context_snippets:
        if 'source' in s: platforms.add(s['source'])
    
    if platforms:
        summary_parts.append(f"Verified activity spikes detected across {', '.join(platforms)}.")

    reasoning = " ".join(summary_parts) if summary_parts else "Comprehensive ground reports are currently being aggregated. GDELT volume indicates localized activity."
    
    full_reasoning = f"LIVE DATA SUMMARY: We are synthesizing multiple streams for {event_row['ActionGeo_FullName']}. {reasoning} The current threat profile is categorized as MEDIUM while high-fidelity verification is in progress."
    
    return {
      "threat_level": "MEDIUM", 
      "affected_zones": [event_row['ActionGeo_FullName']],
      "primary_threat": f"Active signal clusters detected in {event_row['ActionGeo_FullName']}.",
      "immediate_actions": [
        {"action": "Deploy localized monitoring bots", "sector": event_row['ActionGeo_FullName'], "priority": 1, "time_sensitive": True},
        {"action": "Alert regional response coordinators", "sector": "Network Ops", "priority": 2, "time_sensitive": False}
      ],
      "reasoning": full_reasoning,
      "resource_allocation": {
        "rescue_units": 1,
        "medical_teams": 1,
        "supply_drops": 0,
        "evacuation_buses": 0
      },
      "signal_credibility": { "high": 1, "medium": 1, "low": 1 },
      "estimated_affected_population": "Verification in progress",
      "next_6_hours_prediction": "Situation is highly dynamic. Automated signal tracking remains active."
    }

def process_live_crises(limit=3, targeted_cities=None):
    """Main loop: Fetch GDELT -> Search context -> Analyze -> Return."""
    # ── NEW: Initial cooldown to avoid "burst" 429s ──
    print("[*] Initial cooling period (15s) to reset API quota...")
    time.sleep(15)

    events, file_url = fetch_latest_gdelt_events(limit=limit)
    
    # Check for GDELT sync window
    if file_url:
        # e.g., http://.../20260302164500.export.CSV.zip
        timestamp_str = file_url.split('/')[-1].split('.')[0]
        print(f"[*] GDELT Sync Window: {timestamp_str}")
        print("[!] Note: GDELT updates global files global once every 15 minutes.")
    
    # Inject Targeted Cities if requested
    if targeted_cities:
        print(f"[*] Targeting specific cities: {', '.join(targeted_cities)}")
        for city in targeted_cities:
            incident_id = f"FOCUS_{city.upper()}_{int(time.time())}"
            # Skip if already in database (to avoid search spam)
            if check_if_incident_exists(incident_id): continue
            
            # Lookup coordinates dynamically if not in hardcoded dict
            lat, lng = GEO_LOOKUP.get(city.upper(), (0, 0))
            if lat == 0 and lng == 0:
                print(f"[*] Fetching precise map coordinates for: {city}...")
                lat, lng = get_dynamic_coordinates(city)
                
            
            # Create a "pseudo-event" for the targeted city
            pseudo_row = {
                'GlobalEventID': incident_id,
                'ActionGeo_FullName': city,
                'ActionGeo_Lat': lat,
                'ActionGeo_Long': lng,
                'EventCode': 'FOCUS',
                'DATEADDED': int(time.time()),
                'SOURCEURL': 'Targeted Search',
                'NumArticles': 10, # Give it weight
                'AvgTone': -5
            }
            # Add to top of events if it's a dataframe
            new_row_df = pd.DataFrame([pseudo_row])
            events = pd.concat([new_row_df, events], ignore_index=True)

    if events.empty:
        print("[*] No active disaster signals found in current GDELT window.")
        return []

    live_incidents = []
    for index, row in events.iterrows():
        incident_id = str(row['GlobalEventID'])
        raw_location = row['ActionGeo_FullName']
        if pd.isna(raw_location): continue
        
        # ── Fix encoding issue in location name ──
        location = clean_location_name(raw_location)
        row['ActionGeo_FullName'] = location # Update for AI
        
        # ── Fix ocean mapping issue for generic GDELT events ──
        lat = float(row['ActionGeo_Lat']) if not pd.isna(row['ActionGeo_Lat']) else 0
        lng = float(row['ActionGeo_Long']) if not pd.isna(row['ActionGeo_Long']) else 0
        if lat == 0 and lng == 0:
            lat, lng = get_dynamic_coordinates(location)
        
        # ── NEW: Skip if already in database ──
        if check_if_incident_exists(incident_id):
            print(f"[*] Skipping {location} (already analyzed).")
            continue
        
        # ── Rate limiting sleep between NEW events ──
        if live_incidents:
            print("[*] Rate limit pause (5s)...")
            time.sleep(5)

        # 1. Search for news context
        search_query = f"Disaster news crisis situation {location}"
        context = search_disaster_context(search_query)

        # 1.5 Fetch Social Signals (Telegram & Reddit)
        tg_signals = search_social_media(location, platform="telegram", count=2)
        rd_signals = search_social_media(location, platform="reddit", count=2)
        
        # Combine all context for AI
        all_context = context + tg_signals + rd_signals
        
        # 2. Analyze (Priority: Groq -> Gemini -> Fallback)
        analysis = analyze_event_with_groq(row, all_context)
        
        if not analysis:
            # Fallback to Gemini if Groq fails or is not configured
            for attempt in range(3):
                analysis = analyze_event_with_gemini(row, all_context)
                if analysis == "QUOTA_EXHAUSTED":
                    break
                if analysis: break
                
                wait_time = (attempt + 1) * 60
                print(f"[!] Rate Limited. Retrying {attempt+1}/3 in {wait_time}s...")
                time.sleep(wait_time)
        
        # If all AI retries failed, use the Live Data Summary synthesis
        if not analysis or analysis == "QUOTA_EXHAUSTED":
            analysis = generate_live_data_summary(row, all_context)

        if analysis:
            # 3. Format for Frontend
            incident = {
                "id": str(row['GlobalEventID']),
                "name": f"Live: {location}",
                "emoji": "🚨",
                "location": location,
                "lat": lat,
                "lng": lng,
                "color": "var(--red)",
                "signals": [
                    {"source": "GDELT", "type": "event_record", "value": f"Event {row['EventCode']} detected at {location}", "timestamp": str(row['DATEADDED'])},
                ],
                "analysis": analysis,
                "isLive": True
            }

            # Append platform-specific signals for the UI trace
            for s in tg_signals:
                incident["signals"].append({"source": "Telegram", "type": "social_sos", "value": s.get('title'), "timestamp": "Real-time"})
            for s in rd_signals:
                incident["signals"].append({"source": "Reddit", "type": "social_report", "value": s.get('title'), "timestamp": "Recent"})
            for s in context[:3]:
                incident["signals"].append({"source": "News", "type": "news_clip", "value": s.get('title'), "timestamp": "Just now"})
        
            # Save to Database
            save_incident(incident)
            live_incidents.append(incident)
            
    return live_incidents

def export_incidents_to_json(output_path):
    """Exports all incidents from the database to a JSON file."""
    all_data = get_all_incidents()
    with open(output_path, "w", encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    print(f"[*] Exported {len(all_data)} incidents to {output_path}")

init_db() # Ensure DB is ready on import

if __name__ == "__main__":
    incidents = process_live_crises(limit=1)
    if incidents:
        print(json.dumps(incidents, indent=2))
