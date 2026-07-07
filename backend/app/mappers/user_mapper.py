from app.auth.schemas import UserResponse
from app.models.user import User


class UserMapper:
    """
    Converts ORM User objects into API response DTOs.
    """

    @staticmethod
    def to_response(user: User) -> UserResponse:

        return UserResponse(
            public_id=user.public_id,
            full_name=user.full_name,
            email=user.email,
            provider=user.provider.value,
            avatar_url=user.avatar_url,
            email_verified=user.email_verified,
            is_active=user.is_active,
            created_at=user.created_at,
        )
