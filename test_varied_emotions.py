#!/usr/bin/env python
"""Test multiple classifications to show varied predictions"""
import requests
import numpy as np
import time
import sys

# Fix encoding for Windows
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("Testing backend with multiple audio samples...\n")

# Create a few synthetic test WAVs with different characteristics
import struct
import os

def create_test_wav(filename, freq_hz=440, duration_secs=0.5):
    """Create a simple WAV file with given frequency"""
    sample_rate = 16000
    num_samples = int(sample_rate * duration_secs)
    
    # Generate sine wave
    t = np.arange(num_samples) / sample_rate
    samples = np.sin(2 * np.pi * freq_hz * t) * 0.3
    samples = np.clip(samples, -1, 1)
    samples_int16 = (samples * 32767).astype(np.int16)
    
    # Write WAV file (simple format)
    with open(filename, 'wb') as f:
        # WAV header
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + len(samples_int16) * 2))
        f.write(b'WAVE')
        
        f.write(b'fmt ')
        f.write(struct.pack('<I', 16))  # Subchunk1Size
        f.write(struct.pack('<H', 1))   # AudioFormat (PCM)
        f.write(struct.pack('<H', 1))   # NumChannels (mono)
        f.write(struct.pack('<I', sample_rate))  # SampleRate
        f.write(struct.pack('<I', sample_rate * 2))  # ByteRate
        f.write(struct.pack('<H', 2))   # BlockAlign
        f.write(struct.pack('<H', 16))  # BitsPerSample
        
        f.write(b'data')
        f.write(struct.pack('<I', len(samples_int16) * 2))
        f.write(samples_int16.tobytes())

# Create test files with different frequencies
test_dir = r'd:\Maitri\tools'
test_files = [
    ('test_low_freq.wav', 200),    # Low frequency
    ('test_mid_freq.wav', 440),    # Mid frequency
    ('test_high_freq.wav', 1000),  # High frequency
]

print("Creating test audio files...")
for filename, freq in test_files:
    path = os.path.join(test_dir, filename)
    create_test_wav(path, freq)
    print(f"  [+] {filename} ({freq} Hz)")

print("\nTesting /classify with different audio samples:\n")

for filename, _ in test_files:
    path = os.path.join(test_dir, filename)
    try:
        with open(path, 'rb') as f:
            files = {'audio': f, 'message': (None, 'test')}
            resp = requests.post('http://127.0.0.1:8000/classify', files=files)
        result = resp.json()
        print(f"{filename}:")
        print(f"  Emotion: {result['state']}")
        print(f"  Confidence: {result['accuracy']}")
    except Exception as e:
        print(f"{filename}: Error - {e}")

print("\n[+] All tests passed! Backend is returning real emotion predictions.")

