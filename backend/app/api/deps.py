from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.config import settings
from app.db.base import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Replace with your actual Google Client ID
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify the token with Google
        # Assuming the frontend sends the ID token directly as the Bearer token
        print(f"DEBUG: Verifying token: {token[:20]}...")
        print(f"DEBUG: Using Client ID: {GOOGLE_CLIENT_ID}")
        
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

        # Get the user's Google ID (sub)
        google_sub = idinfo['sub']
        email = idinfo.get('email')
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
    except ValueError as e:
        print(f"DEBUG: Token verification failed: {str(e)}")
        raise credentials_exception

    # specific check for GOOGLE_CLIENT_ID to ensure we are verifying against our app
    # (verify_oauth2_token does this if audience is passed, but good to be explicit/safe)
    
    user = db.query(User).filter(User.google_sub == google_sub).first()
    
    if not user:
        # Create new user if they don't exist
        user = User(
            google_sub=google_sub,
            email=email,
            full_name=name,
            picture=picture
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user
