from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Base, engine
from oauth import router as oauth_router
from services import calendar, user


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(oauth_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "endpoints": {
            "auth_url": "/api/v1/auth/google/url?telegram_id=123",
            "meetings": "/api/v1/meetings/today?telegram_id=123"
        }
    }

@app.get("/api/v1/meetings/today")
async def get_meetings(telegram_id: str, db: Session = Depends(get_db)):
    db_user = user.get_or_create_user(db, telegram_id)
    if not db_user.is_authorized:
        raise HTTPException(status_code=401, detail="Calendar not connected")
    
    calendar_service = calendar.get_calendar_service(db_user.google_credentials)
    events = calendar.get_today_events(calendar_service)
    
    return [
        {
            'id': event['id'],
            'title': event.get('summary', 'No title'),
            'time': datetime.fromisoformat(
                event['start'].get('dateTime', event['start'].get('date'))
            ).strftime('%H:%M'),
            'attendees': [
                attendee['email'] 
                for attendee in event.get('attendees', [])
                if not attendee.get('self', False)
            ]
        }
        for event in events
    ]