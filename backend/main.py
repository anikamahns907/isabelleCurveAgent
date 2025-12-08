from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.ask_stream import router as ask_stream_router
from backend.routers.ask import router as ask_router
from backend.routers.articleanalysis import router as article_router

app = FastAPI(
    title="Biostats Tutor Backend",
    version="1.0.0"
)


# ============================================================
# CORS — REQUIRED for frontend → backend communication
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Routers
# ============================================================
app.include_router(ask_router)
app.include_router(article_router)


@app.get("/")
def root():
    return {"message": "Backend running"}


app.include_router(ask_stream_router)
