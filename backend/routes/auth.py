from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from db import database, users
from utils.auth import hash_password, verify_password, create_access_token, decode_token
import sqlalchemy

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "finance"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    query = users.select().where(users.c.id == int(user_id))
    user = await database.fetch_one(query)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/register")
async def register(data: UserCreate):
    existing = await database.fetch_one(users.select().where(users.c.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    query = users.insert().values(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    user_id = await database.execute(query)
    return {"message": "User created", "id": user_id}


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await database.fetch_one(users.select().where(users.c.email == form_data.username))
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": str(user["id"]), "role": user["role"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer", "user": {
        "id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]
    }}


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return dict(current_user)


@router.get("/users")
async def list_users(current_user=Depends(require_admin)):
    result = await database.fetch_all(users.select().order_by(users.c.id))
    return [dict(r) for r in result]
