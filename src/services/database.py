import sqlite3
import json
import os

DB_PATH = os.path.join(os.getcwd(), "disaster_intel.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Table to store unique incidents (by GlobalEventID)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            name TEXT,
            location TEXT,
            lat REAL,
            lng REAL,
            data_json TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def check_if_incident_exists(incident_id):
    """Returns True if the incident is already in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT 1 FROM incidents WHERE id = ?', (incident_id,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

def save_incident(incident_data):
    """Saves or updates a live incident in the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # incident_data is the full dict we send to frontend
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO incidents (id, name, location, lat, lng, data_json)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            incident_data['id'],
            incident_data['name'],
            incident_data['location'],
            incident_data['lat'],
            incident_data['lng'],
            json.dumps(incident_data)
        ))
        conn.commit()
    except Exception as e:
        print(f"[!] DB Save Error: {e}")
    finally:
        conn.close()

def get_all_incidents():
    """Retrieves all stored incidents from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT data_json FROM incidents ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    conn.close()
    
    return [json.loads(row[0]) for row in rows]

if __name__ == "__main__":
    init_db()
    print("[*] Database initialized.")
