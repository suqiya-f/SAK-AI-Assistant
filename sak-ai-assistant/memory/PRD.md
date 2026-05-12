# SAK AI Assistant — PRD

## Problem Statement
"SAK AI Assistant" by Suqiya — all-in-one AI platform with chat, image generation, translation, content analysis, weather, notes & bookmarks. Sky-blue branding. Tagline: *"Turning Ideas into Intelligent Experiences"*.

## Architecture
- **Backend**: FastAPI + MongoDB + `emergentintegrations` (Claude/Gemini) + `pypdf` (PDF extraction) + `httpx` (Open-Meteo). JWT + bcrypt auth.
- **Frontend**: React 18 (CRA) + Tailwind + react-router + react-markdown + lucide-react + **jsPDF** (client-side PDF export). Fonts: Outfit + Manrope.
- **AI Models** (via EMERGENT_LLM_KEY):
  - Chat / File Analysis / Photo Analysis → `claude-sonnet-4-5-20250929`
  - Translation → `claude-haiku-4-5-20251001`
  - Image generation → `gemini-3.1-flash-image-preview` (Nano Banana)
- **Weather**: Open-Meteo (free, no key, never expires) — geocoding + 7-day forecast worldwide.

## What's Implemented

### 2026-05-12 — MVP
- JWT auth (register/login/me) with bcrypt
- AI chat with conversation history sidebar + markdown rendering
- Image Studio (Gemini Nano Banana) + gallery
- Translation (15+ languages)
- Notes & Bookmarks CRUD
- Dark mode toggle (persisted)
- Sky-blue branded UI, responsive layout
- ✅ Backend tests: 20/20

### 2026-05-12 — Splash + Landing animations
- 4-second cinematic SAK splash (orbital rings, letter-by-letter reveal, twinkling stars, typewriter title)
- Landing hero: floating chat preview with auto-typing prompts, floating decorative tiles, animated blobs, infinite language marquee, animated CTA banner, staggered feature card reveals

### 2026-05-12 — Mobile + Content analysis + Weather + PDF
- **Mobile interface** polish — drawer history, slimmer composer, mobile-friendly weather grid
- **Chat attachments**:
  - 📎 Attach file (PDF/TXT/MD/CSV/JSON/HTML/code/images) → AI summary
  - 📸 Take photo (mobile camera capture) → AI vision analysis
  - 🖼️ Add photo from gallery → AI vision analysis
- **Chat export to PDF** (jsPDF, client-side)
- **Weather worldwide page** (Open-Meteo): autocomplete city search with country flags, current conditions card with gradient + stats, 7-day forecast
- Animated typing-dots indicator in chat
- Gradient user message bubbles + assistant avatar
- ✅ Backend tests: 38/38

## API Surface (current)
- **Auth**: `POST /api/auth/register|login`, `GET /api/auth/me`
- **Chat**: `POST /api/chat/message`, `GET /api/chat/history`, `GET /api/chat/history/{id}`, `DELETE /api/chat/history/{id}`
- **Image**: `POST /api/image/generate`, `GET /api/image/gallery`
- **Translation**: `POST /api/translation/translate`, `GET /api/translation/languages`
- **File analysis**: `POST /api/file/analyze` (multipart upload)
- **Photo analysis**: `POST /api/photo/analyze` (base64)
- **Weather**: `GET /api/weather/current?city=`, `GET /api/weather/search?q=` (public, no auth)
- **Notes**: full CRUD on `/api/notes`
- **Bookmarks**: full CRUD on `/api/bookmarks`

## Prioritized Backlog
- **P1** PDF editing (annotate, add text overlay, delete pages) — needs `pdf-lib` + `react-pdf`
- **P1** Multiple photo upload at once with batch analysis
- **P1** Streaming chat responses (SSE)
- **P2** Voice input (Web Speech API) + better TTS controls
- **P2** Shareable chat links (public read-only URL)
- **P3** MongoDB indexes on `user_id` for chats/notes/bookmarks/images
- **P3** Split server.py into routers (auth/chat/image/file/weather)
- **P3** Tighten CORS for production

## Next Tasks
1. User to click **Deploy** → top-right of Emergent
2. User to click **Save to GitHub** → bottom of chat input
3. Iterate on P1 features (PDF editor, streaming chat)
