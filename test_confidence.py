#!/usr/bin/env python
"""Test improved confidence scoring"""

import requests
import json

test_files = [
    'test_sad_low_freq.wav',
    'test_happy_high_freq.wav', 
    'test_angry_ultra_freq.wav'
]

print("Testing improved confidence scoring...")
print("-" * 60)

for wav_file in test_files:
    try:
        with open(wav_file, 'rb') as f:
            files = {'audio': f}
            resp = requests.post('http://127.0.0.1:8000/classify', files=files, timeout=30)
        
        result = resp.json()
        emotion = result['state']
        conf = result['accuracy']
        conf_pct = conf * 100
        print(f'{wav_file:30s} -> {emotion:10s} ({conf_pct:5.0f}%)')
    except Exception as e:
        print(f'{wav_file:30s} -> Error: {str(e)[:50]}')

print("-" * 60)
print("Done!")
