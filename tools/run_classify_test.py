import sys
from notebook_helper import classify_via_backend_file

wav = r'D:\Maitri\tools\test_sine.wav'
url = 'http://127.0.0.1:8000'
print('Posting', wav, 'to', url + '/classify')
try:
    res = classify_via_backend_file(wav, url)
    print('Response:', res)
except Exception as e:
    print('Error while calling backend:', repr(e))
    sys.exit(2)
