import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document
from typing import List
from database import DATABASE_URL

# Initialize embeddings
embeddings = OpenAIEmbeddings()

def get_vectorstore():
    # LangChain Postgres vector store
    # collection_name is like a table for vectors
    return PGVector(
        embeddings=embeddings,
        collection_name="docmind_vectors",
        connection=DATABASE_URL,
        use_jsonb=True,
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
    # Postgres vector store doesn't have a simple "get all metadata" method like Chroma
    # We need to query the underlying table using SQLAlchemy or raw SQL
    # For simplicity, we will use a raw SQL query via the vectorstore's connection
    
    # Note: This is a bit of a hack because LangChain's PGVector abstraction hides the table
    # But we can access the driver.
    
    # Let's use a direct SQLAlchemy query for metadata listing
    from sqlalchemy import text
    from database import engine
    
    # The table name is usually langchain_pg_embedding
    # We need to join with collection table to filter by collection_name if needed, 
    # but here we assume one collection.
    
    # The cmetadata column is JSONB
    sql = text("""
        SELECT cmetadata 
        FROM langchain_pg_embedding 
        WHERE cmetadata ->> 'user_id' = :user_id
    """)
    
    documents_list = []
    unique_sources = set()
    
    with engine.connect() as conn:
        result = conn.execute(sql, {"user_id": user_id})
        for row in result:
            meta = row[0]
            if not meta: continue
            
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
    
    return documents_list

def delete_user_document(user_id: str, source: str):
    vectorstore = get_vectorstore()
    print(f"Attempting to delete document for user: {user_id}, source: {source}")
    
    # PGVector delete method usually takes IDs. 
    # We need to find IDs first.
    
    # Again, direct SQL is most reliable for "delete by metadata" in this specific implementation
    from sqlalchemy import text
    from database import engine
    
    sql = text("""
        DELETE FROM langchain_pg_embedding 
        WHERE cmetadata ->> 'user_id' = :user_id 
        AND cmetadata ->> 'source' = :source
    """)
    
    with engine.connect() as conn:
        result = conn.execute(sql, {"user_id": user_id, "source": source})
        conn.commit()
        print(f"Deleted {result.rowcount} rows")
        
    return True
