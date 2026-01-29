DEPLOY A PRODUCCION

Frontend (Vercel)
1) Subi el repo a GitHub.
2) En Vercel: New Project -> importar repo.
3) En Project Settings -> Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4) Framework preset: Next.js. Root Directory: frontend
5) Deploy.

Backend (Render)
1) En Render: New -> Web Service -> conectar repo.
2) Root directory: backend
3) Build command: pip install -r requirements.txt
4) Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
5) Env vars:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE
   - WHATSAPP_TOKEN
   - WHATSAPP_PHONE_NUMBER_ID
   - VERIFY_TOKEN
   - OPENAI_API_KEY (opcional)

Backend (Railway)
1) New Project -> Deploy from GitHub.
2) Root directory: backend (en Railway -> Settings -> Root Directory)
3) Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
4) Env vars iguales a Render.

CI/CD
- GitHub Actions: .github/workflows/ci.yml
  - Backend: pip install + compileall
  - Frontend: npm ci + npm run build

Notas
- Si el frontend falla al build por envs, revisa NEXT_PUBLIC_* en Vercel.
- Si el backend falla al iniciar por .env, revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE.
