from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.exceptions import (
    AccountLockedException,
    EmailAlreadyExistsException,
    InvalidCredentialsException,
    InvalidTokenException,
    UserNotFoundException,
)
from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_refresh_token,
)
from app.auth.schemas import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
)
from app.auth.security import (
    hash_password,
    verify_password,
)
from app.config import settings
from app.mappers.user_mapper import UserMapper
from app.models.refresh_token import RefreshToken
from app.models.user import (
    AuthProvider,
    User,
)
from app.repositories.token_repository import TokenRepository
from app.repositories.user_repository import UserRepository


class AuthService:
    """
    Handles all authentication related business logic.

    Responsibilities
    ----------------
    • Signup
    • Login
    • JWT creation
    • Refresh token management
    • Logout
    • Logout all sessions
    • Current authenticated user
    """

    def __init__(
        self,
        session: AsyncSession,
    ):

        self.session = session

        self.users = UserRepository(session)

        self.tokens = TokenRepository(session)

    #### Private Helpers

    async def _create_token_pair(
        self,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[str, str]:
        """
        Creates an access token and refresh token.

        Refresh token hash is stored in database.
        """

        access_token = create_access_token(
            public_id=user.public_id,
            email=user.email,
        )

        refresh_token = create_refresh_token()

        refresh_hash = hash_refresh_token(refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        refresh = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
            revoked=False,
            user_agent=user_agent,
            ip_address=ip_address,
            last_used_at=datetime.now(timezone.utc),
        )

        await self.tokens.create(refresh)

        return (
            access_token,
            refresh_token,
        )

    async def _build_auth_response(
        self,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        Creates the final authentication response.
        """

        access_token, refresh_token = await self._create_token_pair(
            user=user, user_agent=user_agent, ip_address=ip_address
        )

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserMapper.to_response(user),
        )

    async def _validate_refresh_token(
        self,
        refresh_token: str,
    ) -> RefreshToken:
        """
        Validates refresh token.

        Returns RefreshToken ORM object.
        """

        token_hash = hash_refresh_token(refresh_token)

        token = await self.tokens.get_valid_token(token_hash)

        if token is None:
            raise InvalidTokenException()

        return token

    async def _get_user_from_access_token(
        self,
        access_token: str,
    ) -> User:

        try:

            payload = decode_access_token(access_token)

        except JWTError:

            raise InvalidTokenException()

        public_id = payload.get("sub")

        if public_id is None:
            raise InvalidTokenException()

        user = await self.users.get_by_public_id(public_id)

        if user is None:
            raise UserNotFoundException()

        return user

    #### Signup
    async def signup(
        self,
        request: SignupRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        Register a new user and immediately authenticate them.
        """

        if await self.users.exists_by_email(request.email.lower().strip()):
            raise EmailAlreadyExistsException()

        hashed_password = hash_password(request.password)

        user = await self.users.create(
            full_name=request.full_name.strip(),
            email=request.email.lower().strip(),
            hashed_password=hashed_password,
            provider=AuthProvider.EMAIL,
        )

        return await self._build_auth_response(
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

    #### Login
    async def login(
        self,
        request: LoginRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        Authenticate an existing user.
        """

        user = await self.users.get_by_email(request.email.lower().strip())

        if user is None:
            raise InvalidCredentialsException()

        if not user.is_active:
            raise InvalidCredentialsException()

        if user.locked_until is not None and user.locked_until > datetime.now(
            timezone.utc
        ):
            raise AccountLockedException()

        if user.provider != AuthProvider.EMAIL:
            raise InvalidCredentialsException()

        if user.hashed_password is None:
            raise InvalidCredentialsException()

        if not verify_password(
            request.password,
            user.hashed_password,
        ):

            await self.users.increment_failed_login(user)

            raise InvalidCredentialsException()

        await self.users.reset_failed_login(user)

        await self.users.update_last_login(user)

        return await self._build_auth_response(
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

    #### Refresh
    async def refresh(
        self,
        refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        Refresh access token using a valid refresh token.
        Performs refresh token rotation.
        """

        token = await self._validate_refresh_token(refresh_token)

        user = await self.users.get_by_id(token.user_id)

        if user is None:
            raise UserNotFoundException()

        # Rotate refresh token
        await self.tokens.revoke(token)

        return await self._build_auth_response(
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

    #### Logout current session
    async def logout(
        self,
        refresh_token: str,
    ) -> None:
        """
        Logout current session.
        """

        token = await self._validate_refresh_token(refresh_token)

        await self.tokens.revoke(token)

    #### Logout all sessions
    async def logout_all(
        self,
        user: User,
    ) -> None:
        """
        Logout every device.
        """

        await self.tokens.revoke_all(user.id)

    #### current user
    async def get_current_user(
        self,
        access_token: str,
    ) -> User:
        """
        Returns authenticated user from JWT.
        """

        return await self._get_user_from_access_token(access_token)
