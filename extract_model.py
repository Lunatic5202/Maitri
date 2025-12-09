#!/usr/bin/env python
"""Extract and analyze HYBRID_FINAL_MODEL.pt"""
import zipfile
import pickle
import numpy as np
import json
import os
import torch

model_path = r'd:\Maitri\HYBRID_FINAL_MODEL.pt'
extract_dir = r'd:\Maitri\model_extracted'

os.makedirs(extract_dir, exist_ok=True)

print("Extracting model zip...")
with zipfile.ZipFile(model_path, 'r') as z:
    z.extractall(extract_dir)

# Load the model directly from the .pt file using torch
model_path = r'd:\Maitri\HYBRID_FINAL_MODEL.pt'
print(f"Loading model from {model_path} using torch...")

try:
    import torch
    checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)
    
    print(f"✓ Successfully loaded model!")
    print(f"Type: {type(checkpoint)}")
    
    if isinstance(checkpoint, dict):
        print(f"Keys: {list(checkpoint.keys())}")
        for key in checkpoint.keys():
            val = checkpoint[key]
            print(f"  {key}: type={type(val).__name__}", end="")
            if isinstance(val, dict):
                print(f" keys={list(val.keys())[:5]}")
            elif isinstance(val, np.ndarray):
                print(f" shape={val.shape}, dtype={val.dtype}")
            elif isinstance(val, torch.Tensor):
                print(f" shape={val.shape}, dtype={val.dtype}")
            else:
                print(f" {str(val)[:50]}")
    else:
        print(f"Content: {str(checkpoint)[:200]}")
    
    data = checkpoint  # Use checkpoint as data for next step
    
except Exception as e:
    print(f"✗ Error loading model: {e}")
    import traceback
    traceback.print_exc()
    data = None

# Also save a JSON-serializable version
print("\nCreating JSON version for backend use...")
json_path = os.path.join(extract_dir, 'model_signatures.json')

try:
    if data is not None and isinstance(data, dict) and 'signatures' in data:
        sigs = data['signatures']
        json_data = {}
        for emotion, sig in sigs.items():
            if isinstance(sig, torch.Tensor):
                json_data[emotion] = sig.cpu().numpy().tolist()
            elif isinstance(sig, np.ndarray):
                json_data[emotion] = sig.tolist()
            else:
                json_data[emotion] = list(sig)
        
        with open(json_path, 'w') as f:
            json.dump(json_data, f)
        print(f"✓ Saved signatures to {json_path}")
        print(f"  Emotions: {list(json_data.keys())}")
        for emotion, sig in json_data.items():
            print(f"    {emotion}: {len(sig)} features")
    else:
        print("No 'signatures' key found in data or data is None")
        
except Exception as e:
    print(f"Error creating JSON: {e}")

