const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 3000;

/* Create upload directories if they don't exist */
const uploadsDir = path.join(__dirname, "uploads");
const songsUploadDir = path.join(uploadsDir, "songs");
const coversUploadDir = path.join(uploadsDir, "covers");

[uploadsDir, songsUploadDir, coversUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* Configure multer for file uploads */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "songFile") {
      cb(null, songsUploadDir);
    } else if (file.fieldname === "coverFile") {
      cb(null, coversUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "songFile") {
    if (file.mimetype === "audio/mpeg" || file.originalname.toLowerCase().endsWith(".mp3")) {
      cb(null, true);
    } else {
      cb(new Error("Only MP3 files are allowed for songs"), false);
    }
  } else if (file.fieldname === "coverFile") {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG files are allowed for covers"), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const db = new sqlite3.Database("./music.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

/* Handle database errors */
db.on("error", (err) => {
  console.error("Database error:", err);
});

function initializeDatabase() {
  db.run(
    `CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      file TEXT NOT NULL,
      cover TEXT NOT NULL,
      lyrics TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error creating table:", err);
      } else {
        db.all("SELECT COUNT(*) as count FROM songs", (err, rows) => {
          if (err) {
            console.error("Error checking songs:", err);
          } else if (rows && rows[0].count === 0) {
            console.log("Database initialized with default songs");
          }
        });
      }
    }
  );
}

/* Serve static frontend */
app.use(express.static("."));
app.use("/songs", express.static("songs"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* Serve music.html at root */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "music.html"));
});

/* Song metadata API - fetch from database */
app.get("/api/songs", (req, res) => {
  db.all("SELECT * FROM songs", (err, rows) => {
    if (err) {
      console.error("Error fetching songs:", err);
      res.status(500).json({ error: "Failed to fetch songs" });
    } else {
      res.json(rows);
    }
  });
});

/* Add new song with file uploads */
app.post(
  "/api/songs",
  upload.fields([
    { name: "songFile", maxCount: 1 },
    { name: "coverFile", maxCount: 1 },
  ]),
  (req, res) => {
    const { title, artist, lyrics } = req.body;

    /* Determine file and cover paths — support both uploads and URL fallback */
    let filePath;
    let coverPath;

    if (req.files && req.files.songFile) {
      filePath = "/uploads/songs/" + req.files.songFile[0].filename;
    } else if (req.body.file) {
      filePath = req.body.file;
    } else {
      return res.status(400).json({ error: "Song file is required" });
    }

    if (req.files && req.files.coverFile) {
      coverPath = "/uploads/covers/" + req.files.coverFile[0].filename;
    } else if (req.body.cover) {
      coverPath = req.body.cover;
    } else {
      return res.status(400).json({ error: "Cover image is required" });
    }

    db.run(
      "INSERT INTO songs (title, artist, file, cover, lyrics) VALUES (?, ?, ?, ?, ?)",
      [title, artist, filePath, coverPath, lyrics || ""],
      (err) => {
        if (err) {
          console.error("Error adding song:", err);
          res.status(500).json({ error: "Failed to add song" });
        } else {
          res.json({ message: "Song added successfully" });
        }
      }
    );
  }
);

/* Delete song from database */
app.delete("/api/songs/:id", (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid song ID" });
  }

  /* Get file paths before deleting so we can clean up uploaded files */
  db.get("SELECT file, cover FROM songs WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error finding song:", err);
      return res.status(500).json({ error: "Failed to delete song" });
    }

    db.run("DELETE FROM songs WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("Error deleting song:", err);
        res.status(500).json({ error: "Failed to delete song" });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Song not found" });
      } else {
        /* Clean up uploaded files */
        if (row) {
          [row.file, row.cover].forEach((filePath) => {
            if (filePath && filePath.startsWith("/uploads/")) {
              const fullPath = path.join(__dirname, filePath);
              fs.unlink(fullPath, (err) => {
                if (err && err.code !== "ENOENT") {
                  console.error("Error deleting file:", fullPath, err);
                }
              });
            }
          });
        }
        res.json({ message: "Song deleted successfully" });
      }
    });
  });
});

/* Error handler for multer — must be after all routes */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Max size is 50MB." });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) console.error("Error closing database:", err);
    else console.log("Database closed");
    process.exit(0);
  });
});
