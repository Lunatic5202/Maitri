from fastapi import FastAPI

app = FastAPI(title="MAITRI - Health Only")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "maitri-backend-light"}
