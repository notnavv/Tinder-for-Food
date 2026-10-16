from app.core.config import get_settings


def test_non_development_without_auth_is_refused(client, monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    get_settings.cache_clear()
    assert client.get("/deck").status_code == 503


def test_real_data_mode_requires_dev_user_header(client, monkeypatch):
    monkeypatch.setenv("USE_MOCK_DATA", "false")
    get_settings.cache_clear()
    assert client.get("/deck").status_code == 401
    # With a dev user it reaches the (not yet implemented) model
    assert client.get("/deck", headers={"X-Dev-User-Id": "u1"}).status_code == 501
