MAITRI - Emotion Detection

Overview
- This repository contains a FastAPI backend (`backend/`) and a Vite + React frontend (`frontend/`) for real-time emotion detection from audio.
- Lightweight numpy-based preprocessing is used to avoid heavy native builds in constrained environments. The original heavier stack (librosa/numba) may require Python 3.10-3.13.

Quick Start (Windows)
1. Ensure you have:
   - Python 3.10 or 3.11 (recommended for full dependency compatibility)
   - Node.js (16+ recommended) and npm

2. Start both services (opens two new windows):

```powershell
cd D:\Maitri\scripts
.\start_all.ps1
```

3. Backend health:
```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health'
```

4. Test classify (example using curl):
```powershell
curl -v -X POST -F "audio=@D:\Maitri\tools\test_sine.wav" -F "message=test" http://127.0.0.1:8000/classify
```

Frontend dev URL
- The Vite dev server prints the URL in its terminal (typically `http://localhost:5173`). Open that in a browser.

Notes
- If you plan to install the original heavy ML dependencies (librosa, numba), prefer Python 3.10-3.13; some packages are not yet compatible with Python 3.14.
- Use `frontend/.env.local` to point the frontend to a remote backend by setting `VITE_API_BASE`.

Files of interest
- `backend/main.py` - FastAPI application and `/classify` endpoint
- `backend/services/audio_service.py` - audio preprocessing (numpy-based)
- `frontend/src/components/EmotionDetection.tsx` - UI hook-up (Server toggle and POST to `/classify`)
- `scripts/start_all.ps1` - convenience script to open backend and frontend windows
- `tools/run_classify_test.py` - helper to POST the provided test WAV file

If you want, I can also add a `requirements.txt` with pinned versions or create a developer Dockerfile for fully reproducible local setup.
Docker (optional)

Build and run the stack with Docker Compose (recommended for reproducible environments):

```powershell
# from repository root
docker compose build
docker compose up
```

This builds the backend and frontend images. The frontend static files are served by nginx; the backend runs uvicorn on port 8000. The Compose file maps frontend to host port 5173 and backend to 8000.

Run the end-to-end backend test (after Compose or starting services locally):

```powershell
python tests/e2e/run_classify_e2e.py --url http://127.0.0.1:8000 --wav D:/Maitri/tools/test_sine.wav
```
