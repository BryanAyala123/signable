import React, { useRef, useState } from "react";
import { IonPage, IonContent, IonButton, IonText, IonCard, IonCardContent, IonList, IonItem, IonLabel } from "@ionic/react";

import "./VideoNotetaking.css"; // You can define Ionic-safe styling here
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";



const VideoNotetaking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [video, setVideo] = useState<string>("");

  const [notes, setNotes] = React.useState<{ id: string; title: string; content: string; video?: string }[]>([]);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [selectedNote, setSelectedNote] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchNotes = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const db = getFirestore();
      const notesRef = (await import("firebase/firestore")).collection(db, "users", user.uid, "notes");
      const snapshot = await (await import("firebase/firestore")).getDocs(notesRef);
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        content: doc.data().content,
        video: doc.data().video,
      }));
      setNotes(notesData);
    };
    fetchNotes();
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

  const handleAddNote = async () => {
    if (title.trim() && content.trim()) {
      const id = await addNoteToFirestore(title, content, video)
      setNotes([...notes, { id, title, content, video }]);
      setTitle("");
      setContent("");
    }
  };

  async function addNoteToFirestore(title: string, content: string, video: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const db = getFirestore();
    const noteId = crypto.randomUUID();
    const noteRef = doc(db, "users", user.uid, "notes", noteId);
    const url = await uploadVideoBase64ToFirebase(video, user.uid, noteId);
    await setDoc(noteRef, {
      title,
      content,
      video: url
    });
    return noteId;
  }

  async function uploadVideoBase64ToFirebase(base64Video: string, userId: string, noteId: string): Promise<string> {
    const storage = getStorage();
    // Remove the data URL prefix if present
    const base64 = base64Video.split(",")[1] || base64Video;
    const videoRef = ref(storage, `users/${userId}/notes/${noteId}/video.webm`);
    await uploadString(videoRef, base64, "base64");
    const url = await getDownloadURL(videoRef);
    return url;
  }

  const handleSelectNote = (index: number) => {
    setSelectedNote(index);
    setTitle(notes[index].title);
    setContent(notes[index].content);
  };

  const handleUpdateNote = () => {
    if (selectedNote !== null && title.trim() && content.trim()) {
      const updatedNotes = notes.map((note, idx) =>
        idx === selectedNote ? { ...note, title, content } : note
      );
      setNotes(updatedNotes);
      updateNoteInFirestore(notes[selectedNote].id, title, content, notes[selectedNote].video || "");
      setSelectedNote(null);
      setTitle("");
      setContent("");
    }
  };

  async function updateNoteInFirestore(noteId: string, title: string, content: string, video: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const db = getFirestore();
    const noteRef = doc(db, "users", user.uid, "notes", noteId);
    await setDoc(noteRef, {
      title,
      content,
      video
    }, { merge: true });
  }


  const handleDeleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, idx) => idx !== index);
    setNotes(updatedNotes);
    deleteNoteFromFirestore(notes[index].id);
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };

  async function deleteNoteFromFirestore(noteId: string) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const db = getFirestore();
    const noteRef = doc(db, "users", user.uid, "notes", noteId);
    await deleteDoc(noteRef);

    // Delete the video from Firebase Storage
    const storage = getStorage();
    const videoRef = ref(storage, `users/${user.uid}/notes/${noteId}/video.webm`);
    try {
      await (await import("firebase/storage")).deleteObject(videoRef);
    } catch (error) {
      // Ignore if file does not exist
      if ((error as any)?.code !== "storage/object-not-found") {
        throw error;
      }
    }
  }



  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Video Notetaking</h2>
          <p>Take notes while watching your video.</p>
        </IonText>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", maxWidth: 1200, margin: "0 auto" }}>
          <div className="notes-list" style={{ marginTop: "24px", maxWidth: "800px", marginLeft: 0, marginRight: "auto" }}>
            <IonText>
              <h3>Notes</h3>
            </IonText>
            {notes.length === 0 && (
              <IonText color="medium">
                <p>No notes yet.</p>
              </IonText>
            )}
            {notes.map((note, idx) => {
              const isExpanded = selectedNote === idx;
              return (
                <div
                  key={idx}
                  className="note-item"
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                    background: "#000000ff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    maxWidth: "100%",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedNote(isExpanded ? null : idx)}
                >
                  <strong>{note.title}</strong>
                  {isExpanded && (
                    <p style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{note.content}</p>
                  )}
                  {isExpanded && note.video && (
                    <>
                      <video
                        src={note.video}
                        controls
                        preload="auto"
                        style={{ width: "100%", marginTop: "8px" }}
                        onClick={e => e.stopPropagation()}
                      />
                      <IonButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectNote(idx);
                        }}
                        style={{ marginRight: "8px" }}
                      >
                        Edit
                      </IonButton>
                      <IonButton
                        size="small"
                        color="danger"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteNote(idx);
                        }}
                      >
                        Delete
                      </IonButton>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <IonCard style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
            <IonCardContent>
              <video ref={videoRef} width="100%" height="240" autoPlay muted />
              <div style={{ marginTop: 10 }}>
                {!recording ? (
                  <IonButton
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current.controls = false;
                      }
                      startRecording();
                    }}
                  >
                    Start Recording
                  </IonButton>
                ) : (
                  <IonButton color="danger" onClick={() => {
                    stopRecording();
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                    }
                  }}>
                    Stop Recording
                  </IonButton>
                )}
              </div>
            </IonCardContent>

            <div className="note-form" style={{ maxWidth: 600, margin: "0 auto" }}>
              <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ marginBottom: "8px", width: "100%" }}
              />
              <textarea
                placeholder="Note Content"
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ marginBottom: "8px", width: "100%" }}
                rows={3}
              />
                {selectedNote === null ? (
                <IonButton expand="block" onClick={handleAddNote} disabled={recording}>
                  Add Note
                </IonButton>
                ) : (
                <IonButton expand="block" color="secondary" onClick={handleUpdateNote} disabled={recording}>
                  Update Note
                </IonButton>
                )}
            </div>
          </IonCard>
        </div>


      </IonContent>
    </IonPage>
  );
};

export default VideoNotetaking;
