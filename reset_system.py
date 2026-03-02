import os
import shutil

def reset():
    print("--- Equinox System Reset Initiated ---")
    
    # 1. Delete the SQLite database
    db_path = "disaster_intel.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"[✓] Deleted database: {db_path}")
    else:
        print("[!] Database not found, skipping.")

    # 2. Delete the exported JSON file
    json_path = os.path.join("public", "live_incidents.json")
    if os.path.exists(json_path):
        os.remove(json_path)
        print(f"[✓] Deleted JSON cache: {json_path}")
    else:
        print("[!] JSON cache not found, skipping.")

    print("\n[✔] Reset Complete. Your next 'npm run dev:full' will perform fresh AI analysis.")
    print("--- System Ready ---")

if __name__ == "__main__":
    reset()
