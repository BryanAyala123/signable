import axios from "axios";

const MOTION_URL =
  "https://us-central1-signable-dev.cloudfunctions.net/classify_motion";

export interface MotionResult {
  sign: string;
  confidence: number;
}

/**
 * Send a landmark sequence to the classify_motion Cloud Function.
 *
 * @param frames  Array of frames; each frame is an array of 21 {x, y} objects
 *                in MediaPipe hand-landmark order (wrist = index 0).
 *                Must contain at least 10 frames.
 */
export async function classifyMotionSign(
  frames: Array<Array<{ x: number; y: number }>>
): Promise<MotionResult> {
  const res = await axios.post(
    MOTION_URL,
    JSON.stringify({ frames }),
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    }
  );
  return res.data as MotionResult;
}