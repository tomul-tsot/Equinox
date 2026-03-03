from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import sys
import threading
import time

# Add root to sys.path
sys.path.append(os.getcwd())

from src.services.intelligence_engine import process_live_crises, export_incidents_to_json
from src.services.database import init_db

app = Flask(__name__)
CORS(app)  # Allow frontend to talk to this server

# ── Paths ──────────────────────────────────────────────────────────
PUBLIC_DIR  = os.path.join(os.getcwd(), "public")
INCIDENTS_FILE = os.path.join(PUBLIC_DIR, "live_incidents.json")

def ensure_public_dir():
    if not os.path.exists(PUBLIC_DIR):
        os.makedirs(PUBLIC_DIR)

# ── Background refresh ─────────────────────────────────────────────
REFRESH_INTERVAL_SECONDS = 5 * 60   # 5 minutes

_refresh_lock = threading.Lock()    # prevent overlapping pipeline runs

def run_refresh_pipeline():
    """Fetch fresh GDELT data, analyze, export JSON. Thread-safe."""
    if not _refresh_lock.acquire(blocking=False):
        print("[*] Refresh already in progress — skipping.")
        return
    try:
        print(f"[*] --- Auto-Refresh: Starting pipeline at {time.strftime('%H:%M:%S')} ---")
        ensure_public_dir()
        process_live_crises(limit=3)
        export_incidents_to_json(INCIDENTS_FILE)
        print(f"[✓] Auto-Refresh: live_incidents.json updated.")
    except Exception as e:
        print(f"[!] Auto-Refresh Error: {e}")
    finally:
        _refresh_lock.release()

def _scheduler_loop():
    """Background daemon thread: waits REFRESH_INTERVAL then re-runs."""
    # First run: wait a bit so the server is fully up before hitting APIs
    time.sleep(30)
    while True:
        run_refresh_pipeline()
        time.sleep(REFRESH_INTERVAL_SECONDS)

# ── API routes ─────────────────────────────────────────────────────
@app.route('/api/search', methods=['POST'])
def search_city():
    data = request.json
    city = data.get('city')
    if not city:
        return jsonify({"error": "No city provided"}), 400

    print(f"[*] Frontend requested search for: {city}")
    try:
        process_live_crises(limit=1, targeted_cities=[city])
        ensure_public_dir()
        export_incidents_to_json(INCIDENTS_FILE)
        with open(INCIDENTS_FILE, 'r', encoding='utf-8') as f:
            all_incidents = json.load(f)
        return jsonify(all_incidents)
    except Exception as e:
        print(f"[!] Server Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/refresh', methods=['POST'])
def manual_refresh():
    """Trigger an immediate pipeline refresh from the frontend."""
    thread = threading.Thread(target=run_refresh_pipeline, daemon=True)
    thread.start()
    return jsonify({"status": "refresh_started"}), 202


@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    """Return the current live_incidents.json so the frontend can poll."""
    try:
        if os.path.exists(INCIDENTS_FILE):
            with open(INCIDENTS_FILE, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        return jsonify([])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Startup ────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("--- Equinox Intelligence Server Starting on Port 5000 ---")

    # Launch background auto-refresh scheduler
    scheduler = threading.Thread(target=_scheduler_loop, daemon=True)
    scheduler.start()
    print(f"[✓] Auto-refresh scheduler started (every {REFRESH_INTERVAL_SECONDS // 60} minutes).")

    app.run(port=5000)
