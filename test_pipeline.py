#!/usr/bin/env python
"""Test the model pipeline directly."""

import sys
import time
import numpy as np
import soundfile as sf
from pathlib import Path

# Create a simple sine wave audio
sr = 16000
duration = 4.0
freq = 440
t = np.linspace(0, duration, int(sr * duration), dtype=np.float32)
audio = np.sin(2 * np.pi * freq * t) * 0.1

# Save it
wav_path = Path("test_simple.wav")
sf.write(str(wav_path), audio, sr)
print(f"Created {wav_path}")

# Read it back as bytes
with open(wav_path, "rb") as f:
    audio_bytes = f.read()
print(f"Read {len(audio_bytes)} bytes")

# Test 1: Audio service
print("\n[*] Testing audio service...")
try:
    from backend.services.audio_service import make_model_input
    start = time.time()
    features = make_model_input(audio_bytes)
    elapsed = time.time() - start
    print(f"  ✓ make_model_input returned {features.shape} in {elapsed:.2f}s")
except Exception as e:
    print(f"  ✗ Error: {e}")
    sys.exit(1)

# Test 2: Model function
print("\n[*] Testing model function...")
try:
    from backend.models.model_function import run_emotion_model
    start = time.time()
    result = run_emotion_model(features)
    elapsed = time.time() - start
    print(f"  ✓ run_emotion_model returned {result} in {elapsed:.2f}s")
except Exception as e:
    print(f"  ✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n[✓] Pipeline works!")
