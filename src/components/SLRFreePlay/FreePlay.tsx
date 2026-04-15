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
import { classifyMotionSign } from "../../services/motionClassification";

import play from "/public/assets/Buttons/playButton.svg";
import "./FreePlay.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const ALPHABET_URL   = "https://classify-landmarks-ft6ax3huaq-uc.a.run.app";
const ALPHABET_FRAMES = 15;
const WINDOW_SIZE    = 45;   // must match training WINDOW_SIZE
const CONFIDENCE_THRESHOLD = 0.7;

type Mode = "alphabet" | "words";

// ── Component ─────────────────────────────────────────────────────────────────
const LandmarkCapture: React.FC = () => {
  const videoRef        = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("alphabet");

  // Alphabet state
  const [capturing,        setCapturing]        = useState(false);
  const [processing,       setProcessing]       = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState<string>("");

  // Words state (UI)
  const [wordRecording,   setWordRecording]   = useState(false);   // hand in frame, collecting
  const [wordCooldown,    setWordCooldown]     = useState(false);   // waiting for hand to leave
  const [wordProcessing,  setWordProcessing]  = useState(false);   // API call in-flight
  const [frameCount,      setFrameCount]      = useState(0);       // progress bar
  const [motionSign,      setMotionSign]       = useState<string>("");
  const [motionConfidence,setMotionConfidence] = useState<number>(0);
  const [lowConfidence,   setLowConfidence]    = useState(false);

  // Words refs (read inside RAF — state is stale there)
  const frameBufferRef  = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const recordingRef    = useRef(false);
  const cooldownRef     = useRef(false);
  const processingRef   = useRef(false);
  const loopActiveRef   = useRef(false);
  const rafIdRef        = useRef<number | null>(null);

  const [presentToast] = useIonToast();

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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
  };

  // ── Load MediaPipe + camera on mount ──────────────────────────────────────
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

  // ── Words mode: classify collected buffer ─────────────────────────────────
  const classifyBuffer = async (frames: Array<Array<{ x: number; y: number }>>) => {
    processingRef.current = true;
    setWordProcessing(true);
    try {
      const result = await classifyMotionSign(frames);
      if (result.confidence >= CONFIDENCE_THRESHOLD) {
        setMotionSign(result.sign);
        setMotionConfidence(result.confidence);
        setLowConfidence(false);
      } else {
        setLowConfidence(true);
        setMotionSign("");
        setMotionConfidence(0);
      }
    } catch (err) {
      console.error("Motion classify error:", err);
      presentToast({ message: "Prediction failed.", duration: 3000, color: "danger" });
    } finally {
      processingRef.current  = false;
      cooldownRef.current    = true;    // wait for hand to leave before next attempt
      setWordProcessing(false);
      setWordCooldown(true);
    }
  };

  // ── Words mode: RAF loop — mirrors training collection script logic ────────
  const motionLoop = () => {
    if (!loopActiveRef.current) return;

    if (
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      handLandmarkerRef.current
    ) {
      let result;
      try {
        result = handLandmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now()
        );
      } catch {
        rafIdRef.current = requestAnimationFrame(motionLoop);
        return;
      }

      const handPresent = Boolean(result.landmarks?.[0]);

      if (cooldownRef.current) {
        // Saved a sequence — wait for hand to leave before auto-starting again
        if (!handPresent) {
          cooldownRef.current = false;
          setWordCooldown(false);
        }
      } else if (processingRef.current) {
        // API call in-flight — do nothing
      } else if (recordingRef.current) {
        if (handPresent) {
          // Accumulate frame
          const frame = result.landmarks![0].map((p) => ({ x: p.x, y: p.y }));
          frameBufferRef.current.push(frame);
          setFrameCount(frameBufferRef.current.length);

          if (frameBufferRef.current.length >= WINDOW_SIZE) {
            // Buffer full — classify
            const snapshot = [...frameBufferRef.current];
            frameBufferRef.current = [];
            recordingRef.current   = false;
            setWordRecording(false);
            setFrameCount(0);
            classifyBuffer(snapshot);
          }
        } else {
          // Hand lost mid-sequence — discard
          frameBufferRef.current = [];
          recordingRef.current   = false;
          setWordRecording(false);
          setFrameCount(0);
        }
      } else {
        // Idle — start recording as soon as hand appears
        if (handPresent) {
          const frame = result.landmarks![0].map((p) => ({ x: p.x, y: p.y }));
          frameBufferRef.current = [frame];
          recordingRef.current   = true;
          setWordRecording(true);
          setFrameCount(1);
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(motionLoop);
  };

  // ── Start/stop RAF loop when switching to/from Words ─────────────────────
  useEffect(() => {
    if (mode === "words") {
      frameBufferRef.current = [];
      recordingRef.current   = false;
      cooldownRef.current    = false;
      processingRef.current  = false;
      setWordRecording(false);
      setWordCooldown(false);
      setWordProcessing(false);
      setFrameCount(0);
      setMotionSign("");
      setMotionConfidence(0);
      setLowConfidence(false);

      loopActiveRef.current = true;
      rafIdRef.current = requestAnimationFrame(motionLoop);
    } else {
      loopActiveRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
    return () => {
      loopActiveRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [mode]);

  // ── Alphabet mode ─────────────────────────────────────────────────────────
  const captureAlphabet = async () => {
    if (!videoRef.current || !handLandmarkerRef.current) return;
    setCapturing(true);
    setProcessing(false);
    setRecognizedLetter("");

    const handLandmarker = handLandmarkerRef.current;
    const frames: number[][] = [];

    for (let i = 0; i < ALPHABET_FRAMES; i++) {
      const result = handLandmarker.detectForVideo(videoRef.current, performance.now());
      if (result.landmarks?.[0]) {
        const lm = result.landmarks[0];
        const minX = Math.min(...lm.map((p) => p.x));
        const minY = Math.min(...lm.map((p) => p.y));
        frames.push(lm.flatMap((p) => [p.x - minX, p.y - minY]));
      }
      await new Promise((r) => setTimeout(r, 33));
    }

    if (frames.length === 0) {
      presentToast({ message: "No hand detected.", duration: 2000 });
      setCapturing(false);
      return;
    }

    setCapturing(false);
    setProcessing(true);
    try {
      const res = await axios.post(
        ALPHABET_URL,
        JSON.stringify({ frames }),
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );
      setRecognizedLetter(res.data?.result ?? "?");
    } catch (err) {
      console.error("Alphabet classify error:", err);
      presentToast({ message: "Prediction failed.", duration: 3000, color: "danger" });
    } finally {
      setProcessing(false);
    }
  };

  const handleModeChange = (next: Mode) => {
    setMode(next);
    setRecognizedLetter("");
    setMotionSign("");
    setMotionConfidence(0);
    setLowConfidence(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const isWordsMode   = mode === "words";
  const alphabetBusy  = capturing || processing;
  const progressPct   = Math.round((frameCount / WINDOW_SIZE) * 100);

  // Words hint text — mirrors training script UI
  const wordsHint = wordCooldown
    ? "Lower your hand to reset"
    : wordRecording
    ? `${frameCount} / ${WINDOW_SIZE} frames`
    : "Show your hand to start";

  return (
    <IonPage>
      <IonHeader><AppHeader /></IonHeader>

      <IonContent className="ion-padding">
        <div className="free-play-SLR-MainContent">

          {/* Video */}
          <div className="free-play-SLR-LeftContent">
            <IonCard className="free-play-SLR-ionCard">
              <IonCardContent>
                <div className="free-play-SLR-video-container">
                  <video
                    ref={videoRef}
                    className={`free-play-SLR-video-preview${(capturing || wordRecording) ? " recording" : ""}`}
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* REC badge — shown during recording in either mode */}
                  {(capturing || wordRecording) && (
                    <div className="free-play-SLR-recording-badge">
                      <span className="free-play-SLR-recording-dot" />
                      REC
                    </div>
                  )}

                  {/* Words mode: progress bar overlay */}
                  {isWordsMode && wordRecording && (
                    <div className="free-play-SLR-progress-bar-container">
                      <div
                        className="free-play-SLR-progress-bar-fill"
                        style={{ width: `${progressPct}%` }}
                      />
                      <span className="free-play-SLR-progress-label">
                        {frameCount} / {WINDOW_SIZE} frames
                      </span>
                    </div>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Right panel */}
          <div className="free-play-SLR-RightContent">

            {/* Mode toggle */}
            <div className="free-play-SLR-mode-toggle">
              <button
                className={`free-play-SLR-mode-btn${mode === "alphabet" ? " active" : ""}`}
                onClick={() => handleModeChange("alphabet")}
              >
                Alphabet
              </button>
              <button
                className={`free-play-SLR-mode-btn${mode === "words" ? " active" : ""}`}
                onClick={() => handleModeChange("words")}
              >
                Words
              </button>
            </div>

            {/* Result box */}
            <div className="free-play-SLR-result-container">
              <div className="free-play-SLR-result-container-header">
                <p>{isWordsMode ? "Sign Detected:" : "Letter Signed:"}</p>
              </div>

              <div className="free-play-SLR-result-container-text">
                {isWordsMode ? (
                  wordProcessing ? (
                    <>
                      <IonSpinner name="dots" />
                      <IonText><h3>Processing...</h3></IonText>
                    </>
                  ) : lowConfidence ? (
                    <p className="free-play-SLR-words-hint">Try again — sign clearly</p>
                  ) : motionSign ? (
                    <>
                      <IonText>
                        <h2 className="free-play-SLR-letterSigned free-play-SLR-motion-sign">
                          {motionSign}
                        </h2>
                      </IonText>
                      <p className="free-play-SLR-confidence">
                        {Math.round(motionConfidence * 100)}% confidence
                      </p>
                    </>
                  ) : (
                    <p className="free-play-SLR-words-hint">{wordsHint}</p>
                  )
                ) : (
                  processing ? (
                    <>
                      <IonSpinner name="dots" />
                      <IonText><h3>Processing...</h3></IonText>
                    </>
                  ) : recognizedLetter ? (
                    <IonText>
                      <h2 className="free-play-SLR-letterSigned">{recognizedLetter}</h2>
                    </IonText>
                  ) : null
                )}
              </div>
            </div>

            {/* Alphabet: button */}
            {!isWordsMode && (
              <div className="free-play-SLR-button-container">
                <p>Start Processing</p>
                {!alphabetBusy ? (
                  <IonButton onClick={captureAlphabet}>
                    <img className="free-play-SLR-playImage" src={play} />
                  </IonButton>
                ) : (
                  <p>{capturing ? "Recording…" : "Processing…"}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </IonContent>

      <IonFooter><AppFooter /></IonFooter>
    </IonPage>
  );
};

export default LandmarkCapture;