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

@app.get("/version")
async def version():
    return {"version": "1.2.3", "deployed_at": "2025-11-22", "note": "cors-fix-test", "cors_enabled": True}

@app.get("/test-supabase")
async def test_supabase():
    """
    Debug endpoint to verify Supabase connection.
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url:
            return {"status": "error", "message": "SUPABASE_URL is missing"}
        if not supabase_key:
            return {"status": "error", "message": "SUPABASE_KEY is missing"}
            
        from supabase import create_client, Client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Try to list buckets to verify credentials
        buckets = supabase.storage.list_buckets()
        return {
            "status": "ok", 
            "message": "Connection successful", 
            "buckets": [b.name for b in buckets]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


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
    """
    Upload logo to Supabase Storage for persistent storage.
    Returns a public URL that persists across Railway deployments.
    """
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")
        
        # Read file contents
        file_contents = await file.read()
        
        # Generate unique filename
        import uuid
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"logos/{user_id}/{uuid.uuid4()}{file_extension}"
        
        # Upload to Supabase Storage
        from supabase import create_client, Client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Upload file (bucket name: 'widget-assets')
        bucket_name = 'widget-assets'
        
        # Check if bucket exists, if not create it (if permissions allow)
        try:
            buckets = supabase.storage.list_buckets()
            bucket_names = [b.name for b in buckets]
            if bucket_name not in bucket_names:
                print(f"Bucket {bucket_name} not found. Attempting to create...")
                supabase.storage.create_bucket(bucket_name, options={'public': True})
        except Exception as bucket_error:
            print(f"Bucket check/create warning: {bucket_error}")
            # Continue anyway, maybe list_buckets is forbidden but upload works
            
        response = supabase.storage.from_(bucket_name).upload(
            unique_filename,
            file_contents,
            file_options={"content-type": file.content_type}
        )
        
        print(f"Upload response: {response}")
        
        # Get public URL
        public_url = supabase.storage.from_('widget-assets').get_public_url(unique_filename)
        
        print(f"Generated public URL: {public_url}")
        
        return {"url": public_url}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in upload_logo: {e}")
        import traceback
        traceback.print_exc()
        # Return more detailed error
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


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
    """Scan a website and return discovered URLs in a tree structure."""
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            return JSONResponse(
                status_code=200,
                content={
                    "base_url": scan_request.url,
                    "total_count": 0,
                    "tree": None,
                    "error": "user-id header is required"
                }
            )
        
        from website_crawler import crawl_website
        
        print(f"[API] Starting website scan for: {scan_request.url}")
        
        # Crawl the website with explicit error handling
        try:
            result = await crawl_website(scan_request.url, max_pages=1000, max_time=90)
            print(f"[API] Scan completed. Total count: {result.get('total_count', 0)}")
            
            # Always return 200 OK with result (even if crawler found 0 pages)
            return JSONResponse(
                status_code=200,
                content=result
            )
            
        except Exception as crawler_error:
            print(f"[API] Crawler exception: {str(crawler_error)}")
            import traceback
            traceback.print_exc()
            
            # Return 200 OK with error details (not a 500)
            return JSONResponse(
                status_code=200,
                content={
                    "base_url": scan_request.url,
                    "total_count": 0,
                    "tree": None,
                    "error": f"Crawler failed: {str(crawler_error)}",
                    "debug_logs": [f"Exception: {str(crawler_error)}"]
                }
            )

    except Exception as e:
        print(f"[API] Endpoint exception: {e}")
        import traceback
        traceback.print_exc()
        
        # Always return 200 OK (never 500), frontend will check for error field
        return JSONResponse(
            status_code=200,
            content={
                "base_url": getattr(scan_request, 'url', 'unknown'),
                "total_count": 0,
                "tree": None,
                "error": f"API error: {str(e)}",
                "debug_logs": [f"Fatal error: {str(e)}"]
            }
        )


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

