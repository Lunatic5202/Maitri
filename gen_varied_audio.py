#!/usr/bin/env python
"""Generate varied test audio to show confidence variance"""
import numpy as np
import soundfile as sf
from pathlib import Path

np.random.seed(42)
test_dir = Path('test_audio_samples_varied')
test_dir.mkdir(exist_ok=True)

sr = 16000
duration = 2.0
t = np.linspace(0, duration, int(sr * duration))

print("Generating varied test audio samples...\n")

# Generate emotional variations of test audio
emotions = [
    ("angry", 3520, 0.7),      # High freq, high amplitude
    ("happy", 1760, 0.6),      # Mid-high freq, medium amplitude
    ("sad", 880, 0.5),         # Lower freq, lower amplitude
    ("neutral", 440, 0.55),    # Mid freq, mid amplitude
]

for emotion, base_freq, amplitude in emotions:
    print(f"Creating {emotion} variations...")
    
    for variation in range(1, 4):
        # Add frequency variation
        freq_var = base_freq * (1.0 + np.random.uniform(-0.1, 0.1))
        
        # Create sine wave with harmonics for more natural variation
        wave = np.zeros_like(t)
        for harmonic in [1, 2, 3]:
            phase_shift = np.random.uniform(0, 2*np.pi)
            harmonic_amp = amplitude / harmonic
            wave += harmonic_amp * np.sin(2 * np.pi * freq_var * harmonic * t + phase_shift)
        
        # Add slight noise for variation
        noise = np.random.normal(0, 0.02, len(wave))
        wave = wave + noise
        
        # Normalize
        wave = wave / (np.max(np.abs(wave)) + 1e-8) * amplitude
        
        filename = test_dir / f"test_{emotion}_var{variation}.wav"
        sf.write(filename, wave, sr)
        print(f"  ✓ {filename.name}")

print(f"\n[DONE] Generated {len(list(test_dir.glob('*.wav')))} varied audio files")
print(f"Location: {test_dir}")
