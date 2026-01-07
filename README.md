# Isabelle Curve

**An AI-powered biostatistics tutoring agent for PHP 2510 at Brown University**

Isabelle Curve helps students master biostatistics concepts through:
- **Biostats Chat** — RAG-powered Q&A using course materials
- **Article Analysis** — Guided 10-question analysis of research articles with PDF export

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: FastAPI (Python 3.11), OpenAI GPT-4o-mini, Supabase (PostgreSQL + pgvector)
- **Deployment**: Vercel (frontend), Render (backend)

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- OpenAI API key
- Supabase account with pgvector extension enabled

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/isabelleCurveAgent.git
cd isabelleCurveAgent
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or: .\venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- **API**: `http://localhost:8000`
- **Docs**: `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 5. Running the Application

**You need both servers running simultaneously:**

**Terminal 1 (Backend):**
```bash
source venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Loading Course Materials (Optional)

To populate the Supabase database with course materials for RAG:

```bash
source venv/bin/activate
python backend/load_course_materials.py
```

This will embed and store PDFs from `backend/course_materials/` including:
- Weekly lecture slides (PHP 2510 Weeks 1-14)
- Exam study guides and solutions
- Textbook excerpts and practice problems
- Handouts and feedback documents

---

## Project Structure

```
isabelleCurveAgent/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── core/
│   │   ├── config.py            # Environment settings & CORS
│   │   ├── openai_client.py     # OpenAI integration & system prompts
│   │   ├── rag.py               # Vector search & embeddings
│   │   ├── pdf_extractor.py     # PDF text extraction
│   │   └── supabase_client.py   # Supabase connection
│   ├── routers/
│   │   ├── ask.py               # General chat endpoint
│   │   ├── ask_stream.py        # Streaming chat endpoint
│   │   └── articleanalysis.py   # Article analysis endpoints
│   ├── models/                  # Pydantic request/response models
│   └── course_materials/        # PDF files for RAG ingestion
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── chat/page.tsx        # Biostats chat interface
│   │   ├── analysis/page.tsx    # Article analysis interface
│   │   └── resources/page.tsx   # Resources page
│   ├── components/              # React components
│   └── lib/api.ts               # API client functions
│
└── diagrams/                    # Architecture documentation
```

---

## Features

### 💬 Biostats Chat
- Real-time streaming responses powered by GPT-4o-mini
- RAG (Retrieval-Augmented Generation) retrieves relevant course materials
- Covers probability, inference, regression, ANOVA, sampling distributions, and more

### 📄 Article Analysis
- Upload a PDF of an empirical research article
- Isabelle guides you through 10 structured questions:
  1. Statistical methods
  2. Study design
  3. Results interpretation
  4. Limitations
  5. Course connections
  6. Communication (explaining to non-statisticians)
  7. Summary of findings
  8. Alternative analyses
  9. Clarity improvements
  10. Specific statistic interpretation
- Export completed session as a PDF for submission

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | General chat (non-streaming) |
| `POST` | `/chat-stream` | General chat with streaming |
| `POST` | `/articleanalysis/start` | Upload PDF to start analysis |
| `POST` | `/articleanalysis/continue` | Submit answer, get next question |
| `GET` | `/articleanalysis/export/{id}` | Export conversation transcript |

---

## Database Schema (Supabase)

The application uses PostgreSQL with pgvector extension:

- **`articles`** — Stores extracted PDF text from uploaded articles
- **`conversations`** — Links to articles, tracks analysis sessions
- **`conversation_turns`** — Stores each message (role: ai/student)
- **`documents`** — Vector embeddings of course materials for RAG

The `match_documents` RPC function performs similarity search using cosine distance.

---

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy automatically on push to main

### Backend (Render)
1. Create a new Web Service
2. Set environment variables (OpenAI, Supabase keys)
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

---

## Troubleshooting

**Backend won't start:**
- Check that all environment variables are set in `.env`
- Verify Supabase URL and keys are correct
- Ensure Python 3.11+ is installed

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Check that backend is running on port 8000
- Look for CORS errors in browser console

**RAG not returning results:**
- Run `python backend/load_course_materials.py` to populate database
- Check Supabase has pgvector extension enabled
- Verify `documents` table exists and has data

---

## License

Developed for educational purposes at Brown University.

## Authors
Anika Mahns in Collaboration with Peter Lipman
anika_mahns@brown.edu

Created for PHP 2510 (Biostatistics) at Brown University.
