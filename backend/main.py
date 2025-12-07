from fastapi import FastAPI
from backend.routers.ask import router as ask_router
from backend.routers.articleanalysis import router as article_router

app = FastAPI(title="Biostats Tutor Backend", version="1.0.0")

app.include_router(ask_router)
app.include_router(article_router)

@app.get("/")
def root():
    return {"message": "Backend running"}
