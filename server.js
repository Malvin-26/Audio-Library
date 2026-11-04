require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

/* Check Supabase credentials */
const SUPABASE_URL = process.env.SUPABASE_URL || "https://pnysywzorgsomfvpuvic.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Connected to Supabase at", SUPABASE_URL);
} else {
  console.log("Supabase credentials not fully set. Falling back to local SQLite.");
}

/* Local SQLite Fallback Setup */
const db = new sqlite3.Database("./music.db");
db.run(`CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  file TEXT NOT NULL,
  cover TEXT NOT NULL,
  lyrics TEXT
)`);

/* Create local upload directories */
const uploadsDir = path.join(__dirname, "uploads");
const songsUploadDir = path.join(uploadsDir, "songs");
const coversUploadDir = path.join(uploadsDir, "covers");
[uploadsDir, songsUploadDir, coversUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* Multer for local uploads */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "songFile" ? songsUploadDir : coversUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

/* Middleware */
app.use(express.json());
app.use(express.static("."));
app.use("/uploads", express.static(uploadsDir));

/* API Config - Exposes Supabase public URL and anon key to client */
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
  });
});

/* Root routes */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "music.html"));
});

/* GET: Fetch songs */
app.get("/api/songs", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("id", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  }

  db.all("SELECT * FROM songs", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch songs" });
    res.json(rows);
  });
});

/* POST: Add song (handles both JSON and multipart form data) */
app.post(
  "/api/songs",
  upload.fields([
    { name: "songFile", maxCount: 1 },
    { name: "coverFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const { title, artist, lyrics } = req.body;
    let file = req.body.file;
    let cover = req.body.cover;

    if (req.files?.songFile?.[0]) {
      file = "/uploads/songs/" + req.files.songFile[0].filename;
    }
    if (req.files?.coverFile?.[0]) {
      cover = "/uploads/covers/" + req.files.coverFile[0].filename;
    }

    if (!title || !artist || !file || !cover) {
      return res.status(400).json({ error: "title, artist, file, and cover are required" });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("songs")
        .insert([{ title, artist, file, cover, lyrics: lyrics || "" }])
        .select();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data?.[0] || { message: "Song added" });
    }

    db.run(
      "INSERT INTO songs (title, artist, file, cover, lyrics) VALUES (?, ?, ?, ?, ?)",
      [title, artist, file, cover, lyrics || ""],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to add song" });
        res.json({ id: this.lastID, title, artist, file, cover, lyrics });
      }
    );
  }
);

/* DELETE: Remove song */
const deleteHandler = async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) return res.status(400).json({ error: "Song ID is required" });

  if (supabase) {
    const { error } = await supabase.from("songs").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: "Song deleted successfully" });
  }

  db.run("DELETE FROM songs WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to delete song" });
    res.json({ message: "Song deleted successfully" });
  });
};

app.delete("/api/songs/:id", deleteHandler);
app.delete("/api/songs", deleteHandler);

/* Error handling */
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
