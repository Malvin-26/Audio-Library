# 🎵 Audio Library Music Player

A modern web-based music player designed to run seamlessly on **Vercel** with **Supabase** (Database + Storage).

## ✨ Features
- 🎶 Play, pause, skip, and seek audio tracks with duration display
- 📁 Upload MP3 files directly or enter audio URLs
- 🖼️ Upload JPG/PNG album art with live preview or enter cover URLs
- 📜 Lyrics display support
- 🗄️ Full CRUD with **Supabase PostgreSQL** & **Supabase Storage**
- ⚡ Serverless API routes optimized for **Vercel** (`/api/songs`, `/api/config`)
- 💻 Local development support with SQLite and file uploads

---

## 🚀 Setup with Supabase

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In your Supabase dashboard, click **SQL Editor** on the left menu.
3. Open `supabase-setup.sql` from this repository, copy all contents, paste it into the SQL Editor, and click **Run**.
   - This automatically creates:
     - `songs` table with Row Level Security (RLS) policies
     - `songs` storage bucket (public) for MP3 files
     - `covers` storage bucket (public) for album artwork

### 2. Get your Supabase API Keys
1. In Supabase, go to **Project Settings** -> **API**.
2. Copy your **Project URL** and **anon / public** key.

---

## ☁️ Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [https://vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
3. Import your `Audio-Library` repository.
4. Under **Environment Variables**, add:
   - `SUPABASE_URL`: Your Supabase Project URL (e.g. `https://xyz.supabase.co`)
   - `SUPABASE_ANON_KEY`: Your Supabase anon public key
5. Click **Deploy**!

---

## 💻 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Create a `.env` file from `.env.example` with your Supabase credentials.
3. Start the server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

