#!/usr/bin/env python
"""Test all audio samples with new confidence formula"""
import requests
import time
from pathlib import Path

time.sleep(0.5)

test_dir = Path('test_audio_samples')
files = sorted(list(test_dir.glob('*.wav')))

print(f"\n{'='*70}")
print(f"Testing {len(files)} audio samples with NEW confidence formula")
print(f"Formula: Softmax + Margin Combination")
print(f"{'='*70}\n")

results = []
for audio_file in files:
    try:
        with open(audio_file, 'rb') as f:
            files_dict = {'audio': f}
            response = requests.post('http://localhost:8000/classify', files=files_dict, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            name = audio_file.stem.replace('test_', '').replace('_', ' ').title()
            emotion = result.get('emotion', 'Error')
            conf = result.get('confidence', 0)
            conf_pct = conf * 100
            results.append((name, emotion, conf_pct))
            print(f'{name:30} → {emotion:12} ({conf_pct:5.1f}%)')
        else:
            print(f'{audio_file.name}: Error {response.status_code}')
    except Exception as e:
        print(f'{audio_file.name}: Failed - {str(e)[:40]}')

print(f"\n{'='*70}")
print("Summary:")
print(f"{'='*70}")
avg_conf = sum(c for _, _, c in results) / len(results) if results else 0
print(f"Average confidence: {avg_conf:.1f}%")
print(f"Unique emotions detected: {len(set(e for _, e, _ in results))}")
print(f"{'='*70}\n")
