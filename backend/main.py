from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
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
async def chat(request: Request, chat_request: ChatRequest):
    try:
        user_id = request.headers.get("user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user-id header is required")

        from rag import query_rag
        from user_data_store import increment_message_count
        
        answer = query_rag(chat_request.question, user_id)
        increment_message_count(user_id)
        
        return {"answer": answer}
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
