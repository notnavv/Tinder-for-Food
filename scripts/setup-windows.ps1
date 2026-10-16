# One-time setup on Windows (PowerShell). Run from the repo root:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
$ErrorActionPreference = "Stop"

if (-not (Get-Command py -ErrorAction SilentlyContinue)) { throw "Python launcher 'py' not found. Install Python 3.12 from python.org (check 'Add to PATH')." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "Node.js not found. Install Node 20+ from https://nodejs.org" }

Write-Host "==> Backend: creating backend\.venv with Python 3.12"
Push-Location backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip -q
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt -q
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Pop-Location

Write-Host "==> Frontend: installing npm packages"
Push-Location frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
Pop-Location

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  Backend:  cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"
Write-Host "  Frontend: cd frontend; npm run dev"
