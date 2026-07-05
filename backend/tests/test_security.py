import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.auth.security import hash_password
from app.auth.security import verify_password

from app.auth.jwt import (
    create_access_token,
    decode_access_token,
    create_refresh_token,
    hash_refresh_token,
)

password = "BiasBuster123!"

hashed = hash_password(password)

print("Password:", password)

print("Hash:", hashed)

print(
    "Verify:",
    verify_password(password, hashed),
)

access = create_access_token(
    public_id="123",
    email="test@test.com",
)

print(access)

print(decode_access_token(access))

refresh = create_refresh_token()

print(refresh)

print(hash_refresh_token(refresh))
