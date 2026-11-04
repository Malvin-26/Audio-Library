const audio = document.getElementById("audio");
const songList = document.getElementById("songList");
const title = document.getElementById("songTitle");
const artist = document.getElementById("artistName");
const cover = document.getElementById("coverImage");
const lyricsBox = document.getElementById("lyricsBox");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time");
const volumeSlider = document.getElementById("volumeSlider");

let songs = [];
let currentIndex = -1;
let supabaseClient = null;

let currentAudioMode = "upload"; // "upload" | "url"
let currentCoverMode = "upload"; // "upload" | "url"

/* Format time to mm:ss */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/* Initialize Supabase client if config is available */
async function initSupabase() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return;
    const config = await res.json();

    if (config.supabaseUrl && config.supabaseAnonKey && window.supabase) {
      supabaseClient = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey
      );
      console.log("Supabase client initialized successfully");
    }
  } catch (err) {
    console.warn("Could not load /api/config:", err.message);
  }
}

/* Fetch songs from backend */
async function fetchSongs() {
  try {
    const r = await fetch("/api/songs");
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch songs (${r.status})`);
    }
    songs = await r.json();
    renderSongs();
  } catch (err) {
    console.error("Error fetching songs:", err);
    songList.innerHTML = `<div style="padding:20px;color:#888;font-size:13px;">No songs found or error loading collection. ${err.message}</div>`;
  }
}

function renderSongs() {
  songList.innerHTML = "";
  if (!songs || songs.length === 0) {
    songList.innerHTML = `<div style="padding:20px;color:#777;font-size:13px;text-align:center;">No songs yet. Click <b>+ ADD</b> to add your first track!</div>`;
    return;
  }

  songs.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "song";

    const titleSpan = document.createElement("span");
    titleSpan.innerText = s.title;
    titleSpan.style.cursor = "pointer";
    titleSpan.onclick = () => loadSong(i);
    titleSpan.style.flex = "1";
    titleSpan.style.overflow = "hidden";
    titleSpan.style.textOverflow = "ellipsis";
    titleSpan.style.whiteSpace = "nowrap";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "✕";
    deleteBtn.className = "delete-btn";
    deleteBtn.title = "Delete song";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSong(s.id);
    };

    div.appendChild(titleSpan);
    div.appendChild(deleteBtn);
    songList.appendChild(div);
  });
}

function loadSong(i) {
  if (i < 0 || i >= songs.length) return;
  currentIndex = i;
  const s = songs[i];

  audio.src = s.file;
  title.innerText = s.title;
  artist.innerText = s.artist;
  cover.src = s.cover || "";
  lyricsBox.innerText = s.lyrics || "No lyrics available.";

  audio.play().catch((e) => console.log("Auto-play prevented:", e));
}

function togglePlay() {
  if (!audio.src) {
    if (songs.length > 0) loadSong(0);
    return;
  }
  if (audio.paused) audio.play();
  else audio.pause();
}

function nextSong() {
  if (currentIndex < songs.length - 1) {
    loadSong(currentIndex + 1);
  } else if (songs.length > 0) {
    loadSong(0);
  }
}

function prevSong() {
  if (currentIndex > 0) {
    loadSong(currentIndex - 1);
  } else if (songs.length > 0) {
    loadSong(songs.length - 1);
  }
}

/* Audio event listeners */
audio.addEventListener("timeupdate", () => {
  progress.max = audio.duration || 0;
  progress.value = audio.currentTime || 0;
  timeDisplay.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

audio.addEventListener("loadedmetadata", () => {
  timeDisplay.innerText = `0:00 / ${formatTime(audio.duration)}`;
});

audio.addEventListener("ended", () => {
  nextSong();
});

progress.addEventListener("input", () => {
  audio.currentTime = progress.value;
});

/* Delete Song Function */
async function deleteSong(songId) {
  if (!confirm("Are you sure you want to delete this song?")) return;

  try {
    const res = await fetch(`/api/songs?id=${encodeURIComponent(songId)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete song");
    }

    await fetchSongs();
    if (currentIndex >= songs.length) {
      currentIndex = songs.length - 1;
      if (currentIndex >= 0) loadSong(currentIndex);
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete song: " + err.message);
  }
}

/* Tab Switchers for Add Song Modal */
function setAudioSourceMode(mode) {
  currentAudioMode = mode;
  const tabUpload = document.getElementById("audioTabUpload");
  const tabUrl = document.getElementById("audioTabUrl");
  const uploadContainer = document.getElementById("audioUploadContainer");
  const urlContainer = document.getElementById("audioUrlContainer");

  if (mode === "upload") {
    tabUpload.classList.add("active");
    tabUrl.classList.remove("active");
    uploadContainer.style.display = "block";
    urlContainer.style.display = "none";
  } else {
    tabUrl.classList.add("active");
    tabUpload.classList.remove("active");
    urlContainer.style.display = "block";
    uploadContainer.style.display = "none";
  }
}

function setCoverSourceMode(mode) {
  currentCoverMode = mode;
  const tabUpload = document.getElementById("coverTabUpload");
  const tabUrl = document.getElementById("coverTabUrl");
  const uploadContainer = document.getElementById("coverUploadContainer");
  const urlContainer = document.getElementById("coverUrlContainer");

  if (mode === "upload") {
    tabUpload.classList.add("active");
    tabUrl.classList.remove("active");
    uploadContainer.style.display = "block";
    urlContainer.style.display = "none";
  } else {
    tabUrl.classList.add("active");
    tabUpload.classList.remove("active");
    urlContainer.style.display = "block";
    uploadContainer.style.display = "none";
  }
}

/* File input change handlers */
document.getElementById("newSongFile").addEventListener("change", function () {
  const label = document.getElementById("songFileLabel");
  if (this.files && this.files[0]) {
    label.innerText = "🎵 " + this.files[0].name;
  } else {
    label.innerText = "🎵 Choose MP3 File";
  }
});

document.getElementById("newSongCover").addEventListener("change", function () {
  const label = document.getElementById("coverFileLabel");
  const preview = document.getElementById("coverPreview");
  if (this.files && this.files[0]) {
    label.innerText = "🖼️ " + this.files[0].name;
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Cover preview">`;
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    label.innerText = "🖼️ Choose Image (JPG/PNG)";
    preview.innerHTML = "";
  }
});

/* URL change preview for cover */
document
  .getElementById("newSongCoverUrl")
  ?.addEventListener("input", function () {
    const preview = document.getElementById("coverPreview");
    if (this.value && this.value.startsWith("http")) {
      preview.innerHTML = `<img src="${this.value}" alt="Cover preview" onerror="this.style.display='none'">`;
    } else {
      preview.innerHTML = "";
    }
  });

/* Helper to upload file directly to Supabase Storage */
async function uploadToSupabaseStorage(bucket, file) {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client is not initialized. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set."
    );
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${Date.now()}_${cleanName}`;

  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload error (${bucket}): ${error.message}`);
  }

  const { data: urlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/* Handle Add Song Form Submission */
document
  .getElementById("addSongForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleVal = document.getElementById("newSongTitle").value.trim();
    const artistVal = document.getElementById("newSongArtist").value.trim();
    const lyricsVal = document.getElementById("newSongLyrics").value.trim();
    const submitBtn = document.getElementById("submitSongBtn");

    const songFileInput = document.getElementById("newSongFile");
    const songUrlInput = document.getElementById("newSongFileUrl");
    const coverFileInput = document.getElementById("newSongCover");
    const coverUrlInput = document.getElementById("newSongCoverUrl");

    submitBtn.disabled = true;
    submitBtn.innerText = "Uploading & Saving...";

    try {
      let finalAudioUrl = "";
      let finalCoverUrl = "";

      /* 1. Resolve Audio URL */
      if (currentAudioMode === "upload") {
        if (!songFileInput.files || !songFileInput.files[0]) {
          throw new Error("Please select an MP3 file to upload");
        }
        const file = songFileInput.files[0];

        if (supabaseClient) {
          finalAudioUrl = await uploadToSupabaseStorage("songs", file);
        } else {
          /* Fallback: If running with local Express + Multer */
          const fd = new FormData();
          fd.append("songFile", file);
          if (currentCoverMode === "upload" && coverFileInput.files[0]) {
            fd.append("coverFile", coverFileInput.files[0]);
          } else if (coverUrlInput.value) {
            fd.append("cover", coverUrlInput.value.trim());
          }
          fd.append("title", titleVal);
          fd.append("artist", artistVal);
          fd.append("lyrics", lyricsVal);

          const localRes = await fetch("/api/songs", {
            method: "POST",
            body: fd,
          });
          if (!localRes.ok) {
            const errJson = await localRes.json().catch(() => ({}));
            throw new Error(errJson.error || "Local upload failed");
          }
          await fetchSongs();
          closeAddSongModal();
          return;
        }
      } else {
        finalAudioUrl = songUrlInput.value.trim();
        if (!finalAudioUrl) {
          throw new Error("Please provide a valid audio URL");
        }
      }

      /* 2. Resolve Cover URL */
      if (currentCoverMode === "upload") {
        if (!coverFileInput.files || !coverFileInput.files[0]) {
          throw new Error("Please select a cover image (JPG/PNG)");
        }
        const file = coverFileInput.files[0];
        finalCoverUrl = await uploadToSupabaseStorage("covers", file);
      } else {
        finalCoverUrl = coverUrlInput.value.trim();
        if (!finalCoverUrl) {
          throw new Error("Please provide a valid cover image URL");
        }
      }

      /* 3. Send Song Metadata to /api/songs */
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleVal,
          artist: artistVal,
          file: finalAudioUrl,
          cover: finalCoverUrl,
          lyrics: lyricsVal,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to add song");
      }

      await fetchSongs();
      closeAddSongModal();
    } catch (err) {
      console.error("Add song error:", err);
      alert("Error: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Add Song";
    }
  });

/* Modal open/close */
function openAddSongModal() {
  const modal = document.getElementById("addSongModal");
  if (modal) modal.style.display = "block";
}

function closeAddSongModal() {
  const modal = document.getElementById("addSongModal");
  if (!modal) return;
  modal.style.display = "none";

  const form = document.getElementById("addSongForm");
  if (form) form.reset();

  setAudioSourceMode("upload");
  setCoverSourceMode("upload");
  document.getElementById("songFileLabel").innerText = "🎵 Choose MP3 File";
  document.getElementById("coverFileLabel").innerText =
    "🖼️ Choose Image (JPG/PNG)";
  document.getElementById("coverPreview").innerHTML = "";
}

window.addEventListener("click", (event) => {
  const modal = document.getElementById("addSongModal");
  if (event.target === modal) closeAddSongModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAddSongModal();
});

/* Startup */
window.addEventListener("DOMContentLoaded", async () => {
  await initSupabase();
  await fetchSongs();
});
