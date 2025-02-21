# backend/oauth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
import json

from database import get_db
from models import User
from config import settings

router = APIRouter()

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

def create_flow():
    """Create OAuth flow instance"""
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.OAUTH_REDIRECT_URL]
            }
        },
        scopes=SCOPES
    )

@router.get("/auth/google/url")
async def get_auth_url(telegram_id: str, db: Session = Depends(get_db)):
    """Generate Google OAuth URL with state parameter"""
    # Check if user exists, create if not
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id)
        db.add(user)
        db.commit()
    
    flow = create_flow()
    flow.redirect_uri = settings.OAUTH_REDIRECT_URL
    
    # Use telegram_id as state parameter for security
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=telegram_id,
        prompt='consent'  # Force prompt to ensure we get refresh token
    )
    
    return {"url": auth_url}

@router.get("/oauth/callback")
async def oauth_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle OAuth callback - state parameter contains telegram_id"""
    user = db.query(User).filter(User.telegram_id == state).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    flow = create_flow()
    flow.redirect_uri = settings.OAUTH_REDIRECT_URL
    
    # Exchange code for tokens
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # Store credentials in database
    user.google_credentials = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    user.is_authorized = True
    db.commit()
    
    return {"message": "Calendar successfully connected! You can return to Telegram."}

@router.get("/calendar/test")
async def test_calendar(telegram_id: str, db: Session = Depends(get_db)):
    """Test calendar connection"""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user or not user.is_authorized:
        raise HTTPException(status_code=401, detail="Calendar not connected")
    
    credentials = Credentials(
        token=user.google_credentials['token'],
        refresh_token=user.google_credentials['refresh_token'],
        token_uri=user.google_credentials['token_uri'],
        client_id=user.google_credentials['client_id'],
        client_secret=user.google_credentials['client_secret'],
        scopes=user.google_credentials['scopes']
    )
    
    # Test if credentials are valid
    if not credentials.valid:
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            # Update stored credentials
            user.google_credentials['token'] = credentials.token
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"status": "ok", "message": "Calendar connected and working"}