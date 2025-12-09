#!/usr/bin/env python
"""Test if the model loads correctly"""
import sys
import os
sys.path.insert(0, r'd:\Maitri')

# Test direct import and model loading
from backend.models.model_function import run_emotion_model, _load_hybrid_model
import numpy as np

print("=" * 60)
print("Testing HYBRID_FINAL_MODEL.pt loading...")
print("=" * 60)

# Try to load the model
_load_hybrid_model()

# Create dummy features for testing
dummy_features = np.random.randn(1, 1, 128, 10).astype(np.float32)

print("\nTesting inference with dummy audio features...")
result = run_emotion_model(dummy_features)

print(f"\nResult: {result}")
print("=" * 60)

if result.get("state") != "Calm":
    print("✓ SUCCESS: Model loaded and returned real emotion prediction!")
    print(f"  Emotion: {result['state']}, Confidence: {result['accuracy']}")
else:
    print("✗ WARNING: Model returned fallback value. Check if HYBRID_FINAL_MODEL.pt exists.")

