import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonIcon, IonModal, IonButtons } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { trash, add } from 'ionicons/icons';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import appIcon from '/public/assets/square-plus.svg';
import pencil from '/public/assets/blackPencil.svg';
import './Library.css'
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
    const [showModal, setShowModal] = useState(false);
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
        <div className='LibraryContent'>
            <div className='LibraryContentTop'>
                <h1 className='LibraryContentTopHeader'>My Library</h1>
            </div>

            <div className='LibraryContentBottom'>
                <div className='LibraryContentBottomRightSide'>
                    <h1 className='LibraryContentBottomRightSideHeader'>Recents</h1>
                </div>
                <div className='VerticalDivider'></div>
                <div className='LibraryContentBottomLeftSide'>
                <div className='headerRow'>
                <h1 className='LibraryContentBottomLeftSideHeader'>Courses</h1>
                    <IonButton onClick={() => setShowModal(true)} className='triggerButton'>
                        <img src={appIcon} className='LibraryContentBottomLeftSideHeaderButton'/>
                    </IonButton>
                </div>

                    <IonList>
                        {courses.map(course => (
                            <IonItem key={course.id} button onClick={() => handleCourseClick(course.id)} className='LibraryContentBottomLeftSideCourse'>
                                <div className='LibraryContentBottomLeftSideCourseName'>
                                    <div className='LibraryContentBottomLeftSideCourseNameHeader'>
                                        <h1><u className='coursetitle'>{course.title}</u><img src={pencil} className='pencilSvg'/></h1>
                                    </div>
                                </div>
                                <div className='HorizontalDivider'></div>
                                <div className='LibraryContentBottomLeftSideCourseDesc'>
                                    <p>{course.content}</p>
                                </div>
                                <IonButton
                                    className="delete-course-btn"
                                    slot="end"
                                    fill = "clear"
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (!window.confirm("Would like to delete this course?")) return;
                                        handleDeleteCourse(course.id);
                                    }}
                                >
                                    <IonIcon icon={trash} />
                                </IonButton>
                            </IonItem>
                        ))}
                    </IonList>
                </div>
            </div>
        </div>
    </IonContent>
    <AppFooter />
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="custom-modal">
        <IonHeader>
            <IonToolbar className='modalToolbar'>
                <IonTitle className='modalHeader'>Add New Course</IonTitle>
                <IonButtons slot="end">
                    <IonButton onClick={() => setShowModal(false)} className='closeButton'>
                        Close
                    </IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" style={{ '--background': '#EBE7DB' }}>
            <div className='modalContent'>
                <div>
                    <IonInput
                        value={newCourse}
                        placeholder="Course title"
                        onIonChange={e => setNewCourse(e.detail.value!)}
                        label="Title"
                        labelPlacement="stacked"
                        className='modalInput'
                    />
                    <IonInput
                        value={newContent}
                        placeholder="Course content"
                        onIonChange={e => setNewContent(e.detail.value!)}
                        label="Description"
                        labelPlacement="stacked"
                        className='modalInput'
                    />
                </div>
                <IonButton 
                    expand="block"
                    className='addButton'
                    onClick={() => {
                        handleAddCourse();
                        setShowModal(false);
                    }}
                >
                    Add Course
                </IonButton>
            </div>
        </IonContent>
    </IonModal>
</IonPage>
    );
};

export default Library;