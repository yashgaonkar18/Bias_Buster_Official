from fastapi import (
    APIRouter,
    Depends,
    Header,
    Request,
    status,
)
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    SignupRequest,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
)
from app.auth.oauth import oauth
from app.db import get_session
from app.mappers.user_mapper import UserMapper
from app.models.user import User
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


def get_auth_service(
    session: AsyncSession = Depends(get_session),
) -> AuthService:
    return AuthService(session)


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    payload: SignupRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    """
    Register a new account.
    """

    return await service.signup(
        request=payload,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
async def login(
    payload: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    """
    Login using email/password.
    """

    return await service.login(
        request=payload,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post(
    "/refresh",
    response_model=AuthResponse,
)
async def refresh(
    payload: RefreshTokenRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    """
    Refresh access token.
    """

    return await service.refresh(
        refresh_token=payload.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
)
async def logout(
    payload: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Logout current device.
    """

    await service.logout(payload.refresh_token)

    return MessageResponse(
        message="Logged out successfully."
    )


@router.post(
    "/logout-all",
    response_model=MessageResponse,
)
async def logout_all(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    """
    Logout all devices.
    """

    await service.logout_all(current_user)

    return MessageResponse(
        message="Logged out from all devices."
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
async def me(
    current_user: User = Depends(get_current_user),
):
    """
    Current authenticated user.
    """
    return UserMapper.to_response(current_user)

@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", response_model=AuthResponse)
async def google_callback(
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    token = await oauth.google.authorize_access_token(request)

    userinfo = token.get("userinfo")
    if not userinfo:
        userinfo = await oauth.google.parse_id_token(request, token)

    auth = await service.oauth_login(
        provider="google",
        provider_id=userinfo["sub"],
        email=userinfo["email"],
        full_name=userinfo.get("name", ""),
        avatar_url=userinfo.get("picture"),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    return RedirectResponse(
        url=f"http://localhost:3000/?access_token={auth.access_token}&refresh_token={auth.refresh_token}"
    )

@router.get("/github/login")
async def github_login(request: Request):
    redirect_uri = request.url_for("github_callback")
    return await oauth.github.authorize_redirect(request, redirect_uri)

@router.get("/github/callback", response_model=AuthResponse)
async def github_callback(
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    token = await oauth.github.authorize_access_token(request)

    resp = await oauth.github.get("user", token=token)
    profile = resp.json()

    email_resp = await oauth.github.get("user/emails", token=token)
    emails = email_resp.json()

    primary_email = next(
        (e["email"] for e in emails if e["primary"]),
        emails[0]["email"] if emails else "",
    )

    auth = await service.oauth_login(
        provider="github",
        provider_id=str(profile["id"]),
        email=primary_email,
        full_name=profile.get("name") or profile.get("login") or "",
        avatar_url=profile.get("avatar_url"),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    return RedirectResponse(
        url=f"http://localhost:3000/?access_token={auth.access_token}&refresh_token={auth.refresh_token}"
    )
@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, service: AuthService = Depends(get_auth_service)):
    await service.request_password_reset(payload.email)
    return MessageResponse(message="If the email exists, a reset link has been sent.")

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, service: AuthService = Depends(get_auth_service)):
    await service.reset_password(payload.token, payload.new_password)
    return MessageResponse(message="Password has been reset successfully.")

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(payload: VerifyEmailRequest, service: AuthService = Depends(get_auth_service)):
    await service.verify_email(payload.token)
    return MessageResponse(message="Email verified successfully.")

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(payload: ResendVerificationRequest, service: AuthService = Depends(get_auth_service)):
    await service.request_email_verification(payload.email)
    return MessageResponse(message="Verification email sent.")