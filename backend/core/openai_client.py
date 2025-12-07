from openai import AsyncOpenAI
from backend.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """
You are a helpful biostatistics tutor. 
You explain probability, inference, sampling distributions, regression, and ANOVA 
in clear and intuitive terms.
"""

async def openai_chat(user_message: str) -> str:
    """
    Sends a simple prompt to OpenAI and returns the assistant's reply.
    """
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        max_tokens=400
    )
    
    return response.choices[0].message.content