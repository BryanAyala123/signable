import React, { useRef, useState } from 'react';
import {

IonPage,
IonHeader,
IonToolbar,
IonTitle,
IonContent,
IonList,
IonItem,
IonLabel,
IonNote,
IonButton,
} from '@ionic/react';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useParams } from 'react-router-dom';
import { set } from 'firebase/database';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";



type VocabTerm = {
term: string;
url: string;
dataType: string;
videoId: string;
};

interface RouteParams {
    course_id: string;
    set_id?: string;
}


const Sets: React.FC = () => {
const [title, setTitle] = React.useState<string>('Sample Vocabulary Set');
const [vocabTerms, setVocabTerms] = React.useState<VocabTerm[]>([]);
const [termInput, setTermInput] = React.useState<string>('');
const [media, setMedia] = React.useState<string>('text');
const [dataType, setDataType] = React.useState<string>('video');
const initialized = useRef(false);
let { course_id, set_id } = useParams<RouteParams>();

const videoRef = useRef<HTMLVideoElement>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const [recording, setRecording] = useState(false);
const [stream, setStream] = useState<MediaStream | null>(null);
const chunks = useRef<Blob[]>([]);
const [video, setVideo] = useState<string>("");

React.useEffect(() => {
    const initializeSet = async () => {
        if (!set_id && !initialized.current) {
            initialized.current = true;
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            const db = getFirestore();
            const newSetRef = doc(db, "users", user.uid, "courses", course_id, "sets", Math.random().toString(36).substr(2, 9));
            const newSet = {
                title: 'New Vocabulary Set',
                vocabTerms: []
            };
            await setDoc(newSetRef, newSet);
            set_id = newSetRef.id;

            window.location.replace(`/library/${course_id}/sets/${set_id}`);
            return;
        }
        if (set_id) {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            const db = getFirestore();
            const setDocRef = doc(db, "users", user.uid, "courses", course_id, "sets", set_id);
            const setDocSnap = await (await import("firebase/firestore")).getDoc(setDocRef);
            if (setDocSnap.exists()) {
                const setData = setDocSnap.data();
                setTitle(setData.title);
                setVocabTerms(setData.vocabTerms);
            }
        }
    };
    initializeSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);



  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();
    }
    mediaRecorderRef.current = new MediaRecorder(mediaStream);
    chunks.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setVideo(base64data);
        if (videoRef.current) {
          videoRef.current.src = base64data;
          videoRef.current.controls = true;
          videoRef.current.play();
          videoRef.current.srcObject = null;
          videoRef.current.pause();
        }
      };
      reader.readAsDataURL(blob);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  async function uploadVideoBase64ToFirebase(base64Video: string, userId: string, setId: string, videoId: string): Promise<string> {
    const storage = getStorage();
    // Remove the data URL prefix if present
    const base64 = base64Video.split(",")[1] || base64Video;
    console.log(base64Video);
    const videoRef = ref(storage, `users/${userId}/sets/${setId}/videos/${videoId}.webm`);
    await uploadString(videoRef, base64, "base64");
    const url = await getDownloadURL(videoRef);
    return url;
  }




const addVocabTerm = async (term: string) => {
    const videoId = Math.random().toString(36).substr(2, 9); // Generate a unique ID for the video
    let url = media;
    if (dataType === "video") {
        if (!set_id) return;
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        url = await uploadVideoBase64ToFirebase(video, user.uid, set_id, videoId);
    }
    setVocabTerms(prevTerms => {
        const updatedTerms = [
            ...prevTerms,
            { term, url, dataType: dataType, videoId: videoId }
        ];
        persistVocabTerms(updatedTerms);
        return updatedTerms;
    });
};

const updateVocabTerm = (index: number, updatedTerm: VocabTerm) => {
    setVocabTerms(prevTerms => {
        const updatedTerms = prevTerms.map((t, i) => (i === index ? updatedTerm : t));
        persistVocabTerms(updatedTerms);
        return updatedTerms;
    });
};

const deleteVocabTerm = async (index: number) => {
    const videoId = vocabTerms[index].videoId;
    setVocabTerms(prevTerms => {
        const updatedTerms = prevTerms.filter((_, i) => i !== index);
        persistVocabTerms(updatedTerms);
        return updatedTerms;
    });

    // Delete the video from Firebase Storage
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !set_id || !videoId) return;
    const storage = getStorage();
    const videoRef = ref(storage, `users/${user.uid}/sets/${set_id}/videos/${videoId}.webm`);
    try {
        await (await import("firebase/storage")).deleteObject(videoRef);
    } catch (error) {
        // Ignore if file does not exist
        if ((error as any)?.code !== "storage/object-not-found") {
        throw error;
        }
    }
};

const persistVocabTerms = (terms: VocabTerm[]) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !set_id) return;
    const db = getFirestore();
    const setDocRef = doc(db, "users", user.uid, "courses", course_id, "sets", set_id);
    setDoc(setDocRef, {
        title,
        vocabTerms: terms
    });
};

return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonTitle>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            fontSize: 'inherit',
                            width: '100%',
                            outline: 'none'
                        }}
                    />
                </IonTitle>
            </IonToolbar>
        </IonHeader>
        <IonContent>
            <input
                type="text"
                placeholder="Enter term"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
                <input
                    type="text"
                    placeholder="New vocab term"
                    value={termInput}
                    onChange={e => setTermInput(e.target.value)}
                />
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                if (event.target?.result) {
                                    setMedia(event.target.result as string);
                                    setDataType('image');
                                }
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />

                <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                    <video ref={videoRef} width="100%" height="240" autoPlay muted />
                </div>
                
                <button
                    style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    outline: "none",
                    borderRadius: "50%",
                    boxShadow: recording
                      ? "0 0 0 2px #eb445a, 0 0 8px 2px #eb445a55"
                      : "none",
                    transition: "box-shadow 0.2s",
                    }}
                    onClick={() => {
                    if (!recording) {
                      if (videoRef.current) {
                      videoRef.current.muted = true;
                      videoRef.current.controls = false;
                      }
                      startRecording();
                    } else {
                      stopRecording();
                      if (videoRef.current) {
                      videoRef.current.muted = false;
                      }
                      setDataType('video');
                    }
                    
                    }}
                    aria-label={recording ? "Stop Recording" : "Start Recording"}
                  >
                    <img
                    src="/assets/videoNotes/video-on.svg"
                    alt="Video Icon"
                    style={{
                      filter: recording
                      ? "drop-shadow(0 0 4px #eb445a) brightness(1.2)"
                      : "none",
                      opacity: recording ? 1 : 0.85,
                      transition: "filter 0.2s, opacity 0.2s",
                      width: 32,
                      height: 32,
                    }}
                    />
                  </button>
                <IonButton
                    color="light"
                    style={{ color: "#fff", background: "#fff" }}
                    onClick={() => {
                        if (termInput.trim()) {
                            addVocabTerm(termInput);
                            setTermInput('');
                        }
                    }}
                >
                    Add Term
                </IonButton>
            </div>
            <IonList>
                {vocabTerms.map((term, idx) => (
                    <IonItem key={idx}>
                        <IonLabel>
                            <h2>{term.term}</h2>
                            <IonNote color="medium">{term.dataType}</IonNote>
                            {term.dataType === "image" && term.url && (
                                <img src={term.url} alt={term.term} style={{ maxWidth: 120, maxHeight: 120, marginTop: 8 }} />
                            )}
                            {term.dataType === "video" && term.url && (
                                <video src={term.url} controls style={{ maxWidth: 240, maxHeight: 240, marginTop: 8 }} />
                            )}
                        </IonLabel>
                        <IonButton
                            slot="end"
                            color="danger"
                            onClick={() => deleteVocabTerm(idx)}
                        >
                            Delete
                        </IonButton>
                    </IonItem>
                ))}
            </IonList>
        </IonContent>
    </IonPage>
);
};

export default Sets;