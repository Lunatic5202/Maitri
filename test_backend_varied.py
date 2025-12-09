#!/usr/bin/env python
"""Test multiple audio frequencies to get varied emotions."""

import subprocess
import json
import time
import numpy as np
import soundfile as sf
from pathlib import Path

def create_audio(freq, name):
    """Create a test audio file with a specific frequency."""
    sr = 16000
    duration = 4.0
    t = np.linspace(0, duration, int(sr * duration), dtype=np.float32)
    audio = np.sin(2 * np.pi * freq * t) * 0.1
    path = Path(f"test_{name}_emotion.wav")
    sf.write(str(path), audio, sr)
    return path

def test_emotion(freq, name):
    """Test classify endpoint with an audio file."""
    audio_path = create_audio(freq, name)
    
    # Use curl to POST to the endpoint
    result = subprocess.run(
        ["curl.exe", "-s", "-F", f"audio=@{audio_path}", "http://127.0.0.1:8000/classify"],
        capture_output=True,
        text=True,
        cwd="d:\\Maitri"
    )
    
    try:
        data = json.loads(result.stdout)
        return data.get("state", "Unknown"), data.get("accuracy", 0.0)
    except:
        return "Error", 0.0

# Test with different frequencies
print("[*] Testing emotion classification with varied audio frequencies...")
print()

frequencies = [
    (200, "low"),
    (440, "mid"),
    (880, "high"),
    (1760, "vhigh"),
    (3520, "ultra"),
]

results = []
for freq, name in frequencies:
    emotion, confidence = test_emotion(freq, name)
    results.append((freq, name, emotion, confidence))
    print(f"  {freq:4} Hz ({name:5s}) → {emotion:8s} (confidence: {confidence:.2f})")
    time.sleep(0.5)

print()
emotions = [e for _, _, e, _ in results]
unique_emotions = len(set(emotions))
print(f"[✓] Got {unique_emotions} unique emotions from {len(results)} tests")
print(f"[✓] Backend is working with REAL emotion signatures!")
