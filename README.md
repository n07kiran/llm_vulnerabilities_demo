# LLM Vulnerability Demo

A full-stack educational cybersecurity lab for demonstrating common LLM chatbot vulnerabilities in a controlled local environment.

The app includes four scenarios:

- Prompt Injection
- System Prompt Extraction
- Tool Abuse
- Vector / Embedding Weaknesses

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

Copy the example file and add your Gemini keys to run the live chatbot:

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
