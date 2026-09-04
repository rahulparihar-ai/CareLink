"""
CareLink — Streamlit Deployment Dashboard
==========================================
A production-ready Streamlit interface for the CareLink healthcare platform.

Run:
    streamlit run streamlit_app.py

Services launched automatically (subprocess):
  • Backend  — FastAPI  on http://localhost:8000
  • AI       — FastAPI  on http://localhost:8001

The frontend (Next.js) is shown as an embedded link; for full UI run:
    cd frontend && npm run dev
"""

from __future__ import annotations

import atexit
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

import requests
import streamlit as st

# ---------------------------------------------------------------------------
# Page config — must be first Streamlit call
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="CareLink — Healthcare Platform",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent
BACKEND_DIR = ROOT / "backend"
AI_DIR = ROOT / "ai"

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
AI_URL = os.environ.get("AI_URL", "http://localhost:8001")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
st.markdown(
    """
    <style>
    /* Smooth card blocks */
    div[data-testid="stExpander"] { border-radius: 12px; }
    div[data-testid="metric-container"] {
        background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
        border-radius: 12px;
        padding: 12px 16px;
        border: 1px solid #e2ecf7;
        box-shadow: 0 2px 8px rgba(15,40,80,.06);
    }
    .stButton > button {
        border-radius: 8px;
        font-weight: 600;
        transition: transform .15s ease, box-shadow .15s ease;
    }
    .stButton > button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(15,40,80,.12);
    }
    /* Status pill */
    .status-ok   { background:#d1fae5; color:#065f46; padding:3px 10px; border-radius:999px; font-size:.8rem; font-weight:600; }
    .status-fail { background:#fee2e2; color:#991b1b; padding:3px 10px; border-radius:999px; font-size:.8rem; font-weight:600; }
    .status-warn { background:#fef3c7; color:#92400e; padding:3px 10px; border-radius:999px; font-size:.8rem; font-weight:600; }
    h1, h2, h3 { letter-spacing: -0.5px; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Process management (start backend + AI in subprocesses)
# ---------------------------------------------------------------------------
_procs: list[subprocess.Popen] = []


def _kill_all() -> None:
    for p in _procs:
        try:
            p.terminate()
        except Exception:
            pass


atexit.register(_kill_all)


@st.cache_resource(show_spinner=False)
def start_services() -> dict[str, str]:
    """
    Start backend and AI FastAPI servers as background subprocesses.
    Returns a dict of {service: status}.
    """
    env = {**os.environ, "PYTHONUNBUFFERED": "1"}
    statuses: dict[str, str] = {}

    # --- Backend ---
    try:
        backend_proc = subprocess.Popen(
            [
                sys.executable, "-m", "uvicorn",
                "app.main:app",
                "--host", "0.0.0.0",
                "--port", "8000",
                "--log-level", "warning",
            ],
            cwd=str(BACKEND_DIR),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        _procs.append(backend_proc)
        statuses["backend"] = "starting"
    except Exception as exc:
        statuses["backend"] = f"error: {exc}"

    # --- AI ---
    try:
        ai_proc = subprocess.Popen(
            [
                sys.executable, "-m", "uvicorn",
                "ai.app.main:app",
                "--host", "0.0.0.0",
                "--port", "8001",
                "--log-level", "warning",
            ],
            cwd=str(ROOT),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        _procs.append(ai_proc)
        statuses["ai"] = "starting"
    except Exception as exc:
        statuses["ai"] = f"error: {exc}"

    # Give services a moment to bind
    time.sleep(2)
    return statuses


# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------

def _health(url: str, path: str = "/health", timeout: float = 3.0) -> tuple[bool, dict]:
    try:
        r = requests.get(f"{url}{path}", timeout=timeout)
        return r.status_code < 400, r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    except Exception:
        return False, {}


def status_pill(ok: bool, label_ok: str = "Online", label_fail: str = "Offline") -> str:
    if ok:
        return f'<span class="status-ok">● {label_ok}</span>'
    return f'<span class="status-fail">● {label_fail}</span>'


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def _post(base: str, path: str, payload: dict, timeout: float = 10.0) -> Optional[dict]:
    try:
        r = requests.post(f"{base}{path}", json=payload, timeout=timeout)
        return r.json()
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _get(base: str, path: str, params: Optional[dict] = None, timeout: float = 5.0) -> Optional[dict]:
    try:
        r = requests.get(f"{base}{path}", params=params, timeout=timeout)
        return r.json()
    except Exception as exc:
        return {"success": False, "error": str(exc)}


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------

def render_sidebar(backend_ok: bool, ai_ok: bool) -> str:
    with st.sidebar:
        st.image(
            "https://raw.githubusercontent.com/your-org/carelink/main/docs/logo.png"
            if False else None,
            width=48,
        ) if False else None

        st.markdown("## 🩺 CareLink")
        st.caption("Healthcare Platform · v0.1.0")
        st.divider()

        st.markdown("**Service Status**")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(status_pill(backend_ok, "Backend"), unsafe_allow_html=True)
        with col2:
            st.markdown(status_pill(ai_ok, "AI"), unsafe_allow_html=True)

        if not backend_ok or not ai_ok:
            if st.button("🔄 Restart Services", use_container_width=True):
                start_services.clear()
                st.rerun()

        st.divider()
        st.markdown("**Navigation**")
        page = st.radio(
            "Go to",
            [
                "🏠 Dashboard",
                "🔐 Auth & OTP",
                "🤖 AI Assistant",
                "📄 Documents",
                "🏥 Organizations",
                "📊 Audit Log",
                "⚙️ Configuration",
                "📱 Full App (Next.js)",
            ],
            label_visibility="collapsed",
        )
        st.divider()
        st.caption("CareLink · Connecting Care, Enriching Lives")
    return page


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

def page_dashboard(backend_ok: bool, backend_info: dict, ai_ok: bool, ai_info: dict) -> None:
    st.title("🩺 CareLink — Healthcare Platform")
    st.markdown(
        "_A unified digital health platform: patient management, clinical workflows, "
        "AI-powered history intake, and multilingual support._"
    )

    # Service summary
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("Backend API", "Online ✅" if backend_ok else "Offline ❌")
    with c2:
        st.metric("AI Service", "Online ✅" if ai_ok else "Offline ❌")
    with c3:
        env = backend_info.get("environment", "—")
        st.metric("Environment", str(env).capitalize() if env else "—")
    with c4:
        mock = backend_info.get("mock_otp", True)
        st.metric("OTP Mode", "Mock (demo)" if mock else "Live")

    st.divider()

    col_b, col_a = st.columns(2)
    with col_b:
        st.subheader("Backend Details")
        if backend_ok:
            st.json(backend_info)
        else:
            st.warning(f"Backend unreachable at `{BACKEND_URL}`")
            st.info("Make sure Python packages are installed: `pip install -r backend/requirements.txt`")

    with col_a:
        st.subheader("AI Service Details")
        if ai_ok:
            ai_health, _ = _health(AI_URL, "/api/ai/health")
            ai_data = _get(AI_URL, "/api/ai/health") or {}
            st.json(ai_data.get("data", ai_data))
        else:
            st.warning(f"AI service unreachable at `{AI_URL}`")
            st.info("Make sure Python packages are installed: `pip install -r ai/requirements.txt`")

    st.divider()
    st.subheader("🚀 Quick Start")
    st.markdown(
        """
        | What | Command |
        |------|---------|
        | Backend API | `cd backend && uvicorn app.main:app --reload --port 8000` |
        | AI Service  | `uvicorn ai.app.main:app --reload --port 8001` (from repo root) |
        | Frontend UI | `cd frontend && npm run dev` |
        | API Docs    | [Backend Swagger](/docs) · [AI Swagger](http://localhost:8001/docs) |
        """
    )


def page_auth(backend_ok: bool) -> None:
    st.title("🔐 Auth & OTP Testing")
    if not backend_ok:
        st.error("Backend is offline. Cannot test auth endpoints.")
        return

    tab_otp, tab_login, tab_register, tab_me = st.tabs(
        ["Send OTP", "Password Login", "Register", "/me"]
    )

    with tab_otp:
        st.markdown("### Send OTP (mock returns `123456`)")
        mobile = st.text_input("Mobile Number", value="9876543210", key="otp_mobile")
        purpose = st.selectbox("Purpose", ["login", "register", "reset"], key="otp_purpose")
        if st.button("Send OTP", key="send_otp"):
            res = _post(BACKEND_URL, "/api/v1/auth/send-otp", {"mobile": mobile, "purpose": purpose})
            if res:
                st.success("OTP sent (mock).")
                st.json(res)

        st.divider()
        st.markdown("### Verify OTP")
        otp_val = st.text_input("OTP", value="123456", key="otp_val")
        if st.button("Verify OTP", key="verify_otp"):
            res = _post(BACKEND_URL, "/api/v1/auth/verify-otp", {"mobile": mobile, "otp": otp_val, "purpose": purpose})
            if res:
                if res.get("success"):
                    st.success("OTP verified!")
                else:
                    st.error(res.get("error", {}).get("message", "Failed"))
                st.json(res)

    with tab_login:
        st.markdown("### Password Login")
        login_mobile = st.text_input("Mobile", value="9876543210", key="login_mobile")
        login_pass = st.text_input("Password", type="password", key="login_pass")
        if st.button("Login", key="do_login"):
            res = _post(BACKEND_URL, "/api/v1/auth/login", {"mobile": login_mobile, "password": login_pass})
            if res:
                if res.get("success"):
                    st.success("Login successful!")
                    st.session_state["access_token"] = res.get("data", {}).get("access_token", "")
                else:
                    st.error(res.get("error", {}).get("message", "Failed"))
                st.json(res)

    with tab_register:
        st.markdown("### Register Patient")
        with st.form("register_form"):
            reg_mobile = st.text_input("Mobile", value="9000000001")
            reg_name = st.text_input("Full Name", value="Test Patient")
            reg_age = st.number_input("Age", min_value=0, max_value=150, value=30)
            reg_gender = st.selectbox("Gender", ["Male", "Female", "Other"])
            reg_pass = st.text_input("Password", type="password", value="password123")
            submitted = st.form_submit_button("Register")
        if submitted:
            payload = {
                "role": "patient",
                "profile": {
                    "mobile": reg_mobile,
                    "full_name": reg_name,
                    "age": reg_age,
                    "gender": reg_gender,
                    "password": reg_pass,
                },
            }
            res = _post(BACKEND_URL, "/api/v1/auth/register", payload)
            if res:
                if res.get("success"):
                    st.success("Registered successfully!")
                else:
                    st.error(res.get("error", {}).get("message", "Failed"))
                st.json(res)

    with tab_me:
        st.markdown("### Current User (`/auth/me`)")
        token = st.text_input("Bearer Token", value=st.session_state.get("access_token", ""), key="me_token")
        if st.button("Get /me", key="do_me"):
            try:
                r = requests.get(
                    f"{BACKEND_URL}/api/v1/auth/me",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=5,
                )
                st.json(r.json())
            except Exception as exc:
                st.error(str(exc))


def page_ai(ai_ok: bool) -> None:
    st.title("🤖 AI Health Assistant")
    if not ai_ok:
        st.error(f"AI service is offline. Start it with: `uvicorn ai.app.main:app --port 8001`")
        return

    tab_chat, tab_history, tab_redflags, tab_translate = st.tabs(
        ["Patient Chat", "History Interview", "Red Flags", "Translate"]
    )

    with tab_chat:
        st.markdown("### Patient Health Chat")
        if "chat_history" not in st.session_state:
            st.session_state.chat_history = []

        for turn in st.session_state.chat_history:
            role = "🧑 You" if turn["role"] == "user" else "🤖 CareLink AI"
            with st.chat_message(turn["role"]):
                st.markdown(f"**{role}:** {turn['content']}")

        user_msg = st.chat_input("Ask a health question…")
        if user_msg:
            st.session_state.chat_history.append({"role": "user", "content": user_msg})
            lang = st.selectbox("Language", ["en", "hi", "ur", "bn", "ta", "te"], key="chat_lang", index=0)
            with st.spinner("AI is thinking…"):
                res = _post(AI_URL, "/api/ai/chat", {
                    "message": user_msg,
                    "language": lang,
                    "context": {},
                })
            reply = "_(no response)_"
            if res and res.get("success"):
                data = res.get("data", {})
                reply = data.get("reply", data.get("message", "_(empty)_"))
            st.session_state.chat_history.append({"role": "assistant", "content": reply})
            st.rerun()

        if st.button("Clear chat", key="clear_chat"):
            st.session_state.chat_history = []
            st.rerun()

    with tab_history:
        st.markdown("### Adaptive History Interview")
        complaint = st.text_input("Chief Complaint", value="fever", key="hist_complaint")
        message = st.text_area("Patient Message", value="I have had fever for 2 days", key="hist_msg")
        answered = st.text_area(
            "Already Answered Questions (one per line)", value="", key="hist_answered"
        )
        lang = st.selectbox("Language", ["en", "hi", "ur", "bn"], key="hist_lang")
        if st.button("Get Next Question", key="hist_go"):
            with st.spinner("Processing…"):
                res = _post(AI_URL, "/api/ai/interview/message", {
                    "message": message,
                    "complaint": complaint,
                    "language": lang,
                    "answered_questions": [a.strip() for a in answered.splitlines() if a.strip()],
                })
            if res and res.get("success"):
                data = res.get("data", {})
                st.success(f"**Next question:** {data.get('next_question', data.get('reply', '—'))}")
                st.metric("Questions remaining", data.get("missing_count", "—"))
                if data.get("red_flags"):
                    st.warning(f"⚠️ Red flags: {data['red_flags']}")
                with st.expander("Full response"):
                    st.json(data)
            else:
                st.error("Request failed")
                st.json(res)

    with tab_redflags:
        st.markdown("### Red Flag Detection")
        rf_text = st.text_area(
            "Patient text to analyse",
            value="Patient reports severe chest pain and breathing difficulty.",
            key="rf_text",
        )
        if st.button("Check Red Flags", key="rf_go"):
            with st.spinner("Analysing…"):
                res = _post(AI_URL, "/api/ai/red-flags", {"text": rf_text})
            if res and res.get("success"):
                data = res.get("data", {})
                flags = data.get("red_flags", [])
                if flags:
                    st.error(f"⚠️ {len(flags)} red flag(s) detected")
                    for f in flags:
                        st.markdown(
                            f"- **{f.get('severity', '').upper()}** — {f.get('advice', '')}"
                        )
                else:
                    st.success("No red flags detected in the text.")
                if data.get("emergency_keywords"):
                    st.error("🚨 Emergency keyword detected")
            else:
                st.error("Request failed")

    with tab_translate:
        st.markdown("### Text Translation")
        src_text = st.text_area("Source Text (English)", value="Please describe your symptoms.", key="tr_src")
        target_lang = st.selectbox("Target Language Code", ["hi", "ur", "bn", "ta", "te", "mr"], key="tr_lang")
        if st.button("Translate", key="tr_go"):
            with st.spinner("Translating…"):
                res = _post(AI_URL, "/api/ai/lang/translate", {"text": src_text, "target": target_lang})
            if res and res.get("success"):
                data = res.get("data", {})
                st.success(f"**Translation ({target_lang}):**")
                st.markdown(f"> {data.get('translated', data.get('text', '—'))}")
                if data.get("mock"):
                    st.caption("ℹ️ AI running in mock mode — real translation requires a provider key.")
            else:
                st.error("Translation failed")
                st.json(res)


def page_documents(backend_ok: bool) -> None:
    st.title("📄 Document Management")
    if not backend_ok:
        st.error("Backend offline.")
        return

    st.markdown(
        "Upload, list and manage patient medical documents. Documents are stored "
        "privately; access is controlled by consent and patient-doctor relationships."
    )

    token = st.text_input(
        "Bearer Token (from Login)", value=st.session_state.get("access_token", ""), key="doc_token"
    )

    tab_upload, tab_list = st.tabs(["Upload Document", "List Documents"])

    with tab_upload:
        st.markdown("### Upload a Document")
        patient_id = st.text_input("Patient ID", key="doc_patient_id")
        kind = st.selectbox(
            "Document Kind",
            ["prescription", "lab_report", "discharge_summary", "imaging", "other"],
            key="doc_kind",
        )
        uploaded = st.file_uploader("Choose file", type=["pdf", "jpg", "jpeg", "png"], key="doc_file")
        if st.button("Upload", key="doc_upload") and uploaded and patient_id:
            try:
                r = requests.post(
                    f"{BACKEND_URL}/api/v1/documents/patients/{patient_id}/upload",
                    headers={"Authorization": f"Bearer {token}"},
                    files={"file": (uploaded.name, uploaded.getvalue(), uploaded.type)},
                    params={"kind": kind},
                    timeout=15,
                )
                res = r.json()
                if res.get("success"):
                    st.success("Document uploaded successfully!")
                    st.json(res.get("data", res))
                else:
                    st.error(res.get("error", {}).get("message", "Upload failed"))
            except Exception as exc:
                st.error(str(exc))

    with tab_list:
        st.markdown("### List Patient Documents")
        list_patient_id = st.text_input("Patient ID", key="doc_list_patient_id")
        if st.button("Fetch Documents", key="doc_list_fetch") and list_patient_id:
            try:
                r = requests.get(
                    f"{BACKEND_URL}/api/v1/documents/patients/{list_patient_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10,
                )
                res = r.json()
                if res.get("success"):
                    docs = res.get("data", [])
                    if docs:
                        st.dataframe(docs, use_container_width=True)
                    else:
                        st.info("No documents found for this patient.")
                else:
                    st.error(res.get("error", {}).get("message", "Failed"))
            except Exception as exc:
                st.error(str(exc))


def page_organizations(backend_ok: bool) -> None:
    st.title("🏥 Organizations")
    if not backend_ok:
        st.error("Backend offline.")
        return

    st.markdown("Manage healthcare organizations (hospitals, clinics) on the platform.")

    tab_list, tab_create = st.tabs(["List Organizations", "Create Organization"])

    with tab_list:
        if st.button("Refresh", key="org_refresh"):
            res = _get(BACKEND_URL, "/api/v1/organizations")
            if res and res.get("success"):
                orgs = res.get("data", [])
                if orgs:
                    st.dataframe(orgs, use_container_width=True)
                else:
                    st.info("No organizations registered yet.")
            else:
                st.error("Failed to fetch organizations")

    with tab_create:
        token = st.text_input("Bearer Token", value=st.session_state.get("access_token", ""), key="org_token")
        with st.form("org_form"):
            org_name = st.text_input("Organization Name", value="Demo Hospital")
            org_type = st.selectbox("Type", ["Hospital", "Clinic", "Healthcare Facility"])
            org_reg = st.text_input("Registration Number (optional)", value="")
            org_city = st.text_input("City", value="")
            org_state = st.text_input("State", value="")
            create_org = st.form_submit_button("Create Organization")
        if create_org:
            try:
                r = requests.post(
                    f"{BACKEND_URL}/api/v1/organizations",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "name": org_name,
                        "org_type": org_type,
                        "registration_number": org_reg or None,
                        "city": org_city or None,
                        "state": org_state or None,
                    },
                    timeout=10,
                )
                res = r.json()
                if res.get("success"):
                    st.success(f"Organization '{org_name}' created!")
                    st.json(res.get("data", res))
                else:
                    st.error(res.get("error", {}).get("message", "Failed"))
            except Exception as exc:
                st.error(str(exc))


def page_audit(backend_ok: bool) -> None:
    st.title("📊 Audit Log")
    if not backend_ok:
        st.error("Backend offline.")
        return

    st.markdown("System-wide audit events (requires SYSTEM_ADMIN token).")
    token = st.text_input(
        "SYSTEM_ADMIN Bearer Token", value=st.session_state.get("access_token", ""), key="audit_token"
    )
    if st.button("Load Audit Log", key="audit_load"):
        try:
            r = requests.get(
                f"{BACKEND_URL}/api/v1/admin/audit",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            res = r.json()
            if res.get("success"):
                events = res.get("data", [])
                if events:
                    st.dataframe(events, use_container_width=True)
                else:
                    st.info("No audit events yet.")
            else:
                st.error(res.get("error", {}).get("message", "Access denied or failed"))
        except Exception as exc:
            st.error(str(exc))


def page_config() -> None:
    st.title("⚙️ Configuration")
    st.markdown(
        "All secrets and settings are read from **environment variables**. "
        "No secrets are ever hardcoded. Copy `.env.example` → `.env` and fill in the values."
    )

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Backend (`backend/.env`)")
        st.code(
            """# Core
APP_ENV=development          # development | production | testing
DATABASE_URL=sqlite:///./dev_carelink.db
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI integration
AI_SERVICE_URL=http://localhost:8001
AI_API_KEY=

# OTP
OTP_STORE=mock               # mock | live

# CORS
CORS_ORIGINS=http://localhost:3000
""",
            language="ini",
        )

    with col2:
        st.subheader("AI Service (`ai/.env`)")
        st.code(
            """# Provider (leave blank for mock mode)
AI_PROVIDER=openrouter       # openai | openrouter | gemini | anthropic
AI_API_KEY=                  # your API key
AI_MODEL=openai/gpt-4o-mini  # model identifier

# Optional fallback
AI_FALLBACK_PROVIDER=openai
AI_FALLBACK_API_KEY=
AI_FALLBACK_MODEL=

# Safety
MOCK_AI_MODE=false           # true = always mock, no LLM calls
FORCE_MOCK_AI_MODE=false
REQUIRE_AUTH=false

# CORS
CORS_ORIGINS=http://localhost:3000
""",
            language="ini",
        )

    st.divider()
    st.subheader("Deployment Checklist")
    checks = [
        ("JWT_SECRET changed from default", True),
        ("DATABASE_URL points to PostgreSQL (production)", False),
        ("OTP_STORE set to live provider (production)", False),
        ("CORS_ORIGINS restricted to your domain", False),
        ("REQUIRE_AUTH=true on AI service (production)", False),
        ("AI_SHARED_SECRET set (production)", False),
        ("Rate limiting enabled (RATE_LIMIT_ENABLED=true)", True),
    ]
    for label, done in checks:
        icon = "✅" if done else "⬜"
        st.markdown(f"{icon} {label}")


def page_frontend() -> None:
    st.title("📱 Full App (Next.js)")
    st.markdown(
        f"""
        The full CareLink UI is a Next.js 16 (Turbopack) app with:

        - **Patient portal** — health history, documents, wellness, AI assistant
        - **Doctor portal** — queue, consultation workspace, prescriptions, follow-ups
        - **Hospital terminal** — patient registration, QR scan, intake flow
        - **Intake AI** — voice/text history collection, red-flag detection

        ### Run the frontend

        ```bash
        cd frontend
        npm install
        npm run dev
        ```

        Then open **[{FRONTEND_URL}]({FRONTEND_URL})** in your browser.

        ### Build for production

        ```bash
        cd frontend
        npm run build
        npm start
        ```
        """
    )
    st.info(
        f"Frontend dev server: [{FRONTEND_URL}]({FRONTEND_URL})  \n"
        "*(Start it manually — Streamlit cannot embed a Next.js dev server directly.)*"
    )
    st.divider()
    st.subheader("API Routes (Next.js → Backend proxy)")
    st.markdown(
        """
        | Route | Description |
        |-------|-------------|
        | `GET /api/ai/health` | AI service health check |
        | `POST /api/ai/chat` | Patient AI chat (onboarding / help mode) |
        | `POST /api/ai/guidance` | Wellness / health guidance |
        | `POST /api/ai/nutrition` | Nutrition Q&A |
        | `POST /api/ai/health-chat` | General health information |
        """
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # Start services (cached — only runs once per session)
    with st.spinner("Starting CareLink services…"):
        start_services()

    # Health checks
    backend_ok, backend_info = _health(BACKEND_URL, "/health")
    ai_ok, _ = _health(AI_URL, "/api/ai/health")

    # Sidebar + routing
    page = render_sidebar(backend_ok, ai_ok)

    if page.startswith("🏠"):
        page_dashboard(backend_ok, backend_info, ai_ok, {})
    elif page.startswith("🔐"):
        page_auth(backend_ok)
    elif page.startswith("🤖"):
        page_ai(ai_ok)
    elif page.startswith("📄"):
        page_documents(backend_ok)
    elif page.startswith("🏥"):
        page_organizations(backend_ok)
    elif page.startswith("📊"):
        page_audit(backend_ok)
    elif page.startswith("⚙️"):
        page_config()
    else:
        page_frontend()


if __name__ == "__main__":
    main()
