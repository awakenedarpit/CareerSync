"""
Authentication & Role-Based Access Control Service
Implements bcrypt password hashing, JWT issue/verification, and RBAC authorization.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models.user import User
from ..models.enums import UserRole


class AuthService:
    """Handles password security, token issuance, and role enforcement."""

    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

    @staticmethod
    def create_access_token(
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        role: UserRole,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        payload = {
            "sub": str(user_id),
            "tenant_id": str(tenant_id),
            "role": role.value if isinstance(role, UserRole) else str(role),
            "iat": now,
            "exp": expire,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except jwt.PyJWTError as e:
            raise ValueError(f"Invalid or expired authentication token: {e}")

    @staticmethod
    async def authenticate_user(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        email: str,
        password: str,
    ) -> Optional[User]:
        stmt = select(User).where(
            User.tenant_id == tenant_id,
            User.email == email.lower().strip(),
            User.is_active == True,
        )
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        if user and AuthService.verify_password(password, user.password_hash):
            return user
        return None
