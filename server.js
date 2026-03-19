const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;


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

/* Add new song to database */
app.post("/api/songs", express.json(), (req, res) => {
  const { title, artist, file, cover, lyrics } = req.body;
  db.run(
    "INSERT INTO songs (title, artist, file, cover, lyrics) VALUES (?, ?, ?, ?, ?)",
    [title, artist, file, cover, lyrics],
    (err) => {
      if (err) {
        console.error("Error adding song:", err);
        res.status(500).json({ error: "Failed to add song" });
      } else {
        res.json({ message: "Song added successfully" });
      }
    }
  );
});

/* Delete song from database */
app.delete("/api/songs/:id", (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid song ID" });
  }
  db.run(
    "DELETE FROM songs WHERE id = ?",
    [id],
    function(err) {
      if (err) {
        console.error("Error deleting song:", err);
        res.status(500).json({ error: "Failed to delete song" });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Song not found" });
      } else {
        res.json({ message: "Song deleted successfully" });
      }
    }
  );
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