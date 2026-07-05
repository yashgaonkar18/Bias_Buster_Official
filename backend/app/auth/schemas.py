from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class SignupRequest(BaseModel):
    """
    User registration request.
    """
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["John Doe"],
    )
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        examples=["StrongPassword123!"],
    )


class LoginRequest(BaseModel):
    """User Login Request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    public_id: str
    full_name: str
    email: EmailStr
    provider: str
    avatar_url: str | None
    email_verified: bool
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
    

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
class AuthResponse(BaseModel):
    """
    Returned after successful login/signup.
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class LogoutAllResponse(BaseModel):
    message: str