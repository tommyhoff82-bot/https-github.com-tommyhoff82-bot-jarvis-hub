"""Password hashing + JWT session tokens.

Self-hosted deployments still need a real login — this file is the whole
auth primitive set: hash/verify passwords, mint/verify tokens, and a
FastAPI dependency (`get_current_user`) that route handlers use to find
out who's calling and reject anyone who isn't.
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from db import db

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: str) -> str:
    if not JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET is not set. Generate one (e.g. `openssl rand -hex 32`) "
            "and add it to your .env before starting the server."
        )
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """FastAPI dependency: raises 401 if the bearer token is missing/invalid/
    expired, otherwise returns the Prisma User row it belongs to.
    """
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = await db.user.find_unique(where={"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


async def require_workspace_owner(workspace_id: str, current_user):
    """Raise 403/404 unless `current_user` owns `workspace_id`. Every route
    that touches a specific workspace should call this before doing
    anything with it — otherwise workspace IDs are guessable and any
    logged-in user could read or trigger agents on anyone else's business.
    """
    workspace = await db.workspace.find_unique(where={"id": workspace_id})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Not your workspace")
    return workspace
