# AI Bookmark Organizer (Chrome Extension)

<img src="assets/promo_small_440x280.png" alt="AI Bookmark Organizer Banner" width="440">

Organize your messy bookmarks automatically using Google Gemini AI. Privacy-focused, local processing, and instant export.

<img src="assets/feature_showcase.png" alt="AI Bookmark Organizer Features - Your Digital Knowledge Hub" width="100%">

## 🚀 Features
- **One-Click Logic**: Sorts hundreds of bookmarks into smart categories (Dev, News, Shopping, etc.).
- **Privacy First**: Your bookmarks are processed in-memory and never stored on our servers.
- **Export Ready**: Save your cleaned-up bookmarks as standard HTML.

## 📥 Installation

You can install this extension manually (no Store required) by downloading the latest release.

**➡️ [Download the latest release](https://github.com/consciouspenguin/Bookmark-Organizer-Chrome-Extension/releases/latest)** — or grab the zip directly: **[bookmark-organizer-v1.0.1.zip](https://github.com/consciouspenguin/Bookmark-Organizer-Chrome-Extension/releases/download/v1.0.1/bookmark-organizer-v1.0.1.zip)**

### Method 1: Download & Install (Easiest)
1.  **Download**: Grab **[bookmark-organizer-v1.0.1.zip](https://github.com/consciouspenguin/Bookmark-Organizer-Chrome-Extension/releases/download/v1.0.1/bookmark-organizer-v1.0.1.zip)** from the [Releases page](https://github.com/consciouspenguin/Bookmark-Organizer-Chrome-Extension/releases/latest).
2.  **Unzip**: Extract the zip file to a folder on your computer.
3.  **Open Chrome Extensions**:
    - Type `chrome://extensions` in your address bar.
    - Enable **Developer mode** (top right switch).
4.  **Load**:
    - Click **Load unpacked**.
    - Select the folder inside the unzipped location (it should contain `manifest.json`).
5.  **Done!** The extension icon should appear in your toolbar.

### Method 2: Build from Source
If you are a developer and want to modify the code:
```bash
git clone https://github.com/your-username/Bookmark-Organizer-Browser-Extension.git
cd chrome_extension/frontend
npm install
npm run build
# Then load the 'dist' folder in chrome://extensions
```

## 🔒 Privacy
We do not collect data. Your API key is stored locally in your browser. Bookmarks are sent directly to the OpenRouter API for categorization and then immediately discarded.
[Read our Privacy Policy](docs/privacy.html)

## License
This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for the full text.

Copyright (C) 2026 Amado Evert
