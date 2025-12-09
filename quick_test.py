#!/usr/bin/env python
import requests
import time
import os
import sys

os.chdir('d:\\Maitri')
time.sleep(2)  # Give backend time to start

# Test on one audio file to see new confidence
test_file = 'test_audio_samples/test_sad_low_freq.wav'

print("\nTesting new confidence calculation:", flush=True)
print("=" * 60, flush=True)

try:
    with open(test_file, 'rb') as f:
        files_dict = {'audio': f}
        resp = requests.post('http://localhost:8000/classify', files=files_dict, timeout=10)
    
    if resp.status_code == 200:
        result = resp.json()
        emotion = result.get('emotion', 'Error')
        conf = result.get('confidence', 0)
        print(f'Test (sad audio):  {emotion:12} ({conf:.0%})', flush=True)
    else:
        print(f'Server error: {resp.status_code}', flush=True)
except Exception as e:
    print(f'Failed: {e}', flush=True)
    import traceback
    traceback.print_exc()

print("=" * 60, flush=True)
