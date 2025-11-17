import React, { useRef, useState } from "react";
import { IonPage, IonContent, IonButton, IonText, IonCard } from "@ionic/react";
import "./VideoNotetaking.css";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import AppHeader from "../layout/AppHeader";
import AppFooter from "../layout/AppFooter";
import { useParams } from "react-router-dom";
import CourseSidebar from "../Library/CourseSideBar";

interface RouteParams {
  course_id?: string;
}

type Note = {
  id: string;
  title: string;
  content: string;
  url: string;
};

type VocabSet = {
  id: string;
  title: string;
  vocabTerms: any[];
};

type CourseWithContent = {
  id: string;
  title: string;
  content: string;
  notes: Note[];
  sets: VocabSet[];
};

const VideoNotetaking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [video, setVideo] = useState<string>("");
  const [allCourses, setAllCourses] = React.useState<CourseWithContent[]>([]);
  const [notes, setNotes] = React.useState<{ id: string; title: string; content: string; video?: string }[]>([]);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [selectedNote, setSelectedNote] = React.useState<number | null>(null);

  const { course_id } = useParams<RouteParams>();

  React.useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const db = getFirestore();

      // Fetch notes for current page
      let notesRef;
      if (course_id) {
        notesRef = collection(db, "users", user.uid, "courses", course_id, "notes");
      } else {
        notesRef = collection(db, "users", user.uid, "notes");
      }
      const snapshot = await getDocs(notesRef);
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        content: doc.data().content,
        video: doc.data().video,
      }));
      setNotes(notesData);

      // Fetch ALL courses for sidebar
      const coursesRef = collection(db, "users", user.uid, "courses");
      const coursesSnapshot = await getDocs(coursesRef);
      
      const coursesWithContent = await Promise.all(
        coursesSnapshot.docs.map(async (courseDoc) => {
          const courseData = courseDoc.data();
          const courseId = courseDoc.id;

          // Fetch notes for this course
          const courseNotesRef = collection(db, "users", user.uid, "courses", courseId, "notes");
          const courseNotesSnapshot = await getDocs(courseNotesRef);
          const courseNotes = courseNotesSnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            content: doc.data().content,
            url: doc.data().url || doc.data().video || ""
          }));

          // Fetch sets for this course
          const courseSetsRef = collection(db, "users", user.uid, "courses", courseId, "sets");
          const courseSetsSnapshot = await getDocs(courseSetsRef);
          const courseSets = courseSetsSnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            vocabTerms: doc.data().vocabTerms
          }));

          return {
            id: courseId,
            title: courseData.title,
            content: courseData.content,
            notes: courseNotes,
            sets: courseSets
          };
        })
      );

      setAllCourses(coursesWithContent);
    };
    fetchData();
  }, [course_id]);

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
      const id = await addNoteToFirestore(title, content, video);
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
    let noteRef;
    if (course_id) {
      noteRef = doc(db, "users", user.uid, "courses", course_id, "notes", noteId);
    } else {
      noteRef = doc(db, "users", user.uid, "notes", noteId);
    }
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
    let noteRef;
    if (course_id) {
      noteRef = doc(db, "users", user.uid, "courses", course_id, "notes", noteId);
    } else {
      noteRef = doc(db, "users", user.uid, "notes", noteId);
    }
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
    let noteRef;
    if (course_id) {
      noteRef = doc(db, "users", user.uid, "courses", course_id, "notes", noteId);
    } else {
      noteRef = doc(db, "users", user.uid, "notes", noteId);
    }
    await deleteDoc(noteRef);

    const storage = getStorage();
    const videoRef = ref(storage, `users/${user.uid}/notes/${noteId}/video.webm`);
    try {
      await (await import("firebase/storage")).deleteObject(videoRef);
    } catch (error) {
      if ((error as any)?.code !== "storage/object-not-found") {
        throw error;
      }
    }
  }

  return (
    <IonPage>
      <AppHeader />
      <IonContent>
        <div style={{ display: 'flex', height: '100%', background: '#EBE7DB' }}>
          {/* Sidebar */}
          <div style={{ 
            width: '300px', 
            minWidth: '300px',
            borderRight: '1px solid #ccc',
            overflowY: 'auto',
            background: '#EBE7DB'
          }}>
            <CourseSidebar courses={allCourses} />
          </div>

          {/* Main Content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            background: '#EBE7DB',
            padding: '20px'
          }}>
            <div style={{ 
              display: "flex", 
              gap: "16px", 
              justifyContent: "center", 
              maxWidth: 1200, 
              margin: "0 auto" 
            }}>
              {/* Notes List */}
              <div
                className="notes-list"
                style={{
                  marginTop: "24px",
                  maxWidth: "800px",
                  marginLeft: 0,
                  marginRight: "auto",
                  background: "#F5F3ED",
                  borderRadius: "24px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  padding: "24px 120px 16px 120px",
                  border: "2px solid #D6D3C2",
                }}
              >
                <IonText>
                  <h3 style={{
                    fontFamily: "Figtree",
                    fontWeight: 700,
                    fontSize: 28,
                    color: "#353534",
                    marginBottom: 18,
                    letterSpacing: 1.2,
                    textAlign: "left"
                  }}>Entries</h3>
                </IonText>
                {notes.length === 0 && (
                  <IonText color="medium">
                    <p style={{ fontStyle: "italic", color: "#888", margin: "12px 0" }}>No entries yet.</p>
                  </IonText>
                )}
                {notes.map((note, idx) => {
                  const isExpanded = selectedNote === idx;
                  return (
                    <div
                      key={idx}
                      className="note-item"
                      style={{
                        border: isExpanded ? "2px solid #2dd36f" : "1.5px solid #CFCFCF",
                        borderRadius: "18px",
                        padding: "18px 16px 14px 16px",
                        marginBottom: "14px",
                        background: isExpanded ? "#E8F8F1" : "#fff",
                        boxShadow: isExpanded
                          ? "0 2px 12px rgba(45,211,111,0.08)"
                          : "0 1px 4px rgba(0,0,0,0.04)",
                        maxWidth: "100%",
                        cursor: "pointer",
                        transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                        position: "relative",
                      }}
                      onClick={() => setSelectedNote(isExpanded ? null : idx)}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}>
                        <div style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: isExpanded ? "#2dd36f" : "#CFCFCF",
                          marginRight: 8,
                          transition: "background 0.2s"
                        }} />
                        <strong style={{
                          fontFamily: "Figtree",
                          fontWeight: 600,
                          fontSize: 20,
                          color: "#353534",
                          letterSpacing: 0.8,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>{note.title}</strong>
                      </div>
                      {isExpanded && (
                        <p style={{
                          marginTop: "12px",
                          whiteSpace: "pre-wrap",
                          fontFamily: "Figtree",
                          fontSize: 16,
                          color: "#353534",
                          background: "#F7F7F7",
                          borderRadius: 10,
                          padding: "10px 12px",
                          border: "1px solid #E0E0E0"
                        }}>{note.content}</p>
                      )}
                      {isExpanded && note.video && (
                        <>
                          <video
                            src={note.video}
                            controls
                            preload="auto"
                            style={{
                              width: "100%",
                              marginTop: "12px",
                              borderRadius: 12,
                              border: "1.5px solid #CFCFCF",
                              background: "#000"
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                          <div style={{
                            display: "flex",
                            gap: 10,
                            marginTop: 14,
                            justifyContent: "flex-end"
                          }}>
                            <IonButton
                              size="small"
                              fill="outline"
                              color="success"
                              onClick={e => {
                                e.stopPropagation();
                                handleSelectNote(idx);
                              }}
                              style={{
                                borderRadius: 18,
                                fontWeight: 500,
                                fontFamily: "Figtree",
                                letterSpacing: 0.5,
                                padding: "0 18px",
                                fontSize: 15,
                                border: "1.5px solid #2dd36f"
                              }}
                            >
                              Edit
                            </IonButton>
                            <IonButton
                              size="small"
                              color="danger"
                              fill="outline"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteNote(idx);
                              }}
                              style={{
                                borderRadius: 18,
                                fontWeight: 500,
                                fontFamily: "Figtree",
                                letterSpacing: 0.5,
                                padding: "0 18px",
                                fontSize: 15,
                                border: "1.5px solid #eb445a"
                              }}
                            >
                              Delete
                            </IonButton>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Note Editor Card */}
              <IonCard style={{
                width: '70%', 
                maxWidth: '800px', 
                height: '100%', 
                background: '#EBE7DB', 
                borderRadius: 39, 
                border: '2px #343434 solid'
              }}>
                <div style={{ padding: "16px", justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                  <div style={{ 
                    color: '#353534', 
                    fontSize: 40, 
                    fontFamily: 'Figtree', 
                    fontWeight: '500', 
                    letterSpacing: 1.60, 
                    wordWrap: 'break-word' 
                  }}>
                    <input
                      type="text"
                      placeholder="Entry Title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      style={{ background: 'none', outline: 'none', border: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                  <div style={{ width: '100%', height: 2, background: '#353534', borderRadius: 1 }} />
                </div>
                <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                  <textarea
                    placeholder="Entry Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{
                      marginBottom: "8px",
                      width: "100%",
                      background: 'none',
                      fontSize: 20,
                      fontFamily: 'Figtree',
                      fontWeight: '400',
                      letterSpacing: 1.28,
                      color: '#353534',
                      padding: 16,
                      border: 'none',
                      resize: 'none',
                      minHeight: 120,
                      height: 250,
                      boxSizing: 'border-box'
                    }}
                    rows={15}
                  />
                </div>
                <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                  <video ref={videoRef} width="100%" height="240" autoPlay muted />
                </div>
                <div style={{ padding: "16px", justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                  <div style={{
                    width: '100%', 
                    height: '100%', 
                    background: '#343434', 
                    borderRadius: 26, 
                    border: '2px #343434 solid'
                  }}>
                    <div style={{
                      padding: "8px",
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '24px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ flex: 1 }} />
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
                      <button
                        onClick={() => {
                          if (selectedNote === null) {
                            handleAddNote();
                          } else {
                            handleUpdateNote();
                          }
                        }}
                        disabled={recording}
                        style={{
                          opacity: recording ? 0.5 : 1,
                          filter: recording ? "grayscale(0.7)" : "none",
                          cursor: recording ? "not-allowed" : "pointer",
                          background: "none",
                          border: "none",
                          padding: 0,
                          outline: "none",
                          borderRadius: "50%",
                          boxShadow: recording
                            ? "0 0 0 2px #eb445a, 0 0 8px 2px #eb445a55"
                            : "none",
                          transition: "box-shadow 0.2s, filter 0.2s, opacity 0.2s",
                        }}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            display: "block",
                            margin: "auto",
                            filter: recording ? "grayscale(0.7)" : "none",
                          }}
                        >
                          <circle cx="16" cy="16" r="16" fill="#2dd36f" />
                          <path
                            d="M10 17.5L14 21L22 13"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <div style={{ flex: 1 }} />
                    </div>
                  </div>
                </div>
              </IonCard>
            </div>
          </div>
        </div>
      </IonContent>
      <AppFooter />
    </IonPage>
  );
};

export default VideoNotetaking;