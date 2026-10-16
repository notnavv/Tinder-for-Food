"""Loads the shared fake responses in data/mock/ (used when USE_MOCK_DATA=true)."""

import json
from functools import lru_cache

from app.core.config import MOCK_DATA_DIR


@lru_cache
def load_mock(name: str) -> dict:
    with open(MOCK_DATA_DIR / f"{name}.json", encoding="utf-8") as f:
        return json.load(f)
