from datetime import datetime, timezone

from sqlalchemy import select

from app.models.user import User, AuthProvider
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Repository responsible for all database operations
    related to User entities.
    """

    async def create(
        self,
        *,
        full_name: str,
        email: str,
        hashed_password: str,
        provider: AuthProvider,
        auth_provider_id: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        """
        Create a new user.
        """

        user = User(
            full_name=full_name,
            email=email,
            hashed_password=hashed_password,
            provider=provider,
            auth_provider_id=auth_provider_id,
            avatar_url=avatar_url,
        )

        return await self.add(user)

    async def get_by_id(
        self,
        user_id: int,
    ) -> User | None:
        """
        Retrieve user by internal database id.
        """

        result = await self.session.execute(select(User).where(User.id == user_id))

        return result.scalar_one_or_none()

    async def get_by_email(
        self,
        email: str,
    ) -> User | None:
        """
        Retrieve user by email.
        """

        result = await self.session.execute(select(User).where(User.email == email))

        return result.scalar_one_or_none()

    async def exists_by_email(
        self,
        email: str,
    ) -> bool:
        """
        Check whether an email is already registered.
        """

        return await self.get_by_email(email) is not None

    async def get_by_public_id(
        self,
        public_id: str,
    ) -> User | None:
        """
        Retrieve user by public UUID.
        """

        result = await self.session.execute(
            select(User).where(User.public_id == public_id)
        )

        return result.scalar_one_or_none()

    async def get_by_provider_id(
        self,
        provider: AuthProvider,
        provider_id: str,
    ) -> User | None:
        """
        Retrieve user using OAuth provider id.
        """

        result = await self.session.execute(
            select(User).where(
                User.provider == provider,
                User.auth_provider_id == provider_id,
            )
        )

        return result.scalar_one_or_none()

    async def update_last_login(
        self,
        user: User,
    ) -> None:
        """
        Update user's last login timestamp.
        """

        user.last_login = datetime.now(timezone.utc)

        await self.commit()

    async def update_password(
        self,
        user: User,
        hashed_password: str,
    ) -> None:
        """
        Update password hash.
        """

        user.hashed_password = hashed_password
        user.last_password_change = datetime.now(timezone.utc)

        await self.commit()

    async def verify_email(
        self,
        user: User,
    ) -> None:
        """
        Mark email as verified.
        """

        user.email_verified = True

        await self.commit()

    async def increment_failed_login(
        self,
        user: User,
    ) -> None:
        """
        Increment failed login attempts.
        """

        user.failed_login_attempts += 1

        await self.commit()

    async def reset_failed_login(
        self,
        user: User,
    ) -> None:
        """
        Reset failed login counter.
        """

        user.failed_login_attempts = 0
        user.locked_until = None

        await self.commit()
