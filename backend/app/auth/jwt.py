from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import JWTError, jwt

from app.config import settings


def create_access_token(
    *,
    public_id: str,
    email: str,
) -> str:
    """
    Create JWT access token.
    """

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": public_id,
        "email": email,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> dict:
    """
    Decode JWT access token.
    Raises JWTError if invalid.
    """

    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )


def create_refresh_token() -> str:
    """
    Generate cryptographically secure refresh token.
    """

    return secrets.token_urlsafe(64)


def hash_refresh_token(
    refresh_token: str,
) -> str:
    """
    Store only SHA256 hash inside database.
    """

    return hashlib.sha256(refresh_token.encode()).hexdigest()
