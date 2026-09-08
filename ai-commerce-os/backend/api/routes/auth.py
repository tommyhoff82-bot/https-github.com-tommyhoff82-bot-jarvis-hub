from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from db import db
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _public_user(user) -> dict:
    return {"id": user.id, "email": user.email}


@router.post("/auth/signup")
async def signup(data: SignupRequest):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = await db.user.find_unique(where={"email": data.email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with that email already exists")

    user = await db.user.create(data={
        "email": data.email,
        "passwordHash": hash_password(data.password),
    })
    token = create_access_token(user.id)
    return {"token": token, "user": _public_user(user)}


@router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.user.find_unique(where={"email": data.email})
    if not user or not verify_password(data.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return {"token": token, "user": _public_user(user)}


@router.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    workspaces = await db.workspace.find_many(where={"userId": current_user.id})
    return {
        "user": _public_user(current_user),
        "workspaces": [
            {"id": w.id, "businessName": w.businessName, "niche": w.niche,
             "subscriptionTier": w.subscriptionTier}
            for w in workspaces
        ],
    }
