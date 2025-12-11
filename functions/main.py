"""Firebase HTTPS function for ASL recognition (expects multiple frames of landmark coordinates)."""
from __future__ import annotations
import json, pickle, os
import numpy as np
from collections import Counter
from firebase_functions import https_fn
from firebase_admin import initialize_app

initialize_app()

# --- Lazy model loader ---
MODEL = None
LABELS_DICT = {i: chr(65 + i) for i in range(26)}  # 0->A, 1->B, ...

def load_model_if_needed():
    """Loads the pickled model into memory if not already loaded."""
    global MODEL
    if MODEL is None:
        model_path = os.path.join(os.path.dirname(__file__), "model-V2.p")
        with open(model_path, "rb") as f:
            model_dict = pickle.load(f)
        MODEL = model_dict["model"]
        print("✅ Model loaded successfully.")
    return MODEL


@https_fn.on_request()
def classify_landmarks(req: https_fn.Request) -> https_fn.Response:
    """Receives a list of 15 landmark frames, predicts each, and returns the majority-voted letter."""

    # ---- Handle CORS preflight ----
    if req.method == "OPTIONS":
        return https_fn.Response(
            "",
            status=204,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        )

    try:
        # ---- Parse JSON body ----
        data = req.get_json(silent=True)
        if data is None and req.data:
            try:
                data = json.loads(req.data.decode("utf-8"))
            except Exception as parse_err:
                print("❌ JSON parse error:", parse_err)
                data = None

        print("DEBUG: got body:", data)

        if not data or "frames" not in data:
            return https_fn.Response(
                json.dumps({"error": "Missing 'frames' key"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        frames = data["frames"]
        if not isinstance(frames, list) or len(frames) == 0:
            return https_fn.Response(
                json.dumps({"error": "'frames' must be a non-empty list"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        print(f"🪞 Received {len(frames)} frames from client")

        # ---- Predict for each frame ----
        model = load_model_if_needed()
        predictions = []
        for i, frame in enumerate(frames):
            if not isinstance(frame, list) or len(frame) != 42:
                print(f"⚠️ Skipping invalid frame {i}")
                continue
            arr = np.asarray(frame)
            pred = model.predict([arr])
            predictions.append(int(pred[0]))

        if not predictions:
            return https_fn.Response(
                json.dumps({"error": "No valid frames detected"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        letters = [LABELS_DICT[p] for p in predictions]
        counts = Counter(letters)
        most_common_letter, freq = counts.most_common(1)[0]

        result = {
            "result": most_common_letter,
            "counts": counts,
            "frames_processed": len(frames),
        }

        # ✅ Always return CORS header
        return https_fn.Response(
            json.dumps(result, default=str),
            status=200,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"},
        )

    except Exception as e:
        print("💥 Exception:", str(e))
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"},
        )