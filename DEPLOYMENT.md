# 🚀 DocMind Deployment Guide

## Step 1: Prepare Your Accounts

### Required Accounts:
1. ✅ **Vercel** - https://vercel.com (for hosting)
2. ✅ **GitHub** - https://github.com (for code repository)
3. ✅ **OpenAI** - https://platform.openai.com (for API key)
4. ✅ **Clerk** - https://clerk.com (for authentication)

---

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd /Users/ditang/gemini-project/antigravity/scratch
git init
git add .
git commit -m "Initial commit: DocMind application"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/docmind.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend to Vercel

### 3.1 Via Vercel CLI:
```bash
cd backend
npm install -g vercel
vercel login
vercel --prod
```

### 3.2 Via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the `backend` folder as root directory
4. Add environment variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
5. Click "Deploy"

### 3.3 Save your backend URL:
After deployment, you'll get a URL like: `https://docmind-backend.vercel.app`

---

## Step 4: Update Frontend Configuration

Update all instances of `http://localhost:8000` to your backend URL:

### Files to update:
- `frontend/src/components/Chat.jsx`
- `frontend/src/components/Dashboard.jsx`
- `frontend/src/components/EmbedChat.jsx`
- `frontend/src/components/KnowledgeList.jsx`
- `frontend/src/components/Upload.jsx`
- `frontend/src/components/WidgetChat.jsx`
- `frontend/src/components/WidgetGenerator.jsx`

**Search and replace:** `http://localhost:8000` → `https://your-backend-url.vercel.app`

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Via Vercel CLI:
```bash
cd frontend
vercel --prod
```

### 5.2 Via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the `frontend` folder as root directory
4. Framework Preset: **Vite**
5. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
6. Click "Deploy"

---

## Step 6: Update Clerk Settings

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **"Configure" → "Domains"**
4. Add your Vercel frontend URL to allowed domains

---

## Step 7: Test Your Deployment

1. Visit your frontend URL: `https://your-app.vercel.app`
2. Sign in with Clerk
3. Upload a document
4. Test the chat functionality
5. Test the embeddable widget on the landing page

---

## 📝 Important Notes

### API URLs to Update:
After deployment, remember to update:
- Loader.js widget URL
- Backend API base URLs in all components
- Clerk redirect URLs

### Environment Variables Needed:

**Backend:**
- `OPENAI_API_KEY`

**Frontend:**
- `VITE_CLERK_PUBLISHABLE_KEY`

---

## 🔧 Troubleshooting

### CORS Issues:
Make sure your backend allows your frontend domain in CORS settings.

### 404 on Routes:
Vercel should auto-detect React Router. If not, add `vercel.json` to frontend.

### Database Persistence:
Vercel has ephemeral storage. Consider using:
- **Supabase** for user data
- **Pinecone** or **Weaviate** for vector database

---

## 🎉 You're Live!

Once deployed, share your DocMind URL with customers!

**Widget embed code:**
```html
<script 
    src="https://your-app.vercel.app/loader.js" 
    data-owner-id="YOUR_USER_ID"
></script>
```
