#!/usr/bin/env python
"""Try to inspect and extract HYBRID_FINAL_MODEL.pt"""
import os
import sys
import zipfile
import json

model_path = r'd:\Maitri\HYBRID_FINAL_MODEL.pt'

print(f"Checking {model_path}...")
print(f"File exists: {os.path.exists(model_path)}")
print(f"File size: {os.path.getsize(model_path) if os.path.exists(model_path) else 'N/A'} bytes")

if os.path.exists(model_path):
    # Try to open as zip (torch saves as zip internally)
    try:
        with zipfile.ZipFile(model_path, 'r') as z:
            print("\nZip contents:")
            for name in z.namelist():
                info = z.getinfo(name)
                print(f"  - {name} ({info.file_size} bytes)")
            
            # Try to read data.pkl
            if 'data.pkl' in z.namelist():
                print("\nAttempting to load data.pkl...")
                data_bytes = z.read('data.pkl')
                print(f"data.pkl size: {len(data_bytes)} bytes")
                # Don't try to unpickle yet, just show hex
                print(f"First 100 bytes (hex): {data_bytes[:100].hex()}")
    except zipfile.BadZipFile:
        print("Not a zip file, trying other approaches...")
        
        # Try reading as raw bytes and look for pickle magic
        with open(model_path, 'rb') as f:
            header = f.read(100)
            print(f"File header (hex): {header.hex()}")
            print(f"First 10 chars: {header[:10]}")
