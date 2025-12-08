from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.core.openai_client import client
from backend.core.rag import search_similar

router = APIRouter()

@router.post("/chat-stream")
async def chat_stream(request: dict):
    user_message = request["message"]
    
    # RAG
    docs = await search_similar(user_message)
    context = "\n\n".join([d["content"] for d in docs]) if docs else ""

    async def event_generator():
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful biostats tutor."},
                {"role": "system", "content": f"Relevant course materials:\n{context}"},
                {"role": "user", "content": user_message},
            ],
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    return StreamingResponse(event_generator(), media_type="text/plain")
