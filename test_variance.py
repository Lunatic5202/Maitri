#!/usr/bin/env python
"""Test confidence variance with multiple runs on same files"""
import requests
import time
from pathlib import Path
import numpy as np

time.sleep(0.5)

test_dir = Path('test_audio_samples')
files = sorted(list(test_dir.glob('*.wav')))

print(f"\n{'='*70}")
print(f"Testing {len(files)} audio samples - 5 runs each to show variance")
print(f"Expected: Varying confidence 86-97%, avg ~87%")
print(f"{'='*70}\n")

all_confidences = []

for audio_file in files:
    confidences = []
    for run in range(5):
        try:
            with open(audio_file, 'rb') as f:
                files_dict = {'audio': f}
                response = requests.post('http://localhost:8000/classify', files=files_dict, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                emotion = result.get('emotion', 'Error')
                conf = result.get('confidence', 0)
                confidences.append(conf * 100)
                all_confidences.append(conf * 100)
        except Exception as e:
            print(f'Run {run+1} failed: {str(e)[:30]}')
    
    if confidences:
        name = audio_file.stem.replace('test_', '').replace('_', ' ').title()
        avg = np.mean(confidences)
        min_c = np.min(confidences)
        max_c = np.max(confidences)
        print(f'{name:30} | Avg: {avg:5.1f}% | Range: {min_c:5.1f}% - {max_c:5.1f}%')

print(f"\n{'='*70}")
if all_confidences:
    overall_avg = np.mean(all_confidences)
    overall_min = np.min(all_confidences)
    overall_max = np.max(all_confidences)
    print(f"Overall Average: {overall_avg:.1f}%")
    print(f"Range: {overall_min:.1f}% - {overall_max:.1f}%")
    print(f"Total samples: {len(all_confidences)}")
print(f"{'='*70}\n")
