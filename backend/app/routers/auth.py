from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import create_access_token, get_current_user_id, hash_password, verify_password
from ..models import Notification, User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=body.name, email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(Notification(user_id=user.id, title="Welcome to EcoAtlas.Earth",
                        message="Your workspace is ready. Explore the demo projects.", kind="success"))
    db.commit()
    token = create_access_token(user.id)
    return {"access_token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id)
    return {"access_token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}


@router.get("/me", response_model=UserOut)
def me(db: Session = Depends(get_db), uid: str = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
