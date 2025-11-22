# Supabase Storage Setup for Logo Uploads

## Problem
Previously, logos were saved to Railway's local filesystem (`static/logos/`), which gets wiped on each deployment. This caused uploaded logos to disappear.

## Solution
We now use **Supabase Storage** for persistent logo storage.

---

## Setup Steps

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Wait for database initialization

### 2. Create Storage Bucket
1. In your Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Bucket name: `widget-assets`
4. **Make it PUBLIC** (toggle Public Bucket to ON)
5. Click **Create Bucket**

### 3. Get Credentials
1. Go to **Project Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon/public key** (the long JWT token)

### 4. Configure Railway Environment Variables
1. Go to your Railway project
2. Navigate to **Variables** tab
3. Add these two variables:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key_here
   ```
4. Click **Deploy** to restart with new variables

### 5. Update Local .env (for development)
```bash
# backend/.env
OPENAI_API_KEY=your_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

---

## How It Works

1. **Upload**:
   - User uploads logo in Widget Generator
   - Frontend sends file to `/upload/logo`
   - Backend uploads to Supabase bucket: `widget-assets/logos/{userId}/{uuid}.png`
   - Returns permanent public URL

2. **Display**:
   - Logo URL is saved in user settings
   - Chat widget reads settings and displays logo
   - URL persists forever (no more disappearing logos!)

---

## Security Notes

- The `anon` key is safe to expose in frontend code
- Supabase's Row Level Security (RLS) protects data
- For logos, we use a public bucket (anyone can view, only backend can upload)

---

## Troubleshooting

**Error: "Supabase not configured"**
→ Make sure `SUPABASE_URL` and `SUPABASE_KEY` are set in Railway variables

**Error: "Bucket widget-assets does not exist"**
→ Create the bucket in Supabase dashboard as described in Step 2

**Logo uploads but doesn't display**
→ Ensure bucket is set to **Public** in Supabase Storage settings
