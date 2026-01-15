# NutriVision

NutriVision is an AI-powered nutrition tracking and coaching application. It allows users to log meals by simply taking a photo, uses computer vision to identify foods and estimate portions, and provides personalized dietary advice using LLMs.

## Product Demo

https://drive.google.com/file/d/1clqk7BT0UD8etuuMKouYUpWvHsNasAZ3/view 

## Key Features & Architecture

1. Developed a production-ready vision–language AI system that transforms food images into nutritional insights and personalized recommendations, removing the need for manual food logging.

2. Designed a cascaded computer vision pipeline comprising a binary CNN gatekeeper (ResNet-18) and a multi-class food classifier (ResNet-50) trained on Food-101 (101K images), achieving 88% Top-3 accuracy with 100% food-image recall.

3. Applied image preprocessing, transfer learning, and data augmentation techniques to improve robustness across diverse lighting conditions, viewing angles, and regional cuisines.

4. Implemented a FastAPI backend with asynchronous inference, orchestrating image uploads, model inference, and external API calls to support low-latency, scalable serving.

5. Integrated an LLM-based reasoning and coaching layer to combine vision outputs, user goals, and nutrition data into context-aware dietary guidance across 8+ languages.

6. Built a React + TailwindCSS frontend with Google OAuth authentication, enabling real-time meal tracking, macro breakdowns, and conversational interaction.

7. Connected to the USDA FoodData Central API for grounded macro- and micronutrient estimation, achieving ~10.7% MAPE and ±9 kcal MAE on a verified evaluation set.

8. Architected the system using modular AI services, decoupling vision models from LLM orchestration to allow future model swaps with minimal refactoring.

9. Conducted quantitative benchmarking and human-in-the-loop evaluations to validate safety, relevance, and multilingual response quality for real-world deployment.

## Tech Stack

### Frontend

1. React (Vite) – fast, modern frontend tooling for responsive UI development
2. Tailwind CSS – utility-first styling for consistent, scalable design
3. Lucide React – lightweight SVG icon library
4. Axios – promise-based HTTP client for API communication
5. Google OAuth UI Flow – seamless user authentication and session handling

### Backend & APIs

1. FastAPI (Python) – high-performance REST API framework with native async support
2. Async I/O (async/await) – concurrent handling of image uploads, inference, and external API calls
3. SQLAlchemy + SQLite – ORM-based persistence for users, meals, and activity logs
4. Pydantic – strict request/response validation and schema enforcement
5. Google OAuth 2.0 – secure authentication and identity management
6. USDA FoodData Central API – authoritative macro- and micronutrient data source

### Machine Learning & AI

1. PyTorch – training and inference for deep learning models
2. Torchvision – image preprocessing, augmentations, and pretrained model support
3. ResNet-18 – binary food vs non-food classifier (gatekeeper model)
4. ResNet-50 – multi-class food recognition model trained on Food-101
5. Transfer Learning – ImageNet-pretrained weights fine-tuned for food classification
6. Data Augmentation – RandomResizedCrop, normalization, and flips for robustness

### Large Language Models & Reasoning

1. Gemini (via Google Vertex AI) – LLM used for multilingual nutritional reasoning and coaching
2. Prompt Engineering – structured prompts combining vision outputs, nutrition data, and user goals
3. Multilingual Generation – support for 8+ languages including English, Hindi, Spanish, and Mandarin

### Architecture & Deployment

1. Modular AI Services – decoupled vision models and LLM orchestration for easy upgrades
2. RESTful API Design – clean separation between frontend and backend services
3. Docker – containerization for reproducible development and deployment
4. Scalable Inference Pipeline – low-latency serving with model and API orchestration

### Evaluation & Metrics

1. Top-1 / Top-3 Accuracy – food classification evaluation
2. MAPE & MAE – quantitative validation of nutritional estimation accuracy
3. Human-in-the-Loop (HITL) Evaluation – qualitative assessment of safety, relevance, and response quality

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
