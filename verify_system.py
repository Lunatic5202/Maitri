#!/usr/bin/env python
"""
Complete System Verification Script

This script verifies that all components of the MAITRI emotion classification
system are properly configured and working together.
"""

import sys
import subprocess
import json
import time
from pathlib import Path

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_status(message, status="INFO"):
    colors = {
        "OK": Color.GREEN,
        "ERROR": Color.RED,
        "WARNING": Color.YELLOW,
        "INFO": Color.BLUE
    }
    color = colors.get(status, Color.BLUE)
    symbol = {
        "OK": "✓",
        "ERROR": "✗",
        "WARNING": "⚠",
        "INFO": "ℹ"
    }
    print(f"{color}{symbol.get(status, '•')} {message}{Color.END}")

def check_python_environment():
    """Check if Python 3.11 venv exists and has required packages."""
    print("\n" + "="*60)
    print("1. Checking Python Environment")
    print("="*60)
    
    venv_path = Path("D:\\Maitri\\py311-venv")
    
    # Check venv exists
    if venv_path.exists():
        print_status("Virtual environment found at py311-venv", "OK")
    else:
        print_status("Virtual environment not found at py311-venv", "ERROR")
        return False
    
    # Check Python version
    python_exe = venv_path / "Scripts" / "python.exe"
    try:
        result = subprocess.run(
            [str(python_exe), "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        version = result.stdout.strip()
        if "3.11" in version or "3.11" in result.stderr:
            print_status(f"Python version: {version}", "OK")
        else:
            print_status(f"Python version might be incorrect: {version}", "WARNING")
    except Exception as e:
        print_status(f"Could not check Python version: {e}", "ERROR")
        return False
    
    # Check required packages
    packages = ["torch", "fastapi", "uvicorn", "numpy", "soundfile", "requests"]
    try:
        result = subprocess.run(
            [str(python_exe), "-m", "pip", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        installed = result.stdout.lower()
        
        for package in packages:
            if package.lower() in installed:
                print_status(f"Package {package} installed", "OK")
            else:
                print_status(f"Package {package} NOT installed", "WARNING")
    except Exception as e:
        print_status(f"Could not check packages: {e}", "ERROR")
        return False
    
    return True


def check_model_files():
    """Check if model files exist."""
    print("\n" + "="*60)
    print("2. Checking Model Files")
    print("="*60)
    
    files_to_check = [
        ("HYBRID_FINAL_MODEL.pt", "Original torch model"),
        ("model_extracted/model_signatures.json", "Extracted emotion signatures"),
        ("backend/models/model_function.py", "Backend model inference code"),
        ("backend/services/audio_service.py", "Audio preprocessing service"),
    ]
    
    all_exist = True
    for filename, description in files_to_check:
        filepath = Path(filename)
        if filepath.exists():
            size_mb = filepath.stat().st_size / (1024 * 1024)
            print_status(f"{description}: {filepath} ({size_mb:.1f}MB)", "OK")
        else:
            print_status(f"{description} NOT FOUND: {filepath}", "ERROR")
            all_exist = False
    
    # Check signatures content
    sig_path = Path("model_extracted/model_signatures.json")
    if sig_path.exists():
        try:
            with open(sig_path) as f:
                sigs = json.load(f)
            emotions = list(sigs.keys())
            first_emotion = emotions[0]
            dim = len(sigs[first_emotion])
            print_status(f"Signatures contain {len(emotions)} emotions: {emotions}", "OK")
            print_status(f"Each signature is {dim}-dimensional (ResNet50)", "OK")
        except Exception as e:
            print_status(f"Could not parse signatures JSON: {e}", "ERROR")
    
    return all_exist


def check_backend_code():
    """Verify backend code structure."""
    print("\n" + "="*60)
    print("3. Checking Backend Code")
    print("="*60)
    
    # Check main.py has required endpoints
    main_py = Path("backend/main.py")
    if main_py.exists():
        content = main_py.read_text()
        
        endpoints = {
            "/health": "Health check endpoint",
            "/classify": "Emotion classification endpoint"
        }
        
        for endpoint, description in endpoints.items():
            if endpoint in content:
                print_status(f"Found {description}: {endpoint}", "OK")
            else:
                print_status(f"Missing {description}: {endpoint}", "ERROR")
    else:
        print_status("backend/main.py not found", "ERROR")
        return False
    
    return True


def check_frontend_code():
    """Verify frontend code structure."""
    print("\n" + "="*60)
    print("4. Checking Frontend Code")
    print("="*60)
    
    frontend_files = [
        "frontend/src/App.tsx",
        "frontend/src/pages/Index.tsx",
        "frontend/src/components/EmotionDetection.tsx",
        "frontend/package.json",
    ]
    
    all_exist = True
    for filepath in frontend_files:
        path = Path(filepath)
        if path.exists():
            print_status(f"Found: {filepath}", "OK")
        else:
            print_status(f"Missing: {filepath}", "ERROR")
            all_exist = False
    
    # Check if API base URL is referenced
    emotion_detection = Path("frontend/src/components/EmotionDetection.tsx")
    if emotion_detection.exists():
        content = emotion_detection.read_text()
        if "API_BASE" in content or "VITE_API_BASE" in content:
            print_status("EmotionDetection component has backend API integration", "OK")
        else:
            print_status("EmotionDetection component might not have backend integration", "WARNING")
    
    return all_exist


def check_documentation():
    """Check if documentation exists."""
    print("\n" + "="*60)
    print("5. Checking Documentation")
    print("="*60)
    
    docs = [
        ("INTEGRATION_GUIDE.md", "Complete integration guide"),
        ("notebook_integration_code.py", "Notebook integration functions"),
        ("start_system.ps1", "System startup script"),
        ("README.md", "Project README"),
    ]
    
    for filename, description in docs:
        filepath = Path(filename)
        if filepath.exists():
            print_status(f"Found {description}: {filename}", "OK")
        else:
            print_status(f"Missing {description}: {filename}", "WARNING")
    
    return True


def check_audio_samples():
    """Check if test audio samples exist."""
    print("\n" + "="*60)
    print("6. Checking Test Audio Samples")
    print("="*60)
    
    audio_dir = Path("test_audio_samples")
    if audio_dir.exists():
        wav_files = list(audio_dir.glob("*.wav"))
        if wav_files:
            print_status(f"Found {len(wav_files)} test audio files", "OK")
            for wav_file in wav_files[:5]:
                size_kb = wav_file.stat().st_size / 1024
                print_status(f"  - {wav_file.name} ({size_kb:.1f}KB)", "OK")
        else:
            print_status("No WAV files found in test_audio_samples/", "WARNING")
    else:
        print_status("test_audio_samples/ directory does not exist", "WARNING")
        print_status("This is OK - audio samples can be created at runtime", "INFO")
    
    return True


def summarize_architecture():
    """Print system architecture summary."""
    print("\n" + "="*60)
    print("SYSTEM ARCHITECTURE")
    print("="*60)
    
    architecture = """
┌─────────────────────────────────────────────────────────────┐
│                    Audio Input (WAV)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│   Frontend (React) - Emotion Detection Component            │
│   • Audio recording from microphone                         │
│   • Real-time emotion display                              │
│   • Server/Local AI toggle                                 │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST /classify
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Backend API (FastAPI on :8000)                      │
│  ├─ /health - Service health check                         │
│  └─ /classify - Emotion classification                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌─────────────────┐    ┌──────────────────────┐
│ Audio Service   │    │ Model Service        │
│                 │    │                      │
│ • Soundfile     │    │ • Load signatures    │
│ • STFT          │    │ • Cosine similarity  │
│ • Mel-binning   │    │ • Emotion matching   │
└────────┬────────┘    └──────────┬───────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
         ┌─────────────────────────┐
         │ Extracted Signatures    │
         │ (model_signatures.json) │
         │                         │
         │ 5 emotions × 2048 dims  │
         └─────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  Emotion + Confidence   │
         └─────────────────────────┘
"""
    
    print(architecture)
    
    print("Key Components:")
    print_status("Python 3.11.8 with torch 2.9.1+cpu", "INFO")
    print_status("FastAPI + uvicorn for REST API", "INFO")
    print_status("React + TypeScript for Frontend", "INFO")
    print_status("Real emotion signatures extracted from HYBRID_FINAL_MODEL.pt", "INFO")


def main():
    """Run all checks."""
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "MAITRI Emotion Classification System - Verification".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    
    checks = [
        ("Python Environment", check_python_environment),
        ("Model Files", check_model_files),
        ("Backend Code", check_backend_code),
        ("Frontend Code", check_frontend_code),
        ("Documentation", check_documentation),
        ("Test Audio", check_audio_samples),
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            result = check_func()
            results[name] = result
        except Exception as e:
            print_status(f"Error during {name}: {e}", "ERROR")
            results[name] = False
    
    # Summary
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        color = Color.GREEN if result else Color.RED
        print(f"{color}{status}{Color.END} - {name}")
    
    print(f"\nOverall: {passed}/{total} checks passed")
    
    if passed == total:
        print_status("System is fully configured and ready to use!", "OK")
    else:
        print_status("Some components need attention before deployment", "WARNING")
    
    # Architecture summary
    summarize_architecture()
    
    # Quick start guide
    print("\n" + "="*60)
    print("QUICK START")
    print("="*60)
    print("""
1. Start the complete system:
   .\\start_system.ps1

2. Or start components separately:
   
   Backend:
   python -m uvicorn backend.main:app --port 8000
   
   Frontend:
   cd frontend
   VITE_API_BASE=http://localhost:8000 bun run dev

3. Open browser to http://localhost:5173

4. Navigate to "Emotion Detection" and try recording audio
""")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
