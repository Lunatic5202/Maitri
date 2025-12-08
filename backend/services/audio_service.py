# services/audio_service.py
"""
Audio preprocessing: read uploaded audio bytes, resample/pad to a fixed length,
and produce features (log-mel) to pass to ML function.

Your teammate will receive whatever 'features' this function returns.
Adjust n_mels / durations as needed to match your teammate's expectations.
"""
import io
import numpy as np
import soundfile as sf
import librosa

TARGET_SR = 16000    # sampling rate for model
DURATION = 4.0       # seconds; backend pads/truncates to this length
N_MELS = 64          # mel bins for log-mel

def read_audio_bytes(audio_bytes: bytes, sr: int = TARGET_SR, max_duration: float = DURATION):
    # Read with soundfile (handles wav, flac, etc.)
    data, orig_sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
    # make mono if needed
    if data.ndim > 1:
        data = data.mean(axis=1)
    # resample to target sr
    if orig_sr != sr:
        data = librosa.resample(data, orig_sr=orig_sr, target_sr=sr)
    # trim or pad to max_duration
    max_len = int(sr * max_duration)
    if len(data) > max_len:
        data = data[:max_len]
    else:
        data = np.pad(data, (0, max_len - len(data)), mode='constant')
    return data

def extract_log_mel(audio: np.ndarray, sr: int = TARGET_SR, n_mels: int = N_MELS):
    # compute mel spectrogram and convert to log scale
    S = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=n_mels, power=2.0)
    log_S = librosa.power_to_db(S, ref=np.max)
    # standardize (optional)
    log_S = (log_S - log_S.mean()) / (log_S.std() + 1e-6)
    return log_S.astype('float32')

def make_model_input(audio_bytes: bytes):
    """
    Final output is 'features' passed to teammate function.
    Current shape: (1, 1, n_mels, T)  -- batch + channel + mel + time
    Teammate should expect this format or we can change it to match them.
    """
    audio = read_audio_bytes(audio_bytes)
    feat = extract_log_mel(audio)
    # add batch & channel dims: (1,1,n_mels,T)
    return feat[np.newaxis, np.newaxis, :, :]
