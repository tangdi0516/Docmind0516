# DocMind - AI-Powered Document Intelligence Platform

This is a full-stack application for creating AI chatbots trained on your documents.

## Project Structure

- `/frontend` - React + Vite frontend application
- `/backend` - FastAPI backend with LangChain and ChromaDB

## Deployment

### Backend (Vercel/Railway/Render)

1. Deploy backend to Vercel or Railway
2. Set environment variables:
   - `OPENAI_API_KEY` - Your OpenAI API key

### Frontend (Vercel)

1. Deploy frontend to Vercel
2. Update API base URL to point to your backend URL

## Environment Variables

### Backend
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend
Update `API_BASE_URL` in components to point to your deployed backend.

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- 📄 Upload PDF, TXT, MD files
- 🌐 Ingest content from URLs
- 💬 AI-powered chat with your documents
- 🎨 Customizable chat widget
- 📊 Usage analytics
- 🔌 Embeddable widget for any website

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Clerk (auth)
- **Backend**: FastAPI, LangChain, OpenAI, ChromaDB
- **Deployment**: Vercel

## License

MIT
