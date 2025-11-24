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
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import play from '/public/assets/Buttons/playButton.svg';
import './SignLanguageRecognition.css';
import { generateLetterHint, startChatSession } from '../../firebase/ai';
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// backend model apiendpoint and frame count per capture
const FUNCTION_URL =
  "https://classify-landmarks-ft6ax3huaq-uc.a.run.app";
const FRAMES_TO_CAPTURE = 15;

const LETTER_HINTS: Record<string, string[]> = {
  A: [
    "Create a closed fist with the thumb pressed against the side of the index finger, knuckles facing out.",
    "Keep the thumb tight to the fingers instead of covering them."
  ],
  B: [
    "Extend all four fingers straight up together while the thumb crosses the palm.",
    "Flatten the palm toward your audience so the fingers stay parallel."
  ],
  C: [
    "Curve your hand like the letter C as if holding a small ball, thumb opposite the fingers.",
    "Only curl the fingers and thumb; keep the wrist straight."
  ],
  D: [
    "Point the index finger straight up and touch the thumb to the middle finger, other fingers curled.",
    "Tuck the ring and pinky tightly against the palm so only one finger is up."
  ],
  E: [
    "Curl all fingertips toward the thumb so they meet the pad of the thumb, palm forward.",
    "Avoid flattening the fingers like B - keep them bent into a compact shape."
  ],
  F: [
    "Touch the index finger tip to the thumb to form a circle; other three fingers stay extended.",
    "Let the remaining fingers spread slightly so they do not collapse toward the palm."
  ],
  G: [
    "Hold the thumb and index finger parallel pointing sideways while other fingers curl down.",
    "Rotate the wrist so the thumb edge faces forward, keeping the hand level."
  ],
  H: [
    "Extend index and middle fingers together pointing sideways, thumb tucked, other fingers folded.",
    "Stack the two extended fingers evenly so the top edges align."
  ],
  I: [
    "Make a fist and raise just the pinky finger straight up.",
    "Wrap the thumb across the fingers so it does not poke out like Y."
  ],
  J: [
    "Trace the letter J in the air with the pinky starting from the I handshape.",
    "Lead the motion with the pinky while the rest of the hand stays relaxed."
  ],
  K: [
    "Extend index and middle fingers in a V while the thumb touches the base of the middle finger, palm out.",
    "Spread the two fingers slightly so the V shape is clear."
  ],
  L: [
    "Raise the index finger vertically and the thumb horizontally to make an L shape, other fingers tucked.",
    "Face the palm outward so the viewer clearly sees the outline."
  ],
  M: [
    "Lay the thumb across the palm and fold three fingers over it, pinky resting to the side.",
    "Cover the thumb completely so it does not peek between the fingers."
  ],
  N: [
    "Tuck the thumb across the palm and cover it with the index and middle fingers only.",
    "Keep the two covering fingers snug so the thumb remains hidden."
  ],
  O: [
    "Touch all fingertips to the thumb to form a small O shape, palm angled forward.",
    "Round the fingers from the knuckles rather than just bending the tips."
  ],
  P: [
    "Make the K handshape then tip the wrist so the extended fingers point downward.",
    "Keep the thumb contacting the middle finger while the index points outward like the leg of P."
  ],
  Q: [
    "Start with the G handshape and drop the wrist so the index finger points down.",
    "Aim both the thumb and index finger toward the floor with the palm facing inward."
  ],
  R: [
    "Cross the middle finger over the index finger, palm forward, other fingers curled.",
    "Keep the two crossed fingers straight and close together."
  ],
  S: [
    "Form a fist with the thumb folded across the front of the fingers.",
    "Do not push the thumb between fingers - let it rest on top of the index and middle finger."
  ],
  T: [
    "Make a fist and insert the thumb between the index and middle finger with the thumb tip showing.",
    "Ensure the thumb sticks out slightly so it is distinct from S."
  ],
  U: [
    "Extend the index and middle fingers together pointing up while other fingers curl.",
    "Keep the two fingers touching rather than spread apart."
  ],
  V: [
    "Raise the index and middle fingers in a V shape, remaining fingers curled to the palm.",
    "Spread the two fingers just enough to show the V without exaggerating."
  ],
  W: [
    "Extend index, middle, and ring fingers with slight spacing; pinky and thumb stay tucked.",
    "Hold the three fingers level so they form the points of the W."
  ],
  X: [
    "Curl the index finger like a hook while other fingers stay folded and the thumb rests on them.",
    "Point the knuckle upward so the hooked finger faces forward."
  ],
  Y: [
    "Extend the thumb and pinky while the other fingers remain curled.",
    "Stretch the thumb and pinky away from each other to suggest the Y shape."
  ],
  Z: [
    "Use the extended index finger to draw the letter Z in the air: across, diagonal, across.",
    "Keep the diagonal stroke sharp so the letter outline is clear."
  ],
};

const DEFAULT_HINT = "Focus on matching the exact ASL handshape: adjust finger placement, thumb position, and palm orientation.";

const LandmarkCapture: React.FC = () => {

  // camera and model refrences 
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const coachChatRef = useRef<any | null>(null);

  // UI states
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState<string>("");
  const [presentToast] = useIonToast();

  // Firebase data
  const [courses, setCourses] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<string>("");

  // vocab terms and progress
  const [terms, setTerms] = useState<any[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [letterIndex, setLetterIndex] = useState<number>(0);
  const [correctLetters, setCorrectLetters] = useState<boolean[]>([]);
  const [incorrectLetters, setIncorrectLetters] = useState<boolean[]>([]);
  const [termProgress, setTermProgress] = useState<{ [term: string]: number }>({});

  // adaptive hinting
  const [hintMessage, setHintMessage] = useState<string>("");
  const [hintStatus, setHintStatus] = useState<"info" | "success" | "error" | "">("");
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string>("");
  const hintRequestIdRef = useRef(0);

  const ensureCoachChat = () => {
    if (!coachChatRef.current) {
      try {
        coachChatRef.current = startChatSession();
      } catch (error) {
        console.error("Failed to start coach chat session:", error);
        return null;
      }
    }
    return coachChatRef.current;
  };

  useEffect(() => {
    ensureCoachChat();
  }, []);

  // split into learning v. mastered 
  const masteredTerms = Object.keys(termProgress).filter(
    term => termProgress[term] >= 2
  );
  const learningTerms = Object.keys(termProgress).filter(
    term => termProgress[term] < 2
  );
  const getBaselineHintForLetter = (letter: string) => {
    const normalized = letter?.toUpperCase() ?? "";
    const candidates = LETTER_HINTS[normalized];
    if (!candidates || candidates.length === 0) {
      return DEFAULT_HINT;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const resetHint = () => {
    hintRequestIdRef.current += 1;
    setHintMessage("");
    setHintStatus("");
    setHintError("");
    setHintLoading(false);
  };

  const showSuccessHint = (letter: string) => {
    hintRequestIdRef.current += 1;
    setHintStatus("success");
    setHintMessage(`Great job signing ${letter.toUpperCase()}!`);
    setHintError("");
    setHintLoading(false);
  };

  const requestLetterHint = async (
    targetLetter: string,
    detectedLetter?: string,
    attemptContext?: string
  ) => {
    if (!targetLetter) return;
    const uppercaseTarget = targetLetter.toUpperCase();
    const baselineHint = getBaselineHintForLetter(uppercaseTarget);
    const requestId = ++hintRequestIdRef.current;
    const chat = ensureCoachChat();

    setHintStatus("info");
    setHintMessage(baselineHint);
    setHintError("");
    setHintLoading(true);

    try {
      const aiHint = await generateLetterHint({
        targetLetter: uppercaseTarget,
        detectedLetter: detectedLetter?.toUpperCase(),
        baselineHint,
        attemptContext,
        chat,
      });

      if (hintRequestIdRef.current === requestId && aiHint) {
        setHintMessage(aiHint);
      }
    } catch (error) {
      console.error("generateLetterHint error:", error);
      if (hintRequestIdRef.current === requestId) {
        setHintError("Chatbot hint is temporarily unavailable. Use the baseline tip above.");
      }
    } finally {
      if (hintRequestIdRef.current === requestId) {
        setHintLoading(false);
      }
    }
  };

  
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


  //---------------Firebase--------------
  //get sets from selected course
  const fetchSets = async (courseId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    const setsRef = collection(db, "users", user.uid, "courses", courseId, "sets");
    const setsSnap = await getDocs(setsRef);
    const setList = setsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSets(setList);
  };


  // Load MediaPipe model and start camera
  useEffect(() => {
    const loadModel = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const db = getFirestore();

          // fetch courses
          const coursesRef = collection(db, "users", user.uid, "courses");
          const coursesSnap = await getDocs(coursesRef);
          const courseList = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCourses(courseList);
        }
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

  // get terms froma set and initialize mastery table 
  const fetchTerms = async (setId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !selectedCourse) return;

    const db = getFirestore();
    const setRef = doc(db, "users", user.uid, "courses", selectedCourse, "sets", setId);
    const snap = await (await import("firebase/firestore")).getDoc(setRef);

    if (snap.exists()) {
      const data = snap.data() as { vocabTerms: { term: string }[] };
      const list: { term: string }[] = data.vocabTerms || [];

      setTerms(list);
      pickRandomTerm(list);

      // Initialize mastery count per term
      const progress: { [term: string]: number } = {};
      list.forEach((t: { term: string }) => {
        progress[t.term.toUpperCase()] = 0;
      });

      setTermProgress(progress);
    }
  };


  //------------Mastery/Word picking-------------
  const pickRandomTerm = (termsArray: any[]) => {
    if (!termsArray || termsArray.length === 0) return;

    // Build a weighted pool
    const weighted: string[] = [];

    termsArray.forEach((t: { term: string }) => {
      const word = t.term.toUpperCase();
      const progress = termProgress[word] ?? 0;

      // weight: 3 → 2 → 1
      const weight = 3 - Math.min(progress, 2);

      for (let i = 0; i < weight; i++) {
        weighted.push(word);
      }
    });

    // Pick from weighted list
    const randomWord = weighted[Math.floor(Math.random() * weighted.length)];

    // Find the original term object again
    const selected = termsArray.find((t: { term: string }) => t.term.toUpperCase() === randomWord);
    if (!selected) return;

    // Set state
    setCurrentPrompt(randomWord);
    setLetterIndex(0);
    setCorrectLetters(new Array(randomWord.length).fill(false));
    setIncorrectLetters(new Array(randomWord.length).fill(false));
    setRecognizedLetter("");
    resetHint();
  };


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

        showSuccessHint(expected);

        // if not done, move to next letter
        if (letterIndex < currentPrompt.length - 1) {
          setLetterIndex(letterIndex + 1);
        } else {
          // word completed → update mastery progress
          setTermProgress(prev => {
            const newProgress = { ...prev };
            newProgress[currentPrompt] = (newProgress[currentPrompt] ?? 0) + 1;
            return newProgress;
          });

          // pick a new word
          pickRandomTerm(terms);

        }
      } else {
        setIncorrectLetters(prev => {
          const newArr = [...prev];
          newArr[letterIndex] = true;
          return newArr;
        });
        requestLetterHint(
          expected,
          letter,
          "The learner signed a different letter than requested."
        );
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
    const skippedLetter = currentPrompt[letterIndex];
    finalizeLetterAsIncorrect();

    if (skippedLetter) {
      requestLetterHint(
        skippedLetter,
        undefined,
        "The learner skipped this letter and would like a reminder for next time."
      );
    }

    if (letterIndex < currentPrompt.length - 1) {
      setLetterIndex(letterIndex + 1);
    } else {
      pickRandomTerm(terms);
    }
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
      <IonContent className="ion-padding">
        <div className="MainContent">
          <div className="LeftContent">
            <IonCard className="ionCard">
              <IonCardContent className="video-container">
                <video
                  ref={videoRef}
                  className="video-preview"
                  autoPlay
                  muted
                  playsInline
                />
                {/* Overlay letters */}
                <div className="video-letter-overlay" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ color: '#EBE7DB', fontSize: 40, fontFamily: 'Figtree', fontWeight: '400', letterSpacing: 1.60, wordWrap: 'break-word', whiteSpace: 'pre-line' }}>
                    Letter<br />signed:
                  </div>
                    <div style={{ position: "relative", display: "inline-block", minWidth: 64, minHeight: 64 }}>
                      <img
                        src="public/assets/slr/circle.svg"
                        alt="Circle"
                        style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%) scale(1.4)",
                        height: 76,
                        width: 76,
                        zIndex: 1,
                        pointerEvents: "none",
                        }}
                      />
                      <div className="result-container-text" style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 64, minWidth: 64 }}>
                        {processing ? (
                        <>
                          <IonSpinner name="dots" />
                          <IonText>
                          <h3>...</h3>
                          </IonText>
                        </>
                        ) : recognizedLetter ? (
                        <IonText>
                          <h2 className="letterSigned" style={{ color: '#EBE7DB', fontSize: 64, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 2.56, wordWrap: 'break-word', margin: 0 }}>{recognizedLetter}</h2>
                        </IonText>
                        ) : null}
                      </div>
                    </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          <div className="RightContent">
            <div className="set-picker">
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "right", width: "33%" }}>
                      <div style={{ flex: 0, textAlign: 'right', color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: 500, letterSpacing: 0.8, wordWrap: 'break-word', whiteSpace: 'nowrap' }}>
                        Current Course: {selectedCourse && courses.find(c => c.id === selectedCourse)?.title}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", width: "34%" }}>
                      <div style={{width: '27px', height: '0px', transform: 'rotate(90deg)', outline: '1px black solid', margin: '0 8px'}}></div>
                    </td>
                    <td style={{ textAlign: "left", width: "33%" }}>
                      <div style={{ flex: 0 }}>
                        <select
                          className="dropdown"
                          value=""
                          onChange={async (e) => {
                            const value = e.target.value;
                            setSelectedCourse(value);
                            setSelectedSet("");
                            setTerms([]);
                            setCurrentPrompt("");
                            setLetterIndex(0);
                            setCorrectLetters([]);
                            setIncorrectLetters([]);
                            setRecognizedLetter("");
                            setTermProgress({});
                            resetHint();
                            await fetchSets(value);
                          }}
                        >
                          <option value="" disabled>Change</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                  <br></br>
                  {sets.length > 0 && (
                  <tr>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ flex: 0, textAlign: 'right', color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: 500, letterSpacing: 0.8, wordWrap: 'break-word', whiteSpace: 'nowrap' }}>
                        Current Set: {selectedSet && sets.find(s => s.id === selectedSet)?.title}
                      </div>        
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{width: '27px', height: '0px', transform: 'rotate(90deg)', outline: '1px black solid', margin: '0 8px'}}></div>
                    </td>
                    <td style={{ textAlign: "left" }}>
                      <select
                        className="dropdown"
                        value={""}
                        onChange={async (e) => {
                          const value = e.target.value;
                          setSelectedSet(value);
                          setLetterIndex(0);
                          setCorrectLetters([]);
                          setIncorrectLetters([]);
                          setRecognizedLetter("");
                          resetHint();
                          await fetchTerms(value);
                        }}
                      >
                        <option value="" disabled>Change</option>
                        {sets.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  )}
                </tbody>
              </table>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <tbody>
                <tr>
                  <td style={{ width: "100%" }}>
                    <div style={{ width: "100%", height: "0px", outline: '1px black solid'}} />
                  </td>
                </tr>
                <tr>
                  <td style={{ width: "100%", textAlign: "center", paddingTop: 8 }}>
                    <div style={{width: '100%', height: '100%', background: '#343434', borderRadius: 39, paddingTop: 55, paddingBottom: 55, paddingLeft: 83, paddingRight: 83}}>
                      <div className="prompt-container">
                        {selectedSet && currentPrompt && (
                          <>
                            <p>Finger Spell:</p>
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
                                  {idx < currentPrompt.length - 1 && " - "}
                                </span>
                              ))}
                            </div>
                            {(hintLoading || hintMessage || hintError) && (
                              <div className={`hint-card${hintStatus ? " " + hintStatus : ""}`}>
                                <p className="hint-label">Chatbot Hint</p>
                                {hintLoading ? (
                                  <div className="hint-loading">
                                    <IonSpinner name="lines" />
                                    <span>Generating tip...</span>
                                  </div>
                                ) : hintError ? (
                                  <p className="hint-error-text">{hintError}</p>
                                ) : (
                                  <p className="hint-message">{hintMessage}</p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: "100%", textAlign: "center", paddingTop: 8 }}>
                    {selectedSet && (
                      <div className="remaining-terms">
                        <p style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word'}}>{learningTerms.length} Terms Remaining!</p>
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                    <td style={{ textAlign: "center" }}>
                    {selectedSet && currentPrompt && (
                      <img
                      src="public/assets/slr/highlighter.svg"
                      alt="Highlight"
                      style={{
                        height: 10,
                        marginRight: 8,
                        display: "inline-block",
                        position: "relative",
                        top: "-18px"
                      }}
                      />
                    )}
                    </td>
                </tr>
                <tr>
                  <td>
                    <div style={{ border: "2px solid black", borderRadius: 40, overflow: "hidden",}}>
                      <table style={{ width: "100%", marginBottom: 16}}>
                        <tbody>
                        <tr>
                          <td style={{ textAlign: "center" }}>
                          <p style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word'}}>Still Learning</p>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <p style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word'}}>Mastered</p>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: "center", verticalAlign: "top", width: "50%" }}>
                            <ul style={{ paddingLeft: 0, marginTop: 0 }}>
                              {learningTerms.map(term => (
                                  <li style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word', listStyleType: 'none' }} key={term}>{term}</li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "top", width: "50%" }}>
                            <ul style={{ paddingLeft: 0, marginTop: 0 }}>
                              {masteredTerms.map(term => (
                                <li style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word', listStyleType: 'none' }} key={term}>{term}</li>
                              ))} 
                            </ul>
                          </td>
                          
                        </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="button-container">
              <p>Controls</p>
              <div className="button-row">
                <IonButton
                  disabled={!selectedSet || !currentPrompt}
                  onClick={captureFrames}
                >
                  <img className="playImage" src={play} alt="Start" />
                </IonButton>
                <IonButton
                  color="medium"
                  fill="outline"
                  disabled={!selectedSet || !currentPrompt}
                  onClick={handleSkip}
                >
                  Skip Letter
                </IonButton>
              </div>
              {capturing && (
                <p color="medium">
                  Processing...
                </p>
              )}
            </div>
          </div>
        </div>
      </IonContent>
      <IonFooter>
        <AppFooter/>
      </IonFooter>
    </IonPage>
  );
};

export default LandmarkCapture;
