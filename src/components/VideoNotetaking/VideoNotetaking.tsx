import React, { useRef, useState } from "react";
import { IonPage, IonContent, IonButton, IonText, IonCard, IonCardContent, IonList, IonItem, IonLabel} from "@ionic/react";

import "./VideoNotetaking.css"; // You can define Ionic-safe styling here



const VideoNotetaking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [notes, setNotes] = React.useState<{ title: string; content: string }[]>([]);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [selectedNote, setSelectedNote] = React.useState<number | null>(null);

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
          const url = URL.createObjectURL(blob);
          // setRecordedVideos((prev) => [url, ...prev]);

          if (videoRef.current) {
              videoRef.current.src = url;
              videoRef.current.controls = true;
              videoRef.current.play();
              videoRef.current.srcObject = null;
              videoRef.current.pause();
          }
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

  const handleAddNote = () => {
    if (title.trim() && content.trim()) {
      setNotes([...notes, { title, content }]);
      setTitle("");
      setContent("");
    }
  };

  const handleSelectNote = (index: number) => {
    setSelectedNote(index);
    setTitle(notes[index].title);
    setContent(notes[index].content);
  };

  const handleUpdateNote = () => {
    if (selectedNote !== null && title.trim() && content.trim()) {
      const updatedNotes = notes.map((note, idx) =>
        idx === selectedNote ? { title, content } : note
      );
      setNotes(updatedNotes);
      setSelectedNote(null);
      setTitle("");
      setContent("");
    }
  };

  const handleDeleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, idx) => idx !== index);
    setNotes(updatedNotes);
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Video Notetaking</h2>
          <p>Take notes while watching your video.</p>
        </IonText>
        <IonCard style={{ flex: 1 }}>
            <IonCardContent>
                <video ref={videoRef} width="100%" height="240" autoPlay muted />
                <div style={{ marginTop: 10 }}>
                    {!recording ? (
                        <IonButton onClick={startRecording}>Start Recording</IonButton>
                    ) : (
                        <IonButton color="danger" onClick={stopRecording}>Stop Recording</IonButton>
                    )}
                </div>
            </IonCardContent>
        </IonCard>
        <div className="note-form">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: "8px" }}
          />
          <textarea
            placeholder="Note Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ width: "100%", marginBottom: "8px" }}
            rows={3}
          />
          {selectedNote === null ? (
            <IonButton expand="block" onClick={handleAddNote}>
              Add Note
            </IonButton>
          ) : (
            <IonButton expand="block" color="secondary" onClick={handleUpdateNote}>
              Update Note
            </IonButton>
          )}
        </div>
        <div className="notes-list" style={{ marginTop: "24px" }}>
          <IonText>
            <h3>Notes</h3>
          </IonText>
          {notes.length === 0 && (
            <IonText color="medium">
              <p>No notes yet.</p>
            </IonText>
          )}
          {notes.map((note, idx) => (
            <div key={idx} className="note-item" style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
              <strong>{note.title}</strong>
              <p>{note.content}</p>
              <IonButton size="small" onClick={() => handleSelectNote(idx)} style={{ marginRight: "8px" }}>
                Edit
              </IonButton>
              <IonButton size="small" color="danger" onClick={() => handleDeleteNote(idx)}>
                Delete
              </IonButton>
            </div>
          ))}
        </div>
        <IonCard style={{ flex: 1 }}>
            <IonCardContent>
                <IonLabel>Recorded Videos</IonLabel>
                <IonList>
                    {recordedVideos.map((url, idx) => (
                        <IonItem key={idx}>
                            <video src={url} controls width="100%" height="120" />
                        </IonItem>
                    ))}
                </IonList>
            </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default VideoNotetaking;
