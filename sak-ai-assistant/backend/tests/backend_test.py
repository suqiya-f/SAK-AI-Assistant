"""Backend tests for SAK AI Assistant API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://462a89a0-29ed-4036-b88a-54fc6cd939ad.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def user_creds():
    suffix = uuid.uuid4().hex[:10]
    return {
        "name": "TEST User",
        "email": f"test_{suffix}@example.com",
        "password": "Test@12345",
    }


@pytest.fixture(scope="session")
def token(user_creds):
    r = requests.post(f"{API}/auth/register", json=user_creds, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == user_creds["email"].lower()
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# --- Root ---
def test_root():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["app"] == "SAK AI Assistant"
    assert j["creator"] == "Suqiya"


# --- Auth ---
def test_register_duplicate(user_creds, token):
    r = requests.post(f"{API}/auth/register", json=user_creds, timeout=20)
    assert r.status_code == 400


def test_login_success(user_creds, token):
    r = requests.post(f"{API}/auth/login", json={
        "email": user_creds["email"], "password": user_creds["password"]
    }, timeout=20)
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={
        "email": "nouser@example.com", "password": "wrong"
    }, timeout=20)
    assert r.status_code == 401


def test_auth_me(auth_headers, user_creds):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["email"] == user_creds["email"].lower()
    assert "password" not in j


def test_auth_me_unauthenticated():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code in (401, 403)


def test_auth_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.here"}, timeout=10)
    assert r.status_code == 401


# --- Chat ---
@pytest.fixture(scope="session")
def chat_id_holder():
    return {}


def test_chat_message(auth_headers, chat_id_holder):
    r = requests.post(f"{API}/chat/message", headers=auth_headers,
                      json={"message": "Say hi in one short sentence."}, timeout=90)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "chat_id" in j and "response" in j
    assert isinstance(j["response"], str) and len(j["response"]) > 0
    chat_id_holder["id"] = j["chat_id"]


def test_chat_message_followup(auth_headers, chat_id_holder):
    cid = chat_id_holder.get("id")
    assert cid
    r = requests.post(f"{API}/chat/message", headers=auth_headers,
                      json={"message": "Now reply with 'OK'.", "chat_id": cid}, timeout=90)
    assert r.status_code == 200
    assert r.json()["chat_id"] == cid


def test_chat_history_list(auth_headers, chat_id_holder):
    r = requests.get(f"{API}/chat/history", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert chat_id_holder["id"] in ids


def test_chat_history_detail(auth_headers, chat_id_holder):
    r = requests.get(f"{API}/chat/history/{chat_id_holder['id']}", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["id"] == chat_id_holder["id"]
    assert len(j["messages"]) >= 4  # 2 turns


def test_chat_delete(auth_headers, chat_id_holder):
    r = requests.delete(f"{API}/chat/history/{chat_id_holder['id']}", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    r2 = requests.get(f"{API}/chat/history/{chat_id_holder['id']}", headers=auth_headers, timeout=15)
    assert r2.status_code == 404


def test_chat_unauthenticated():
    r = requests.post(f"{API}/chat/message", json={"message": "hi"}, timeout=15)
    assert r.status_code in (401, 403)


# --- Image ---
def test_image_generate(auth_headers):
    r = requests.post(f"{API}/image/generate", headers=auth_headers,
                      json={"prompt": "A small blue cube on white background"}, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["image"].startswith("data:image/") and ";base64," in j["image"]
    assert "id" in j


# --- Translation ---
def test_translation_languages(auth_headers):
    r = requests.get(f"{API}/translation/languages", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    langs = r.json()["languages"]
    assert isinstance(langs, list) and len(langs) >= 15
    assert "English" in langs and "Spanish" in langs


def test_translate(auth_headers):
    r = requests.post(f"{API}/translation/translate", headers=auth_headers,
                      json={"text": "Hello, how are you?", "target_language": "Spanish"}, timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["target_language"] == "Spanish"
    assert isinstance(j["translated_text"], str) and len(j["translated_text"]) > 0


# --- Notes CRUD ---
def test_notes_crud(auth_headers):
    # Create
    r = requests.post(f"{API}/notes", headers=auth_headers,
                      json={"title": "TEST Note", "content": "Body", "tags": ["t1"]}, timeout=15)
    assert r.status_code == 200
    note = r.json()
    nid = note["id"]
    assert note["title"] == "TEST Note"

    # List
    r = requests.get(f"{API}/notes", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert any(n["id"] == nid for n in r.json())

    # Update
    r = requests.put(f"{API}/notes/{nid}", headers=auth_headers,
                     json={"title": "TEST Note Updated", "content": "Body2", "tags": ["t2"]}, timeout=15)
    assert r.status_code == 200
    assert r.json()["title"] == "TEST Note Updated"

    # Delete
    r = requests.delete(f"{API}/notes/{nid}", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    # Delete again -> 404
    r = requests.delete(f"{API}/notes/{nid}", headers=auth_headers, timeout=15)
    assert r.status_code == 404


def test_notes_unauthenticated():
    r = requests.get(f"{API}/notes", timeout=10)
    assert r.status_code in (401, 403)


# --- Bookmarks CRUD ---
def test_bookmarks_crud(auth_headers):
    r = requests.post(f"{API}/bookmarks", headers=auth_headers,
                      json={"title": "TEST BM", "url": "https://example.com", "description": "d"}, timeout=15)
    assert r.status_code == 200
    bm = r.json()
    bid = bm["id"]
    assert bm["url"] == "https://example.com"

    r = requests.get(f"{API}/bookmarks", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert any(b["id"] == bid for b in r.json())

    r = requests.delete(f"{API}/bookmarks/{bid}", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    r = requests.delete(f"{API}/bookmarks/{bid}", headers=auth_headers, timeout=15)
    assert r.status_code == 404


def test_bookmarks_unauthenticated():
    r = requests.get(f"{API}/bookmarks", timeout=10)
    assert r.status_code in (401, 403)



# ============================================================
# Iteration 2 - New endpoints: file/analyze, photo/analyze, weather
# ============================================================
import base64 as _b64
from io import BytesIO as _BIO
from PIL import Image as _Image


def _make_jpeg_bytes(size=(64, 64), color=(70, 130, 180)) -> bytes:
    img = _Image.new("RGB", size, color)
    buf = _BIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def _make_png_bytes(size=(64, 64), color=(200, 100, 50)) -> bytes:
    img = _Image.new("RGB", size, color)
    buf = _BIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# --- /api/file/analyze ---
def test_file_analyze_text(auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    files = {"file": ("sample.txt", b"SAK AI was created by Suqiya. This is a brief note for testing.", "text/plain")}
    data = {"prompt": "Summarize in one line."}
    r = requests.post(f"{API}/file/analyze", headers=headers, files=files, data=data, timeout=90)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["filename"] == "sample.txt"
    assert j["type"] == "txt"
    assert isinstance(j["analysis"], str) and len(j["analysis"]) > 0
    assert j["size"] > 0


def test_file_analyze_image(auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    img_bytes = _make_jpeg_bytes()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"prompt": "What color dominates?"}
    r = requests.post(f"{API}/file/analyze", headers=headers, files=files, data=data, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["type"] == "jpg"
    assert isinstance(j["analysis"], str) and len(j["analysis"]) > 0


def test_file_analyze_unsupported_extension(auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    files = {"file": ("evil.exe", b"MZ\x00\x00binary", "application/octet-stream")}
    r = requests.post(f"{API}/file/analyze", headers=headers, files=files, timeout=30)
    assert r.status_code == 400, r.text
    assert "Unsupported" in r.json().get("detail", "")


def test_file_analyze_too_large(auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    big = b"a" * (10 * 1024 * 1024 + 100)
    files = {"file": ("big.txt", big, "text/plain")}
    r = requests.post(f"{API}/file/analyze", headers=headers, files=files, timeout=60)
    assert r.status_code == 400, r.text
    assert "too large" in r.json().get("detail", "").lower()


def test_file_analyze_unauthenticated():
    files = {"file": ("sample.txt", b"hello", "text/plain")}
    r = requests.post(f"{API}/file/analyze", files=files, timeout=15)
    assert r.status_code in (401, 403)


# --- /api/photo/analyze ---
def test_photo_analyze_success(auth_headers):
    img_bytes = _make_png_bytes()
    b64 = _b64.b64encode(img_bytes).decode("utf-8")
    assert len(b64) > 100
    r = requests.post(
        f"{API}/photo/analyze",
        headers=auth_headers,
        json={"image": b64, "prompt": "Describe briefly."},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert isinstance(j["analysis"], str) and len(j["analysis"]) > 0


def test_photo_analyze_with_data_url_prefix(auth_headers):
    img_bytes = _make_jpeg_bytes()
    b64 = _b64.b64encode(img_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"
    r = requests.post(
        f"{API}/photo/analyze",
        headers=auth_headers,
        json={"image": data_url, "prompt": "What is this?"},
        timeout=120,
    )
    assert r.status_code == 200, r.text


def test_photo_analyze_short_base64(auth_headers):
    r = requests.post(
        f"{API}/photo/analyze",
        headers=auth_headers,
        json={"image": "abc123", "prompt": "x"},
        timeout=15,
    )
    assert r.status_code == 400, r.text
    assert "Invalid image" in r.json().get("detail", "")


def test_photo_analyze_unauthenticated():
    r = requests.post(f"{API}/photo/analyze", json={"image": "a" * 200}, timeout=15)
    assert r.status_code in (401, 403)


# --- /api/weather/current (no auth) ---
@pytest.mark.parametrize("city", ["London", "Karachi", "Tokyo", "São Paulo"])
def test_weather_current_cities(city):
    r = requests.get(f"{API}/weather/current", params={"city": city}, timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "location" in j and "current" in j and "daily" in j
    loc = j["location"]
    assert loc["name"] and isinstance(loc["latitude"], (int, float))
    assert "temperature_2m" in j["current"]
    assert "temperature_2m_max" in j["daily"]


def test_weather_current_not_found():
    r = requests.get(f"{API}/weather/current", params={"city": "zzzqqqxxxnoplace12345"}, timeout=30)
    assert r.status_code == 404, r.text


def test_weather_current_no_auth_required():
    # Confirm no Authorization header still works (public endpoint)
    r = requests.get(f"{API}/weather/current", params={"city": "Paris"}, timeout=30)
    assert r.status_code == 200


# --- /api/weather/search ---
def test_weather_search_suggestions():
    r = requests.get(f"{API}/weather/search", params={"q": "lon"}, timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert "results" in j and isinstance(j["results"], list)
    assert len(j["results"]) >= 2
    # at least one entry should look like London
    names = [x.get("name", "").lower() for x in j["results"]]
    assert any("lon" in n for n in names)


def test_weather_search_empty():
    r = requests.get(f"{API}/weather/search", params={"q": ""}, timeout=15)
    assert r.status_code == 200
    assert r.json()["results"] == []


def test_weather_search_no_auth_required():
    r = requests.get(f"{API}/weather/search", params={"q": "Tokyo"}, timeout=20)
    assert r.status_code == 200
