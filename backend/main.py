# main.py
import time
import asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from concurrent.futures import ThreadPoolExecutor

# audio preprocessing helper you created earlier
from services.audio_service import make_model_input

# teammate's function (they implement the ML logic here)
from models.model_function import run_emotion_model

# optional DB logging helpers
from database.db import init_db, insert_log, get_history

# Allow frontend (localhost) to call this backend during development
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MAITRI - Audio classify API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # during dev: allow any origin. In production, restrict this.
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use a thread pool so heavy CPU work inside run_emotion_model doesn't block the event loop
executor = ThreadPoolExecutor(max_workers=2)

@app.on_event("startup")
async def startup():
    # initialize DB table (safe if already exists)
    await init_db()
    print("Startup complete — DB initialized (if present).")

@app.post("/classify")
async def classify(audio: UploadFile = File(...), message: str = Form("")):
    """
    Receives multipart/form-data with:
      - audio: file (field name "audio")
      - message: optional text
    Workflow:
      1) read bytes
      2) preprocess -> features (make_model_input)
      3) call teammate's run_emotion_model(features) inside a threadpool
      4) asynchronously log to DB
      5) return the teammate's JSON: {"state": "...", "accuracy": ...}
    """
    # 1) Basic validation
    if not audio or not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file uploaded under field 'audio'")

    # 2) Read uploaded bytes (small files ok to hold in memory)
    audio_bytes = await audio.read()

    # 3) Preprocess to features (this is synchronous CPU work but fast)
    try:
        features = make_model_input(audio_bytes)
    except Exception as e:
        # bad input or preprocessing error -> return 400
        raise HTTPException(status_code=400, detail=f"Audio preprocessing failed: {e}")

    # 4) Call teammate's model function inside threadpool (avoid blocking)
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(executor, call_teammate_sync, features)

    # 5) Optionally log result to DB without blocking the response
    try:
        asyncio.create_task(insert_log(result.get("state"), result.get("accuracy"), message, result.get("inference_time", 0.0)))
    except Exception:
        # logging failure should not break the response
        pass

    # 6) Return the teammate's output. Keep keys stable: state + accuracy.
    return {"state": result.get("state"), "accuracy": result.get("accuracy")}


def call_teammate_sync(features):
    """
    Synchronous wrapper that calls the teammate function.
    Any heavy CPU/GPU code inside run_emotion_model runs here.
    We also capture and attach inference_time.
    """
    t0 = time.perf_counter()
    try:
        out = run_emotion_model(features)
    except Exception as e:
        # If teammate's function crashes, return a safe default
        return {"state": "Unknown", "accuracy": 0.0, "inference_time": 0.0}
    dt = round(time.perf_counter() - t0, 4)
    # Ensure returned object has expected fields
    return {
        "state": out.get("state", "Unknown"),
        "accuracy": out.get("accuracy", 0.0),
        "inference_time": dt
    }

@app.get("/history")
async def history(hours: int = 48):
    """
    Optional helper to fetch recent logs from SQLite.
    """
    rows = await get_history(hours)
    keys = ["id","state","accuracy","user_message","inference_time","timestamp"]
    results = [dict(zip(keys,row)) for row in rows]
    return {"history": results}
