from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import List
from datetime import datetime
from bson import ObjectId
from app.db import ticket_collection
from app.models.ticket_model import TicketCreate, Ticket
import os

router = APIRouter()

# File storage directory
file_storage_dir = "uploaded_files"
os.makedirs(file_storage_dir, exist_ok=True)

@router.post("/tickets", response_model=Ticket, tags=["Tickets"])
async def create_ticket(
    category: str = Form(...),
    subcategory: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    priority: str = Form(...),
    department: str = Form(...),
    email: str = Form(...),
    attachment: UploadFile = File(None),
):
    """
    Create a new ticket with optional file attachment.
    """
    ticket_data = {
        "category": category,
        "subcategory": subcategory,
        "subject": subject,
        "description": description,
        "priority": priority,
        "department": department,
        "email": email,
        "status": "open",  # Default status is "open"
        "created_at": datetime.utcnow(),
    }

    # Handle file upload
    if attachment:
        file_location = os.path.join(file_storage_dir, attachment.filename)
        with open(file_location, "wb") as f:
            f.write(await attachment.read())
        ticket_data["attachment"] = {"filename": attachment.filename, "file_path": file_location}

    # Insert ticket into the database
    result = await ticket_collection.insert_one(ticket_data)
    ticket_data["id"] = str(result.inserted_id)
    return ticket_data

@router.get("/tickets", response_model=List[Ticket], tags=["Tickets"])
async def get_tickets(skip: int = 0, limit: int = 10):
    """
    Retrieve all tickets from the database with pagination.
    """
    try:
        tickets = await ticket_collection.find().skip(skip).limit(limit).to_list(100)
        return [Ticket(**ticket, id=str(ticket["_id"])) for ticket in tickets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")

@router.get("/tickets/{ticket_id}", response_model=Ticket, tags=["Tickets"])
async def get_ticket_by_id(ticket_id: str):
    """
    Retrieve a specific ticket by its ID.
    """
    ticket = await ticket_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return Ticket(**ticket, id=str(ticket["_id"]))

@router.patch("/tickets/{ticket_id}/status", tags=["Tickets"])
async def update_ticket_status(ticket_id: str, status: str):
    """
    Update the status of a ticket.
    """
    try:
        result = ticket_collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": {"status": status}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return {"message": "Ticket status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ticket status: {str(e)}")

@router.post("/tickets/{ticket_id}/notify", tags=["Tickets"])
async def notify_ticket_update(ticket_id: str):
    """
    Notify relevant parties about a ticket update.
    This could include sending an email or a notification.
    """
    try:
        ticket = await get_ticket_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Implement your notification logic here
        # For example, send an email, or trigger a webhook
        # For now, we'll just simulate a notification message
        notification_message = f"Ticket {ticket_id} has been updated. Notification sent."

        return {"message": notification_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error notifying ticket update: {str(e)}")
