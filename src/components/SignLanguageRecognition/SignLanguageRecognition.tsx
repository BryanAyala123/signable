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
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  const [termProgress, setTermProgress] = useState<{ [term: string]: number }>({});

  // split into learning v. mastered 
  const masteredTerms = Object.keys(termProgress).filter(
    term => termProgress[term] >= 2
  );
  const learningTerms = Object.keys(termProgress).filter(
    term => termProgress[term] < 2
  );
  const remainingCount = learningTerms.length;

  
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

      const expected = currentPrompt[letterIndex];  // target letter

      const letter = res.data?.result ?? "?"; // predicted letter
      setRecognizedLetter(letter);

      if (letter.toUpperCase() === expected.toUpperCase()) {
        // mark this letter green
        setCorrectLetters(prev => {
          const newArr = [...prev];
          newArr[letterIndex] = true;
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

          // pick a new word
          pickRandomTerm(terms);

        }
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
              <IonCardContent>
                <video
                  ref={videoRef}
                  className="video-preview"
                  autoPlay
                  muted
                  playsInline
                />
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
                                  className={
                                    idx < letterIndex
                                      ? "correct-letter"
                                      : idx === letterIndex
                                      ? "current-letter"
                                      : "pending-letter"
                                  }
                                  style={{ textAlign: "center" }}
                                >
                                  {ch}
                                  {idx < currentPrompt.length - 1 && " - "}
                                </span>
                              ))}
                            </div>
                            <p></p>
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

            <div className="result-container">
              <div className="result-container-header">
                <p>Letter Signed:</p>
              </div>

              <div className="result-container-text">
                {processing ? (
                  <>
                    <IonSpinner name="dots" />
                    <IonText>
                      <h3>Processing...</h3>
                    </IonText>
                  </>
                ) : recognizedLetter ? (
                  <IonText>
                    <h2 className="letterSigned">{recognizedLetter}</h2>
                  </IonText>
                ) : null}
              </div>
            </div>

            <div className="button-container">
              <p>Start Processing</p>
              {!capturing ? (
                <IonButton disabled={!selectedSet || !currentPrompt} onClick={captureFrames}>
                  <img className="playImage" src={play}/>
                </IonButton>
              ) : (
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
