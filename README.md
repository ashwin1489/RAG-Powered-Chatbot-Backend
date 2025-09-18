1) Tech stack (copy into your submission)

Embeddings — sentence-transformers / all-MiniLM-L6-v2 (open-source; fast & small).
Vector DB — Qdrant Cloud (managed, easy to query).
LLM API — Google Gemini API (as required by assignment).
Backend — Node.js + Express.
Redis — ioredis for session history (Upstash or managed Redis for Render).
Frontend — React (Vite) + SCSS.
Deployment — Render (backend), Vercel (frontend).
Optional persistence — Postgres (Render DB) for storing final transcripts.

Why these? small footprint, easy to host on free tiers, Qdrant + local embeddings are cost friendly, Node + Redis is common for session caching.

2) Backend README (copy into backend/README.md)
# RAG News Backend

## Overview
Express API that:
- Ingests news into Qdrant (script `scripts/ingest_news.py`)
- Provides endpoints: `/api/chat`, `/api/chat/stream`, `/api/session/:id/history`, `/api/session/:id/clear`, `/api/health`
- Uses Redis for session history caching
- Uses Gemini API for final answers

## Quickstart (local)
1. Create `.env` (do NOT commit):
     PORT=4000
REDIS_URL=redis://localhost:6379 # or Upstash URL
QDRANT_URL=https://<your-qdrant-host>
QDRANT_API_KEY=<your-qdrant-api-key>
QDRANT_COLLECTION=news_embeddings
GEMINI_API_URL=https://api.studio.googlecloud.ai/
...... # your endpoint
GEMINI_API_KEY=<your_gemini_key>
SESSION_TTL_SECONDS=86400

2. Install & run:
```bash
npm install
npm run dev         # for local dev with nodemon

ngest news to Qdrant (Python script)

Use scripts/ingest_news.py. Example:

python scripts/ingest_news.py --limit 50

This connects to Qdrant Cloud using QDRANT_URL and QDRANT_API_KEY.

Endpoints

POST /api/chat body { message: string, sessionId?: string } → returns { sessionId, reply, retrieved }

POST /api/chat/stream body { message, sessionId? } → SSE streaming of tokens

GET /api/session/:sessionId/history → returns session message history from Redis

POST /api/session/:sessionId/clear → clears history

GET /api/health → { status: "ok" }

Testing with curl (PowerShell notes)

PowerShell treats {} specially. Use curl.exe --% or single-quote JSON:

Example (PowerShell):
curl.exe --% -X POST -H "Content-Type: application/json" -d "{\"message\":\"hello\"}" "https://<your-backend>/api/chat"

Notes

DO NOT commit .env. Add .env to .gitignore.

Make sure QDRANT_COLLECTION exists (ingest script creates it).


---

# 3) Frontend README (copy into `frontend/README.md`)
