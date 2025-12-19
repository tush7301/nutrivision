# NutriVision

NutriVision is an AI-powered nutrition tracking and coaching application. It allows users to log meals by simply taking a photo, uses computer vision to identify foods and estimate portions, and provides personalized dietary advice using LLMs.

## Features

-   **AI Food Recognition**: Automatically identifies food items from images.
-   **Portion Estimation**: Estimates portion sizes using computer vision.
-   **AI Coaching**: Individualized dietary feedback and advice based on your goals.
-   **Dashboard**: Track daily calorie intake and nutritional breakdown (Carbs, Protein, Fats).
-   **Secure Login**: Google Authentication support.
-   **Dark Mode**: Beautiful UI with full dark mode support.

## Tech Stack

### Frontend
-   **React** (Vite)
-   **TailwindCSS** for styling
-   **Lucide React** for icons
-   **Axios** for API communication

### Backend
-   **FastAPI** (Python)
-   **SQLAlchemy** (SQLite database)
-   **Pydantic** for validation
-   **Google OAuth2** for authentication
-   **PyTorch/Torchvision** (for AI models)

## Setup & Installation

### Prerequisites
-   Node.js & npm
-   Python 3.10+
-   Pip & Virtualenv

### 1. Clone the Repository
```bash
git clone https://github.com/tush7301/nutrivision.git
cd nutrivision
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with the following:
```ini
# backend/.env
DATABASE_URL=sqlite:///./nutrivision.db
SECRET_KEY=your_secret_key_here
# Google Auth
vite_google_client_id=YOUR_GOOGLE_CLIENT_ID
# Optional External APIs
USDA_API_KEY=your_usda_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

Run the backend server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in `frontend/` with the following:
```ini
# frontend/.env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

Run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Usage
1.  Open the frontend in your browser.
2.  Log in with your Google account.
3.  Upload a meal photo to get started!

## License
[MIT](LICENSE)
