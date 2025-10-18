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
} from "@ionic/react";
import './SignLanguageRecognition.css';

/**
 * SignLanguageRecognition.tsx
 *
 * Simple Ionic React page that:
 * - accesses the user camera
 * - shows the video feed
 * - draws into a hidden/overlay canvas for frame processing
 * - runs a placeholder recognition loop (replace recognizeSign with a real ML model)
 *
 * Add model integration in recognizeSign() where indicated.
 */

const PROCESS_WIDTH = 256; // width used for ML processing (keeps perf manageable)
const PROCESS_HEIGHT = 256;

const SignLanguageRecognition: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);

    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPrediction, setLastPrediction] = useState<{ label: string; confidence: number } | null>(null);

    useEffect(() => {
        // cleanup on unmount
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                // some browsers require play() to be called
                await videoRef.current.play();
            }
        } catch (e: any) {
            setError("Unable to access camera. Check permissions.");
            console.error(e);
        }
    };

    const stopCamera = (): void => {
        // stop RAF loop
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        // stop media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        // stop video element
        if (videoRef.current) {
            videoRef.current.pause();
            try {
                // remove srcObject for cleanup
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                videoRef.current.srcObject = null;
            } catch {}
        }
        setRunning(false);
    };

    const startRecognition = async (): Promise<void> => {
        setLastPrediction(null);
        if (!streamRef.current) {
            await startCamera();
        }
        setRunning(true);
        runLoop();
    };

    const stopRecognition = (): void => {
        setRunning(false);
        stopCamera();
    };

    const runLoop = async (): Promise<void> => {
        const loop = async () => {
            if (!running || !videoRef.current || !canvasRef.current) {
                rafRef.current = null;
                return;
            }
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                // copy a downsized frame for processing
                ctx.drawImage(videoRef.current, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
                const imageData = ctx.getImageData(0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
                // call recognition (replace with real model)
                try {
                    const pred = await recognizeSign(imageData);
                    setLastPrediction(pred);
                } catch (e) {
                    console.error("recognition error", e);
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(loop);
        }
    };

    /**
     * Placeholder recognizer.
     * Replace this with a real ML model (e.g., TensorFlow.js handpose + classifier)
     * The function receives an ImageData object sized PROCESS_WIDTH x PROCESS_HEIGHT.
     */
    const recognizeSign = async (imageData: ImageData): Promise<{ label: string; confidence: number }> => {
        // Simple placeholder: returns "unknown" most of the time.
        // Replace with model inference and return meaningful results.
        await new Promise((r) => setTimeout(r, 50)); // simulate async work / inference time
        // Example deterministic stub based on a pixel to avoid fully random outputs
        const pixel = imageData.data[0] || 0;
        if (pixel % 47 === 0) {
            return { label: "HELLO", confidence: 0.86 };
        }
        return { label: "Unknown", confidence: 0.0 };
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
                                    <div style={{ position: "relative", width: "100%", background: "#000" }}>
                                        {/* Visible video feed */}
                                        <video
                                            ref={videoRef}
                                            style={{ width: "100%", height: "auto", display: "block" }}
                                            autoPlay
                                            muted
                                            playsInline
                                        />
                                        {/* Overlay canvas (optional draw for UI/annotations) */}
                                        <canvas
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                pointerEvents: "none",
                                            }}
                                            // overlay canvas intentionally not used for processing; kept for annotations if needed
                                        />
                                    </div>

                                    {/* Hidden processing canvas (kept small for performance) */}
                                    <canvas
                                        ref={canvasRef}
                                        width={PROCESS_WIDTH}
                                        height={PROCESS_HEIGHT}
                                        style={{ display: "none" }}
                                    />
                                </IonCardContent>
                            </IonCard>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <IonButton onClick={startRecognition} disabled={running}>
                                    Start Recognition
                                </IonButton>
                                <IonButton color="medium" onClick={stopRecognition} disabled={!running}>
                                    Stop
                                </IonButton>
                            </div>
                        </IonCol>

                        <IonCol size="12" sizeMd="5">
                            <IonCard>
                                <IonCardContent>
                                    <IonText>
                                        <h2>Live Detection</h2>
                                    </IonText>

                                    {error && (
                                        <div style={{ color: "var(--ion-color-danger)", marginBottom: 8 }}>{error}</div>
                                    )}

                                    <div style={{ marginTop: 8 }}>
                                        <strong>Last prediction:</strong>
                                        <div style={{ marginTop: 6 }}>
                                            <IonText>
                                                <div style={{ fontSize: 20 }}>
                                                    {lastPrediction ? lastPrediction.label : "—"}
                                                </div>
                                                <div style={{ color: "var(--ion-color-medium)" }}>
                                                    {lastPrediction ? `Confidence: ${Math.round(lastPrediction.confidence * 100)}%` : ""}
                                                </div>
                                            </IonText>
                                        </div>
                                    </div>

                                    <hr />

                                    <div>
                                        <strong>Notes</strong>
                                        <ul>
                                            <li>Allow camera access when prompted.</li>
                                            <li>
                                                Integrate a ML model (TensorFlow.js, MediaPipe, etc.) inside recognizeSign()
                                                to perform real ASL recognition.
                                            </li>
                                            <li>Use a small processing size for better performance on mobile.</li>
                                        </ul>
                                    </div>
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
