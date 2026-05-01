from fastapi import APIRouter, HTTPException, Query

from backend.app.data.scenarios import get_scenario
from backend.app.schemas.chat import ChatHistoryResponse, ChatRequest, ChatResponse, ResetRequest
from backend.app.services.simulation_engine import simulation_engine


router = APIRouter(prefix="/api", tags=["chat"])


def _require_scenario(slug: str) -> None:
    if get_scenario(slug) is None:
        raise HTTPException(status_code=404, detail="Vulnerability scenario not found.")


@router.get("/chat/{slug}", response_model=ChatHistoryResponse)
async def get_chat_history(
    slug: str,
    session_id: str = Query(default="default", min_length=1, max_length=120),
) -> ChatHistoryResponse:
    _require_scenario(slug)
    return ChatHistoryResponse(
        session_id=session_id,
        scenario_slug=slug,
        messages=simulation_engine.history(slug, session_id),
    )


@router.post("/chat/{slug}", response_model=ChatResponse)
async def send_chat_message(slug: str, request: ChatRequest) -> ChatResponse:
    _require_scenario(slug)
    try:
        return await simulation_engine.chat(
            slug=slug,
            session_id=request.session_id,
            user_text=request.message,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/reset/{slug}", response_model=ChatHistoryResponse)
async def reset_chat(slug: str, request: ResetRequest) -> ChatHistoryResponse:
    _require_scenario(slug)
    return ChatHistoryResponse(
        session_id=request.session_id,
        scenario_slug=slug,
        messages=simulation_engine.reset(slug, request.session_id),
    )
