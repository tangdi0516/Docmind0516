import json
import os
from typing import Dict, Any

DATA_FILE = "user_data.json"

def load_data() -> Dict[str, Any]:
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def save_data(data: Dict[str, Any]):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

def get_user_data(user_id: str) -> Dict[str, Any]:
    data = load_data()
    if user_id not in data:
        # Default data
        data[user_id] = {
            "message_count": 0,
            "bot_name": "DocMind",
            "system_prompt": (
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
            ),
            "widget_color": "#4F46E5",
            "header_logo": "",
            "initial_message": "Hello! How can I help you today?"
        }
        save_data(data)
    return data[user_id]

def update_user_data(user_id: str, updates: Dict[str, Any]):
    data = load_data()
    if user_id not in data:
        get_user_data(user_id) # Initialize
        data = load_data() # Reload
    
    data[user_id].update(updates)
    save_data(data)
    return data[user_id]

def increment_message_count(user_id: str):
    data = load_data()
    if user_id not in data:
        get_user_data(user_id) # Initialize
        data = load_data() # Reload
        
    current = data[user_id].get("message_count", 0)
    data[user_id]["message_count"] = current + 1
    save_data(data)
    return data[user_id]["message_count"]
