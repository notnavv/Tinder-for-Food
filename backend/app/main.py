"""FastAPI entry point.

Run locally:  uvicorn app.main:app --reload
Interactive docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import deck, food_dna, health, recommendations
from app.core.config import get_settings

app = FastAPI(title="Tinder for Food ML API", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["GET"],
    allow_headers=["Authorization", "X-Dev-User-Id"],
)

app.include_router(health.router)
app.include_router(deck.router)
app.include_router(recommendations.router)
app.include_router(food_dna.router)
