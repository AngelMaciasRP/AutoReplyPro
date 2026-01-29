# Odontobot Backend (minimal)
This folder includes a copy of your uploaded whatsapp webhook file at:
app/routers/whatsapp.py

To run backend:
1. Create virtual env and install requirements:
   python -m venv .venv
   .venv\Scripts\activate   (Windows)  OR  source .venv/bin/activate (Unix)
   pip install -r requirements.txt

2. Create .env in backend root with your keys:
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   VERIFY_TOKEN=...
   OPENAI_API_KEY=...
   SUPABASE_URL=...
   SUPABASE_KEY=...

3. Run:
   uvicorn app.main:app --reload --port 8000
