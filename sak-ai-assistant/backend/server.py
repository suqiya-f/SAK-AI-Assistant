"""SAK AI Assistant Backend - Created by Suqiya."""
import os
import base64
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from fastapi import UploadFile, File, Form
import httpx
from io import BytesIO
from pypdf import PdfReader

# --- Config ---
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

# --- DB ---
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# --- Auth utilities ---
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()


def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)


def verify_password(p: str, h: str) -> bool:
    return pwd_ctx.verify(p, h)


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# --- App ---
app = FastAPI(title="SAK AI Assistant API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---
class RegisterReq(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class ChatMessageReq(BaseModel):
    message: str
    chat_id: Optional[str] = None


class ImageGenReq(BaseModel):
    prompt: str


class TranslateReq(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = "auto"


class NoteReq(BaseModel):
    title: str
    content: str
    tags: List[str] = []


class BookmarkReq(BaseModel):
    title: str
    url: str
    description: Optional[str] = ""


class PhotoAnalyzeReq(BaseModel):
    image: str  # base64 (no data: prefix expected, but we strip it if present)
    prompt: Optional[str] = "Describe this image in detail."


# --- Routes ---
@api.get("/")
async def root():
    return {"app": "SAK AI Assistant", "creator": "Suqiya", "status": "ok"}


# AUTH
@api.post("/auth/register")
async def register(body: RegisterReq):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": body.name,
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {
        "token": token,
        "user": {"id": user_id, "name": body.name, "email": body.email.lower()},
    }


@api.post("/auth/login")
async def login(body: LoginReq):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


# CHAT
SYSTEM_PROMPT = (
    "You are SAK AI, a brilliant, friendly assistant created by Suqiya. "
    "Always answer comprehensively using clear Markdown: headings, bullet lists, "
    "**bold** key terms, and fenced code blocks for code. Be helpful and concise."
)


@api.post("/chat/message")
async def chat_message(body: ChatMessageReq, current=Depends(get_current_user)):
    user_id = current["id"]
    chat_id = body.chat_id or str(uuid.uuid4())

    # Load prior messages for context
    history_doc = await db.chats.find_one({"id": chat_id, "user_id": user_id}, {"_id": 0})
    is_new = history_doc is None

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"{user_id}:{chat_id}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        response_text = await chat.send_message(UserMessage(text=body.message))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    now = datetime.now(timezone.utc).isoformat()
    user_msg = {"role": "user", "content": body.message, "timestamp": now}
    ai_msg = {"role": "assistant", "content": response_text, "timestamp": now}

    if is_new:
        title = body.message[:60] + ("..." if len(body.message) > 60 else "")
        await db.chats.insert_one({
            "id": chat_id,
            "user_id": user_id,
            "title": title,
            "messages": [user_msg, ai_msg],
            "created_at": now,
            "updated_at": now,
        })
    else:
        await db.chats.update_one(
            {"id": chat_id, "user_id": user_id},
            {"$push": {"messages": {"$each": [user_msg, ai_msg]}},
             "$set": {"updated_at": now}},
        )

    return {"chat_id": chat_id, "response": response_text}


@api.get("/chat/history")
async def chat_history(current=Depends(get_current_user)):
    cursor = db.chats.find(
        {"user_id": current["id"]},
        {"_id": 0, "id": 1, "title": 1, "updated_at": 1, "created_at": 1},
    ).sort("updated_at", -1)
    return await cursor.to_list(length=200)


@api.get("/chat/history/{chat_id}")
async def chat_detail(chat_id: str, current=Depends(get_current_user)):
    doc = await db.chats.find_one(
        {"id": chat_id, "user_id": current["id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Chat not found")
    return doc


@api.delete("/chat/history/{chat_id}")
async def chat_delete(chat_id: str, current=Depends(get_current_user)):
    result = await db.chats.delete_one({"id": chat_id, "user_id": current["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"ok": True}


# IMAGE GENERATION
@api.post("/image/generate")
async def image_generate(body: ImageGenReq, current=Depends(get_current_user)):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"img:{current['id']}:{uuid.uuid4()}",
        system_message="You are a creative image generator.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    try:
        _, images = await chat.send_message_multimodal_response(
            UserMessage(text=body.prompt)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

    if not images:
        raise HTTPException(status_code=500, detail="No image generated")

    img = images[0]
    data_url = f"data:{img['mime_type']};base64,{img['data']}"

    record = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "prompt": body.prompt,
        "data_url": data_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.images.insert_one(record)
    return {"id": record["id"], "prompt": body.prompt, "image": data_url}


@api.get("/image/gallery")
async def image_gallery(current=Depends(get_current_user)):
    cursor = db.images.find(
        {"user_id": current["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50)
    return await cursor.to_list(length=50)


# TRANSLATION
SUPPORTED_LANGS = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Russian",
    "Turkish", "Dutch", "Swedish", "Urdu",
]


@api.get("/translation/languages")
async def translation_languages():
    return {"languages": SUPPORTED_LANGS}


@api.post("/translation/translate")
async def translate(body: TranslateReq, current=Depends(get_current_user)):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"tr:{current['id']}:{uuid.uuid4()}",
        system_message=(
            "You are a professional translator. Return ONLY the translated text, "
            "no explanations, no quotes, preserve formatting."
        ),
    ).with_model("anthropic", "claude-haiku-4-5-20251001")

    prompt = (
        f"Translate the following text to {body.target_language}. "
        f"Source language: {body.source_language or 'auto-detect'}.\n\n"
        f"Text:\n{body.text}"
    )
    try:
        translated = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
    return {"translated_text": translated.strip(), "target_language": body.target_language}


# NOTES
@api.get("/notes")
async def notes_list(current=Depends(get_current_user)):
    cursor = db.notes.find({"user_id": current["id"]}, {"_id": 0}).sort("updated_at", -1)
    return await cursor.to_list(length=500)


@api.post("/notes")
async def notes_create(body: NoteReq, current=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "title": body.title,
        "content": body.content,
        "tags": body.tags,
        "created_at": now,
        "updated_at": now,
    }
    await db.notes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.put("/notes/{note_id}")
async def notes_update(note_id: str, body: NoteReq, current=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.notes.update_one(
        {"id": note_id, "user_id": current["id"]},
        {"$set": {"title": body.title, "content": body.content,
                  "tags": body.tags, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    doc = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return doc


@api.delete("/notes/{note_id}")
async def notes_delete(note_id: str, current=Depends(get_current_user)):
    result = await db.notes.delete_one({"id": note_id, "user_id": current["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"ok": True}


# BOOKMARKS
@api.get("/bookmarks")
async def bookmarks_list(current=Depends(get_current_user)):
    cursor = db.bookmarks.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=500)


@api.post("/bookmarks")
async def bookmarks_create(body: BookmarkReq, current=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "title": body.title,
        "url": body.url,
        "description": body.description,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookmarks.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.delete("/bookmarks/{bookmark_id}")
async def bookmarks_delete(bookmark_id: str, current=Depends(get_current_user)):
    result = await db.bookmarks.delete_one({"id": bookmark_id, "user_id": current["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"ok": True}


# FILE ANALYSIS
TEXT_EXTS = {"txt", "md", "csv", "json", "log", "html", "xml", "py", "js", "ts", "jsx", "tsx", "yaml", "yml"}
IMAGE_EXTS = {"png", "jpg", "jpeg", "webp", "gif"}


def _extract_text_from_pdf(content: bytes, max_chars: int = 20000) -> str:
    reader = PdfReader(BytesIO(content))
    parts = []
    total = 0
    for page in reader.pages:
        try:
            t = page.extract_text() or ""
        except Exception:
            t = ""
        parts.append(t)
        total += len(t)
        if total >= max_chars:
            break
    return "\n\n".join(parts)[:max_chars]


@api.post("/file/analyze")
async def file_analyze(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form("Analyze this content and provide a clear, structured summary with key points."),
    current=Depends(get_current_user),
):
    name = (file.filename or "file").lower()
    ext = name.rsplit(".", 1)[-1] if "." in name else ""
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Build the LLM call
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"file:{current['id']}:{uuid.uuid4()}",
        system_message=(
            "You are SAK AI, an expert content analyzer. Provide concise, well-structured "
            "Markdown analyses with: a 1-line TL;DR, key points (bullets), entities/topics, "
            "and any action items if relevant."
        ),
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        if ext == "pdf":
            text = _extract_text_from_pdf(content)
            if not text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            full_prompt = f"{prompt}\n\nFile: {file.filename}\n\nContent:\n{text}"
            response = await chat.send_message(UserMessage(text=full_prompt))
        elif ext in TEXT_EXTS:
            try:
                text = content.decode("utf-8", errors="ignore")[:20000]
            except Exception:
                raise HTTPException(status_code=400, detail="Could not decode file as text")
            full_prompt = f"{prompt}\n\nFile: {file.filename}\n\nContent:\n{text}"
            response = await chat.send_message(UserMessage(text=full_prompt))
        elif ext in IMAGE_EXTS:
            b64 = base64.b64encode(content).decode("utf-8")
            response = await chat.send_message(
                UserMessage(text=prompt, file_contents=[ImageContent(b64)])
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    return {
        "filename": file.filename,
        "type": ext,
        "size": len(content),
        "analysis": response,
    }


# PHOTO ANALYSIS (base64 from camera/uploads)
@api.post("/photo/analyze")
async def photo_analyze(body: PhotoAnalyzeReq, current=Depends(get_current_user)):
    img = body.image
    if img.startswith("data:"):
        # strip data URL prefix
        img = img.split(",", 1)[-1]
    if not img or len(img) < 100:
        raise HTTPException(status_code=400, detail="Invalid image data")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"photo:{current['id']}:{uuid.uuid4()}",
        system_message=(
            "You are SAK AI, a visual analyst. Describe and analyze images using Markdown: "
            "a 1-line TL;DR, list of detected objects/people, scene context, colors/composition, "
            "and any readable text (OCR)."
        ),
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        response = await chat.send_message(
            UserMessage(text=body.prompt or "Analyze this image.", file_contents=[ImageContent(img)])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo analysis failed: {str(e)}")

    return {"analysis": response}


# WEATHER (Open-Meteo, free, no API key, never expires)
@api.get("/weather/current")
async def weather_current(city: str):
    if not city.strip():
        raise HTTPException(status_code=400, detail="City required")
    async with httpx.AsyncClient(timeout=15) as cx:
        geo = await cx.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1, "language": "en", "format": "json"},
        )
        if geo.status_code != 200:
            raise HTTPException(status_code=502, detail="Geocoding failed")
        gd = geo.json().get("results") or []
        if not gd:
            raise HTTPException(status_code=404, detail=f"City not found: {city}")
        loc = gd[0]
        lat, lon = loc["latitude"], loc["longitude"]
        w = await cx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat, "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max",
                "timezone": "auto",
                "forecast_days": 7,
            },
        )
        if w.status_code != 200:
            raise HTTPException(status_code=502, detail="Weather API failed")
        wd = w.json()
    return {
        "location": {
            "name": loc.get("name"),
            "country": loc.get("country"),
            "country_code": loc.get("country_code"),
            "admin1": loc.get("admin1"),
            "latitude": lat, "longitude": lon,
            "timezone": wd.get("timezone"),
        },
        "current": wd.get("current"),
        "daily": wd.get("daily"),
    }


@api.get("/weather/search")
async def weather_search(q: str):
    if not q.strip():
        return {"results": []}
    async with httpx.AsyncClient(timeout=10) as cx:
        r = await cx.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": q, "count": 8, "language": "en", "format": "json"},
        )
    if r.status_code != 200:
        return {"results": []}
    data = r.json().get("results") or []
    return {"results": [
        {
            "name": x.get("name"),
            "country": x.get("country"),
            "country_code": x.get("country_code"),
            "admin1": x.get("admin1"),
            "latitude": x.get("latitude"),
            "longitude": x.get("longitude"),
        } for x in data
    ]}


app.include_router(api)