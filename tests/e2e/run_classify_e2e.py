"""
Simple end-to-end test that posts `tools/test_sine.wav` to the running backend `/classify`
Usage: python tests/e2e/run_classify_e2e.py --url http://localhost:8000

This does not exercise the browser UI (recording), but validates the full backend inference path.
"""
import argparse
import requests
import sys

def run(url, wav_path):
    files = {'audio': open(wav_path, 'rb')}
    data = {'message': 'e2e-test'}
    r = requests.post(f"{url.rstrip('/')}/classify", files=files, data=data, timeout=30)
    print('Status:', r.status_code)
    print('Body:', r.text)
    if r.status_code != 200:
        return 2
    try:
        js = r.json()
        if 'state' in js and 'accuracy' in js:
            print('OK - model response present')
            return 0
    except Exception as e:
        print('Invalid JSON response:', e)
        return 3
    return 1

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--url', default='http://127.0.0.1:8000')
    p.add_argument('--wav', default='D:/Maitri/tools/test_sine.wav')
    args = p.parse_args()
    sys.exit(run(args.url, args.wav))
