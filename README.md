# MAITRI — Audio Emotion Detection

MAITRI is a full-stack audio emotion-classification project combining a FastAPI service, a React + TypeScript interface, audio preprocessing and model-backed classification.

> **Research/demo note:** Predictions are experimental outputs, not clinical or psychological assessments. Revalidate against a labelled, representative dataset before making accuracy claims.

## How it works
1. Audio is recorded or supplied by the frontend.
2. The backend preprocesses audio into model features.
3. The inference layer compares the representation with the available emotion signatures.
4. The API returns a predicted state and confidence for display.

Main routes: `GET /health` and `POST /classify`.

## Stack
- Backend: Python, FastAPI, Uvicorn, NumPy and audio utilities.
- Frontend: React, TypeScript and Vite.
- Model assets: `HYBRID_FINAL_MODEL.pt` and extracted signatures in `model_extracted/`.
- Optional container workflow: Docker Compose.

## Run locally

Use Python 3.11 for predictable compatibility with the model tooling.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
python -m uvicorn backend.main:app --reload --port 8000
```

In a second terminal:

```powershell
cd frontend
npm install
$env:VITE_API_BASE="http://localhost:8000"
npm run dev
```

For local frontend configuration, copy `frontend/.env.example` to `frontend/.env.local` and fill in the Supabase project ID, publishable key, and URL if the frontend features you are using require them. Set the same `VITE_*` values in your deployment environment. These values are exposed to the browser bundle; never put a Supabase service-role key or other privileged secret in a `VITE_*` variable.

Vite prints the frontend URL (commonly port 5173). API docs are available at `http://127.0.0.1:8000/docs`. Docker Compose configuration is in `docker-compose.yml`; inspect `scripts/start_all.ps1` or `start_system.ps1` before using the Windows launchers.

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
| `tests/`, `test_*.py` | Verification scripts |
| `INTEGRATION_GUIDE.md` | Integration notes |
| `STATUS_REPORT.md` | Historical report; check its date before relying on it |

## Verify the API

```bash
curl http://127.0.0.1:8000/health
curl -F "audio=@path/to/audio.wav" http://127.0.0.1:8000/classify
```

The repository contains exploratory scripts as well as tests; do not assume every top-level `test_*.py` is part of one unified pytest suite.

## Development guidance
- Keep model and dataset provenance explicit.
- Distinguish synthetic samples from real labelled evaluation data.
- Report dataset composition, split strategy, class-wise metrics and limitations before publishing accuracy claims.
- Do not commit private recordings or personal audio.
- Update this README when API contracts, model assets or setup commands change.

## License and data rights

No project-wide license is currently provided. Do not assume permission to copy, modify, or redistribute this repository. Model weights, datasets, recordings, and other third-party materials may have separate rights and terms; verify their provenance and permissions independently.
