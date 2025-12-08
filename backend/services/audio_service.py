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

TARGET_SR = 16000    # sampling rate for model
DURATION = 4.0       # seconds; backend pads/truncates to this length
N_MELS = 64          # mel bins for log-mel

def read_audio_bytes(audio_bytes: bytes, sr: int = TARGET_SR, max_duration: float = DURATION):
    # Read with soundfile (handles wav, flac, etc.)
    data, orig_sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
    # make mono if needed
    if data.ndim > 1:
        data = data.mean(axis=1)
    # resample to target sr (lightweight numpy-based resampling)
    if orig_sr != sr:
        # simple linear interpolation resample to avoid heavy external deps
        resample_factor = float(sr) / float(orig_sr)
        new_len = int(np.ceil(len(data) * resample_factor))
        old_idx = np.arange(len(data))
        new_idx = np.linspace(0, len(data) - 1, new_len)
        data = np.interp(new_idx, old_idx, data).astype('float32')
    # trim or pad to max_duration
    max_len = int(sr * max_duration)
    if len(data) > max_len:
        data = data[:max_len]
    else:
        data = np.pad(data, (0, max_len - len(data)), mode='constant')
    return data

def extract_log_mel(audio: np.ndarray, sr: int = TARGET_SR, n_mels: int = N_MELS):
    # Lightweight spectrogram-based features without librosa.
    # Compute short-time Fourier magnitude spectrogram
    n_fft = 512
    hop_length = 256
    # number of frames
    frames = 1 + (len(audio) - n_fft) // hop_length if len(audio) >= n_fft else 1
    # pad if needed
    if len(audio) < n_fft:
        audio = np.pad(audio, (0, n_fft - len(audio)), mode='constant')

    # build frames and compute positive-frequency FFT magnitude directly
    pos_freq_bins = (n_fft // 2) + 1
    S = np.empty((pos_freq_bins, frames), dtype=np.float32)
    for i in range(frames):
        start = i * hop_length
        frame = audio[start:start + n_fft]
        if len(frame) < n_fft:
            frame = np.pad(frame, (0, n_fft - len(frame)), mode='constant')
        windowed = frame * np.hanning(len(frame))
        spec = np.fft.rfft(windowed)
        S[:, i] = np.abs(spec).astype(np.float32)

    # reduce frequency bins to n_mels by averaging contiguous bins
    freq_bins = S.shape[0]
    bins_per_mel = max(1, freq_bins // n_mels)
    mel_S = np.zeros((n_mels, S.shape[1]), dtype=np.float32)
    for m in range(n_mels):
        start_bin = m * bins_per_mel
        end_bin = start_bin + bins_per_mel
        mel_S[m, :] = S[start_bin:end_bin, :].mean(axis=0)

    # convert to dB-like scale
    log_S = 20.0 * np.log10(np.maximum(mel_S, 1e-10))
    # standardize
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
