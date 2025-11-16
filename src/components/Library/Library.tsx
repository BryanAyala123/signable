import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { trash, add } from 'ionicons/icons';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

import AppHeader from "../layout/AppHeader";
import AppFooter from "../layout/AppFooter";

const Library: React.FC = () => {
    type Course = {
        id: string;
        title: string;
        content: string;
    };

    const [courses, setCourses] = useState<Course[]>([]);
    const [newCourse, setNewCourse] = useState('');
    const [newContent, setNewContent] = useState('');
    const history = useHistory();

    React.useEffect(() => {
        const fetchCourses = async () => {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;
          const db = getFirestore();
          const coursesRef = (await import("firebase/firestore")).collection(db, "users", user.uid, "courses");
          const snapshot = await (await import("firebase/firestore")).getDocs(coursesRef);
          const coursesData = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            content: doc.data().content
          }));
          setCourses(coursesData);
        };
        fetchCourses();
      }, []);

    

    const handleAddCourse = async () => {
        const trimmedTitle = newCourse.trim();
        const trimmedContent = newContent.trim();
        if (!trimmedTitle) return;
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const db = getFirestore();
        const newCourseObj: Course = {
            id: Math.random().toString(36).substr(2, 9),
            title: trimmedTitle,
            content: trimmedContent,
        };
        try {
            const courseDocRef = (await import("firebase/firestore")).doc(db, "users", user.uid, "courses", newCourseObj.id);
            await setDoc(courseDocRef, newCourseObj);
            setCourses([...courses, newCourseObj]);
            setNewCourse('');
            setNewContent('');
        } catch (error) {
            console.error("Error adding course:", error);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const db = getFirestore();
        try {
            const courseDocRef = (await import("firebase/firestore")).doc(db, "users", user.uid, "courses", courseId);
            await deleteDoc(courseDocRef);
            setCourses(courses.filter(c => c.id !== courseId));
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    };

    const handleCourseClick = (courseId: string) => {
        history.push(`/library/${courseId}`);
    };

    return (
        <IonPage>
            <AppHeader />
            <IonContent className="ion-padding">
                <IonList>
                    {courses.map(course => (
                        <IonItem key={course.id} button onClick={() => handleCourseClick(course.id)}>
                            <div>
                                <div>{course.title}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>{course.content}</div>
                            </div>
                            <IonButton
                                slot="end"
                                color="danger"
                                fill="clear"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteCourse(course.id);
                                }}
                            >
                                <IonIcon icon={trash} />
                            </IonButton>
                        </IonItem>
                    ))}
                </IonList>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexDirection: 'column' }}>
                    <IonInput
                        value={newCourse}
                        placeholder="Course title"
                        onIonChange={e => setNewCourse(e.detail.value!)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAddCourse();
                        }}
                    />
                    <IonInput
                        value={newContent}
                        placeholder="Course content"
                        onIonChange={e => setNewContent(e.detail.value!)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAddCourse();
                        }}
                    />
                    <IonButton onClick={handleAddCourse}>
                        <IonIcon icon={add} />
                    </IonButton>
                </div>
            </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default Library;