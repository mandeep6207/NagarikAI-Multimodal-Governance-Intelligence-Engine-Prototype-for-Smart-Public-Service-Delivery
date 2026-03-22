"""
Security utilities for NagarikAI.

Role resolution order:
1. If a valid "v1-simulated-jwt-<role>-..." Bearer token is present → use it.
2. Otherwise fall back to the x-user-role header (convenient for dev/demo).

This keeps the demo frictionless while demonstrating an auth-aware API surface.
"""
from typing import Callable, List

from fastapi import Header, HTTPException

VALID_ROLES = ["super_admin", "district_officer", "csc_operator", "analyst", "citizen"]


def _resolve_role(authorization: str, x_user_role: str) -> str:
    """Return the current role from token or header."""
    if authorization.startswith("Bearer v1-simulated-jwt-"):
        token = authorization.split(" ", 1)[1]
        # Token format: v1-simulated-jwt-<role>-<suffix>
        parts = token.replace("v1-simulated-jwt-", "").rsplit("-", 1)
        role = parts[0]
        if role in VALID_ROLES:
            return role

    # Fallback: trust the x-user-role header (demo mode)
    if x_user_role in VALID_ROLES:
        return x_user_role

    raise HTTPException(status_code=401, detail="Unauthenticated — provide a valid Bearer token or x-user-role header")


def role_guard(allowed_roles: List[str]) -> Callable[..., str]:
    def _guard(
        x_user_role: str = Header(default="", alias="x-user-role"),
        authorization: str = Header(default=""),
    ) -> str:
        role = _resolve_role(authorization, x_user_role)
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Role '{role}' is not permitted for this operation")
        return role

    return _guard
