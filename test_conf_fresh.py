#!/usr/bin/env python
"""Test new confidence formula on all available audio samples"""

import requests
import json
from pathlib import Path
import time

# Wait for backend
time.sleep(0.5)

test_dir = Path('test_audio_samples')
files = sorted(list(test_dir.glob('*.wav')))

print(f"\nTesting {len(files)} audio samples with new confidence formula:")
print("=" * 70)

for audio_file in files:
    try:
        with open(audio_file, 'rb') as f:
            files_dict = {'audio': f}
            response = requests.post('http://127.0.0.1:8000/classify', files=files_dict, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            name = audio_file.stem.replace('test_', '')
            emotion = result.get('state', 'Error')
            conf = result.get('accuracy', 0)
            conf_pct = conf * 100
            print(f'{name:30} → {emotion:12} ({conf_pct:5.0f}%)')
        else:
            print(f'{audio_file.name}: Error {response.status_code}')
    except Exception as e:
        print(f'{audio_file.name}: {str(e)[:40]}')

print("=" * 70)
