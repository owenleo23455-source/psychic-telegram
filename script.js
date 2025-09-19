const API_KEY = "AIzaSyCtdW_fmZano2-ymc4lmTchKcKV9o6WHoA";

// DOM Elements
const trailerList = document.getElementById("trailer-list");
const trendingList = document.getElementById("trending-list");
const rankingList = document.getElementById("ranking-list");
const moviesList = document.getElementById("movies-list");
const videoModal = document.getElementById("videoModal");
const videoFrame = document.getElementById("videoFrame");

const ONE_DAY = 24 * 60 * 60 * 1000; // 24h cache
let currentCategory = "all";

// On page load
document.addEventListener("DOMContentLoaded", () => {
  fetchTrailers("latest movie trailers 2025");
  fetchWithCache("trending", fetchTrending, trendingList);
  fetchWithCache("ranking", () => fetchMostViewed("official movie trailer"), rankingList);
  fetchFullMovies();
});

// ---------------- Skeleton loader ----------------
function showSkeleton(container) {
  container.innerHTML = "";
  for(let i=0;i<12;i++){
    const div = document.createElement("div");
    div.className = "skeleton";
    container.appendChild(div);
  }
}

// ---------------- Fetch Trailers ----------------
async function fetchTrailers(query) {
  showSkeleton(trailerList);
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${API_KEY}`
    );
    const data = await res.json();
    displayVideos(data.items, trailerList);
  } catch (error) {
    trailerList.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// ---------------- Trending Trailers ----------------
async function fetchTrending() {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&videoCategoryId=1&maxResults=12&key=${API_KEY}`
  );
  const data = await res.json();
  return data.items;
}

// ---------------- Most Viewed ----------------
async function fetchMostViewed(query) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=12&key=${API_KEY}`
  );
  const data = await res.json();
  return data.items;
}

// ---------------- Full Movies ----------------
async function fetchFullMovies(query="full movie 2025") {
  showSkeleton(moviesList);
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${API_KEY}`
    );
    const data = await res.json();
    displayVideos(data.items, moviesList);
  } catch (error) {
    moviesList.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// ---------------- Cache with 24h expiry ----------------
async function fetchWithCache(key, fetchFunc, container) {
  const cached = localStorage.getItem(key);
  const cachedTime = localStorage.getItem(key + "_time");

  if (cached && cachedTime && Date.now() - cachedTime < ONE_DAY) {
    displayVideos(JSON.parse(cached), container);
  } else {
    showSkeleton(container);
    try {
      const items = await fetchFunc();
      displayVideos(items, container);
      localStorage.setItem(key, JSON.stringify(items));
      localStorage.setItem(key + "_time", Date.now());
    } catch (error) {
      container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  }
}

// ---------------- Display Videos ----------------
function displayVideos(videos, container) {
  if (!videos || videos.length === 0) {
    container.innerHTML = "<p>No videos found.</p>";
    return;
  }
  container.innerHTML = "";
  videos.forEach((item) => {
    const videoId = item.id.videoId || item.id;
    const title = item.snippet.title;
    const thumbnail = item.snippet.thumbnails.high.url;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<img src="${thumbnail}" alt="${title}"><h3>${title}</h3>`;
    card.addEventListener("click", () => openModal(videoId));
    container.appendChild(card);
  });
}

// ---------------- Search ----------------
function searchTrailers() {
  const query = document.getElementById("searchInput").value;
  if (query.trim() !== "") {
    fetchTrailers(query + " trailer");
    fetchFullMovies(query + " full movie");
  }
}

// ---------------- Category filter ----------------
function filterCategory(category) {
  currentCategory = category;
  const trailerQuery = category === "all" ? "latest movie trailers 2025" : category + " movie trailers 2025";
  const movieQuery = category === "all" ? "full movie 2025" : category + " full movie 2025";
  fetchTrailers(trailerQuery);
  fetchFullMovies(movieQuery);
}

// ---------------- Modal / Play Video ----------------
async function openModal(videoId) {
  videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&cc_load_policy=1`;
  videoModal.style.display = "flex";

  // Fetch video details
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`);
  const data = await res.json();
  const video = data.items[0];

  document.getElementById("modalTitle").innerText = video.snippet.title;
  document.getElementById("modalChannel").innerText = "Channel: " + video.snippet.channelTitle;
  document.getElementById("modalViews").innerText = "Views: " + video.statistics.viewCount;
  document.getElementById("modalDate").innerText = "Published: " + new Date(video.snippet.publishedAt).toDateString();
}

// ---------------- Close Modal ----------------
function closeModal() {
  videoFrame.src = "";
  videoModal.style.display = "none";
}

// Close modal on outside click
window.addEventListener("click", (e) => {
  if (e.target === videoModal) closeModal();
});

// Close modal with ESC key
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
