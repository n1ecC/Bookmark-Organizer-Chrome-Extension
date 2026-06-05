# How to Test the Chrome Extension

## Prerequisites
1.  **Build the Project**:
    - Ensure you have Node.js and npm installed.
    - Run the build command in the `frontend` directory:
      ```bash
      cd frontend
      npm install
      npm run build
      ```
    - This creates a `dist` folder containing the compiled extension assets.

## Loading the Extension in Chrome
1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Toggle **Developer mode** in the top-right corner.
3.  Click the **Load unpacked** button (top-left).
4.  Select the `frontend/dist` folder in the project directory.
    - **Note**: Do not select the `public` or `src` folder; it must be the `dist` folder.

## Verification Steps

### 1. Functional Testing
- **Extension Popup**: Click the extension icon in the toolbar. Verify that the UI opens correctly and displays the updated text: *Powered by Google Gemini 3.5 Flash via OpenRouter*.
- **API Key Configuration**: Enter your OpenRouter API key. Verify that it is saved locally (it will stay populated when you close and reopen the extension).
- **Organization Options**:
  - **Browser Mode**: Without uploading a file, click the **Organize My Bookmarks** button. Verify that it scans your local browser bookmarks, organizes them, and places them under a new "AI Organized Bookmarks-[Date]" folder structure.
  - **File Mode**: Drag and drop a bookmarks HTML file (or browse to select one), and click **Organize File & Download**. Verify that a newly organized bookmarks file download is initiated.

### 2. Developer Console & Security Checks
- **Console Errors**:
    - Right-click inside the extension popup and choose **Inspect** to open the developer tools.
    - Navigate to the **Console** tab.
    - Run the organization process and verify that there are no JavaScript or Content Security Policy (CSP) errors.
    - Try to execute `eval('alert(1)')` in the console. It **should fail** if the extension's default CSP is active.
