<div align="center">
  <h1>🎬 yt-dockerWloader</h1>
  <p>
    <strong>A powerful, self-hosted, and containerized web interface for yt-dlp.</strong>
  </p>
  <p>
    <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-blue.svg" />
    <img alt="Framework" src="https://img.shields.io/badge/Framework-Flask-lightgrey.svg" />
    <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED.svg" />
    <img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg" />
  </p>
</div>

---

**yt-dockerWloader** is a modern Flask-based Web UI for managing your downloads using `yt-dlp`. Fully containerized with Docker, it provides a clean, isolated environment to download media from YouTube and thousands of other websites without needing to install FFmpeg or Python on your host machine.

---

## ✨ Key Features

### 📥 Download Capabilities
- **Automatic Content Type Detection:** The system automatically identifies if the provided URL points to a single video or a playlist, dynamically displaying relevant UI elements (such as Range Selection for playlists) and tailoring the download experience.
- **Multilingual Downloads with Combinatorial Fallback:** Select up to 5 different audio tracks (e.g., Italian, English, German, Spanish, Danish). The system dynamically generates decreasing combinations of requested streams to prevent download failures. If a video in a playlist lacks some of the selected languages, it won't crash; instead, it automatically downloads the best available subset!
- **Playlist Monitoring & Auto-download:** Periodically monitors YouTube playlists or channels to automatically download new videos. Features automatic URL normalization to prevent duplicates and allows direct editing of each monitored playlist's preferences (languages, folder, audio/video options, interval) through a dedicated modal.
- **Robust Subtitle Error Tolerance:** Enhanced subtitle handling with built-in error tolerance. If a subtitle is missing or fails (e.g., due to `HTTP 429` rate limiting), the app skips the error and successfully completes the download of the video and all audio streams.

### 🎨 Modern Interface & Design
- **Dynamic Dark/Light Mode:** Toggle between Dark and Light mode instantly using the sun/moon button directly on the homepage. Includes smooth transitions and theme state persistence (saved in `localStorage`).
- **Premium UI/UX:** Responsive, clean, and modern layout with custom HSL-based colors for high contrast and accessibility, hover micro-animations, and customized pointer feedback.
- **Multilingual UI Support:** The interface is fully translated into **English** and **Italian**. You can swap the interface language dynamically from the settings panel.

### ⚙️ Settings, Presets & Folders
- **Control & Update Container Dependencies:** Check for outdated container-level dependencies (system packages and Python pip libraries such as `yt-dlp` from PyPI) and upgrade them directly from the UI settings.
- **Favorite Download Folders:** Configure and manage multiple favorite folders (add, edit, delete) in the settings panel. Easily select the target folder from a dropdown menu on the homepage before starting a download.
- **Customizable Presets:** Save and apply your favorite configurations (e.g., `Only MP3`, `MP4 1080p`) for quick one-click downloads.
- **Software Info & Interactive Changelog:** Access detailed software metadata directly from settings, featuring version logs, author information, and an interactive release changelog.
- **Debug Logging Toggle:** Enable detailed logging via the UI to easily diagnose backend or `yt-dlp` issues directly from the container logs.

### 📊 Logs & History
- **Raw CLI Command Visualizer:** Inspect the exact `yt-dlp` CLI command executed by the backend. Clicking the info icon next to "Download Log" shows the exact arguments used, with a one-click button to copy the command to your clipboard.
- **Real-Time Streamed Logging:** Unbuffered log updates. The Python backend streams output from `yt-dlp` instantly to the frontend web browser, ensuring immediate visual feedback.
- **Persistent Download History:** Download logs are saved as a JSON file in the `/app/logs` directory and automatically reloaded on server startup. History entries display thumbnails, download metadata (labeled as `Playlist`, `Video`, or `Audio`), execution details, and CLI arguments.
- **Safe History Cleaning:** Delete individual logs or clear the entire history with one click. Deleting history records **never** deletes the actual downloaded files from the disk, keeping your media safe.
- **Admin API:** Query endpoints like `/admin/status`, `/admin/downloads`, `/admin/stop-all`, or `/admin/health` via terminal to monitor system health, active downloads, and scheduled playlists.

---

## 🏗️ Architecture

The application is built around a lightweight, efficient client-server model:
1. **Frontend (Client):** A Single-Page Application (SPA) designed with HTML5, vanilla CSS3 (utilizing the Inter font), and jQuery, communicating with the backend via AJAX.
2. **Backend (Server):** A Python/Flask application served by **Gunicorn** WSGI in production. It processes configurations (URLs, resolutions, formats, folders), manages concurrent `yt-dlp` processes in separate threads, and exposes Admin APIs.
3. **Core (yt-dlp + FFmpeg):** `yt-dlp` executes downloads in the background, while FFmpeg merges video and multiple audio streams, embeds subtitles (dynamically converted to `.srt`), and writes metadata.

---

## 🚀 Installation & Setup

You can run `yt-dockerWloader` using Docker Compose or manually with Docker Run.

### Prerequisites
- **Docker** installed.
- **Docker Compose** (recommended).

### Method 1: Docker Compose (Recommended)
Create a `docker-compose.yml` file in your preferred directory:

```yaml
version: '3.8'

services:
  yt-downloader:
    build: .
    # Or pull from the Gitea container registry:
    # image: git.matterver.dpdns.org/mattia/yt-dockerwloader:latest
    container_name: yt-downloader
    ports:
      - "5000:5000"
    volumes:
      - /path/to/downloads:/downloads
      - ./settings.json:/app/settings.json # Recommended: persists presets and favorite folder settings
      - ./logs:/app/logs # Recommended: persists download history across container restarts
    restart: unless-stopped
```

Start the container in detached mode:
```bash
docker-compose up -d
```

### Method 2: Docker Run (Manual)
Clone the repository and build the image:

```bash
git clone https://git.matterver.dpdns.org/Mattia/yt-dockerwloader.git
cd yt-dockerwloader
docker build -t yt-dockerwloader .

docker run -d \
  -p 5000:5000 \
  -v /path/to/downloads:/downloads \
  --name yt-downloader \
  --restart unless-stopped \
  yt-dockerwloader
```
*(Make sure to replace `/path/to/downloads` with the actual path on your host machine where you want to store downloaded files).*

---

## 📖 Quick Start Guide

1. **Access the Web UI:** Open your browser and navigate to `http://YOUR_SERVER_IP:5000`.
2. **Setup Download Folders:** Open **Settings** (top right) and configure your favorite target download paths. They must align with the mounted directories inside your container (default is `/downloads`).
3. **Download Content:**
   - Paste the URL of a video or a playlist.
   - Choose a target download folder from your favorites.
   - Choose a **Preset** or click **⚙️ Show Advanced** to manually select audio languages, formats, and subtitles.
   - If using advanced mode, click the 🔄 load button to fetch available audio tracks and subtitles directly from YouTube.
   - Click **Download**.
4. **Monitor Progress:** The Log panel will slide open automatically.
   - Click the `ℹ️ Info` icon beside the log header to view the running `yt-dlp` CLI command.
   - Once completed, the final merged file (MKV/MP4/MP3) will be saved in your destination folder.

---

## 🤝 Contributing
Contributions are always welcome! Feel free to open an **Issue** if you encounter bugs or want to suggest new features, or submit a **Pull Request** with your enhancements.

## 📝 License
This project is open-source and released under the **GPL-3.0 license**. See the `LICENSE` file for details.

<div align="center">
  <p><i>Simplifying self-hosted media downloads.</i></p>
</div>