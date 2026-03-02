"""
INTELMAP Python Microservice
Fetches real-time crisis data using GDELT and DuckDuckGo Search (ddgs).
Run with: uvicorn app:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, Query, HTTPException
from duckduckgo_search import DDGS
from gdeltdoc import GdeltDoc, Filters
from datetime import datetime, timedelta
import traceback

app = FastAPI(title="INTELMAP Data Fetcher", version="1.0.0")

CRISIS_KEYWORDS = [
    "fire", "flood", "earthquake", "explosion", "accident",
    "collapse", "landslide", "storm", "evacuation", "wildfire",
    "tsunami", "hurricane", "cyclone", "disaster", "crisis",
]


def normalize_timestamp(ts) -> str:
    """Return ISO timestamp string or current time if unparseable."""
    if not ts:
        return datetime.utcnow().isoformat()
    if isinstance(ts, datetime):
        return ts.isoformat()
    try:
        # GDELT uses YYYYMMDDHHMMSS
        return datetime.strptime(str(ts), "%Y%m%d%H%M%S").isoformat()
    except Exception:
        try:
            return datetime.fromisoformat(str(ts)).isoformat()
        except Exception:
            return str(ts)


def fetch_gdelt(query: str, max_results: int = 5) -> list[dict]:
    """Fetch recent articles from GDELT filtered by query keyword."""
    results = []
    try:
        gd = GdeltDoc()
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=3)

        f = Filters(
            keyword=query,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            num_records=max_results,
        )
        articles_df = gd.article_search(f)

        if articles_df is not None and not articles_df.empty:
            for _, row in articles_df.iterrows():
                title = str(row.get("title", "")).strip()
                url = str(row.get("url", "")).strip()
                seendate = row.get("seendate", "")
                domain = str(row.get("domain", "")).strip()

                if not title or not url:
                    continue

                results.append({
                    "source": "gdelt",
                    "headline": title,
                    "description": f"[{domain}] {title}",
                    "url": url,
                    "timestamp": normalize_timestamp(seendate),
                })
    except Exception as e:
        print(f"[GDELT ERROR] {e}\n{traceback.format_exc()}")

    return results


def fetch_ddgs(query: str, max_results: int = 5) -> list[dict]:
    """Fetch news from DuckDuckGo Search."""
    results = []
    try:
        with DDGS() as ddgs:
            news_items = ddgs.news(
                keywords=query,
                region="wt-wt",
                safesearch="off",
                timelimit="d",  # last 24 hours
                max_results=max_results,
            )
            for item in news_items:
                title = str(item.get("title", "")).strip()
                body = str(item.get("body", "")).strip()
                url = str(item.get("url", "")).strip()
                date = item.get("date", "")

                if not title:
                    continue

                results.append({
                    "source": "ddgs",
                    "headline": title,
                    "description": body or title,
                    "url": url,
                    "timestamp": normalize_timestamp(date),
                })
    except Exception as e:
        print(f"[DDGS ERROR] {e}\n{traceback.format_exc()}")

    return results


@app.get("/fetch-live-data")
def fetch_live_data(query: str = Query(..., description="Crisis keyword to search for")):
    """
    Fetch real-time crisis news from GDELT and DuckDuckGo.
    Returns a list of article objects.
    """
    # Validate query is a known crisis keyword or allow any term
    query = query.strip().lower()
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required.")

    gdelt_results = fetch_gdelt(query, max_results=5)
    ddgs_results = fetch_ddgs(query, max_results=5)

    all_results = gdelt_results + ddgs_results

    if not all_results:
        raise HTTPException(
            status_code=503,
            detail=f"No live data found for query '{query}'. Both GDELT and DDGS returned empty results."
        )

    return all_results


@app.get("/health")
def health():
    return {"status": "ok", "service": "INTELMAP Python Fetcher"}


@app.get("/keywords")
def get_keywords():
    """Return the list of supported crisis keywords."""
    return {"keywords": CRISIS_KEYWORDS}
