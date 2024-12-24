from fastapi import FastAPI, HTTPException, Form, UploadFile, File, BackgroundTasks, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from email_validator import validate_email, EmailNotValidError
from bson import ObjectId
import motor.motor_asyncio
import bcrypt
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import uvicorn

# Constants
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "tejas@cirrus.co.in"  # Update with your email
SMTP_PASSWORD = "Tejubandal@2511"  # Update with your app-specific password

# Environment-based secret keys
SECRET_KEYS = {
    "admin": os.getenv("ADMIN_SECRET_KEY", "default_admin_key"),
    "techteam": os.getenv("TECH_TEAM_SECRET_KEY", "default_tech_key"),
}

# Initialize FastAPI app
app = FastAPI()

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to restrict specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client.ticketing_system
ticket_collection = db.tickets
users_collection = db.users

# Ensure file storage directory exists
file_storage_dir = "uploaded_files"
os.makedirs(file_storage_dir, exist_ok=True)

# Models
class User(BaseModel):
    email: str
    password: str
    role: str = "user"  # Default role

class TicketStatusUpdate(BaseModel):
    status: str

# Utility functions
def validate_email_format(email: str):
    try:
        validate_email(email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=str(e))

async def hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

async def authenticate_user(user: User):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return db_user

def check_role(required_role: str):
    async def role_checker(user: dict = Depends(authenticate_user)):
        if user["role"] != required_role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return role_checker

def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {e}")

import logging

logger = logging.getLogger("uvicorn.error")

@app.post("/register")
async def register(
    email: str = Body(...),
    password: str = Body(...),
    role: str = Body("user"),
    secret_key: Optional[str] = Body(None)
):
    try:
        logger.info("Attempting to register user")
        validate_email_format(email)
        logger.info(f"Email format validated: {email}")

        if await users_collection.find_one({"email": email}):
            logger.error("Email already registered")
            raise HTTPException(status_code=400, detail="Email already registered")

        if role in ["admin", "techteam"]:
            if not secret_key or SECRET_KEYS.get(role) != secret_key:
                logger.error("Invalid secret key")
                raise HTTPException(status_code=403, detail="Invalid secret key for role")

        hashed_password = await hash_password(password)
        user_data = {"email": email, "password": hashed_password.decode('utf-8'), "role": role}
        await users_collection.insert_one(user_data)

        logger.info("User registered successfully")
        return {"message": f"{role.capitalize()} registered successfully"}
    except Exception as e:
        logger.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/login")
async def login(user: User):
    await authenticate_user(user)
    return {"message": "Login successful"}

@app.patch("/users/{user_email}/role")
async def update_user_role(user_email: str, new_role: str, user: dict = Depends(check_role("admin"))):
    if new_role not in ["admin", "techteam", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    result = await users_collection.update_one({"email": user_email}, {"$set": {"role": new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User role updated to {new_role}"}

@app.post("/tickets")
async def create_ticket(
    category: str = Form(...),
    subcategory: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    priority: str = Form(...),
    department: str = Form(...),
    email: str = Form(...),
    attachment: Optional[UploadFile] = File(None)
):
    validate_email_format(email)
    ticket_data = {
        "category": category,
        "subcategory": subcategory,
        "subject": subject,
        "description": description,
        "priority": priority,
        "department": department,
        "email": email,
        "status": "open"
    }
    if attachment:
        file_path = os.path.join(file_storage_dir, attachment.filename)
        with open(file_path, "wb") as f:
            f.write(await attachment.read())
        ticket_data["attachment"] = {"filename": attachment.filename, "path": file_path}
    ticket_id = await ticket_collection.insert_one(ticket_data)
    return {"message": "Ticket created successfully", "ticket_id": str(ticket_id.inserted_id)}

@app.get("/tickets")
async def get_tickets(skip: int = 0, limit: int = 10):
    tickets = await ticket_collection.find().skip(skip).limit(limit).to_list(length=limit)
    for ticket in tickets:
        ticket["_id"] = str(ticket["_id"])
    return {"tickets": tickets}

@app.patch("/tickets/{ticket_id}/status", tags=["Tickets"])
async def update_ticket_status_route(ticket_id: str, ticket_update: TicketStatusUpdate):
    try:
        ticket = await ticket_collection.find_one({"_id": ObjectId(ticket_id)})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        updated_count = await ticket_collection.update_one({"_id": ObjectId(ticket_id)}, {"$set": {"status": ticket_update.status}})
        if updated_count.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to update ticket status")

        return {"message": f"Ticket {ticket_id} status updated to {ticket_update.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ticket status: {str(e)}")

@app.post("/tickets/{ticket_id}/notify")
async def notify_ticket_update(ticket_id: str, background_tasks: BackgroundTasks):
    ticket = await ticket_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    subject = f"Update for Ticket: {ticket['subject']}"
    body = f"Ticket ID {ticket_id} has been updated."
    background_tasks.add_task(send_email, ticket["email"], subject, body)
    return {"message": "Notification sent"}



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
