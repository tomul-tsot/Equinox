from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import json
import sys

# Add root to sys.path
sys.path.append(os.getcwd())

from src.services.intelligence_engine import process_live_crises, export_incidents_to_json

app = Flask(__name__)
CORS(app) # Allow frontend to talk to this server

@app.route('/api/search', methods=['POST'])
def search_city():
    data = request.json
    city = data.get('city')
    if not city:
        return jsonify({"error": "No city provided"}), 400

    print(f"[*] Frontend requested search for: {city}")
    
    # Run the intelligence pipeline for this specific city
    # We use a limit of 1 for manual searches to save quota
    try:
        process_live_crises(limit=1, targeted_cities=[city])
        
        # Export the updated database to the public folder
        public_dir = os.path.join(os.getcwd(), "public")
        output_path = os.path.join(public_dir, "live_incidents.json")
        export_incidents_to_json(output_path)
        
        # Reload the json to return the latest
        with open(output_path, 'r', encoding='utf-8') as f:
            all_incidents = json.load(f)
            
        return jsonify(all_incidents)
    except Exception as e:
        print(f"[!] Server Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize DB on start
    from src.services.database import init_db
    init_db()
    
    print("--- Equinox Intelligence Server Starting on Port 5000 ---")
    app.run(port=5000)
