import React, { useRef, useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  useIonToast,
  IonSpinner,
  IonFooter,
} from "@ionic/react";
import axios from "axios";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

import AppHeader from "../layout/AppHeader";
import AppFooter from "../layout/AppFooter";

import play from "/public/assets/Buttons/playButton.svg";
import "./FreePlay.css";

const FUNCTION_URL = "https://classify-landmarks-ft6ax3huaq-uc.a.run.app";
const FRAMES_TO_CAPTURE = 15;

const LandmarkCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState<string>("");

  const [presentToast] = useIonToast();
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
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
      setRecognizedLetter("");
    } catch (err) {
      console.error("Camera error:", err);
      presentToast({ message: "Unable to access camera.", duration: 3000 });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };

  // Load MediaPipe model + start camera
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
        await startCamera();
      } catch (err) {
        console.error("Failed to load MediaPipe model:", err);
      }
    };

    loadModel();
    return () => stopCamera();
  }, []);

  // Send landmarks to server
  const sendLandmarksToServer = async (frames: number[][]) => {
    setProcessing(true);
    setRecognizedLetter("Processing...");

    try {
      console.log("[DEBUG] Sending to server:", {
        url: FUNCTION_URL,
        payload: { frames },
        frameCount: frames.length,
        firstFrame: frames[0],
      });

      const res = await axios.post(
        FUNCTION_URL,
        JSON.stringify({ frames }),
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const letter = res.data?.result ?? "?";
      setRecognizedLetter(letter);
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

        const xs = lm.map((p) => p.x);
        const ys = lm.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);

        const normalized = lm.flatMap((p) => [p.x - minX, p.y - minY]);
        frames.push(normalized);
      }

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
        <AppHeader />
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="free-play-SLR-MainContent">
          <div className="free-play-SLR-LeftContent">
            <IonCard className="free-play-SLR-ionCard">
              <IonCardContent>
                <video
                  ref={videoRef}
                  className="free-play-SLR-video-preview"
                  autoPlay
                  muted
                  playsInline
                />
              </IonCardContent>
            </IonCard>
          </div>

          <div className="free-play-SLR-RightContent">
            <div className="free-play-SLR-result-container">
              <div className="free-play-SLR-result-container-header">
                <p>Letter Signed:</p>
              </div>

              <div className="free-play-SLR-result-container-text">
                {processing ? (
                  <>
                    <IonSpinner name="dots" />
                    <IonText>
                      <h3>Processing...</h3>
                    </IonText>
                  </>
                ) : recognizedLetter ? (
                  <IonText>
                    <h2 className="free-play-SLR-letterSigned">{recognizedLetter}</h2>
                  </IonText>
                ) : null}
              </div>
            </div>

            <div className="free-play-SLR-button-container">
              <p>Start Processing</p>
              {!capturing ? (
                <IonButton onClick={captureFrames}>
                  <img className="free-play-SLR-playImage" src={play} />
                </IonButton>
              ) : (
                <p> Processing... </p>
              )}
            </div>
          </div>
        </div>
      </IonContent>

      <IonFooter>
        <AppFooter />
      </IonFooter>
    </IonPage>
  );
};

export default LandmarkCapture;
