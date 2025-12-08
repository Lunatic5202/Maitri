import os
import wave
import struct
import math
import requests

def generate_sine_wav(path, duration_s=1.0, sr=16000, freq=440.0, amplitude=0.5):
    n_samples = int(duration_s * sr)
    max_amp = 32767
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sr)
        for i in range(n_samples):
            t = i / sr
            sample = amplitude * math.sin(2 * math.pi * freq * t)
            val = int(max_amp * sample)
            wf.writeframes(struct.pack('<h', val))

def post_wav_to_backend(wav_path, url='http://127.0.0.1:8000/classify'):
    with open(wav_path, 'rb') as f:
        files = {'audio': ('test.wav', f, 'audio/wav')}
        data = {'message': 'synthetic test'}
        r = requests.post(url, files=files, data=data, timeout=30)
    return r

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'test_sine.wav')
    print('Generating', out)
    generate_sine_wav(out, duration_s=2.0, freq=220.0)
    print('Posting to backend...')
    resp = post_wav_to_backend(out)
    print('Status:', resp.status_code)
    try:
        print('JSON:', resp.json())
    except Exception:
        print('Text:', resp.text)
