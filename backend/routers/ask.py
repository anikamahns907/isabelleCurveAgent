from fastapi import APIRouter
from backend.models.chat_models import ChatRequest, ChatResponse
from backend.core.openai_client import openai_chat

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def general_chat(request: ChatRequest):
    ai_reply = await openai_chat(request.message)
    return ChatResponse(response=ai_reply)
