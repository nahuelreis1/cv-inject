# Developer Guide — CV Prompt Injection Tool

## Quick Start (Users)

```bash
git clone https://github.com/nahuelreis1/cv-inject.git
cd cv-inject
npm start
```

The wizard handles everything. No manual `.env`, no database setup, no Docker.

## For Developers

### Requirements
- Node.js 20 LTS

### Architecture

```
Frontend (Astro 5 + React 19, port 4321)
    ↕ /api proxy (dev) or same-origin (prod)
Backend (Express.js + TypeScript, port 3000)
    ↕
Memory Store (in-RAM, zero config)
    ↕
AI Provider (Gemini / DeepSeek / OpenAI-compatible)
```

### Manual start (without wizard)

```bash
# Backend
cd backend
cp .env.example .env     # add your AI_PROVIDER and API key
npm install
npm run dev              # port 3000

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev              # port 4321
```

### Mock mode (no API key)

Set `GEMINI_MOCK=true` in `backend/.env`. All AI calls return sample data.

### Optional: PostgreSQL persistence

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` in `backend/.env`. Run `database/schema.sql` in Supabase SQL Editor. Without these, the memory store is used (data lost on restart).

### Optional: Docker

```bash
cd infra
cp .env.example .env
docker-compose up -d --build
```

For n8n automation (optional): `docker-compose -f docker-compose.yml -f docker-compose.n8n.yml up`

### Optional: n8n workflows

Workflow JSON files in `n8n/` can be imported into n8n UI. Requires Docker or self-hosted n8n instance.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/health | Health check |
| POST | /api/upload-cv | Upload CV PDF |
| POST | /api/analyze-job | Analyze LinkedIn job posting |
| POST | /api/generate-cv | Generate optimized CV with prompt injection |
| GET | /api/download/:id | Download generated PDF |
| POST | /api/batch-process | Process multiple jobs at once |

## Verification

```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend
curl http://localhost:4321

# Upload CV
curl -X POST http://localhost:3000/api/upload-cv -F "cv=@test-cv.pdf"
```
