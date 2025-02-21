from sqlalchemy.orm import Session
from models import User

def get_or_create_user(db: Session, telegram_id: str):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id)
        db.add(user)
        db.commit()
    return user