import React, { useRef, useEffect, useState, } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonButton,
  IonText,
  IonCardContent,
  useIonToast,
  IonSpinner,
  IonFooter,
  IonModal,
  useIonRouter,
} from "@ionic/react";

import axios from "axios";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import LetterHint from '../LetterHint/letterHint';
import play from '/public/assets/RecordSign.svg';
import skip from '/public/assets/skipSign.svg';
import './HeroSLR.css';

// backend model apiendpoint and frame count per capture
const FUNCTION_URL =
  "https://classify-landmarks-ft6ax3huaq-uc.a.run.app";
const FRAMES_TO_CAPTURE = 15;

const LandmarkCapture: React.FC = () => {

  // camera and model refrences 
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // UI states
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState<string>("");
  const [presentToast] = useIonToast();
  const router = useIonRouter();

  // vocab terms and progress
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [letterIndex, setLetterIndex] = useState<number>(0);
  const [correctLetters, setCorrectLetters] = useState<boolean[]>([]);
  const [incorrectLetters, setIncorrectLetters] = useState<boolean[]>([]);
  const [hintsOn, setHintsOn] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const query = new URLSearchParams(location.search);
  const initialName = query.get("name") ?? "";

  const [name, setName] = useState(initialName);


  const restartSet = () => {
  setCapturing(false);
  setProcessing(false);

  setRecognizedLetter("");
  setHintsOn(true);

  setLetterIndex(0);
  setCorrectLetters([]);
  setIncorrectLetters([]);

  setShowCompletionModal(false);

  stopCamera();   // you MUST stop old stream or you get duplicates
  startCamera();  // then fresh init

};

  useEffect(() => {
    if (!name) return;

    const formatted = name.toUpperCase();

    setCurrentPrompt(formatted);
    setLetterIndex(0);
    setCorrectLetters(Array(formatted.length).fill(false));
    setIncorrectLetters(Array(formatted.length).fill(false));
  }, [name]);


  //-----------camera handling--------------
  // Start camera automatically when component mounts
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
      // presentToast({ message: "Unable to access camera.", duration: 3000 });
    }
  };

  // stop camera 
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };


  // Load MediaPipe model and start camera
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
        
        // Start camera after model loads
        await startCamera();
      } catch (err) {
        console.error("Failed to load MediaPipe model:", err);
      }
    };
    loadModel();
    return () => stopCamera();
  }, []);


  //-------------Actual model interraction-------------
  // Function to send landmarks
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
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );

      const letter = res.data?.result ?? "?"; // predicted letter
      setRecognizedLetter(letter);

      const expected = currentPrompt[letterIndex];  // target letter
      if (!expected) {
        return;
      }

      if (letter.toUpperCase() === expected.toUpperCase()) {
        // mark this letter green
        setCorrectLetters(prev => {
          const newArr = [...prev];
          newArr[letterIndex] = true;
          return newArr;
        });

        setIncorrectLetters(prev => {
          const newArr = [...prev];
          newArr[letterIndex] = false;
          return newArr;
        });

        // if not done, move to next letter
        if (letterIndex < currentPrompt.length - 1) {
          setLetterIndex(letterIndex + 1);
        } else {
          // word completed, show success
          
          // 2 second wait to show the completed word
          await new Promise(res => setTimeout(res, 2000));
          
          // Stop camera and show completion modal
          stopCamera();
          setShowCompletionModal(true);
        }
      } else {
        setIncorrectLetters(prev => {
          const newArr = [...prev];
          newArr[letterIndex] = true;
          return newArr;
        });
      }
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

  const finalizeLetterAsIncorrect = () => {
    setIncorrectLetters(prev => {
      const newArr = [...prev];
      newArr[letterIndex] = true;
      return newArr;
    });
    setCorrectLetters(prev => {
      const newArr = [...prev];
      newArr[letterIndex] = false;
      return newArr;
    });
  };

  const handleSkip = () => {
    if (!currentPrompt) return;
    finalizeLetterAsIncorrect();

    if (letterIndex < currentPrompt.length - 1) {
      setLetterIndex(letterIndex + 1);
    }
    setRecognizedLetter("");
  };


  //------------Frame capture------------
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
      await new Promise((resolve) => setTimeout(resolve, 33));
    }

    // send even if only 1 frame was captured 
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
      <IonContent className="ion-padding-SLRPage">
        <div className="MainContent">
          <div className="SLRMainContent">  
            <div className="LeftContent">
                <IonCardContent className="video-container">
                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    className="video-preview"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
                  {/* Overlay letters */}
                </IonCardContent>
                <div className="video-letter-overlay" style={{ display: "flex", alignItems: "center", gap: 30 }}>
                        <div className="button-container">
                          <div className="button-row">
                            <div className="RecordSignDiv">
                              <IonButton
                                onClick={captureFrames}
                                className="ionButton"
                              >
                                <img className="playImage" src={play} alt="Start" />
                              </IonButton>
                              <h2 className="buttonNameRecord">Record Sign</h2>
                            </div>
                            <div className="RecordSignDiv">
                            <IonButton
                              onClick={handleSkip}
                              className="ionButton"
                            >
                              <img className="skipImage" src={skip} alt="Skip" />
                            </IonButton>
                            <h2 className="buttonName">Skip Letter</h2>
                            </div>
                          </div>
                    </div>
                  </div>
            </div>
              <div className="RightContent">
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "100%", textAlign: "center", paddingTop: 8 }}>
                        <div>
                          <div className="prompt-container">
                            {currentPrompt && (
                              <>
                                <div className="letter-progress" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                  {currentPrompt.split("").map((ch, idx) => (
                                    <span
                                      key={idx}
                                      className={(() => {
                                        if (correctLetters[idx]) return "correct-letter";
                                        if (incorrectLetters[idx]) {
                                          return idx === letterIndex
                                            ? "incorrect-letter current-letter"
                                            : "incorrect-letter";
                                        }
                                        if (idx === letterIndex) return "current-letter";
                                        return "pending-letter";
                                      })()}
                                      style={{ textAlign: "center" }}
                                    >
                                      {ch}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="letter-signed-text">
                  <div className="letter-signed-text-result">
                    <p>
                      Letter Signed:
                      {processing ? (
                        <>
                          <IonSpinner name="dots" className="dotLoad"/>
                        </>
                      ) : recognizedLetter ? (
                        <IonText>
                          <h2 className="letterSigned">{recognizedLetter}</h2>
                        </IonText>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className={`hint-container ${!hintsOn ? "hint-hidden" : ""}`}>
                {hintsOn && (
                  <LetterHint
                    targetLetter={currentPrompt[letterIndex]}
                    detectedLetter={recognizedLetter !== "Processing..." ? recognizedLetter : undefined}
                  />
                )}
                </div>

              </div>
          </div>  
        </div>
      </IonContent>
      <IonModal
        isOpen={showCompletionModal}
        onDidDismiss={() => setShowCompletionModal(false)}
        className="completion-modal"
      >
        <IonContent className="ion-padding-modal" style={{ textAlign: "center" }}>
          <div className="mainContentModal">
            <div className="mainContentLeftSideModal">
            <h2 className="mainContentLeftSideModalLeftSideHeader"><span className="modal-dash-third"></span>Congrats</h2>
            <p className="mainContentLeftSideModalLeftSideText">You've <span className="underlineMasteryText">mastered</span> this set.</p>
            </div>

            <div className="mainContentRightSideModal">
              <div className="mainContentRightSideModalSetSelectionDiv">
                <h3 className="mainContentRightSideModalSetSelectionDivHeader">Start with a new name:</h3>
                {/* DROPDOWN HERE */}
                <div>
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Enter Your Name'
                    className="nameSLRinput"
                  />
                </div>
              </div>
              <IonButton expand="block" onClick={restartSet} className="modalStartNewSetBtn">
                Start over with this name
              </IonButton>

              <button
                className="modalBackToLibraryBtn"
                onClick={() => {
                  setShowCompletionModal(false);
                  router.push('/register', 'forward');
                }}
              >
                <u>Sign Up</u>
              </button>
                </div>
              </div>
        </IonContent>
    </IonModal>
    <IonFooter>
        <AppFooter/>
      </IonFooter>
    </IonPage>
  );
};

export default LandmarkCapture;


