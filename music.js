const audio = document.getElementById("audio");
const songList = document.getElementById("songList");
const title = document.getElementById("songTitle");
const artist = document.getElementById("artistName");
const cover = document.getElementById("coverImage");
const lyricsBox = document.getElementById("lyricsBox");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time");
const volumeSlider = document.getElementById("volumeSlider");
const supabaseBanner = document.getElementById("supabaseBanner");

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

/* Initialize Supabase: Checks server /api/config, then falls back to localStorage */
async function initSupabase() {
  let url = localStorage.getItem("audio_supabase_url") || "";
  let key = localStorage.getItem("audio_supabase_key") || "";

  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const config = await res.json();
      if (config.hasAnonKey && config.supabaseAnonKey) {
        url = config.supabaseUrl;
        key = config.supabaseAnonKey;
      } else if (!url && config.supabaseUrl) {
        url = config.supabaseUrl;
      }
    }
  } catch (err) {
    console.warn("Could not load /api/config:", err.message);
  }

  // Pre-fill modal fields
  const urlInput = document.getElementById("settingsSupabaseUrl");
  const keyInput = document.getElementById("settingsSupabaseKey");
  if (urlInput && url) urlInput.value = url;
  if (keyInput && key) keyInput.value = key;

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      console.log("Supabase client initialized successfully");
      if (supabaseBanner) supabaseBanner.style.display = "none";
      return true;
    } catch (e) {
      console.error("Error creating Supabase client:", e);
    }
  }

  // If credentials are still missing, show banner
  if (supabaseBanner) {
    supabaseBanner.style.display = "flex";
  }
  return false;
}

/* Supabase Modal Controls */
function openSupabaseModal() {
  const modal = document.getElementById("supabaseSettingsModal");
  if (modal) modal.style.display = "block";
}

function closeSupabaseModal() {
  const modal = document.getElementById("supabaseSettingsModal");
  if (modal) modal.style.display = "none";
}

async function saveSupabaseSettings(e) {
  e.preventDefault();
  const url = document.getElementById("settingsSupabaseUrl").value.trim();
  const key = document.getElementById("settingsSupabaseKey").value.trim();

  if (!url || !key) {
    alert("Please enter both Supabase URL and Anon Key.");
    return;
  }

  localStorage.setItem("audio_supabase_url", url);
  localStorage.setItem("audio_supabase_key", key);

  try {
    supabaseClient = window.supabase.createClient(url, key);
    if (supabaseBanner) supabaseBanner.style.display = "none";
    closeSupabaseModal();
    alert("✅ Supabase credentials saved! Fetching your songs...");
    await fetchSongs();
  } catch (err) {
    alert("Error connecting with these credentials: " + err.message);
  }
}

function clearSupabaseSettings() {
  localStorage.removeItem("audio_supabase_url");
  localStorage.removeItem("audio_supabase_key");
  document.getElementById("settingsSupabaseKey").value = "";
  supabaseClient = null;
  if (supabaseBanner) supabaseBanner.style.display = "flex";
  closeSupabaseModal();
  fetchSongs();
}

/* Fetch songs from backend or directly from Supabase */
async function fetchSongs() {
  try {
    const r = await fetch("/api/songs");
    if (r.ok) {
      songs = await r.json();
      if (Array.isArray(songs) && songs.length > 0) {
        renderSongs();
        return;
      }
    }
  } catch (err) {
    console.warn("Server API fetch error:", err.message);
  }

  // Client-side fallback if Supabase client is initialized
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("songs")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data) {
        songs = data;
        renderSongs();
        return;
      }
    } catch (e) {
      console.warn("Direct Supabase select error:", e.message);
    }
  }

  renderSongs();
}

function renderSongs() {
  songList.innerHTML = "";
  if (!songs || songs.length === 0) {
    songList.innerHTML = `
      <div style="padding:25px 15px;color:#888;font-size:13px;text-align:center;line-height:1.6;">
        No songs found yet.<br>Click <b>+ ADD</b> to add your first track!
      </div>`;
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

    if (res.ok) {
      await fetchSongs();
      return;
    }
  } catch (e) {}

  // Fallback direct delete via Supabase client
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("songs").delete().eq("id", songId);
      if (!error) {
        await fetchSongs();
        return;
      }
    } catch (e) {}
  }

  alert("Failed to delete song. Check your Supabase permissions.");
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
document.getElementById("newSongFile")?.addEventListener("change", function () {
  const label = document.getElementById("songFileLabel");
  if (this.files && this.files[0]) {
    label.innerText = "🎵 " + this.files[0].name;
  } else {
    label.innerText = "🎵 Choose MP3 File";
  }
});

document.getElementById("newSongCover")?.addEventListener("change", function () {
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
      "Supabase is not connected. Click ⚙️ Config in the sidebar to add your Supabase credentials, or add them in Vercel settings."
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
    throw new Error(`Storage upload failed (${bucket}): ${error.message}. Make sure the '${bucket}' bucket exists and has public policies in Supabase.`);
  }

  const { data: urlData } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/* Handle Add Song Form Submission */
document
  .getElementById("addSongForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleVal = document.getElementById("newSongTitle").value.trim();
    const artistVal = document.getElementById("newSongArtist").value.trim();
    const lyricsVal = document.getElementById("newSongLyrics").value.trim();
    const submitBtn = document.getElementById("submitSongBtn");

    const songFileInput = document.getElementById("newSongFile");
    const songUrlInput = document.getElementById("newSongFileUrl");
    const coverFileInput = document.getElementById("newSongCover");
    const coverUrlInput = document.getElementById("newSongCoverUrl");

    // Check credentials if not running local express
    if (!supabaseClient) {
      const needConfig = confirm(
        "⚠️ Supabase is not connected yet!\n\nWould you like to open the configuration modal to paste your Supabase URL & Anon Key?"
      );
      if (needConfig) {
        openSupabaseModal();
      }
      return;
    }

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
        finalAudioUrl = await uploadToSupabaseStorage("songs", songFileInput.files[0]);
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
        finalCoverUrl = await uploadToSupabaseStorage("covers", coverFileInput.files[0]);
      } else {
        finalCoverUrl = coverUrlInput.value.trim();
        if (!finalCoverUrl) {
          throw new Error("Please provide a valid cover image URL");
        }
      }

      /* 3. Save Song Metadata */
      const songPayload = {
        title: titleVal,
        artist: artistVal,
        file: finalAudioUrl,
        cover: finalCoverUrl,
        lyrics: lyricsVal,
      };

      // Try server API first
      let saved = false;
      try {
        const res = await fetch("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(songPayload),
        });
        if (res.ok) saved = true;
      } catch (e) {}

      // Fallback: direct Supabase insertion
      if (!saved && supabaseClient) {
        const { error } = await supabaseClient.from("songs").insert([songPayload]);
        if (error) throw new Error("Supabase insert error: " + error.message);
        saved = true;
      }

      if (!saved) {
        throw new Error("Could not save song. Please check your Supabase credentials.");
      }

      await fetchSongs();
      closeAddSongModal();
      alert("🎉 Song added successfully!");
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
  const songLabel = document.getElementById("songFileLabel");
  const coverLabel = document.getElementById("coverFileLabel");
  const preview = document.getElementById("coverPreview");

  if (songLabel) songLabel.innerText = "🎵 Choose MP3 File";
  if (coverLabel) coverLabel.innerText = "🖼️ Choose Image (JPG/PNG)";
  if (preview) preview.innerHTML = "";
}

window.addEventListener("click", (event) => {
  const addModal = document.getElementById("addSongModal");
  const settingsModal = document.getElementById("supabaseSettingsModal");
  if (event.target === addModal) closeAddSongModal();
  if (event.target === settingsModal) closeSupabaseModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAddSongModal();
    closeSupabaseModal();
  }
});

/* Startup */
window.addEventListener("DOMContentLoaded", async () => {
  await initSupabase();
  await fetchSongs();
});
