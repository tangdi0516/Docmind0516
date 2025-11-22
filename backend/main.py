from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from sqlalchemy.orm import Session
from database import init_db, get_db, ChatLog, TeamMember
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 允许所有来源 (仅用于调试！)
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # <-- 确保这里是 origins 变量
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


# Initialize Database Tables
from database import init_db
init_db()

# (接下来是 class ChatRequest 和其他路由...)

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "DocsBot Backend is running"}

@app.get("/debug/version")
def debug_version():
    import langchain
    import pkg_resources
    return {
        "langchain_version": langchain.__version__,
        "installed_packages": [f"{p.project_name}=={p.version}" for p in pkg_resources.working_set if "langchain" in p.project_name]
    }

@app.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")

        # Save file temporarily
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Ingest
        from ingestion import ingest_file
        num_chunks = await ingest_file(file_path, user_id)
        
        # Cleanup
        os.remove(file_path)
        
        return {"filename": file.filename, "status": "Uploaded and Ingested", "chunks": num_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class URLRequest(BaseModel):
    url: str

@app.post("/train/url")
async def ingest_url_endpoint(request: Request, url_request: URLRequest):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")

        from ingestion import ingest_url
        num_chunks = await ingest_url(url_request.url, user_id)
        return {"url": url_request.url, "status": "URL Ingested", "chunks": num_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: Request, chat_request: ChatRequest, db: Session = Depends(get_db)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")

        from rag import query_rag
        from user_data_store import increment_message_count
        
        # Use provided session_id or generate a new one (per request for now if not provided)
        session_id = chat_request.session_id or str(uuid.uuid4())

        # 1. Log User Message
        user_msg = ChatLog(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=chat_request.question
        )
        db.add(user_msg)
        db.commit()

        # 2. Get Answer
        answer = query_rag(chat_request.question, user_id)
        increment_message_count(user_id)
        
        # 3. Log Assistant Message
        bot_msg = ChatLog(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=answer
        )
        db.add(bot_msg)
        db.commit()
        
        return {"answer": answer, "session_id": session_id}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train():
    # In this simple version, upload triggers ingestion, so train might be redundant 
    # or could be used for re-indexing. For now, we'll just say it's done.
    return {"status": "Training completed (Ingestion happens on upload)"}

@app.get("/documents")
async def get_documents(request: Request):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        from ingestion import get_user_documents
        documents = get_user_documents(user_id)
        return {"documents": documents}
    except Exception as e:
        print(f"Error in get_documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class DeleteDocumentRequest(BaseModel):
    source: str

@app.delete("/documents")
async def delete_document(request: Request, delete_request: DeleteDocumentRequest):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        from ingestion import delete_user_document
        delete_user_document(user_id, delete_request.source)
        return {"status": "Document deleted", "source": delete_request.source}
    except Exception as e:
        print(f"Error in delete_document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/settings")
async def get_user_settings(request: Request):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        from user_data_store import get_user_data
        data = get_user_data(user_id)
        return data
    except Exception as e:
        print(f"Error in get_user_settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateSettingsRequest(BaseModel):
    bot_name: str
    system_prompt: str
    widget_color: str = "#4F46E5"
    header_logo: str = ""
    initial_message: str = "Hello! How can I help you today?"

@app.post("/user/settings")
async def update_user_settings(request: Request, settings: UpdateSettingsRequest):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        from user_data_store import update_user_data
        updated_data = update_user_data(user_id, {
            "bot_name": settings.bot_name,
            "system_prompt": settings.system_prompt,
            "widget_color": settings.widget_color,
            "header_logo": settings.header_logo,
            "initial_message": settings.initial_message
        })
        return updated_data
    except Exception as e:
        print(f"Error in update_user_settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files
from fastapi.staticfiles import StaticFiles
os.makedirs("static/logos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/upload/logo")
async def upload_logo(request: Request, file: UploadFile = File(...)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
        
        # Generate a unique filename
        import uuid
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = f"static/logos/{filename}"
        
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        # Return the full URL
        base_url = str(request.base_url).rstrip("/")
        logo_url = f"{base_url}/{file_path}"
        
        return {"url": logo_url}
    except Exception as e:
        print(f"Error in upload_logo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- New Endpoints for Logs and Team ---

@app.get("/logs")
async def get_chat_logs(request: Request, db: Session = Depends(get_db)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
        
        # Get logs for this user, ordered by time desc
        logs = db.query(ChatLog).filter(ChatLog.user_id == user_id).order_by(ChatLog.created_at.desc()).limit(100).all()
        return logs
    except Exception as e:
        print(f"Error in get_chat_logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/team")
async def get_team_members(request: Request, db: Session = Depends(get_db)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        members = db.query(TeamMember).filter(TeamMember.owner_id == user_id).all()
        return members
    except Exception as e:
        print(f"Error in get_team_members: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class InviteRequest(BaseModel):
    email: str

@app.post("/team/invite")
async def invite_team_member(request: Request, invite: InviteRequest, db: Session = Depends(get_db)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        # Check if already exists
        existing = db.query(TeamMember).filter(TeamMember.owner_id == user_id, TeamMember.email == invite.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already invited")
            
        new_member = TeamMember(
            owner_id=user_id,
            email=invite.email,
            role="admin" # Default role
        )
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
        return new_member
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in invite_team_member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/team/{member_id}")
async def remove_team_member(member_id: int, request: Request, db: Session = Depends(get_db)):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
            
        member = db.query(TeamMember).filter(TeamMember.id == member_id, TeamMember.owner_id == user_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        db.delete(member)
        db.commit()
        return {"status": "Member removed"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in remove_team_member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Website Crawling Endpoints ---

class ScanWebsiteRequest(BaseModel):
    url: str

@app.post("/scan/website")
async def scan_website(request: Request, scan_request: ScanWebsiteRequest):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
        
        from website_crawler import crawl_website
        
        # Crawl the website and discover URLs
        discovered_urls = crawl_website(scan_request.url, max_pages=100)
        
        return {
            "base_url": scan_request.url,
            "discovered_urls": discovered_urls,
            "count": len(discovered_urls)
        }
    except Exception as e:
        print(f"Error in scan_website: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class TrainWebsiteRequest(BaseModel):
    urls: List[str]

@app.post("/train/website")
async def train_website(request: Request, train_request: TrainWebsiteRequest):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
        
        from ingestion import ingest_url
        
        results = []
        total_chunks = 0
        
        for url in train_request.urls:
            try:
                num_chunks = await ingest_url(url, user_id)
                total_chunks += num_chunks
                results.append({
                    "url": url,
                    "status": "success",
                    "chunks": num_chunks
                })
            except Exception as e:
                results.append({
                    "url": url,
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "total_urls": len(train_request.urls),
            "total_chunks": total_chunks,
            "results": results
        }
    except Exception as e:
        print(f"Error in train_website: {e}")
        raise HTTPException(status_code=500, detail=str(e))

