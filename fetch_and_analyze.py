import json
import os
import sys
from datetime import datetime

# Add src to path so relative imports work if running from root
sys.path.append(os.path.join(os.getcwd()))

try:
    from src.services.intelligence_engine import process_live_crises, export_incidents_to_json
except ImportError as e:
    print(f"[!] Import Error: {e}")
    print("Ensure you are running this from the Equinox project root.")
    sys.exit(1)

def run_pipeline():
    print(f"--- Disaster Intel Pipeline Started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---")
    
    # 1. Run analysis for NEW events
    # Support targeted cities from command line: python fetch_and_analyze.py Mumbai Pune
    targeted = sys.argv[1:] if len(sys.argv) > 1 else None
    
    process_live_crises(limit=3, targeted_cities=targeted)
    
    # 2. Export ALL incidents from DB to public directory for frontend
    public_dir = os.path.join(os.getcwd(), "public")
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)
        
    output_path = os.path.join(public_dir, "live_incidents.json")
    export_incidents_to_json(output_path)
        
    print(f"\n[✓] Success! Pipeline complete.")
    print("--- Pipeline Finished ---")

if __name__ == "__main__":
    run_pipeline()
