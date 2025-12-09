#!/usr/bin/env python
"""Simple test to see where backend hangs during classify."""

import requests
import time
from pathlib import Path
import soundfile as sf
import numpy as np

def create_simple_audio():
    """Create a simple sine wave audio file."""
    sr = 16000
    duration = 4.0
    freq = 440  # Hz
    t = np.linspace(0, duration, int(sr * duration), dtype=np.float32)
    audio = np.sin(2 * np.pi * freq * t) * 0.1
    
    # Save to wav
    wav_path = Path("test_audio_simple.wav")
    sf.write(str(wav_path), audio, sr)
    return wav_path

def test_classify():
    """Test the classify endpoint with timing."""
    # Create audio
    wav_path = create_simple_audio()
    
    # Read audio bytes
    with open(wav_path, "rb") as f:
        audio_bytes = f.read()
    
    print(f"[*] Audio file: {wav_path} ({len(audio_bytes)} bytes)")
    
    # Test health first
    try:
        print("\n[*] Testing /health endpoint...")
        start = time.time()
        resp = requests.get("http://127.0.0.1:8000/health", timeout=5)
        elapsed = time.time() - start
        print(f"    Status: {resp.status_code} in {elapsed:.2f}s")
        print(f"    Response: {resp.json()}")
    except Exception as e:
        print(f"    ERROR: {e}")
    
    # Test classify with detailed timing
    try:
        print("\n[*] Testing /classify endpoint (timeout=30s)...")
        start = time.time()
        resp = requests.post(
            "http://127.0.0.1:8000/classify",
            files={"file": ("test.wav", audio_bytes, "audio/wav")},
            timeout=30  # 30 second timeout
        )
        elapsed = time.time() - start
        print(f"    Status: {resp.status_code} in {elapsed:.2f}s")
        print(f"    Response: {resp.json()}")
    except requests.exceptions.Timeout as e:
        elapsed = time.time() - start
        print(f"    TIMEOUT after {elapsed:.2f}s: {e}")
    except Exception as e:
        elapsed = time.time() - start
        print(f"    ERROR after {elapsed:.2f}s: {e}")

if __name__ == "__main__":
    test_classify()
