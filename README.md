# Tinder for Food 🍽️

**Can AI learn your food taste?** UCLA students swipe on real dining hall dishes, and a recommendation system learns what they like. An Art.Ificial at UCLA project, Fall 2026.

## File layout

```
frontend/                 React + TypeScript + Vite + Tailwind
  src/types/contracts.ts  shared data shapes (mirror of backend/app/schemas)
  src/lib/                Supabase client, API client, /deck fallback
  src/pages/              one file per page
backend/                  Python + FastAPI
  app/api/                HTTP routes (/health, /deck, /recommendations, /food-dna)
  app/schemas/            Pydantic data shapes
  app/ml/                 recommenders and Food DNA
  app/services/ingestion/ UCLA menu pipeline (fetch → parse → normalize → upsert)
  app/core/               config, auth, dining halls, shared vocab
  scripts/                command-line tools
  tests/
supabase/migrations/      database schema + security rules (SQL)
data/mock/                fake API responses, so frontend and backend can work separately
data/seed/                small hand-made data files
data/raw/                 downloaded menu pages (not committed)
notebooks/                ML experiments
scripts/                  one-time setup scripts for Mac and Windows
```

## Setup

You need **Git**, **Node.js 20+**, and **Python 3.12**.

**Mac**
```bash
brew install python@3.12 node
git clone https://github.com/notnavv/Tinder-for-Food.git
cd Tinder-for-Food
bash scripts/setup-mac.sh
```

**Windows** (install Python 3.12 from python.org with "Add to PATH" ticked, plus Node.js LTS and Git, then in PowerShell):
```powershell
git clone https://github.com/notnavv/Tinder-for-Food.git
cd Tinder-for-Food
powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

Everything runs in **mock mode** until you add Supabase keys, so no credentials are needed to start.

## Run

Backend at http://localhost:8000 (API docs at `/docs`):
```bash
cd backend
source .venv/bin/activate      # Windows: .\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Frontend at http://localhost:5173:
```bash
cd frontend
npm run dev
```

## Environment variables

| File | Contents |
|---|---|
| `frontend/.env.local` | Public Supabase URL + anon key, API URL. Template: `frontend/.env.example` |
| `backend/.env` | Supabase URL + **service-role key**. Template: `backend/.env.example` |

Never commit `.env` files, and never put the service-role key in the frontend.

## Checks

```bash
cd backend && pytest && ruff check .
cd frontend && npm run lint && npm run build
```

GitHub runs these on every pull request.
