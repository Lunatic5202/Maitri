#!/usr/bin/env python
"""Use pickletools to inspect pickle without torch"""
import zipfile
import pickletools
import io
import os

model_path = r'd:\Maitri\HYBRID_FINAL_MODEL.pt'
extract_dir = r'd:\Maitri\model_extracted'

# The zip was already extracted, just read the pickle
pkl_path = os.path.join(extract_dir, 'HYBRID_FINAL_MODEL', 'data.pkl')

print("Analyzing pickle structure...")
try:
    with open(pkl_path, 'rb') as f:
        # Parse without deserializing
        pickletools.dis(f)
except Exception as e:
    print(f"Error: {e}")
