#!/usr/bin/env python
"""Test confidence on varied audio to show variance"""
import requests
import time
from pathlib import Path
import numpy as np

time.sleep(0.5)

test_dir = Path('test_audio_samples_varied')
files = sorted(list(test_dir.glob('*.wav')))

print(f"\n{'='*75}")
print(f"Testing {len(files)} VARIED audio samples")
print(f"Expected: Confidence variance showing 86-97% range, avg ~87%")
print(f"{'='*75}\n")

results = []
all_confidences = []

for audio_file in files:
    try:
        with open(audio_file, 'rb') as f:
            files_dict = {'audio': f}
            response = requests.post('http://localhost:8000/classify', files=files_dict, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            emotion = result.get('emotion', 'Error')
            conf = result.get('confidence', 0)
            conf_pct = conf * 100
            results.append((audio_file.stem, emotion, conf_pct))
            all_confidences.append(conf_pct)
            print(f'{audio_file.stem:30} → {emotion:12} ({conf_pct:5.1f}%)')
    except Exception as e:
        print(f'{audio_file.name}: Failed - {str(e)[:30]}')

print(f"\n{'='*75}")
print("STATISTICS:")
print(f"{'='*75}")
if all_confidences:
    overall_avg = np.mean(all_confidences)
    overall_min = np.min(all_confidences)
    overall_max = np.max(all_confidences)
    overall_std = np.std(all_confidences)
    print(f"Average confidence:     {overall_avg:.1f}%")
    print(f"Minimum confidence:     {overall_min:.1f}%")
    print(f"Maximum confidence:     {overall_max:.1f}%")
    print(f"Std deviation:          {overall_std:.2f}%")
    print(f"Total samples tested:   {len(all_confidences)}")
    print(f"\n✓ Target range 86-97%: {'YES' if overall_min >= 86 and overall_max <= 97 else 'NO'}")
    print(f"✓ Target average ~87%: {'YES' if 86 <= overall_avg <= 88 else 'NO'}")
print(f"{'='*75}\n")
