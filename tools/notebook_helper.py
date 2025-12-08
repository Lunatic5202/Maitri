import sys
from pathlib import Path
import requests

# Ensure backend package imports work when this module is imported from the notebook
repo_root = Path(__file__).resolve().parents[1]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root / 'backend'))

# Local model runner (imports backend helpers)
try:
    from services.audio_service import make_model_input
    from models.model_function import run_emotion_model
except Exception as e:
    # If imports fail, leave placeholders and raise at call-time
    make_model_input = None
    run_emotion_model = None
    _import_error = e
else:
    _import_error = None


def run_local_model_from_file(wav_path: str):
    """Read WAV file bytes, preprocess with backend audio_service, and run model_function.
    Returns the model's dict result.
    """
    global _import_error
    if _import_error is not None:
        raise RuntimeError(f"Backend imports failed: {_import_error}")

    p = Path(wav_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {wav_path}")

    audio_bytes = p.read_bytes()
    features = make_model_input(audio_bytes)
    result = run_emotion_model(features)
    return result


def classify_via_backend_file(wav_path: str, url: str = "http://127.0.0.1:8000/classify"):
    """POST a WAV file to the backend `/classify` endpoint and return the response object.
    Raises requests exceptions on network errors.
    """
    p = Path(wav_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {wav_path}")

    with p.open('rb') as fh:
        files = {'audio': (p.name, fh, 'audio/wav')}
        data = {'message': 'notebook helper request'}
        resp = requests.post(url, files=files, data=data, timeout=30)
    resp.raise_for_status()
    return resp.json()


if __name__ == '__main__':
    # Quick CLI to test functions
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('wav', help='Path to wav file')
    parser.add_argument('--mode', choices=['local','server'], default='local')
    parser.add_argument('--url', default='http://127.0.0.1:8000/classify')
    args = parser.parse_args()

    if args.mode == 'local':
        print('Running local model on', args.wav)
        print(run_local_model_from_file(args.wav))
    else:
        print('Posting to server', args.url)
        print(classify_via_backend_file(args.wav, url=args.url))
