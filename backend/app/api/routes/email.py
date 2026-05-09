from fastapi import APIRouter

from backend.app.schemas.email import EmailCreateRequest, EmailCreateResponse, EmailListResponse
from backend.app.services.email_inbox import email_inbox


router = APIRouter(prefix="/api/email", tags=["email"])


@router.get("/inbox", response_model=EmailListResponse)
async def list_inbox() -> EmailListResponse:
    return EmailListResponse(emails=email_inbox.list())


@router.post("/inbox", response_model=EmailCreateResponse)
async def add_inbox_email(request: EmailCreateRequest) -> EmailCreateResponse:
    return EmailCreateResponse(email=email_inbox.add(request))


@router.post("/reset", response_model=EmailListResponse)
async def reset_inbox() -> EmailListResponse:
    return EmailListResponse(emails=email_inbox.reset())
