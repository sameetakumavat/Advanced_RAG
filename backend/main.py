import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from route.auth_route import auth_router
from route.rag_route import chain_router
from route.file_route import file_router
from route.chat_route import chat_router
from route.dashboard_route import dashboard_router

app = FastAPI()

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(file_router)
app.include_router(chain_router)
app.include_router(chat_router)
app.include_router(dashboard_router)

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
