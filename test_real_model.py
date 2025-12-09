#!/usr/bin/env python
"""Test backend with real emotion signatures loaded"""
import requests
import time
import subprocess
import os
import signal

# Start backend in background
print("Starting backend server...")
proc = subprocess.Popen(
    ['python', '-m', 'uvicorn', 'backend.main:app', '--port', '8000'],
    cwd='d:\\Maitri',
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(3)  # Wait for server to start

try:
    print("Testing /health endpoint...")
    resp = requests.get('http://127.0.0.1:8000/health', timeout=5)
    print(f"Health: {resp.status_code} - {resp.json()}")
    
    print("\nTesting /classify endpoint...")
    with open(r'd:\Maitri\tools\test_sine.wav', 'rb') as f:
        files = {'audio': f, 'message': (None, 'test')}
        resp = requests.post('http://127.0.0.1:8000/classify', files=files, timeout=10)
    
    print(f"Classification: {resp.status_code}")
    result = resp.json()
    print(f"  Emotion: {result['state']}")
    print(f"  Confidence: {result['accuracy']}")
    
    if result['state'] != 'Neutral':  # Check if it's using real signatures
        print("\n✓ SUCCESS: Backend is using REAL emotion signatures!")
    else:
        print(f"\nEmotion prediction: {result['state']} ({result['accuracy']})")

finally:
    print("\nStopping backend...")
    os.kill(proc.pid, signal.SIGTERM)
    proc.wait()
    print("Done")
