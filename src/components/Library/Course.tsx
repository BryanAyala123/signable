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
                <button onClick={() => {
                    window.location.href = '/library/' + course_id + '/notes';
                }}>Add New Notes</button>

                <h3>Sets</h3>
                <button onClick={() => {
                    window.location.href = '/library/' + course_id + '/sets';
                }}>Add New Sets</button>
            </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default Course;