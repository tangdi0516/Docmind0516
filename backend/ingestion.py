import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from typing import List

# Initialize embeddings
embeddings = OpenAIEmbeddings()

# Initialize vector store
persist_directory = "./chroma_db"

def get_vectorstore():
    return Chroma(
        persist_directory=persist_directory,
        embedding_function=embeddings
    )
def add_user_metadata(documents, user_id):
    for doc in documents:
        doc.metadata["user_id"] = user_id
    return documents
    
async def ingest_file(file_path: str, user_id: str):
    # Determine loader based on extension
    _, ext = os.path.splitext(file_path)
    if ext.lower() == ".pdf":
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path)
    
    documents = loader.load()
    
    # Add user metadata
    documents = add_user_metadata(documents, user_id)
    
    # Split text
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    # Add to vector store
    vectorstore = get_vectorstore()
    vectorstore.add_documents(splits)
    
    return len(splits)

async def ingest_url(url: str, user_id: str):
    from langchain_community.document_loaders import WebBaseLoader
    
    loader = WebBaseLoader(url)
    documents = loader.load()
    
    # Add user metadata
    documents = add_user_metadata(documents, user_id)
    
    # Split text
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    # Add to vector store
    vectorstore = get_vectorstore()
    vectorstore.add_documents(splits)
    
    return len(splits)

def get_user_documents(user_id: str):
    vectorstore = get_vectorstore()
    # Fetch all documents for the user
    # Note: Chroma's get() method returns a dict with 'ids', 'embeddings', 'metadatas', 'documents'
    results = vectorstore.get(where={"user_id": user_id})
    
    metadatas = results.get("metadatas", [])
    unique_sources = set()
    documents_list = []
    
    for meta in metadatas:
        if not meta:
            continue
        source = meta.get("source")
        if source and source not in unique_sources:
            unique_sources.add(source)
            
            # Determine type and clean name
            if source.startswith("http"):
                doc_type = "url"
                name = source
            else:
                doc_type = "file"
                # Remove temp_ prefix and path
                name = os.path.basename(source).replace("temp_", "")
                
            documents_list.append({
                "source": name,
                "type": doc_type,
                "original_source": source
            })
    
    print(f"Found {len(documents_list)} unique documents for user {user_id}: {[d['source'] for d in documents_list]}")
    return documents_list

def delete_user_document(user_id: str, source: str):
    vectorstore = get_vectorstore()
    print(f"Attempting to delete document for user: {user_id}, source: {source}")
    
    # Construct where clause using $and for multiple conditions
    where_clause = {
        "$and": [
            {"user_id": {"$eq": user_id}},
            {"source": {"$eq": source}}
        ]
    }
    
    # Verify existence before delete
    existing = vectorstore.get(where=where_clause)
    print(f"Found {len(existing['ids'])} chunks to delete")
    
    # Delete documents
    vectorstore.delete(where=where_clause)
    
    # Verify deletion
    remaining = vectorstore.get(where=where_clause)
    print(f"Remaining chunks after delete: {len(remaining['ids'])}")
    
    return True
