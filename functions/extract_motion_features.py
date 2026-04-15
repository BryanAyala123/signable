"""
extract_motion_features.py
Feature extraction pipeline for dynamic gesture recognition.

Each public function accepts a (T, 21, 2) float32 sequence and returns a 1-D
float32 array.  The top-level ``extract()`` runs the full pipeline:
    pad/trim → bbox normalise → extract all features → concatenate.

Feature vector layout (FEATURE_DIM = 108 values total):
    wrist_velocity        88   (dx, dy) × 44 consecutive frame pairs
    motion_dir_hist        8   normalised histogram of wrist movement angles
    fingertip_spread       7   summary stats of mean inter-fingertip distance
    hand_shape_change      4   summary stats of mean per-frame landmark displacement
    trajectory_curvature   1   total path length ÷ straight-line displacement
"""

import numpy as np

# ── Constants ─────────────────────────────────────────────────────────────────
WINDOW_SIZE   = 45          # all sequences are padded/trimmed to this length
N_LANDMARKS   = 21
WRIST_IDX     = 0
FINGERTIP_IDX = [4, 8, 12, 16, 20]   # thumb, index, middle, ring, pinky tips
N_DIR_BINS    = 8
EPSILON       = 1e-8                  # guards every division against zero

# ── Preprocessing ─────────────────────────────────────────────────────────────

def pad_or_trim(seq: np.ndarray, window_size: int = WINDOW_SIZE) -> np.ndarray:
    """
    Ensure ``seq`` has exactly ``window_size`` frames.

    - Sequences shorter than ``window_size`` are padded by repeating the last
      frame (holds the final pose rather than jumping back to zero).
    - Sequences longer than ``window_size`` are trimmed from the end (keeps the
      sign onset, which is most distinctive).

    Args:
        seq: (T, 21, 2) float32 array
    Returns:
        (window_size, 21, 2) float32 array
    """
    if seq.ndim != 3 or seq.shape[1:] != (N_LANDMARKS, 2):
        raise ValueError(f'Expected (T, {N_LANDMARKS}, 2), got {seq.shape}')

    T = seq.shape[0]
    if T == window_size:
        return seq.copy()
    if T > window_size:
        return seq[:window_size].copy()
    pad = np.repeat(seq[-1:], window_size - T, axis=0)
    return np.concatenate([seq, pad], axis=0).astype(np.float32)


def normalize_bbox(seq: np.ndarray) -> np.ndarray:
    """
    Normalize (x, y) to [0, 1] using the bounding box of ALL landmarks across
    ALL frames in the sequence.

    A single global bounding box is used deliberately — per-frame normalization
    would erase positional drift between frames, destroying velocity signals.
    This matches the spirit of the static-model preprocessing (create_dataset.py)
    while preserving inter-frame motion.

    Args:
        seq: (T, 21, 2) float32 array
    Returns:
        (T, 21, 2) float32 array, values in [0, 1]
    """
    x_min = seq[:, :, 0].min()
    x_max = seq[:, :, 0].max()
    y_min = seq[:, :, 1].min()
    y_max = seq[:, :, 1].max()

    out = seq.copy()
    out[:, :, 0] = (seq[:, :, 0] - x_min) / (x_max - x_min + EPSILON)
    out[:, :, 1] = (seq[:, :, 1] - y_min) / (y_max - y_min + EPSILON)
    return out.astype(np.float32)


# ── Feature extractors ────────────────────────────────────────────────────────

def wrist_velocity(seq: np.ndarray) -> np.ndarray:
    """
    (dx, dy) of the wrist (landmark 0) for each consecutive frame pair,
    normalised by the mean wrist speed over the sequence.

    Speed normalisation makes fast and slow signers produce comparable vectors:
    a "hello" wave looks the same whether the signer moves quickly or slowly.

    Output layout: [dx_0, dy_0, dx_1, dy_1, …, dx_43, dy_43]

    Args:
        seq: (WINDOW_SIZE, 21, 2) preprocessed sequence
    Returns:
        (2 * (WINDOW_SIZE - 1),) = (88,) float32
    """
    wrist    = seq[:, WRIST_IDX, :]         # (T, 2)
    vel      = np.diff(wrist, axis=0)        # (T-1, 2)
    speed    = np.linalg.norm(vel, axis=1)   # (T-1,)  per-frame speed
    mean_spd = speed.mean() + EPSILON        # scalar normaliser
    vel_norm = vel / mean_spd
    return vel_norm.flatten().astype(np.float32)


def motion_direction_histogram(seq: np.ndarray, n_bins: int = N_DIR_BINS) -> np.ndarray:
    """
    Normalised histogram of wrist movement directions (0–360°) using 8 bins.

    Captures the *arc shape* of a sign:
      - hello (waving arc) → energy spread across multiple bins
      - thank you (straight forward-and-down) → energy in 1–2 adjacent bins
      - please (circular rub) → energy spread evenly across all bins

    Frames where the wrist is stationary (speed < EPSILON) are excluded so
    noise during held poses does not pollute the histogram.

    Args:
        seq: (WINDOW_SIZE, 21, 2) preprocessed sequence
    Returns:
        (n_bins,) float32 — bin counts normalised to sum to 1
    """
    wrist = seq[:, WRIST_IDX, :]
    vel   = np.diff(wrist, axis=0)           # (T-1, 2)
    speed = np.linalg.norm(vel, axis=1)

    moving = speed > EPSILON
    if not moving.any():
        return np.zeros(n_bins, dtype=np.float32)

    angles = np.degrees(np.arctan2(vel[moving, 1], vel[moving, 0])) % 360.0
    hist, _ = np.histogram(angles, bins=n_bins, range=(0.0, 360.0))
    hist = hist / (hist.sum() + EPSILON)
    return hist.astype(np.float32)


def fingertip_spread(seq: np.ndarray) -> np.ndarray:
    """
    Mean pairwise Euclidean distance between the 5 fingertips per frame,
    summarised into 7 statistics.

    Captures the open↔close cycle in signs like *goodbye*:
      - high mean spread + large negative delta → hand opens then closes
      - low std + near-zero delta → hand stays open (hello) or closed

    Output layout: [mean, std, min, max, spread_at_frame_0, spread_at_frame_T, delta]

    Args:
        seq: (WINDOW_SIZE, 21, 2) preprocessed sequence
    Returns:
        (7,) float32
    """
    tips = seq[:, FINGERTIP_IDX, :]     # (T, 5, 2)

    # Vectorised pairwise distances: (T, 5, 5)
    diff  = tips[:, :, np.newaxis, :] - tips[:, np.newaxis, :, :]
    dists = np.linalg.norm(diff, axis=-1)

    # Upper-triangle mask: 10 unique pairs from 5 tips
    mask            = np.triu(np.ones((5, 5), dtype=bool), k=1)
    spread_per_frame = dists[:, mask].mean(axis=1)   # (T,)

    s = spread_per_frame
    return np.array([
        s.mean(),
        s.std(),
        s.min(),
        s.max(),
        s[0],          # spread at start of sequence
        s[-1],         # spread at end of sequence
        s[-1] - s[0],  # delta: negative = hand is closing, positive = opening
    ], dtype=np.float32)


def hand_shape_change(seq: np.ndarray) -> np.ndarray:
    """
    Mean displacement of ALL 21 landmarks between consecutive frames,
    summarised into 4 statistics.

    Measures how much the hand shape changes each frame — not just where the
    wrist goes, but the whole configuration:
      - high for cycling signs (goodbye) where fingers repeatedly open/close
      - low for static-shape signs (hello) where the hand shape stays open

    Output layout: [mean, std, max, total_path_length]

    Args:
        seq: (WINDOW_SIZE, 21, 2) preprocessed sequence
    Returns:
        (4,) float32
    """
    diff      = np.diff(seq, axis=0)                     # (T-1, 21, 2)
    per_lm    = np.linalg.norm(diff, axis=2)             # (T-1, 21)
    per_frame = per_lm.mean(axis=1)                      # (T-1,) mean over landmarks

    return np.array([
        per_frame.mean(),
        per_frame.std(),
        per_frame.max(),
        per_frame.sum(),   # total cumulative shape-change path length
    ], dtype=np.float32)


def trajectory_curvature(seq: np.ndarray) -> np.ndarray:
    """
    Ratio of the wrist's total path length to its straight-line displacement:

        curvature = Σ |vel_t| / (|wrist_end − wrist_start| + ε)

    Interpretation:
      - please (circular rub on chest) → >> 1.0 (long path, starts/ends same spot)
      - thank you (single forward arc) → ≈ 1.2–1.5
      - straight motion                → ≈ 1.0

    Args:
        seq: (WINDOW_SIZE, 21, 2) preprocessed sequence
    Returns:
        (1,) float32
    """
    wrist    = seq[:, WRIST_IDX, :]
    vel      = np.diff(wrist, axis=0)
    path_len = np.linalg.norm(vel, axis=1).sum()
    straight = np.linalg.norm(wrist[-1] - wrist[0]) + EPSILON
    return np.array([path_len / straight], dtype=np.float32)


# ── Feature registry ──────────────────────────────────────────────────────────

# Each entry: (name, function, expected output length)
# Order here defines the layout of the flat feature vector.
FEATURE_SPECS: list[tuple[str, callable, int]] = [
    ('wrist_velocity',       wrist_velocity,             2 * (WINDOW_SIZE - 1)),  # 88
    ('motion_dir_hist',      motion_direction_histogram,  N_DIR_BINS),             #  8
    ('fingertip_spread',     fingertip_spread,            7),                      #  7
    ('hand_shape_change',    hand_shape_change,           4),                      #  4
    ('trajectory_curvature', trajectory_curvature,        1),                      #  1
]

FEATURE_DIM: int = sum(length for _, _, length in FEATURE_SPECS)   # 108


# ── Public API ─────────────────────────────────────────────────────────────────

def extract(seq: np.ndarray) -> np.ndarray:
    """
    Full pipeline: pad/trim → bbox-normalize → extract all features.

    Args:
        seq: (T, 21, 2) raw landmark sequence produced by collect_motion_imgs.py
             T does not need to equal WINDOW_SIZE — padding/trimming is applied.
    Returns:
        (FEATURE_DIM,) = (108,) float32 flat feature vector
    Raises:
        ValueError: if seq has the wrong number of dimensions or landmarks
        RuntimeError: if assembled vector length doesn't match FEATURE_DIM
    """
    if seq.ndim != 3 or seq.shape[1:] != (N_LANDMARKS, 2):
        raise ValueError(f'Expected (T, {N_LANDMARKS}, 2), got {seq.shape}')

    seq = pad_or_trim(seq)
    seq = normalize_bbox(seq)

    parts = [fn(seq) for _, fn, _ in FEATURE_SPECS]
    vec   = np.concatenate(parts).astype(np.float32)

    if vec.shape[0] != FEATURE_DIM:
        raise RuntimeError(
            f'Feature dimension mismatch: expected {FEATURE_DIM}, got {vec.shape[0]}'
        )
    return vec


def feature_names() -> list[str]:
    """
    Return a human-readable name for each position in the feature vector.
    Useful for debugging, logging, and feature importance analysis.
    """
    names = []
    for feat_name, _, length in FEATURE_SPECS:
        if length == 1:
            names.append(feat_name)
        else:
            names.extend(f'{feat_name}_{i}' for i in range(length))
    return names
