# 🚀 SAK AI Assistant

**Created by Suqiya** — *Turning Ideas into Intelligent Experiences*

A full-stack AI platform with smart chat, image generation, multi-language translation, weather, content analysis, notes and bookmarks. Built on Emergent.

## ✨ Features

- 💬 **AI Smart Chat** — Claude Sonnet 4.5 with markdown rendering & conversation memory
- 🎨 **Image Studio** — Gemini Nano Banana image generation + gallery
- 🌍 **Translation** — 15+ languages via Claude Haiku
- 📎 **File Analysis** — Upload PDF/TXT/CSV/code/images for AI analysis
- 📸 **Photo Analysis** — Take/upload photos for AI vision (objects, OCR, scene)
- 🌤️ **Weather Worldwide** — Open-Meteo (free, no key) — current + 7-day forecast for any city
- 📄 **PDF Export** — Save any chat as a PDF (jsPDF)
- 📝 **Notes & Bookmarks** — Save and organize ideas
- 🌙 **Dark mode** with persistence
- 📱 **Mobile-first** responsive UI
- 🔐 **JWT auth** with bcrypt password hashing

## 🛠️ Tech Stack

**Backend** — FastAPI · MongoDB (motor) · `emergentintegrations` (Claude / Gemini) · pypdf · httpx · JWT (python-jose) · bcrypt (passlib)

**Frontend** — React 18 (CRA) · Tailwind CSS · react-router-dom · axios · react-markdown · lucide-react · jsPDF

**Fonts** — Outfit (headings), Manrope (body), JetBrains Mono (code)

## 🏃 Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and yarn
- MongoDB 6+ running locally

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Configure environment
cp .env.example .env
# Edit .env and set MONGO_URL, DB_NAME, JWT_SECRET, EMERGENT_LLM_KEY

uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 2. Frontend
```bash
cd frontend
yarn install

# Configure environment
cp .env.example .env
# Edit .env: REACT_APP_BACKEND_URL=http://localhost:8001

yarn start
# Opens http://localhost:3000
```

## 🌐 API Endpoints (`/api` prefix)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account → JWT |
| `POST` | `/auth/login` | Login → JWT |
| `GET` | `/auth/me` | Current user |
| `POST` | `/chat/message` | Send chat (Claude) |
| `GET` | `/chat/history` | List user chats |
| `GET` | `/chat/history/:id` | Chat detail |
| `DELETE` | `/chat/history/:id` | Delete chat |
| `POST` | `/image/generate` | Generate image (Nano Banana) |
| `GET` | `/image/gallery` | User image gallery |
| `POST` | `/translation/translate` | Translate text |
| `GET` | `/translation/languages` | Supported languages |
| `POST` | `/file/analyze` | Analyze uploaded file (multipart) |
| `POST` | `/photo/analyze` | Analyze photo (base64) |
| `GET` | `/weather/current?city=` | Current weather + 7-day (public) |
| `GET` | `/weather/search?q=` | City suggestions (public) |
| `GET/POST/PUT/DELETE` | `/notes` | Notes CRUD |
| `GET/POST/DELETE` | `/bookmarks` | Bookmarks CRUD |

## 🔑 Environment Variables

### `backend/.env`
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=sak_ai_assistant
JWT_SECRET=change-me-in-production
EMERGENT_LLM_KEY=sk-emergent-xxxxxxxxxxxx
```

### `frontend/.env`
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🚀 Deploy
- **Emergent native**: Click the **Deploy** button in the Emergent UI.
- **Vercel (frontend) + Render (backend)**: standard CRA build for frontend; `uvicorn server:app` for backend.

## 📄 License
MIT — Created by **Suqiya**

#SAKAI #CreatedBySuqiya
