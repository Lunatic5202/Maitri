#!/usr/bin/env python
"""
Notebook Integration Code - Add these cells to maitri.ipynb

This code provides:
1. A function to test the backend API
2. A function to compare notebook vs backend predictions  
3. Accuracy computation across test audio files
"""

# Cell 1: Import required libraries
import requests
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple

# Cell 2: Backend integration functions
def test_backend_health(backend_url: str = "http://127.0.0.1:8000") -> bool:
    """Test if backend API is running and healthy."""
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Backend is healthy: {data}")
            return True
    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to backend at {backend_url}")
        print("  Make sure to run: python -m uvicorn backend.main:app --port 8000")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
    
    return False


def classify_audio_backend(audio_path: str, backend_url: str = "http://127.0.0.1:8000") -> Dict:
    """
    Get emotion classification from backend API.
    
    Args:
        audio_path: Path to audio file (WAV, MP3, etc)
        backend_url: Backend API base URL
        
    Returns:
        Dict with 'state' (emotion) and 'accuracy' (confidence)
    """
    try:
        with open(audio_path, 'rb') as f:
            files = {'audio': f}
            response = requests.post(
                f"{backend_url}/classify",
                files=files,
                timeout=30
            )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Backend error {response.status_code}: {response.text}")
            return {"state": "Error", "accuracy": 0.0}
    except requests.exceptions.Timeout:
        print(f"Request timeout for {audio_path}")
        return {"state": "Timeout", "accuracy": 0.0}
    except Exception as e:
        print(f"Error classifying {audio_path}: {e}")
        return {"state": "Error", "accuracy": 0.0}


def classify_audio_notebook(audio_path: str) -> Dict:
    """
    Get emotion classification from notebook's predict_emotion function.
    
    Note: This assumes predict_emotion() is defined in the notebook
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        Dict with emotion and confidence from notebook
    """
    try:
        result = predict_emotion(audio_path)
        # predict_emotion returns tuple or dict, normalize to dict
        if isinstance(result, tuple):
            return {"state": result[0], "accuracy": result[1]}
        elif isinstance(result, dict):
            return result
        else:
            print(f"Unexpected format from predict_emotion: {type(result)}")
            return {"state": "Unknown", "accuracy": 0.0}
    except Exception as e:
        print(f"Error with notebook predict_emotion({audio_path}): {e}")
        return {"state": "Error", "accuracy": 0.0}


# Cell 3: Accuracy computation
def compute_accuracy_comparison(
    audio_files: List[str],
    use_backend: bool = True,
    backend_url: str = "http://127.0.0.1:8000",
    verbose: bool = True
) -> Dict:
    """
    Compute accuracy by comparing notebook vs backend predictions.
    
    Args:
        audio_files: List of audio file paths to test
        use_backend: If True, compare with backend; if False, just use notebook
        backend_url: Backend API URL
        verbose: If True, print detailed results
        
    Returns:
        Dict with accuracy metrics and detailed results
    """
    
    results = []
    
    if verbose:
        print(f"Testing {len(audio_files)} audio files...")
        print(f"Backend: {'Yes' if use_backend else 'No'}")
        print("-" * 80)
    
    for i, audio_path in enumerate(audio_files, 1):
        # Get notebook prediction
        notebook_pred = classify_audio_notebook(audio_path)
        notebook_emotion = notebook_pred.get('state', 'Unknown')
        notebook_conf = notebook_pred.get('accuracy', 0.0)
        
        result = {
            'file': Path(audio_path).name,
            'notebook_emotion': notebook_emotion,
            'notebook_confidence': notebook_conf,
            'backend_emotion': None,
            'backend_confidence': None,
            'match': None
        }
        
        # Get backend prediction if enabled
        if use_backend:
            backend_pred = classify_audio_backend(audio_path, backend_url)
            backend_emotion = backend_pred.get('state', 'Unknown')
            backend_conf = backend_pred.get('accuracy', 0.0)
            
            result['backend_emotion'] = backend_emotion
            result['backend_confidence'] = backend_conf
            result['match'] = (notebook_emotion == backend_emotion)
        
        results.append(result)
        
        if verbose:
            print(f"[{i}/{len(audio_files)}] {Path(audio_path).name}")
            print(f"  Notebook: {notebook_emotion:12s} (conf: {notebook_conf:.2f})")
            if use_backend:
                print(f"  Backend:  {backend_emotion:12s} (conf: {backend_conf:.2f})")
                print(f"  Match:    {'✓' if result['match'] else '✗'}")
            print()
    
    # Compute metrics
    metrics = {
        'total_tests': len(results),
        'results': results,
    }
    
    if use_backend:
        matches = sum(1 for r in results if r['match'])
        accuracy = matches / len(results) if results else 0
        
        metrics['accuracy'] = accuracy
        metrics['matches'] = matches
        
        if verbose:
            print("-" * 80)
            print(f"ACCURACY: {accuracy * 100:.1f}% ({matches}/{len(results)} matches)")
            print()
    
    return metrics


# Cell 4: Example usage
def example_test():
    """Example of how to use the functions."""
    
    # Test backend connectivity
    print("1. Testing backend connectivity...")
    if not test_backend_health():
        print("Backend not available. Install and run:")
        print("  python -m uvicorn backend.main:app --port 8000")
        return
    
    print("\n2. Get a single prediction...")
    # Assuming you have a test audio file
    test_audio = "test_audio.wav"  # Replace with actual file
    
    if Path(test_audio).exists():
        notebook_result = classify_audio_notebook(test_audio)
        backend_result = classify_audio_backend(test_audio)
        
        print(f"Notebook: {notebook_result}")
        print(f"Backend:  {backend_result}")
    else:
        print(f"Test audio file not found: {test_audio}")
    
    print("\n3. Full accuracy test...")
    # Get list of test audio files
    audio_dir = Path("test_audio_samples")
    if audio_dir.exists():
        audio_files = list(audio_dir.glob("*.wav"))
        if audio_files:
            metrics = compute_accuracy_comparison([str(f) for f in audio_files])
            print(f"\nAccuracy: {metrics.get('accuracy', 0) * 100:.1f}%")
        else:
            print("No WAV files found in test_audio_samples/")
    else:
        print(f"Test audio directory not found: {audio_dir}")


# Cell 5: Optional - Stream results to file
def save_results_to_file(metrics: Dict, output_file: str = "accuracy_results.json"):
    """Save accuracy metrics to a JSON file."""
    with open(output_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Results saved to {output_file}")


# Cell 6: Optional - Visualization
def plot_accuracy_results(metrics: Dict):
    """Plot accuracy results if matplotlib is available."""
    try:
        import matplotlib.pyplot as plt
        
        results = metrics.get('results', [])
        if not results:
            print("No results to plot")
            return
        
        files = [r['file'] for r in results]
        notebook_conf = [r['notebook_confidence'] for r in results]
        backend_conf = [r['backend_confidence'] for r in results]
        
        fig, ax = plt.subplots(figsize=(12, 6))
        
        x = np.arange(len(files))
        width = 0.35
        
        ax.bar(x - width/2, notebook_conf, width, label='Notebook', alpha=0.8)
        ax.bar(x + width/2, backend_conf, width, label='Backend', alpha=0.8)
        
        ax.set_ylabel('Confidence')
        ax.set_title('Emotion Classification Confidence Comparison')
        ax.set_xticks(x)
        ax.set_xticklabels([f.split('.')[0][:10] for f in files], rotation=45, ha='right')
        ax.legend()
        ax.set_ylim([0, 1])
        
        plt.tight_layout()
        plt.show()
        
    except ImportError:
        print("matplotlib not available for plotting")


# ============================================================================
# USAGE IN NOTEBOOK:
# ============================================================================
#
# 1. Run all cells above to load functions
#
# 2. Test backend:
#    test_backend_health()
#
# 3. Test on single file:
#    classify_audio_backend("path/to/audio.wav")
#    classify_audio_notebook("path/to/audio.wav")
#
# 4. Full accuracy test:
#    metrics = compute_accuracy_comparison(audio_files_list)
#
# 5. Save and plot:
#    save_results_to_file(metrics)
#    plot_accuracy_results(metrics)
#
# ============================================================================
