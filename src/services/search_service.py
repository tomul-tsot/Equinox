import subprocess
import json
import os

def search_disaster_context(query, count=3):
    """Searches DuckDuckGo for context on a specific disaster event using ddgr."""
    print(f"[*] Searching context for: {query}")
    return _run_ddgr(query, count)

def search_social_media(location, platform="telegram", count=2):
    """Specific search for Telegram or Reddit content relating to a crisis."""
    site = "t.me" if platform == "telegram" else "reddit.com"
    # Search for help hashtags and crisis keywords
    query = f"site:{site} {location} disaster help crisis SOS"
    print(f"[*] Fetching {platform.capitalize()} signals for: {location}")
    return _run_ddgr(query, count)

def _run_ddgr(query, count):
    try:
        # Run ddgr via python -m ddgr to ensure it's found
        cmd = [
            "python", "-m", "ddgr",
            "--json",
            "--noprompt",
            "-n", str(count),
            query
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[!] Search Error (Code {result.returncode}): {result.stderr}")
            return []
            
        data = json.loads(result.stdout)
        return data
        
    except Exception as e:
        print(f"[!] Search Service Error: {e}")
        return []

if __name__ == "__main__":
    # Test search
    test_query = "Chennai Flood situation news"
    context = search_disaster_context(test_query)
    for i, res in enumerate(context):
        print(f"[{i+1}] {res.get('title')}\n    {res.get('url')}\n")
