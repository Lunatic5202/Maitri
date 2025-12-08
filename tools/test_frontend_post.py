"""Test posting a WAV blob to /classify exactly as the frontend would."""
import requests
import mimetypes

wav_path = r'D:\Maitri\tools\test_sine.wav'
url = 'http://127.0.0.1:8000/classify'

# Open file as binary (simulating a Blob from browser)
with open(wav_path, 'rb') as f:
    audio_bytes = f.read()

# Create FormData exactly as frontend would
files = {
    'audio': ('recording.wav', audio_bytes, 'audio/wav'),
}
data = {
    'message': '',
}

print(f"Sending {len(audio_bytes)} bytes to {url}")
r = requests.post(url, files=files, data=data)
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")
if r.status_code == 200:
    print("✓ Success - backend accepted the request")
else:
    print("✗ Failed - backend rejected the request")
