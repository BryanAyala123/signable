"""Firebase HTTPS functions for ASL recognition (static alphabet + dynamic motion signs)."""
from __future__ import annotations
import json, pickle, os
import numpy as np
from collections import Counter
from firebase_functions import https_fn
from firebase_admin import initialize_app
from extract_motion_features import extract

initialize_app()

# --- Lazy model loaders ---
MODEL = None
MOTION_MODEL = None
LABELS_DICT = {i: chr(65 + i) for i in range(26)}  # 0->A, 1->B, ...

# Minimum frames required for a motion classification request
MIN_MOTION_FRAMES = 10

def load_model_if_needed():
    """Loads the pickled alphabet model (model-V2.p) into memory if not already loaded."""
    global MODEL
    if MODEL is None:
        model_path = os.path.join(os.path.dirname(__file__), "model-V2.p")
        with open(model_path, "rb") as f:
            model_dict = pickle.load(f)
        MODEL = model_dict["model"]
        print("✅ Alphabet model loaded successfully.")
    return MODEL


MOTION_LABEL_MAP: dict[str, str] = {
    "0": "goodbye",
    "1": "hello",
    "2": "please",
    "3": "thank you",
}


def load_motion_model_if_needed():
    """Loads the pickled motion model (motion_model_V1.p) into memory if not already loaded."""
    global MOTION_MODEL
    if MOTION_MODEL is None:
        model_path = os.path.join(os.path.dirname(__file__), "motion_model_V1.p")
        with open(model_path, "rb") as f:
            data = pickle.load(f)
        # Support both {"model": estimator} dict and a bare estimator object
        MOTION_MODEL = data["model"] if isinstance(data, dict) else data
        print("✅ Motion model loaded successfully.")
    return MOTION_MODEL


def _sigmoid(x: float) -> float:
    """Map an unbounded SVM decision score to (0, 1)."""
    return float(1.0 / (1.0 + np.exp(-float(x))))


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


@https_fn.on_request()
def classify_motion(req: https_fn.Request) -> https_fn.Response:
    """
    Classify a dynamic ASL sign from a hand-landmark sequence.

    Request JSON schema
    -------------------
    {
        "frames": [
            [{"x": 0.12, "y": 0.34}, ...],   // 21 landmarks per frame (MediaPipe order)
            ...                               // >= MIN_MOTION_FRAMES frames required
        ]
    }

    Response JSON schema
    --------------------
    { "sign": "hello", "confidence": 0.87 }

    confidence is the SVM decision-function score for the predicted class passed
    through a sigmoid, giving a value in (0, 1).
    """

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

        if not data or "frames" not in data:
            return https_fn.Response(
                json.dumps({"error": "Missing 'frames' key"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        frames = data["frames"]
        if not isinstance(frames, list):
            return https_fn.Response(
                json.dumps({"error": "'frames' must be an array"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        # ---- Minimum frame count validation ----
        if len(frames) < MIN_MOTION_FRAMES:
            return https_fn.Response(
                json.dumps({
                    "error": f"Sequence too short: got {len(frames)} frames, need >= {MIN_MOTION_FRAMES}"
                }),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        print(f"🎬 Motion: received {len(frames)} frames from client")

        # ---- Parse frames into (T, 21, 2) numpy array ----
        try:
            seq = np.array(
                [[[lm["x"], lm["y"]] for lm in frame] for frame in frames],
                dtype=np.float32,
            )
        except (KeyError, TypeError) as e:
            return https_fn.Response(
                json.dumps({"error": f"Invalid landmark format — each landmark must be {{x, y}}: {e}"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        if seq.shape[1] != 21:
            return https_fn.Response(
                json.dumps({"error": f"Each frame must have 21 landmarks, got {seq.shape[1]}"}),
                status=400,
                mimetype="application/json",
                headers={"Access-Control-Allow-Origin": "*"},
            )

        # ---- Feature extraction (pad/trim → bbox-normalize → 108-d vector) ----
        feature_vec = extract(seq)   # (108,) float32

        # ---- Inference ----
        model = load_motion_model_if_needed()
        pred_label = model.predict([feature_vec])[0]

        # ---- Confidence: sigmoid of the decision score for predicted class ----
        scores_raw = model.decision_function([feature_vec])  # (1, n_classes) or (1,)
        scores = scores_raw[0]                               # (n_classes,) or scalar
        classes = list(model.classes_)

        if np.ndim(scores) == 0 or (hasattr(scores, "__len__") and len(scores) == 1):
            # Binary SVM: single score
            raw_score = float(np.ravel(scores)[0])
            all_scores = {}
        else:
            pred_idx = classes.index(pred_label)
            raw_score = float(scores[pred_idx])
            all_scores = {str(cls): round(_sigmoid(float(s)), 4)
                          for cls, s in zip(classes, scores)}

        confidence = round(_sigmoid(raw_score), 4)

        # ---- Debug: log full score distribution ----
        print(f"🔍 Model classes ({len(classes)}): {classes}")
        print(f"🔍 Feature vec — mean={feature_vec.mean():.4f}, std={feature_vec.std():.4f}, "
              f"min={feature_vec.min():.4f}, max={feature_vec.max():.4f}")
        print(f"🔍 All scores: {all_scores}")
        # ---- Apply label map (numeric model class → human-readable sign name) ----
        sign_label = MOTION_LABEL_MAP.get(str(pred_label), str(pred_label))
        print(f"✅ Motion prediction: {pred_label} → {sign_label} (confidence={confidence})")

        return https_fn.Response(
            json.dumps({
                "sign": sign_label,
                "confidence": confidence,
                "_debug": {
                    "all_scores": all_scores,
                    "classes": [str(c) for c in classes],
                    "feature_stats": {
                        "mean": round(float(feature_vec.mean()), 4),
                        "std":  round(float(feature_vec.std()),  4),
                        "min":  round(float(feature_vec.min()),  4),
                        "max":  round(float(feature_vec.max()),  4),
                    },
                },
            }),
            status=200,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"},
        )

    except Exception as e:
        print("💥 classify_motion exception:", str(e))
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"},
        )