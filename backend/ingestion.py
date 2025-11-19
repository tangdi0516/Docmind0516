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

async def ingest_file(file_path: str):
    # Determine loader based on extension
    _, ext = os.path.splitext(file_path)
    if ext.lower() == ".pdf":
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path)
    
    documents = loader.load()
    
    # Split text
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    # Add to vector store
    vectorstore = get_vectorstore()
    vectorstore.add_documents(splits)
    
    return len(splits)
