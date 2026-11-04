try {
  require("dotenv").config();
} catch (e) {}

const express = require("express");
const path = require("path");
const fs = require("fs");
let multer;
try {
  multer = require("multer");
} catch (e) {}
let createClient;
try {
  createClient = require("@supabase/supabase-js").createClient;
} catch (e) {}
let sqlite3;
try {
  sqlite3 = require("sqlite3").verbose();
} catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;

/* Check Supabase credentials */
const SUPABASE_URL = process.env.SUPABASE_URL || "https://pnysywzorgsomfvpuvic.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (createClient && SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Connected to Supabase at", SUPABASE_URL);
  } catch (err) {
    console.warn("Could not connect to Supabase:", err.message);
  }
}

/* Local SQLite Fallback Setup */
let db = null;
if (sqlite3) {
  try {
    db = new sqlite3.Database("./music.db");
    db.run(`CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      file TEXT NOT NULL,
      cover TEXT NOT NULL,
      lyrics TEXT
    )`);
  } catch (err) {
    console.warn("Could not initialize local SQLite database:", err.message);
  }
}

/* Local upload directories */
const uploadsDir = path.join(__dirname, "uploads");
const songsUploadDir = path.join(uploadsDir, "songs");
const coversUploadDir = path.join(uploadsDir, "covers");
try {
  [uploadsDir, songsUploadDir, coversUploadDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
} catch (e) {}

/* Multer for local uploads */
let uploadMiddleware = (req, res, next) => next();
if (multer) {
  try {
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
    uploadMiddleware = upload.fields([
      { name: "songFile", maxCount: 1 },
      { name: "coverFile", maxCount: 1 },
    ]);
  } catch (e) {}
}

/* Middleware */
app.use(express.json());
app.use(express.static("."));
app.use("/uploads", express.static(uploadsDir));

/* API Config */
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
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("id", { ascending: true });
      if (!error && data) return res.json(data);
    } catch (e) {}
  }

  if (db) {
    return db.all("SELECT * FROM songs", (err, rows) => {
      if (err) return res.status(500).json({ error: "Failed to fetch songs" });
      res.json(rows || []);
    });
  }

  res.json([]);
});

/* POST: Add song */
app.post("/api/songs", uploadMiddleware, async (req, res) => {
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
    try {
      const { data, error } = await supabase
        .from("songs")
        .insert([{ title, artist, file, cover, lyrics: lyrics || "" }])
        .select();
      if (!error && data) return res.status(201).json(data[0]);
    } catch (e) {}
  }

  if (db) {
    return db.run(
      "INSERT INTO songs (title, artist, file, cover, lyrics) VALUES (?, ?, ?, ?, ?)",
      [title, artist, file, cover, lyrics || ""],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to add song" });
        res.status(201).json({ id: this.lastID, title, artist, file, cover, lyrics });
      }
    );
  }

  res.status(400).json({ error: "Database not connected" });
});

/* DELETE: Remove song */
const deleteHandler = async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) return res.status(400).json({ error: "Song ID is required" });

  if (supabase) {
    try {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (!error) return res.json({ message: "Song deleted successfully" });
    } catch (e) {}
  }

  if (db) {
    return db.run("DELETE FROM songs WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: "Failed to delete song" });
      res.json({ message: "Song deleted successfully" });
    });
  }

  res.json({ message: "Song deleted" });
};

app.delete("/api/songs/:id", deleteHandler);
app.delete("/api/songs", deleteHandler);

/* Error handling */
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || "Server error" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
