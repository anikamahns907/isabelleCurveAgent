import os
from openai import AsyncOpenAI
from backend.core.supabase_client import supabase
from backend.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

EMBED_MODEL = "text-embedding-3-small"


async def embed_text(text: str):
    response = await client.embeddings.create(
        model=EMBED_MODEL,
        input=text
    )
    return response.data[0].embedding


async def search_similar(query: str, match_count=5):
    embedding = await embed_text(query)

    response = supabase.rpc(
        "match_documents",
        {
            "query_embedding": embedding,
            "match_count": match_count
        }
    ).execute()

    return response.data
