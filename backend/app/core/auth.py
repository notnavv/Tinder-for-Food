"""Resolve the caller from their Supabase access token."""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings
from app.core.supabase_client import get_supabase


def verify_supabase_token(token: str, settings: Settings) -> str:
    """Return the user ID (`sub`) from a valid Supabase access token."""
    try:
        response = get_supabase().auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in token") from exc
    if response is None or response.user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in token")
    return str(response.user.id)


def get_current_user_id(
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: Annotated[str | None, Header()] = None,
    x_dev_user_id: Annotated[str | None, Header()] = None,
) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return verify_supabase_token(authorization.split(" ", 1)[1].strip(), settings)

    if settings.app_env == "development":
        if settings.use_mock_data and x_dev_user_id:
            return x_dev_user_id
        if settings.use_mock_data:
            return "00000000-0000-0000-0000-000000000000"  # anonymous mock user
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue")

    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue")


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
