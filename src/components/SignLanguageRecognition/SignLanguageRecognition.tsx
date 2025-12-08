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
  IonToggle
} from "@ionic/react";
import axios from "axios";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import LetterHint from '../LetterHint/letterHint';
import play from '/public/assets/RecordSign.svg';
import skip from '/public/assets/skipSign.svg';
import './SignLanguageRecognition.css';
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import cirlceIcon from '/public/assets/slr/circle.svg';
import highlighter from '/public/assets/slr/highlighter.svg';

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
  const [hintsOn, setHintsOn] = useState(false);


  // split into learning v. mastered 
  const masteredTerms = Object.keys(termProgress).filter(
    term => termProgress[term] >= 2
  );
  const learningTerms = Object.keys(termProgress).filter(
    term => termProgress[term] < 2
  );

  
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

          // freeze UI, give the user a second to vibe
          await new Promise(res => setTimeout(res, 2000));

          // THEN pick the next word
          pickRandomTerm(terms);
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
    } else {
      pickRandomTerm(terms);
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
        <div className="set-picker">
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <tbody className="HeaderSetPicker">
                  <tr>
                    <td style={{ textAlign: "right", width: "33%" }}>
                      <div className="current-select-row">
                        <span>Current Course:</span>

                        <select
                          className="dropdown"
                          value={selectedCourse || ""}
                          onChange={async (e) => {
                            const value = e.target.value;
                            setSelectedCourse(value);
                            setSelectedSet("");       // reset set
                            setTerms([]);             // reset terms
                            setCurrentPrompt("");
                            setLetterIndex(0);
                            setCorrectLetters([]);
                            setIncorrectLetters([]);
                            setRecognizedLetter("");
                            setTermProgress({});
                            await fetchSets(value);    // fetch new sets+terms for this course
                          }}
                        >
                          {/* If no selection */}
                          {!selectedCourse && <option value="">Select</option>}

                          {/* All options always show */}
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", width: "34%" }}>
                      <div style={{width: '27px', height: '0px', transform: 'rotate(90deg)', outline: '1px black solid', margin: '0 8px'}}></div>
                    </td>

                  </tr>
                  <br></br>
                  {sets.length > 0 && (
                  <tr>
                    <td style={{ textAlign: "right", width: "33%" }}>
                      <div className="current-select-row">
                        <span>Current Set:</span>

                        <select
                          className="dropdown"
                          value={selectedSet || ""}
                          onChange={async (e) => {
                            const value = e.target.value;
                            setSelectedSet(value);

                            // reset all word / letter UI
                            setTerms([]);
                            setCurrentPrompt("");
                            setLetterIndex(0);
                            setCorrectLetters([]);
                            setIncorrectLetters([]);
                            setRecognizedLetter("");
                            setTermProgress({});

                            // load the new set's terms
                            await fetchTerms(value);
                          }}
                        >
                          {/* show Select only if no set selected */}
                          {!selectedSet && <option value="">Select</option>}

                          {sets.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{width: '27px', height: '0px', transform: 'rotate(90deg)', outline: '1px black solid', margin: '0 8px'}}></div>
                    </td>

                    <td style={{ textAlign: "left", width: "33%" }}>
                      <IonToggle
                        checked={hintsOn}
                        onIonChange={(e) => setHintsOn(e.detail.checked)}
                        color="primary"
                      >
                        Feedback
                      </IonToggle>

                    </td>

                  </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                                disabled={!selectedSet || !currentPrompt}
                                onClick={captureFrames}
                                className="ionButton"
                              >
                                <img className="playImage" src={play} alt="Start" />
                              </IonButton>
                              <h2 className="buttonNameRecord">Record Sign</h2>
                            </div>
                            <div className="RecordSignDiv">
                            <IonButton
                              disabled={!selectedSet || !currentPrompt}
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


            {selectedSet && (
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
                    <tr>
                      <td style={{ width: "100%", textAlign: "center", paddingTop: 8 }}>
                        <div className="remaining-terms">
                          <p className="remainTermsText" style={{color: '#343434', fontSize: 15, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word'}}>{learningTerms.length} Terms Remaining! Keep it up!</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="masteryTable">
                          <table style={{ width: "100%", marginBottom: 16}}>
                            <tbody>
                            <tr>
                              <td style={{ textAlign: "center" }}>
                              <p className="tableHeader" style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word'}}>Still Learning</p>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <p  className="tableHeader" style={{color: '#343434', fontSize: 20, fontFamily: 'Figtree', fontWeight: '500', letterSpacing: 0.80, wordWrap: 'break-word'}}>Mastered</p>
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
            )} 
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


