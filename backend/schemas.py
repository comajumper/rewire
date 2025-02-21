from pydantic import BaseModel
from typing import Optional, List

class TokenData(BaseModel):
    token: str
    refresh_token: str
    token_uri: str
    scopes: List[str]

class UserCreate(BaseModel):
    telegram_id: str

class UserResponse(BaseModel):
    telegram_id: str
    is_authorized: bool