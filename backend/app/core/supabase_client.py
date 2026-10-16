"""Server-side Supabase client using the service-role key.

The service-role key BYPASSES Row Level Security, so code using this client
must filter by user_id itself. Never send this key or this client's raw
results for other users to the frontend.
"""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_configured:
        raise RuntimeError("Supabase is not configured. Copy backend/.env.example to backend/.env and fill it in.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
