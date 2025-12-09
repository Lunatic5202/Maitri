#!/usr/bin/env python
"""Test the backend /classify endpoint"""
import requests
import time

# Wait for backend to start
time.sleep(2)

# Test health endpoint
print("Testing /health endpoint...")
try:
    resp = requests.get('http://127.0.0.1:8000/health')
    print(f"✓ Health check: {resp.status_code}")
    print(f"  Response: {resp.json()}")
except Exception as e:
    print(f"✗ Health check failed: {e}")

# Test classify endpoint with a test WAV file
print("\nTesting /classify endpoint...")
wav_path = r'd:\Maitri\tools\test_sine.wav'

try:
    with open(wav_path, 'rb') as f:
        files = {'audio': f, 'message': (None, 'test')}
        resp = requests.post('http://127.0.0.1:8000/classify', files=files)
    print(f"✓ Classification: {resp.status_code}")
    result = resp.json()
    print(f"  Emotion: {result['state']}")
    print(f"  Confidence: {result['accuracy']}")
    if result['state'] != 'Calm':
        print("\n✓ SUCCESS: Backend returned real emotion (not dummy Calm)!")
except Exception as e:
    print(f"✗ Classification failed: {e}")

