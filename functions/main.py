# main.py

import os
import io
import json
import time
import base64
import numpy as np
from PIL import Image
from gtts import gTTS
from firebase_functions import https_fn
from firebase_admin import initialize_app

# --- GLOBAL CONFIGURATION ---

# Suppress TensorFlow logs *before* any imports that might trigger it
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations

# Initialize Firebase Admin SDK (once)
initialize_app()

# Define constants
IMG_SIZE = 128
MODEL = None
LABELS = {
    0:'0', 1:'A', 2:'B', 3:'C', 4:'D', 5:'E', 6:'F', 7:'G', 8:'H', 9:'I', 
    10:'J', 11:'K', 12:'L', 13:'M', 14:'N', 15:'O', 16:'P', 17:"Q", 18:'R', 
    19:'S', 20:'T', 21:'U', 22:'V', 23:'W', 24:'X', 25:'Y', 26:'Z'
}


# --- MODEL LOADING ---

def load_model_if_needed():
    """Lazy load the ASL classifier model only once."""
    global MODEL
    if MODEL is None:
        try:
            print("🧠 Loading ASL classifier model...")
            # Import Keras lazily to avoid Firebase deploy timeouts
            import keras
            model_path = os.path.join(os.path.dirname(__file__), "asl_classifier.h5")
            MODEL = keras.models.load_model(model_path)
            print("✅ ASL classifier model loaded successfully.")
        except Exception as e:
            print(f"💥 ERROR: Could not load ASL model: {e}")
            raise
    return MODEL


# --- MAIN FUNCTION HANDLER ---

@https_fn.on_request(memory=2048, timeout_sec=120, max_instances=10)
def recognize_sign(req: https_fn.Request) -> https_fn.Response:
    """Firebase HTTPS function to recognize ASL signs and generate TTS output."""
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    # Handle CORS preflight
    if req.method == 'OPTIONS':
        print("⚙️ Handling OPTIONS preflight request")
        return https_fn.Response('', status=204, headers=headers)

    print("✅ Received request")

    try:
        model = load_model_if_needed()

        # Validate input
        request_json = req.get_json(silent=True)
        if not request_json or 'image' not in request_json:
            print("❌ Missing 'image' field in request JSON")
            return https_fn.Response(
                json.dumps({"error": "Request must include 'image' (base64 string)."}),
                status=400,
                headers=headers
            )

        # Decode image
        print("📦 Decoding base64 image data...")
        img_bytes = base64.b64decode(request_json['image'])
        print(f"📸 Image bytes length: {len(img_bytes)}")

        # Preprocess
        print("🧠 Preprocessing image...")
        image = Image.open(io.BytesIO(img_bytes)).convert('L')
        image = image.resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(image, dtype=np.float32) / 255.0
        reshaped = np.reshape(img_array, (1, IMG_SIZE, IMG_SIZE, 1))

        # Predict
        print("🧮 Running model prediction...")
        result = model.predict(reshaped, verbose=0)
        label_index = np.argmax(result, axis=1)[0]
        predicted_letter = LABELS.get(label_index, "Unknown")
        print(f"✅ Predicted letter: {predicted_letter}")

        # TTS (optional)
        print("🔊 Generating TTS audio...")
        tts_audio_data = None
        if predicted_letter.strip() and predicted_letter != "0":
            try:
                tts_path = f"/tmp/{predicted_letter}_{int(time.time())}.mp3"
                gTTS(text=predicted_letter, lang='en', slow=False).save(tts_path)
                with open(tts_path, 'rb') as f:
                    tts_audio_data = base64.b64encode(f.read()).decode('utf-8')
                os.remove(tts_path)
                print("✅ TTS generation complete.")
            except Exception as tts_e:
                print(f"⚠️ TTS Error: {tts_e}")

        # Prepare response
        response = {
            "prediction": predicted_letter,
            "tts_audio_base64": tts_audio_data,
            "message": "Sign recognized successfully."
        }

        return https_fn.Response(json.dumps(response), status=200, headers=headers)

    except Exception as e:
        print(f"💥 Function execution error: {e}")
        import traceback; traceback.print_exc()
        return https_fn.Response(
            json.dumps({"error": f"Server error: {str(e)}"}),
            status=500,
            headers=headers
        )
