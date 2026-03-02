# INTELMAP Backend — Setup Guide

Node.js + Express + PostgreSQL backend for the INTELMAP Crisis Intelligence Platform.

---

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/download/) installed and running

---

## 1. Create the PostgreSQL Database

Open **psql** (or pgAdmin) and run:

```sql
CREATE DATABASE intelmap;
```

Then apply the schema:

```bash
psql -U your_user -d intelmap -f db/schema.sql
```

This creates the `crises` table.

---

## 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
copy .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/intelmap
GEMINI_API_KEY=your_gemini_api_key
NEWS_API_KEY=your_newsapi_key        # optional, only needed for /api/fetch-news
```

Get keys from:
- **Gemini**: https://aistudio.google.com/app/apikey
- **News API**: https://newsapi.org/register

---

## 3. Install Dependencies

```bash
cd server
npm install
```

---

## 4. Run the Server

**Development** (auto-restarts on file changes):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

Server runs at: `http://localhost:5000`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/analyze` | Analyze text via Gemini, store result |
| `GET` | `/api/crises` | Fetch all stored crises (newest first) |
| `GET` | `/api/crises/:id` | Fetch single crisis by ID |
| `POST` | `/api/fetch-news` | Pull news headlines, analyze & store |

### POST `/api/analyze`
```json
// Body:
{ "text": "Massive flooding reported in Adyar Basin, Chennai. Water levels 4m above normal." }

// Response 201:
{
  "id": 1,
  "raw_input": "...",
  "source": "manual",
  "crisis_type": "Flood",
  "severity": "HIGH",
  "location": "Chennai, Tamil Nadu, India",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "explanation": "...",
  "recommended_action": "...",
  "confidence_score": 87,
  "created_at": "2026-03-02T13:00:00.000Z"
}
```

---

## Architecture

```
server/
├── config/
│   └── db.js                  ← PostgreSQL pool (pg)
├── controllers/
│   └── crisisController.js    ← Route handler logic
├── routes/
│   └── crisisRoutes.js        ← Express router
├── services/
│   ├── geminiService.js       ← Gemini API + JSON validation
│   └── externalApiService.js  ← News API integration
├── db/
│   └── schema.sql             ← Table definition
├── server.js                  ← Express app + error middleware
├── package.json
├── .env.example
└── .gitignore
```
