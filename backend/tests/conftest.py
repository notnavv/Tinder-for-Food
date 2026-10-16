import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


@pytest.fixture
def client(monkeypatch):
    """A test client with mock mode on and no Supabase, regardless of your .env."""
    monkeypatch.setenv("USE_MOCK_DATA", "true")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("SUPABASE_URL", "")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "")
    get_settings.cache_clear()
    yield TestClient(app)
    get_settings.cache_clear()
