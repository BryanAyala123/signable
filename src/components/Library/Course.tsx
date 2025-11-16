import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';

interface RouteParams {
    course_id: string;
}

const Course: React.FC = () => {
    type Course = {
        id: string;
        title: string;
        content: string;
    };

    type Note = {
        id: string;
        title: string;
        content: string;
        url: string;
    }

    const { course_id } = useParams<RouteParams>();
    const [course, setCourse] = useState<Course>();
    const [notes, setNotes] = useState<Note[]>([]);
    const [sets, setSets] = useState<any[]>([]);
    
    React.useEffect(() => {
            const fetchItems = async () => {
              const auth = getAuth();
              const user = auth.currentUser;
              if (!user) return;
              const db = getFirestore();
              const docRef = (await import("firebase/firestore")).doc(db, "users", user.uid, "courses", course_id);
              const docSnap = await (await import("firebase/firestore")).getDoc(docRef);
              if (docSnap.exists()) {
                const docData = docSnap.data();
                const course = {
                  id: course_id,
                  title: docData.title,
                  content: docData.content
                };
                setCourse(course);
              }

                const notesRef = (await import("firebase/firestore")).collection(db, "users", user.uid, "courses", course_id, "notes");
                const notesSnapshot = await (await import("firebase/firestore")).getDocs(notesRef);
                const notesData = notesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    content: doc.data().content,
                    url: doc.data().url
                }));
                setNotes(notesData);

                const setsRef = (await import("firebase/firestore")).collection(db, "users", user.uid, "courses", course_id, "sets");
                const setsSnapshot = await (await import("firebase/firestore")).getDocs(setsRef);
                const setsData = setsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    vocabTerms: doc.data().vocabTerms
                }));
                setSets(setsData);
            };
            fetchItems();
          }, []);



    return (
        <IonPage>
            <AppHeader />
            <IonContent>
                <h2>Course ID: {course_id}</h2>
                {course && (
                    <div>
                        <h3>{course.title}</h3>
                        <p>{course.content}</p>
                    </div>
                )}

                <h3>Notes</h3>
                <ul>
                    {notes.map(note => (
                        <li key={note.id}>
                            <h4>{note.title}</h4>
                            {note.url && (
                                <a href={note.url} target="_blank" rel="noopener noreferrer">
                                    View Note
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
                <button onClick={() => {
                    window.location.href = '/library/' + course_id + '/notes';
                }}>Add New Notes</button>

                <h3>Sets</h3>
                <ul>
                    {sets.map(set => (
                        <li key={set.id}>
                            <h4>
                                <a href={`/library/${course_id}/sets/${set.id}`}>
                                    {set.title}
                                </a>
                            </h4>
                        </li>
                    ))}
                </ul>
                <button onClick={() => {
                    window.location.href = '/library/' + course_id + '/sets';
                }}>Add New Sets</button>
            </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default Course;