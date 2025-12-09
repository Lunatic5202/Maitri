from backend.main import app
import uvicorn
import sys
import signal

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print(f"\n[INFO] Received signal {sig}, shutting down...", flush=True)
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("[INFO] Starting MAITRI backend on 0.0.0.0:8000...", flush=True)
    print("[INFO] Press Ctrl+C to stop", flush=True)
    sys.stdout.flush()
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped by user", flush=True)
    except Exception as e:
        print(f"[ERROR] Server failed with exception: {type(e).__name__}: {e}", flush=True)
        import traceback
        traceback.print_exc()
