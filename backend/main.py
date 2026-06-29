import warnings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import datasets, llm, research
from config import OPENCODE_API_KEY

app = FastAPI(title="AutoDataset Profiler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(datasets.router)
app.include_router(llm.router)
app.include_router(research.router)


@app.on_event("startup")
def on_startup():
    init_db()
    if not OPENCODE_API_KEY:
        warnings.warn(
            "OPENCODE_API_KEY tidak ditemukan. Fitur LLM (analisis, Research PRD) tidak akan berfungsi.",
            stacklevel=1,
        )


@app.get("/")
def root():
    return {"message": "AutoDataset Profiler API berjalan"}
