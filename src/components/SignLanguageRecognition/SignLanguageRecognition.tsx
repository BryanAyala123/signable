import React, { useRef, useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonText,
  useIonToast,
} from "@ionic/react";
import axios from "axios";

const MODEL_URL = "https://recognize-sign-ft6ax3huaq-uc.a.run.app";
const ROI_SIZE = 226;
const ROI_OFFSET = 24;

const SignLanguageRecognition: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCapturingRef = useRef<boolean>(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>(" ");
  const [prevLetter, setPrevLetter] = useState<string>(" ");
  const [timerTens, setTimerTens] = useState<number>(0);

  const frameCountRef = useRef<number>(0);
  const [presentToast] = useIonToast();

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async (): Promise<void> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (e: any) {
      setError("Unable to access camera. Check permissions.");
      console.error(e);
    }
  };

  const stopCamera = (): void => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    isCapturingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    frameCountRef.current = 0;
    setCameraReady(false);
    setRecognizedText(" ");
    setPrevLetter(" ");
  };

  const extractRoiPngBase64 = (ctx: CanvasRenderingContext2D): string | null => {
    const roiCanvas = document.createElement("canvas");
    roiCanvas.width = ROI_SIZE;
    roiCanvas.height = ROI_SIZE;
    const roiCtx = roiCanvas.getContext("2d", { willReadFrequently: true });
    if (!roiCtx) return null;
    const roiData = ctx.getImageData(ROI_OFFSET, ROI_OFFSET, ROI_SIZE, ROI_SIZE);
    roiCtx.putImageData(roiData, 0, 0);
    return roiCanvas.toDataURL("image/png", 0.9).split(",")[1];
  };

  const recognizeSignOnServer = async (base64Image: string) => {
    try {
      const res = await axios.post(
        MODEL_URL,
        { image: base64Image },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );
      const prediction = res.data?.prediction ?? "ERROR";
      const processedB64 = res.data?.processed_roi_base64;

      // update processed preview
      if (processedB64 && processedCanvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = processedCanvasRef.current!.getContext("2d", { willReadFrequently: true })!;
          ctx.clearRect(0, 0, ROI_SIZE, ROI_SIZE);
          ctx.drawImage(img, 0, 0, ROI_SIZE, ROI_SIZE);
        };
        img.src = "data:image/png;base64," + processedB64;
      }

      return prediction;
    } catch (err: any) {
      console.error("Server error:", err);
      presentToast({ message: "Prediction failed", duration: 3000, color: "danger" });
      return "ERROR";
    }
  };

  const startContinuousLoop = () => {
    if (!videoRef.current || !roiCanvasRef.current) return;

    isCapturingRef.current = true;
    const videoEl = videoRef.current;
    const ctx = roiCanvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const loop = () => {
      if (!isCapturingRef.current) return;

      ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
      frameCountRef.current += 1;

      if (frameCountRef.current % 100 === 0) {
        setTimerTens(frameCountRef.current / 100);
      }

      if (frameCountRef.current === 300) {
        frameCountRef.current = 99;
        const base64Image = extractRoiPngBase64(ctx);
        if (base64Image) {
          recognizeSignOnServer(base64Image).then((prediction) => {
            const letter = prediction === "0" ? " " : prediction;
            setPrevLetter(letter);
            setRecognizedText((prev) => prev + letter);
            presentToast({ message: `Detected: ${letter}`, duration: 1000 });
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const handleStartCamera = async () => {
    if (!cameraReady) {
      await startCamera();
      startContinuousLoop(); // start auto recognition
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>ASL Sign Recognition</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="7">
              <IonCard>
                <IonCardContent style={{ position: "relative", padding: 0 }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "75%",
                      backgroundColor: "#000",
                    }}
                  >
                    <video
                      ref={videoRef}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      autoPlay
                      muted
                      playsInline
                    />
                    {cameraReady && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                        }}
                      >
                        {/* ROI rectangle */}
                        <div
                          style={{
                            position: "absolute",
                            top: ROI_OFFSET,
                            left: ROI_OFFSET,
                            width: ROI_SIZE,
                            height: ROI_SIZE,
                            border: "2px solid #00ff00",
                          }}
                        />
                        {/* Prev letter */}
                        <div
                          style={{
                            position: "absolute",
                            top: 14,
                            left: 24,
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#fff",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          {prevLetter}
                        </div>
                        {/* Running text */}
                        <div
                          style={{
                            position: "absolute",
                            top: 50,
                            left: 275,
                            fontSize: 18,
                            color: "#ccc",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          {recognizedText}
                        </div>
                        {/* Timer tens display */}
                        <div
                          style={{
                            position: "absolute",
                            top: 120,
                            left: 300,
                            fontSize: 24,
                            color: "#fff",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          {timerTens}
                        </div>
                      </div>
                    )}
                  </div>
                  <canvas
                    ref={roiCanvasRef}
                    width={640}
                    height={480}
                    style={{ display: "none" }}
                  />
                </IonCardContent>
              </IonCard>

              {/* Processed ROI Preview */}
              <IonCard style={{ marginTop: "12px" }}>
                <IonCardContent>
                  <IonText>
                    <h3>Processed ROI (from server)</h3>
                  </IonText>
                  <canvas
                    ref={processedCanvasRef}
                    width={ROI_SIZE}
                    height={ROI_SIZE}
                    style={{
                      width: "100%",
                      backgroundColor: "#000",
                      border: "1px solid #444",
                      display: "block",
                      marginTop: "8px",
                    }}
                  />
                </IonCardContent>
              </IonCard>

              {error && (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {!cameraReady ? (
                  <IonButton onClick={handleStartCamera}>Start Camera</IonButton>
                ) : (
                  <IonButton color="medium" onClick={stopCamera}>
                    Stop Camera
                  </IonButton>
                )}
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="5">
              <IonCard>
                <IonCardContent>
                  <IonText>
                    <h2>Recognized Text</h2>
                  </IonText>
                  <p style={{ marginTop: 8, fontSize: 20 }}>{recognizedText}</p>
                  <hr />
                  <IonText>
                    <strong>How it works:</strong>
                    <ul style={{ fontSize: "14px", marginTop: "8px" }}>
                      <li>Click "Start Camera" to enable webcam</li>
                      <li>ROI outlined in green is processed continuously</li>
                      <li>Every 300 frames, a prediction is sent to the server</li>
                      <li>Recognized letters appear live</li>
                      <li>Stop Camera to end recognition</li>
                    </ul>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SignLanguageRecognition;
