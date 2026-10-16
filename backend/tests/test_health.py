def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["use_mock_data"] is True
    assert body["supabase_configured"] is False
