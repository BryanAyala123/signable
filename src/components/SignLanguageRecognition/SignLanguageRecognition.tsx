import React, { useRef, useEffect, useState } from "react";
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonText,
    useIonToast
} from "@ionic/react";
import axios from 'axios';

// --- CONFIGURATION CONSTANTS ---
const MODEL_URL = "https://recognize-sign-ft6ax3huaq-uc.a.run.app";
const ROI_SIZE = 226;
const ROI_OFFSET = 24;
const COUNTDOWN_SECONDS = 3.0;
const HOLD_ZERO_FOR = 0.2;

const SignLanguageRecognition: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isCapturingRef = useRef<boolean>(false); // Use ref for loop control
    
    // UI State
    const [cameraReady, setCameraReady] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capturedLetter, setCapturedLetter] = useState<string>(" ");
    const [displaySeconds, setDisplaySeconds] = useState<number>(COUNTDOWN_SECONDS);
    const [progressFraction, setProgressFraction] = useState<number>(0);
    
    const [presentToast] = useIonToast();

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);
    
    const preprocessFrame = (ctx: CanvasRenderingContext2D, videoEl: HTMLVideoElement): string | null => {
        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
        
        const roiData = ctx.getImageData(ROI_OFFSET, ROI_OFFSET, ROI_SIZE, ROI_SIZE);
        const data = roiData.data;

        const outputCanvas = roiCanvasRef.current;
        if (!outputCanvas) return null;

        const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
        if (!outputCtx) return null;

        const preprocessedData = new Uint8Array(128 * 128);
        
        for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 128; x++) {
                const originalX = Math.floor(x * (ROI_SIZE / 128));
                const originalY = Math.floor(y * (ROI_SIZE / 128));
                const originalIndex = (originalY * ROI_SIZE + originalX) * 4;

                const r = data[originalIndex];
                const g = data[originalIndex + 1];
                const b = data[originalIndex + 2];
                
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                const thresholded = gray < 70 ? 255 : 0;
                
                preprocessedData[y * 128 + x] = thresholded;
            }
        }
        
        const imageData = outputCtx.createImageData(128, 128);
        for(let i = 0; i < preprocessedData.length; i++) {
            const val = preprocessedData[i];
            const idx = i * 4;
            imageData.data[idx] = val;
            imageData.data[idx + 1] = val;
            imageData.data[idx + 2] = val;
            imageData.data[idx + 3] = 255;
        }
        outputCtx.putImageData(imageData, 0, 0);

        const base64Image = outputCanvas.toDataURL("image/png", 0.9).split(',')[1];
        return base64Image;
    };

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
                const tracks = stream.getVideoTracks();
                if (tracks.length > 0) {
                    const settings = tracks[0].getSettings();
                    if (settings.width && settings.height && roiCanvasRef.current) {
                        roiCanvasRef.current.width = settings.width;
                        roiCanvasRef.current.height = settings.height;
                    }
                }
                setCameraReady(true);
            }
        } catch (e: any) {
            setError("Unable to access camera. Check permissions.");
            console.error(e);
        }
    };

    const stopCamera = (): void => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        isCapturingRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
        setIsCapturing(false);
        setCapturedLetter(" ");
    };

    const recognizeSignOnServer = async (base64Image: string): Promise<string> => {
        try {
            console.log("Sending request to:", MODEL_URL);
            console.log("Image data length:", base64Image.length);

            const response = await axios.post(
                MODEL_URL,
                { image: base64Image },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 30000, // 30 second timeout
                }
            );

            // 🟩 Here's the fix — unpack the nested structure correctly
            console.log("Full response:", JSON.stringify(response.data, null, 2));

            const prediction = response.data?.data?.prediction ?? response.data?.prediction;
            console.log("Prediction received:", prediction);
            const tts_audio_base64 = response.data?.data?.tts_audio_base64;

            console.log("Prediction received:", prediction);

            // If audio is returned, play it
            if (tts_audio_base64) {
                const audioBlob = new Blob(
                    [Uint8Array.from(atob(tts_audio_base64), (c) => c.charCodeAt(0))],
                    { type: "audio/mp3" }
                );
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play();
                audio.onended = () => URL.revokeObjectURL(audioUrl);
            }

            return prediction || "ERROR"; // fallback in case prediction is missing
        } catch (err: any) {
            console.error("Server Prediction Error - Full details:", err);

            let errorMsg = "Prediction failed. ";
            if (err.response) {
                console.error("Response status:", err.response.status);
                console.error("Response data:", err.response.data);
                errorMsg += `Server error: ${err.response.status}`;
            } else if (err.request) {
                console.error("No response received:", err.request);
                errorMsg += "No response from server (CORS or network issue)";
            } else {
                console.error("Error message:", err.message);
                errorMsg += err.message;
            }

            presentToast({
                message: errorMsg,
                duration: 4000,
                color: "danger",
            });
            return "ERROR";
        }
    };


    const runSingleCaptureCycle = () => {
        if (!videoRef.current || !roiCanvasRef.current || !cameraReady) return;
        
        // Set capturing state
        isCapturingRef.current = true;
        setIsCapturing(true);
        setIsWaitingForResponse(false);
        
        const videoEl = videoRef.current;
        const roiCanvas = roiCanvasRef.current;
        const fullFrameCtx = roiCanvas.getContext("2d", { willReadFrequently: true });
        
        if (!fullFrameCtx) {
            isCapturingRef.current = false;
            setIsCapturing(false);
            return;
        }

        const startTime = performance.now();
        let capturedThisCycle = false;
        let captureTime = 0;

        const loop = () => {
            // Check ref instead of state
            if (!isCapturingRef.current) {
                return;
            }

            const now = performance.now();
            const elapsed = (now - startTime) / 1000;
            
            // Update progress bar
            const fraction = Math.min(1.0, elapsed / COUNTDOWN_SECONDS);
            setProgressFraction(fraction);
            
            // COUNTDOWN LOGIC - matches Python exactly
            if (elapsed < COUNTDOWN_SECONDS) {
                // Show remaining seconds (3, 2, 1)
                const remaining = COUNTDOWN_SECONDS - elapsed;
                const displaySec = Math.ceil(remaining);
                setDisplaySeconds(displaySec);
                
                // Continue loop
                animationFrameRef.current = requestAnimationFrame(loop);
            } else {
                // Show 0 when elapsed >= COUNTDOWN_SECONDS
                setDisplaySeconds(0);
                
                if (!capturedThisCycle) {
                    // CAPTURE ONCE at the end of countdown
                    capturedThisCycle = true;
                    captureTime = now;
                    setIsWaitingForResponse(true);
                    
                    console.log("Capturing frame and sending to server...");
                    
                    const base64Image = preprocessFrame(fullFrameCtx, videoEl);
                    
                    if (base64Image) {
                        recognizeSignOnServer(base64Image)
                            .then(prediction => {
                                const letter = prediction === "0" ? " " : prediction;
                                setCapturedLetter(letter);
                                presentToast({ 
                                    message: `Captured: ${letter}`, 
                                    duration: 1000 
                                });
                            })
                            .catch((err) => {
                                console.error("Recognition error:", err);
                            })
                            .finally(() => {
                                // Response received, allow new cycle
                                setIsWaitingForResponse(false);
                            });
                    } else {
                        setIsWaitingForResponse(false);
                    }
                }
                
                // After showing 0 for HOLD_ZERO_FOR seconds, stop the cycle
                if (capturedThisCycle && (now - captureTime) / 1000 >= HOLD_ZERO_FOR) {
                    // Stop the loop
                    isCapturingRef.current = false;
                    setIsCapturing(false);
                    setProgressFraction(0);
                    setDisplaySeconds(COUNTDOWN_SECONDS);
                    console.log("Cycle complete. Ready for next capture.");
                    return; // Exit loop
                }
                
                // Continue loop during HOLD_ZERO_FOR period
                animationFrameRef.current = requestAnimationFrame(loop);
            }
        };
        
        // Start the loop
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    const handleStartCamera = async () => {
        if (!cameraReady) {
            await startCamera();
        }
    };

    const handleStartRecognition = () => {
        if (cameraReady && !isCapturing && !isWaitingForResponse) {
            runSingleCaptureCycle();
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
                                    <div style={{ 
                                        position: "relative", 
                                        width: "100%", 
                                        paddingBottom: "75%",
                                        backgroundColor: "#000"
                                    }}>
                                        <video
                                            ref={videoRef}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover"
                                            }}
                                            autoPlay 
                                            muted 
                                            playsInline
                                        />
                                        
                                        {cameraReady && isCapturing && (
                                            <div style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                pointerEvents: "none"
                                            }}>
                                                <div style={{
                                                    position: "absolute",
                                                    top: ROI_OFFSET,
                                                    left: ROI_OFFSET,
                                                    width: ROI_SIZE,
                                                    height: ROI_SIZE,
                                                    border: "2px solid #00ff00",
                                                    boxSizing: "border-box"
                                                }}></div>
                                                <div style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    fontSize: "80px",
                                                    fontWeight: "bold",
                                                    color: "#ffffff",
                                                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
                                                }}>
                                                    {displaySeconds}
                                                </div>
                                                <div style={{
                                                    position: "absolute",
                                                    bottom: "30px",
                                                    left: ROI_OFFSET,
                                                    width: ROI_SIZE,
                                                    height: "12px",
                                                    backgroundColor: "rgba(40,40,40,0.8)",
                                                    borderRadius: "2px"
                                                }}>
                                                    <div style={{
                                                        width: `${progressFraction * 100}%`,
                                                        height: "100%",
                                                        backgroundColor: "#00c800",
                                                        borderRadius: "2px",
                                                        transition: "width 0.1s linear"
                                                    }}></div>
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

                            {error && (
                                <IonText color="danger">
                                    <p>{error}</p>
                                </IonText>
                            )}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                {!cameraReady && (
                                    <IonButton onClick={handleStartCamera}>
                                        Start Camera
                                    </IonButton>
                                )}
                                {cameraReady && (
                                    <>
                                        <IonButton 
                                            onClick={handleStartRecognition} 
                                            disabled={isCapturing || isWaitingForResponse}
                                        >
                                            {isWaitingForResponse ? "Processing..." : "Start Recognition"}
                                        </IonButton>
                                        <IonButton color="medium" onClick={stopCamera}>
                                            Stop Camera
                                        </IonButton>
                                    </>
                                )}
                            </div>
                        </IonCol>

                        <IonCol size="12" sizeMd="5">
                            <IonCard>
                                <IonCardContent>
                                    <IonText>
                                        <h2>Last Captured Sign</h2>
                                    </IonText>
                                    <div style={{ marginTop: 8 }}>
                                        <IonText>
                                            <div style={{ fontSize: 48, fontWeight: 'bold' }}>
                                                {capturedLetter}
                                            </div>
                                        </IonText>
                                    </div>
                                    <hr />
                                    <IonText>
                                        <strong>How it works:</strong>
                                        <ul style={{ fontSize: "14px", marginTop: "8px" }}>
                                            <li>Click "Start Camera" to enable webcam</li>
                                            <li>Click "Start Recognition" to begin 3-second countdown</li>
                                            <li>Countdown shows 3, 2, 1, then 0</li>
                                            <li>At 0, frame is captured and sent to server</li>
                                            <li>After brief pause, cycle ends and button re-enables</li>
                                            <li>Click again to start another capture</li>
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