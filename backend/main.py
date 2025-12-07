from fastapi import FastAPI
from backend.routers.ask import router as ask_router

app = FastAPI(
    title="Biostats Tutor Backend",
    description="Backend for general chat and article analysis modes",
    version="0.1.0"
)

# Register endpoints
app.include_router(ask_router, prefix="/ask", tags=["General Chat API"])

@app.get("/")
async def root():
    return {"message": "Backend is running. Use /ask/chat to interact."}
