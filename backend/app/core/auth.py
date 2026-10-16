"""Figuring out which user is calling the API.

The frontend sends the user's Supabase access token as
`Authorization: Bearer <token>`. The backend must verify that token before
trusting the user ID inside it.

TODO: implement real verification in `verify_supabase_token`.
Supabase docs: "JWT signing keys". Newer projects sign tokens with asymmetric keys
published at  {SUPABASE_URL}/auth/v1/.well-known/jwks.json ; older projects
use a shared JWT secret. Check which one our project uses, then verify the
signature, `exp`, and `aud == "authenticated"`, and return the `sub` claim.

Until that's done:
  - In development, you can pass `X-Dev-User-Id: <uuid>` to act as a user.
  - Outside development, every authenticated endpoint returns 503.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings


def verify_supabase_token(token: str, settings: Settings) -> str:
    """Return the user ID (`sub`) from a valid Supabase access token."""
    raise NotImplementedError("Supabase JWT verification is not implemented yet (see app/core/auth.py)")


def get_current_user_id(
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: Annotated[str | None, Header()] = None,
    x_dev_user_id: Annotated[str | None, Header()] = None,
) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        try:
            return verify_supabase_token(authorization.split(" ", 1)[1], settings)
        except NotImplementedError:
            pass  # fall through to the dev-only path below

    if settings.app_env == "development":
        if x_dev_user_id:
            return x_dev_user_id
        if settings.use_mock_data:
            return "00000000-0000-0000-0000-000000000000"  # anonymous mock user
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Send X-Dev-User-Id in development until auth is implemented")

    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "API authentication is not configured yet")


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
