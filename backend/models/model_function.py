# models/model_function.py

def run_emotion_model(features):
    """
    Teammate must replace this with real model logic.
    - Input: 'features' (e.g., numpy array or python list)
    - Output: dict {"state": "<EmotionName>", "accuracy": 0.91}

    IMPORTANT: This function must NOT:
    - import FastAPI
    - read files from disk
    - handle raw audio bytes
    - manage HTTP requests

    Only prediction logic should live here.
    """

    # Dummy example (replace with real model):
    # e.g., if features[0] > threshold -> "Stressed" else "Calm"
    try:
        # If features is a numpy array, use features[0] safely
        first_val = float(features[0]) if len(features) else 0.0
    except Exception:
        first_val = 0.0

    if first_val > 0.5:
        state = "Stressed"
        accuracy = 0.88
    else:
        state = "Calm"
        accuracy = 0.91

    return {"state": state, "accuracy": accuracy}
