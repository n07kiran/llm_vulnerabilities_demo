# LLM Vulnerability Demo

A full-stack educational cybersecurity lab for demonstrating common LLM chatbot vulnerabilities in a controlled local environment.

The app includes four scenarios:

- Prompt Injection
- System Prompt Extraction
- Tool Abuse
- RAG Poisoning / Embedding Weaknesses (Email Inbox)

All unsafe behavior is constrained to fake classroom context. The fake tools do not read files, query databases, send messages, or connect to external systems. The only external call is the optional Google Gemini API call that powers the chatbot response.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, Python, Pydantic
- LLM provider layer: `LLMProvider`, `GeminiProvider`, `MockProvider`
- No LangChain or agent framework

## Project Structure

```txt
backend/
  app/
    main.py
    api/routes/
    core/
    schemas/
    services/
    llm/
    data/
    vulnerabilities/
    utils/
  attacker/
    main.py
frontend/
  src/
    components/
    pages/
    data/
    services/
    types/
    utils/
```

## Local Setup (Quickstart)

Prerequisites:

- Python 3.10+ (macOS users usually want `python3`)
- Node.js 18+

1. Create a virtual environment and install backend deps:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

2. Start the victim backend (port `8000`):

```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

3. Start the attacker backend (port `8001`) in another terminal:

```bash
python -m uvicorn backend.attacker.main:app --reload --port 8001
```

4. Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite defaults to `http://localhost:5173`, but if that port is already in use it will automatically try `5174` and print the URL.

## Environment

Copy the example file and add your Gemini keys to run the live chatbot:

```bash
cp .env.example .env
```

Example:

```env
GEMINI_API_KEYS=key1,key2,key3,key4
GEMINI_MODEL=gemini-2.5-flash
LLM_PROVIDER=gemini
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

If `GEMINI_API_KEYS` is empty, the backend returns a configuration message in the chat window instead of pretending to be Gemini.

## Gemini Key Rotation

Gemini keys are parsed from `GEMINI_API_KEYS` as a comma-separated list.

The backend uses `RoundRobinKeyRotator` in `backend/app/llm/key_rotation.py`:

```txt
request 1 -> key 1
request 2 -> key 2
request 3 -> key 3
request 4 -> key 4
request 5 -> key 1
```

If one key fails with a rate-limit or temporary provider error, `GeminiProvider` tries the next configured key. To add more keys later, append them to `GEMINI_API_KEYS`; no code changes are required.

## Backend Setup

From the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

Useful endpoints:

Victim backend (`8000`):

- `GET /api/vulnerabilities`
- `GET /api/vulnerabilities/{slug}`
- `GET /api/chat/{slug}?session_id=...`
- `POST /api/chat/{slug}`
- `POST /api/reset/{slug}`
- `GET /api/email/inbox`
- `POST /api/email/inbox`
- `POST /api/email/reset`
- `GET /health`

## Attacker Server (Local Lab)

This repo includes a second FastAPI app that simulates an attacker service receiving markdown-image beacons.

Run it in another terminal:

```bash
python -m uvicorn backend.attacker.main:app --reload --port 8001
```

Useful endpoints (attacker backend `8001`):

- `GET /health`
- `GET /p?s=...&n=...&d=...` (1x1 PNG “pixel” endpoint)
- `GET /api/attacker/events`
- `POST /api/attacker/reset`
- `POST /api/attacker/send-email`

Note: `http://localhost:8001/` returns `404` by design (there is no root route). Use `/health` or `/docs`.

The attacker *console UI* is part of the frontend at `/attacker`; port `8001` is only the attacker backend API/pixel receiver.

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Open:

```txt
http://localhost:5173 (or the port Vite prints, e.g. 5174)
```

The frontend defaults to `http://localhost:8000` for API calls. To override it:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ATTACKER_BASE_URL=http://localhost:8001
```

## Email RAG Poisoning Walkthrough

1. Start the victim backend: `python -m uvicorn backend.app.main:app --reload --port 8000`
2. Start the attacker backend: `python -m uvicorn backend.attacker.main:app --reload --port 8001`
3. Start the frontend: `cd frontend && npm run dev`
4. Open the victim scenario: `http://localhost:5173/vulnerabilities/vector-embedding-weaknesses` (or the port Vite prints, e.g. `5174`)
5. Open the attacker console: `http://localhost:5173/attacker` (or the port Vite prints, e.g. `5174`)
6. From the attacker console, send the poisoned email to the victim inbox.
7. In the victim scenario chat, ask: "what are my recent email updates".
8. Watch the attacker console populate with decoded chunks captured from markdown-image requests.

## Live Chatbot Behavior

Each scenario sends the user's message to Gemini through the backend provider abstraction. The backend builds a scenario-specific vulnerable target prompt and stores conversation history per browser session.

The chat UI has a single target chatbot. The assistant bubble shows only the text returned by Gemini.

## Extending Scenarios

Scenario content lives in `backend/app/data/scenarios.py`.

Each scenario contains:

- `slug`
- `title`
- `summary`
- `severity`
- `notable_incidents`
- `why_dangerous`
- `goal`
- `scenario_description`
- `sample_prompts`

Add new target behavior in `backend/app/services/simulation_engine.py`.
