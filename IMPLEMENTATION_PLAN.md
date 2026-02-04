# Chrome Extension Implementation Plan

## Goal
Port the Bookmark Organizer application to a pure client-side Chrome Extension (Manifest V3).

## Architecture
- **Frontend**: The existing React/Vite application will be adapted to run as the Extension Popup and/or Options Page.
- **Backend removal**: The Python backend (`backend/`) will be removed. Its logic will be ported to client-side JavaScript/TypeScript using the `chrome.bookmarks` API and direct fetch calls to the LLM provider.
- **Permissions**: `bookmarks` permission is required.

## Steps

### 1. Cleanup
- Delete `backend/` directory.
- Delete `docker-compose.yml`, `Dockerfile`, `nginx.conf`.
- In `frontend/`, remove any API calls to `localhost:5000` and replace with internal service calls.

### 2. Manifest V3 setup
- Create `manifest.json` in `frontend/public/` (or `frontend/` depending on build config).
```json
{
  "manifest_version": 3,
  "name": "AI Bookmark Organizer",
  "version": "1.0.0",
  "permissions": ["bookmarks", "storage"],
  "action": {
    "default_popup": "index.html"
  },
  "background": {
    "service_worker": "service-worker.js"
  }
}
```

### 3. Porting Logic (Python -> JS)
- **Reading Bookmarks**: Replace `parse_raw_bookmarks` (HTML parsing) with `chrome.bookmarks.getTree()`.
    - This gives a hierarchical JSON structure directly, avoiding the need for BeautifulSoup.
- **Classification**: Port `classify_batch` to a JS function in `src/services/ai.js`.
    - Use `fetch` to call OpenRouter/OpenAI API directly.
    - **Security Note**: The API Key must be stored in `chrome.storage.local` (prompt user for it in the UI), NOT hardcoded.
- **Writing**: Replace `generate_html` with `chrome.bookmarks.create` or `chrome.bookmarks.move`.
    - **Mode 1**: "Simulate" - just generate a proposed JSON/HTML.
    - **Mode 2**: "Apply" - Actual modifications.
    - **Recommended**: Create a new folder "AI Organized" and populate it to avoid destroying user data.

### 4. UI Adaptation
- Resize the UI to fit a Popup (width ~600px, height ~800px) or run as a full tab.
- Add an "Settings" screen for the User to input their API Key.
- Replace file upload inputs with a "Load from Browser" button.

### 5. Build System
- Update `vite.config.js` to build for an extension (ensure `index.html` uses relative paths `base: './'`).
- Ensure the output directory is loadable as an unpacked extension.

## Verification
- Load unpacked extension in `chrome://extensions`.
- Test reading bookmarks (ensure permissions are granted).
- Test API calls (CORS should work from background/popup in extensions usually, or might need host permissions for the specific API endpoint).
