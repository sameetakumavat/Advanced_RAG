from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from route.auth_route import auth_router
from route.chain_route import chain_router
from route.file_route import file_router
from initalize_resources import resource_service

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

resource_service.initialize_resources(directory_path=resource_service.default_files_path)

app.include_router(auth_router)
app.include_router(file_router)
app.include_router(chain_router)
