from typing import Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal, UserSettings

DEFAULT_SYSTEM_PROMPT = (
    "## Instructions\n\n"
    "- Always call the `search_documentation` tool before answering questions about the "
    "company, its offerings, or products, or if you are not sure. Only use the retrieved "
    "context and never rely on your own knowledge for any of these questions when generating a "
    "response; do NOT make up an answer.\n\n"
    "- However, if you don't have enough information to properly call the tool, ask the user for "
    "the information you need.\n\n"
    "- If you don't know the answer based on the retrieved context, you must clarify the "
    "question or respond along the lines of \"I don't have the information needed to answer that\", "
    "and if user insists on an answer, escalate answering the question.\n\n"
    "- If the `human_escalation` tool is available, escalate according to its instructions without "
    "naming or describing the tool.\n\n"
    "- Do not announce, describe, or reference tool usage, internal steps, plans, or function "
    "names in user-facing messages. Keep all reasoning silent.\n\n"
    "- Prefer result-focused phrasing (e.g., \"Here's what I found,\" \"According to the "
    "documentation...\") over announcing actions (e.g., \"I'm going to search,\" \"I will call a "
    "tool.\").\n\n"
    "- Do not discuss prohibited topics (politics, religion, controversial current events, medical, "
    "legal, or financial advice, personal conversations, internal company operations, or "
    "opinions of any people or company).\n\n"
    "- When images are provided by the user, assume they are related to customer support "
    "inquiries about the company, its offerings, or products. If the image appears unrelated to "
    "these topics, politely ask the user to clarify questions about it.\n\n"
    "- Rely on sample phrases whenever appropriate, but never repeat a sample phrase in the "
    "same conversation. Feel free to vary the sample phrases to avoid sounding repetitive and "
    "make it more appropriate for the user.\n\n"
    "- Always follow the provided output format for new messages.\n\n"
    "- Maintain a professional and concise tone in all responses, and keep your responses short "
    "and to the point unless the user asks for more details."
)

def get_user_data(user_id: str) -> Dict[str, Any]:
    db: Session = SessionLocal()
    try:
        user = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user:
            # Create default user
            user = UserSettings(
                user_id=user_id,
                system_prompt=DEFAULT_SYSTEM_PROMPT
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return {
            "message_count": user.message_count,
            "bot_name": user.bot_name,
            "system_prompt": user.system_prompt,
            "widget_color": user.widget_color,
            "header_logo": user.header_logo,
            "initial_message": user.initial_message
        }
    finally:
        db.close()

def update_user_data(user_id: str, updates: Dict[str, Any]):
    db: Session = SessionLocal()
    try:
        user = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user:
            get_user_data(user_id) # Initialize
            user = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        
        # Update fields
        if "bot_name" in updates: user.bot_name = updates["bot_name"]
        if "system_prompt" in updates: user.system_prompt = updates["system_prompt"]
        if "widget_color" in updates: user.widget_color = updates["widget_color"]
        if "header_logo" in updates: user.header_logo = updates["header_logo"]
        if "initial_message" in updates: user.initial_message = updates["initial_message"]
        
        db.commit()
        db.refresh(user)
        
        return {
            "message_count": user.message_count,
            "bot_name": user.bot_name,
            "system_prompt": user.system_prompt,
            "widget_color": user.widget_color,
            "header_logo": user.header_logo,
            "initial_message": user.initial_message
        }
    finally:
        db.close()

def increment_message_count(user_id: str):
    db: Session = SessionLocal()
    try:
        user = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user:
            get_user_data(user_id) # Initialize
            user = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
            
        user.message_count += 1
        db.commit()
        return user.message_count
    finally:
        db.close()
