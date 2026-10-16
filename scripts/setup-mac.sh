#!/usr/bin/env bash
# One-time setup on macOS / Linux. Run from the repo root:  bash scripts/setup-mac.sh
set -euo pipefail

PY="${PYTHON:-python3.12}"
command -v "$PY" >/dev/null || { echo "Python 3.12 not found. Install it (brew install python@3.12) or run: PYTHON=python3 bash scripts/setup-mac.sh"; exit 1; }
command -v npm >/dev/null || { echo "Node.js not found. Install Node 20+ from https://nodejs.org"; exit 1; }

echo "==> Backend: creating backend/.venv with $($PY --version)"
cd backend
"$PY" -m venv .venv
.venv/bin/pip install --upgrade pip -q
.venv/bin/pip install -r requirements-dev.txt -q
[ -f .env ] || cp .env.example .env
cd ..

echo "==> Frontend: installing npm packages"
cd frontend
npm install
[ -f .env.local ] || cp .env.example .env.local
cd ..

echo
echo "Done. Next:"
echo "  Backend:  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo "Both run in mock mode until you fill in backend/.env and frontend/.env.local."
