# LLM Vulnerability Demo

A full-stack educational cybersecurity lab for demonstrating common LLM chatbot vulnerabilities in a controlled local environment.

The app includes four scenarios:

- Prompt Injection
- System Prompt Extraction
- Tool Abuse
- Vector / Embedding Weaknesses

All unsafe behavior is simulated. The fake tools do not read files, query databases, send messages, or connect to external systems. The only optional external call is to Google Gemini for phrasing a precomputed safe simulation response.

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
frontend/
  src/
    components/
    pages/
    data/
    services/
    types/
    utils/
```

## Environment

Copy the example file and add your Gemini keys if you want Gemini phrasing:

```bash
cp .env.example .env
```

Example:

```env
GEMINI_API_KEYS=key1,key2,key3,key4
GEMINI_MODEL=gemini-2.5-flash
LLM_PROVIDER=gemini
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

If `GEMINI_API_KEYS` is empty, the backend automatically uses `MockProvider`.

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
uvicorn backend.app.main:app --reload --port 8000
```

Useful endpoints:

- `GET /api/vulnerabilities`
- `GET /api/vulnerabilities/{slug}`
- `GET /api/chat/{slug}?session_id=...`
- `POST /api/chat/{slug}`
- `POST /api/reset/{slug}`
- `GET /health`

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

The frontend defaults to `http://localhost:8000` for API calls. To override it:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Simulation Modes

Each scenario supports two modes in the conversation window:

- Vulnerable: shows the simulated unsafe behavior and its effect.
- Protected: shows how backend checks or safer prompt handling block the issue.

The rule engine is deterministic and scenario-specific. Gemini, when configured, is only asked to phrase the already-computed simulation outcome. If Gemini is unavailable, the mock provider returns the deterministic response directly.

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
- `code_preview`
- `sample_prompts`
- `sample_conversation`
- `simulation_rules`

Add new behavior in `backend/app/services/simulation_engine.py`, then add frontend rendering only if the new metadata shape needs a new visualization.
