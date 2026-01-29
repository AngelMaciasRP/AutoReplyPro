# Odontobot - Phase 1 (Full)
This archive contains:
- frontend/: Next.js 14 app (TypeScript) - Phase 1
- backend/: minimal backend scaffolding and included uploaded whatsapp.py

Steps to run frontend:
  cd frontend
  npm install
  npm run dev

Steps to run backend:
  cd backend
  python -m venv .venv
  activate venv and pip install -r requirements.txt
  create .env as instructed and run uvicorn app.main:app --reload --port 8000
