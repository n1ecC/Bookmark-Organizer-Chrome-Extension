# Bookmark Organizer Web App

A powerful web application to organize your massive collection of bookmarks using AI.

## Features
- **Smart Categorization**: Uses AI (Gemini/OpenAI) to categorize bookmarks.
- **Progress Tracking**: Real-time progress updates via Server-Sent Events (SSE).
- **Modern UI**: React-based frontend with a responsive design.
- **REST API**: FastAPI backend for robust processing.

## Project Structure
- `frontend/`: React + Vite application
- `backend/`: FastAPI application
- `results/`: Output directory for organized bookmarks

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 1. Backend Setup
Navigate to the root directory.

1. **Install Dependencies**
   ```bash
   python3 -m pip install -r requirements.txt
   ```

2. **Environment Variables**
   Ensure your `.env` file contains your API keys:
   ```
   OPENROUTER_API_KEY=your_key_here
   # or
   GEMINI_API_KEY=your_key_here
   ```

3. **Start the Server**
   ```bash
   uvicorn backend.app:app --reload
   ```
   The API will start at `http://localhost:8000`.

### 2. Frontend Setup
Open a new terminal.

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## 🐳 Deployment (Docker)

You can run the entire stack using Docker Compose.

1. **Build and Run**
   ```bash
   docker-compose up --build
   ```

2. **Access the App**
   - Frontend: `http://localhost:80` (or configured port)
   - Backend: `http://localhost:8000`

## API Documentation
Once the backend is running, visit `http://localhost:8000/docs` for the interactive Swagger documentation.
