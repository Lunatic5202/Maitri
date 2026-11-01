# MAITRI — Audio Emotion Detection

MAITRI is a full-stack audio emotion-classification project. It combines a FastAPI service, a React + TypeScript interface, audio preprocessing, and model-backed classification.

> **Research/demo note:** Treat predictions and confidence values as experimental outputs, not clinical or psychological assessments. The repository contains notebooks, model artifacts, sample audio, and several historical verification scripts; results should be revalidated against a labelled, representative dataset before making accuracy claims.

## How it works

1. Audio is recorded or supplied by the frontend.
2. The backend preprocesses the audio into model features.
3. The inference layer compares the resulting representation with the available emotion signatures.
4. The API returns the predicted state and confidence for display.

The main API routes are `GET /health` and `POST /classify`.

## Stack

- **Backend:** Python, FastAPI, Uvicorn, NumPy and audio-processing utilities.
- **Frontend:** React, TypeScript and Vite.
- **Model assets:** `HYBRID_FINAL_MODEL.pt` and extracted emotion signatures under `model_extracted/`.
- **Optional container workflow:** Docker Compose.

## Run locally

Use Python 3.11 for the most predictable compatibility with the checked-in model tooling.

```powershell
# Backend dependencies
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..

# Start the backend (from the repository root)
python -m uvicorn backend.main:app --reload --port 8000
```

In a second terminal:

```powershell
cd frontend
npm install
$env:VITE_API_BASE="http://localhost:8000"
npm run dev
```

The frontend development server prints its local URL (Vite commonly uses port 5173). You can also inspect the API at `http://127.0.0.1:8000/docs`.

For the repository's Windows launcher, inspect `scripts/start_all.ps1` or `start_system.ps1` before running it. Docker Compose configuration is available in `docker-compose.yml`.

## Useful paths

| Path | Purpose |
| --- | --- |
| `backend/main.py` | FastAPI application and classification endpoints |
| `backend/services/` | Audio preprocessing |
| `backend/models/` | Model inference code |
| `frontend/` | Browser interface |
| `HYBRID_FINAL_MODEL.pt` | Original model checkpoint |
| `model_extracted/` | Extracted model signatures |
| `*.ipynb` | Experiment and integration notebooks |
| `tests/`, `test_*.py` | Verification and regression scripts |
| `INTEGRATION_GUIDE.md` | Detailed integration notes |
| `STATUS_REPORT.md` | Historical status report; verify its date before relying on it |

## Verification

Check the live service:

```bash
curl http://127.0.0.1:8000/health
curl -F "audio=@path/to/audio.wav" http://127.0.0.1:8000/classify
```

Run the tests relevant to the component you changed. The repository contains multiple exploratory scripts, so do not assume every top-level `test_*.py` file is part of one unified pytest suite.

## Development guidance

- Keep model/data provenance explicit and distinguish synthetic samples from real labelled evaluation data.
- Report dataset composition, split strategy, class-wise metrics and limitations before publishing accuracy claims.
- Do not commit private recordings or other personal audio.
- Update this README when API contracts, model assets or setup commands change.
