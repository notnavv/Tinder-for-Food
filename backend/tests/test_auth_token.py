"""Tests for verify_supabase_token in app/core/auth.py (Track C).

These use a FAKE Supabase that knows exactly one valid token, "good-token",
so they run without the internet. Run from backend/:  pytest tests/test_auth_token.py -q
"""

import pytest
from fastapi import HTTPException

from app.core import auth
from app.core.config import get_settings


class FakeUser:
    id = "11111111-1111-1111-1111-111111111111"


class FakeAuth:
    def get_user(self, jwt=None):
        if jwt == "good-token":
            return type("UserResponse", (), {"user": FakeUser()})()
        raise Exception("invalid JWT")  # what the real client does with a bad token


class FakeSupabase:
    auth = FakeAuth()


@pytest.fixture(autouse=True)
def fake_supabase(monkeypatch):
    monkeypatch.setattr(auth, "get_supabase", lambda: FakeSupabase(), raising=False)


# ---------- the function on its own ----------
def test_good_token_gives_the_user_id():
    assert auth.verify_supabase_token("good-token", get_settings()) == FakeUser.id


def test_bad_token_is_401():
    with pytest.raises(HTTPException) as err:
        auth.verify_supabase_token("made-up-token", get_settings())
    assert err.value.status_code == 401


def test_no_user_in_the_answer_is_401(monkeypatch):
    class NoUserAuth:
        def get_user(self, jwt=None):
            return type("UserResponse", (), {"user": None})()

    monkeypatch.setattr(auth, "get_supabase", lambda: type("S", (), {"auth": NoUserAuth()})())
    with pytest.raises(HTTPException) as err:
        auth.verify_supabase_token("good-token", get_settings())
    assert err.value.status_code == 401


# ---------- through the real API ----------
def test_api_accepts_a_real_token(client, monkeypatch):
    monkeypatch.setenv("USE_MOCK_DATA", "false")
    get_settings.cache_clear()
    # 501 = got past the sign-in check and reached the (not yet written) model
    assert client.get("/deck", headers={"Authorization": "Bearer good-token"}).status_code == 501


def test_api_rejects_a_fake_token(client, monkeypatch):
    monkeypatch.setenv("USE_MOCK_DATA", "false")
    get_settings.cache_clear()
    assert client.get("/deck", headers={"Authorization": "Bearer made-up-token"}).status_code == 401
