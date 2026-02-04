# How to Test the Chrome Extension

## Prerequisites
1.  **Build the Project**:
    - Ensure you have Node.js installed.
    - Run the build command in the `frontend` directory:
      ```bash
      cd chrome_extension/frontend
      npm run build
      ```
    - This creates a `dist` folder containing the compiled extension.

## Loading the Extension in Chrome
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Toggle **Developer mode** in the top-right corner.
3.  Click **Load unpacked** (top-left).
4.  Select the `chrome_extension/frontend/dist` folder.
    - **Note**: Do not select the `public` or `src` folder; it must be `dist`.

## Verification Steps

### 1. Functional Testing
- **Popup**: Click the extension icon. Verify usage of the API Key and "Organize" button.
- **Organization**: Upload a bookmarks HTML file or use browser bookmarks (if permissions allow).
- **Chat**: (If applicable) Test the chat interface.

### 2. Security Testing (Manual)
- **CSP Check**:
    - Inspect the extension popup (Right-click -> Inspect).
    - Go to the **Console** tab.
    - Verify there are no "Content Security Policy" errors.
    - Try to execute `eval('alert(1)')` in the console. It **should fail** if CSP is active.

### 3. Automated Tests
- This project includes a Vitest suite for logic and security checks.
- Run tests via terminal:
  ```bash
  cd chrome_extension/frontend
  npm test
  ```
