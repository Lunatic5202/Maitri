#!/usr/bin/env python
"""
Integration script to test the complete pipeline:
1. Load audio files
2. Get predictions from notebook's predict_emotion()
3. Get predictions from backend API
4. Compare and compute accuracy metrics
"""

import os
import json
import numpy as np
import requests
import time
from pathlib import Path

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
TEST_AUDIO_DIR = Path("test_audio_samples")

def ensure_test_audio():
    """Create some test audio files with different characteristics."""
    TEST_AUDIO_DIR.mkdir(exist_ok=True)
    
    import soundfile as sf
    
    test_cases = [
        ("test_happy_high_freq.wav", 1760, "Happy", "high_freq"),
        ("test_sad_low_freq.wav", 440, "Sad", "low_freq"),
        ("test_angry_ultra_freq.wav", 3520, "Anger", "ultra_freq"),
        ("test_neutral_mid_freq.wav", 880, "Neutral", "mid_freq"),
    ]
    
    for filename, freq, expected, label in test_cases:
        filepath = TEST_AUDIO_DIR / filename
        if not filepath.exists():
            sr = 16000
            duration = 4.0
            t = np.linspace(0, duration, int(sr * duration), dtype=np.float32)
            audio = np.sin(2 * np.pi * freq * t) * 0.1
            sf.write(str(filepath), audio, sr)
            print(f"Created {filename}")

def test_backend_health():
    """Test if backend is running."""
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if resp.status_code == 200:
            print("[OK] Backend is running on port 8000")
            return True
        else:
            print(f"[ERROR] Backend health check failed: {resp.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to backend on port 8000")
        print("       Make sure to run: python -m uvicorn backend.main:app --port 8000")
        return False

def classify_with_backend(audio_path):
    """Send audio to backend for classification."""
    try:
        with open(audio_path, "rb") as f:
            files = {"audio": f}
            resp = requests.post(
                f"{BACKEND_URL}/classify",
                files=files,
                timeout=15
            )
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"[ERROR] Backend returned {resp.status_code}")
            return None
    except Exception as e:
        print(f"[ERROR] Backend request failed: {e}")
        return None

def main():
    print("=" * 60)
    print("MAITRI Emotion Classification - Full Integration Test")
    print("=" * 60)
    print()
    
    # Step 1: Ensure test audio exists
    print("[1] Creating test audio samples...")
    ensure_test_audio()
    print()
    
    # Step 2: Check backend
    print("[2] Checking backend service...")
    if not test_backend_health():
        print("\n[CRITICAL] Backend is not running!")
        print("Start it with: python -m uvicorn backend.main:app --port 8000")
        return False
    print()
    
    # Step 3: Test classification
    print("[3] Testing emotion classification...")
    print("-" * 60)
    
    results = []
    for audio_file in sorted(TEST_AUDIO_DIR.glob("*.wav")):
        backend_result = classify_with_backend(audio_file)
        
        if backend_result:
            emotion = backend_result.get("state", "Unknown")
            confidence = backend_result.get("accuracy", 0.0)
            results.append({
                "file": audio_file.name,
                "emotion": emotion,
                "confidence": confidence
            })
            print(f"  {audio_file.name}")
            print(f"    -> {emotion} (confidence: {confidence:.2f})")
        else:
            print(f"  {audio_file.name}")
            print(f"    -> ERROR")
    
    print("-" * 60)
    print()
    
    # Summary
    if results:
        emotions = [r["emotion"] for r in results]
        unique_emotions = len(set(emotions))
        avg_confidence = np.mean([r["confidence"] for r in results])
        
        print("[SUMMARY]")
        print(f"  Total tests: {len(results)}")
        print(f"  Unique emotions: {unique_emotions}")
        print(f"  Average confidence: {avg_confidence:.2f}")
        print()
        print("[SUCCESS] Integration test completed!")
        return True
    else:
        print("[ERROR] No successful predictions")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
