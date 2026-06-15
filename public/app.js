// ─── State ───
let allSongs = [];
let currentIndex = -1;
let isShuffled = false;
let offset = 0;
const LIMIT = 20;
let total = 0;
let isLoading = false;
let searchQuery = "";

// ─── Sections ───
function showSection(name) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.add("hidden"));
  document.getElementById(name).classList.remove("hidden");
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  event.target.classList.add("active");
  if (name === "library") loadSongs(true);
}

// ─── Load Songs (paginated) ───
async function loadSongs(reset = false) {
  if (isLoading) return;
  if (!reset && allSongs.length >= total && total !== 0) return;

  if (reset) {
    offset = 0;
    allSongs = [];
    document.getElementById("song-list").innerHTML = "";
  }

  isLoading = true;

  const res = await fetch(
    `/api/songs?offset=${offset}&search=${encodeURIComponent(searchQuery)}`,
  );
  const data = await res.json();

  total = data.total;
  allSongs = reset ? data.songs : [...allSongs, ...data.songs];
  offset += data.songs.length;

  renderSongs(data.songs, reset);
  toggleLoadMoreBtn();
  isLoading = false;
}

// ─── Render Songs ───
function renderSongs(songs, reset = false) {
  const list = document.getElementById("song-list");

  if (reset && songs.length === 0) {
    list.innerHTML = '<p class="empty-msg">No songs found.</p>';
    return;
  }

  const html = songs
    .map(
      (song) => `
    <div class="song-item" id="song-${song.id}" data-url="${escapeHtml(song.file_url)}" data-title="${escapeHtml(song.title)}" data-artist="${escapeHtml(song.artist || '')}" data-id="${song.id}" onclick="playSongFromEl(this)">
      <div class="song-info">
        <div class="song-title">${escapeHtml(song.title)}</div>
        <div class="song-artist">${escapeHtml(song.artist) || "Unknown Artist"}</div>
      </div>
      <button class="delete-btn" onclick="deleteSong(event, ${song.id})">🗑️</button>
    </div>
  `,
    )
    .join("");

  list.insertAdjacentHTML("beforeend", html);
}

// ─── Load More Button ───
function toggleLoadMoreBtn() {
  let btn = document.getElementById("load-more-btn");
  if (allSongs.length < total) {
    if (!btn) {
      const list = document.getElementById("song-list");
      list.insertAdjacentHTML(
        "afterend",
        `
        <button id="load-more-btn" onclick="loadSongs()" class="load-more-btn">Load More</button>
      `,
      );
    }
  } else {
    if (btn) btn.remove();
  }
}

// ─── Search ───
let searchTimeout;
function filterSongs() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = document.getElementById("search-bar").value.trim();
    loadSongs(true);
  }, 300);
}

// ─── Play Song ───
function playSong(url, title, artist, id) {
  const audio = document.getElementById("audio-player");
  audio.src = url;
  audio.play();
  document.getElementById("player-title").textContent = title;
  document.getElementById("player-artist").textContent = artist;

  document
    .querySelectorAll(".song-item")
    .forEach((s) => s.classList.remove("playing"));
  const el = document.getElementById(`song-${id}`);
  if (el) el.classList.add("playing");

  currentIndex = allSongs.findIndex((s) => s.id === id);
  updateMediaSession(title, artist);
}

// ─── Next / Previous ───
async function playNext() {
  let nextIndex;
  if (isShuffled) {
    // Load a random song from total pool, not just loaded ones
    const randomOffset = Math.floor(Math.random() * total);
    const res = await fetch(`/api/songs?offset=${randomOffset}&search=`);
    const data = await res.json();
    if (data.songs.length > 0) {
      const song = data.songs[0];
      // Add to allSongs if not already there
      if (!allSongs.find((s) => s.id === song.id)) {
        allSongs.push(song);
      }
      playSong(song.file_url, song.title, song.artist || "", song.id);
    }
    return;
  }

  nextIndex = currentIndex + 1;

  // If we're near the end of loaded songs, load more
  if (nextIndex >= allSongs.length && allSongs.length < total) {
    await loadSongs();
  }

  if (nextIndex >= allSongs.length) nextIndex = 0;
  const next = allSongs[nextIndex];
  if (next) playSong(next.file_url, next.title, next.artist || "", next.id);
}

function playPrevious() {
  const audio = document.getElementById("audio-player");
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let prevIndex = currentIndex - 1;
  if (prevIndex < 0) prevIndex = allSongs.length - 1;
  const prev = allSongs[prevIndex];
  if (prev) playSong(prev.file_url, prev.title, prev.artist || "", prev.id);
}

// ─── Auto play next when song ends ───
// Auto play next when song ends - more reliable for mobile
document.getElementById('audio-player').addEventListener('ended', () => {
  playNext();
});

document.getElementById('audio-player').addEventListener('timeupdate', () => {
  const audio = document.getElementById('audio-player');
  if (audio.duration && audio.currentTime > 0) {
    const remaining = audio.duration - audio.currentTime;
    if (remaining < 0.5 && !audio._nextQueued) {
      audio._nextQueued = true;
      setTimeout(() => {
        playNext();
        audio._nextQueued = false;
      }, 300);
    }
  }
});

// ─── Shuffle ───
function toggleShuffle() {
  isShuffled = !isShuffled;
  const btn = document.getElementById("shuffle-btn");
  if (isShuffled) {
    btn.classList.add("active");
    btn.title = "Shuffle: ON";
  } else {
    btn.classList.remove("active");
    btn.title = "Shuffle: OFF";
  }
}

// ─── Upload ───
async function uploadSong() {
  const title = document.getElementById("title").value.trim();
  const artist = document.getElementById("artist").value.trim();
  const album = document.getElementById("album").value.trim();
  const genre = document.getElementById("genre").value.trim();
  const file = document.getElementById("song-file").files[0];
  const status = document.getElementById("upload-status");
  const button = document.querySelector(".upload-form button");

  if (!title) {
    status.textContent = "Title is required!";
    return;
  }
  if (!file) {
    status.textContent = "Please select a file!";
    return;
  }

  button.disabled = true;
  button.textContent = "Uploading...";

  status.innerHTML = `
    <div class="progress-container">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
    <span id="progress-text">0%</span>
  `;

  const formData = new FormData();
  formData.append("title", title);
  formData.append("artist", artist);
  formData.append("album", album);
  formData.append("genre", genre);
  formData.append("song", file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      document.getElementById("progress-bar").style.width = percent + "%";
      document.getElementById("progress-text").textContent = percent + "%";
    }
  });

  xhr.addEventListener("load", () => {
    const data = JSON.parse(xhr.responseText);
    if (xhr.status === 201) {
      status.innerHTML = "✅ Uploaded successfully!";
      document.getElementById("title").value = "";
      document.getElementById("artist").value = "";
      document.getElementById("album").value = "";
      document.getElementById("genre").value = "";
      document.getElementById("song-file").value = "";
    } else {
      status.innerHTML = "❌ Upload failed: " + data.error;
    }
    button.disabled = false;
    button.textContent = "Upload";
  });

  xhr.addEventListener("error", () => {
    status.innerHTML = "❌ Upload failed. Check your connection.";
    button.disabled = false;
    button.textContent = "Upload";
  });

  xhr.open("POST", "/api/songs/upload");
  xhr.send(formData);
}

// ─── Delete ───
async function deleteSong(event, id) {
  event.stopPropagation();
  if (!confirm("Delete this song?")) return;
  const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
  if (res.ok) {
    allSongs = allSongs.filter((s) => s.id !== id);
    total--;
    document.getElementById(`song-${id}`)?.remove();
    toggleLoadMoreBtn();
  }
}

// ─── Media Session ───
function updateMediaSession(title, artist) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artist || 'Unknown Artist',
      album: 'My Music App',
    });

    navigator.mediaSession.setActionHandler('play', () => {
      document.getElementById('audio-player').play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      document.getElementById('audio-player').pause();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('stop', () => {
      document.getElementById('audio-player').pause();
    });
  }
}

// Keep media session position updated so phone knows song progress
function startPositionTracking() {
  const audio = document.getElementById('audio-player');
  setInterval(() => {
    if (!audio.paused && !audio.ended && audio.duration && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch (e) {}
    }
  }, 1000);
}

// ─── Spacebar ───
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    const active = document.activeElement;
    const isTyping =
      active.tagName === "INPUT" || active.tagName === "TEXTAREA";
    if (isTyping) return;
    e.preventDefault();
    const audio = document.getElementById("audio-player");
    if (audio.paused) audio.play();
    else audio.pause();
  }
});

// ─── Service Worker ───
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service Worker registered ✅"))
      .catch((err) => console.log("SW error:", err));
  });
}

// ─── Init ───
loadSongs(true);
startPositionTracking();

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function playSongFromEl(el) {
  const url = el.dataset.url;
  const title = el.dataset.title;
  const artist = el.dataset.artist;
  const id = parseInt(el.dataset.id);
  playSong(url, title, artist, id);
}