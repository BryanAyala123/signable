import React, { useRef, useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  useIonToast,
  IonSpinner,
} from "@ionic/react";
import axios from "axios";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const FUNCTION_URL =
  "https://classify-landmarks-ft6ax3huaq-uc.a.run.app";
const FRAMES_TO_CAPTURE = 15;

const LandmarkCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState<string>("");
  const [presentToast] = useIonToast();

  const streamRef = useRef<MediaStream | null>(null);

  // Load MediaPipe model once
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
          numHands: 1,
          runningMode: "VIDEO",
        });
        handLandmarkerRef.current = handLandmarker;
      } catch (err) {
        console.error("Failed to load MediaPipe model:", err);
      }
    };
    loadModel();
    return () => stopCamera();
  }, []);

  // Camera controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
      setRecognizedLetter("");
    } catch (err) {
      console.error("Camera error:", err);
      presentToast({ message: "Unable to access camera.", duration: 3000 });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
    setCapturing(false);
  };

  // Function to send landmarks
const sendLandmarksToServer = async (frames: number[][]) => {
  setProcessing(true);
  setRecognizedLetter("Processing...");
  try {
    // 🔍 Log the outgoing data clearly
    console.log("[DEBUG] Sending to server:", {
      url: FUNCTION_URL,
      payload: { frames },
      frameCount: frames.length,
      firstFrame: frames[0],
    });

    const res = await axios.post(
      FUNCTION_URL,
      JSON.stringify({ frames }), // ✅ explicitly stringify
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );

    const letter = res.data?.result ?? "?";
    setRecognizedLetter(letter);
    presentToast({ message: `Detected: ${letter}`, duration: 2000 });
  } catch (err) {
    console.error("Server error:", err);
    setRecognizedLetter("Error");
    presentToast({
      message: "Prediction failed",
      duration: 3000,
      color: "danger",
    });
  } finally {
    setProcessing(false);
    setCapturing(false);
  }
};

  // Capture exactly 15 frames
  const captureFrames = async () => {
    if (!videoRef.current || !handLandmarkerRef.current) return;
    setCapturing(true);
    setRecognizedLetter("");
    const handLandmarker = handLandmarkerRef.current;
    const frames: number[][] = [];

    for (let i = 0; i < FRAMES_TO_CAPTURE; i++) {
      const now = performance.now();
      const result = handLandmarker.detectForVideo(videoRef.current, now);
      if (result.landmarks && result.landmarks[0]) {
        const lm = result.landmarks[0];
        const xs = lm.map(p => p.x);
        const ys = lm.map(p => p.y);

        const minX = Math.min(...xs);
        const minY = Math.min(...ys);

        const normalized = lm.flatMap(p => [p.x - minX, p.y - minY]);
        frames.push(normalized);
      }
      // Wait a bit between captures to simulate ~30fps (33ms per frame)
      await new Promise((resolve) => setTimeout(resolve, 33));
    }

    if (frames.length > 0) {
      await sendLandmarksToServer(frames);
    } else {
      presentToast({
        message: "No landmarks detected during capture.",
        duration: 2000,
      });
      setCapturing(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>ASL Landmark Recognition</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <video
              ref={videoRef}
              style={{
                width: "100%",
                borderRadius: "12px",
                transform: "scaleX(-1)",
                background: "#000",
              }}
              autoPlay
              muted
              playsInline
            />
          </IonCardContent>
        </IonCard>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {!isCameraOn ? (
            <IonButton onClick={startCamera}>Start Camera</IonButton>
          ) : !capturing ? (
            <IonButton onClick={captureFrames}>Start Capturing</IonButton>
          ) : (
            <IonButton color="medium" disabled>
              Capturing...
            </IonButton>
          )}
          {isCameraOn && (
            <IonButton color="danger" onClick={stopCamera}>
              Stop Camera
            </IonButton>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          {processing ? (
            <>
              <IonSpinner name="dots" />
              <IonText>
                <h3>Processing...</h3>
              </IonText>
            </>
          ) : recognizedLetter ? (
            <IonText>
              <h2>Detected: {recognizedLetter}</h2>
            </IonText>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LandmarkCapture;
