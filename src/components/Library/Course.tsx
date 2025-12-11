import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSplitPane } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';
import { deleteDoc } from "firebase/firestore";
import CourseSidebar from './CourseSideBar';
import pencil from '/public/assets/blackPencil.svg';
import './Course.css';

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
        creationDate: number;
    }

    type VocabSet = {
        id: string;
        title: string;
        vocabTerms: any[];
        creationDate: number;
    };

    type CourseWithContent = {
        id: string;
        title: string;
        content: string;
        notes: Note[];
        sets: VocabSet[];
    };

    const { course_id } = useParams<RouteParams>();
    const [course, setCourse] = useState<Course>();
    const [notes, setNotes] = useState<Note[]>([]);
    const [sets, setSets] = useState<any[]>([]);
    const [allCourses, setAllCourses] = useState<CourseWithContent[]>([]);
    
    React.useEffect(() => {
        const fetchItems = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            const db = getFirestore();
            
            // Fetch current course
            const docRef = doc(db, "users", user.uid, "courses", course_id);
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

            // Fetch notes for current course
            const notesRef = collection(db, "users", user.uid, "courses", course_id, "notes");
            const notesSnapshot = await getDocs(notesRef);
            const notesData = notesSnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                content: doc.data().content,
                url: doc.data().url,
                creationDate: doc.data().creationDate
            }));
            notesData.sort((a, b) => a.creationDate - b.creationDate);
            setNotes(notesData);

            // Fetch sets for current course
            const setsRef = collection(db, "users", user.uid, "courses", course_id, "sets");
            const setsSnapshot = await getDocs(setsRef);
            const setsData = setsSnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                vocabTerms: doc.data().vocabTerms,
                creationDate: doc.data().creationDate
            }));
            setsData.sort((a, b) => a.creationDate - b.creationDate);
            setSets(setsData);

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
                        url: doc.data().url,
                        creationDate: doc.data().creationDate
                    }));

                    // Fetch sets for this course
                    const courseSetsRef = collection(db, "users", user.uid, "courses", courseId, "sets");
                    const courseSetsSnapshot = await getDocs(courseSetsRef);
                    const courseSets = courseSetsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        title: doc.data().title,
                        vocabTerms: doc.data().vocabTerms,
                        creationDate: doc.data().creationDate
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
        fetchItems();
    }, [course_id]);

    const deleteNote = async (noteId: string) => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const db = getFirestore();
        const noteDocRef = doc(db, "users", user.uid, "courses", course_id, "notes", noteId);
        await deleteDoc(noteDocRef);

        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    };

    const deleteSet = async (setId: string) => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const db = getFirestore();
        const setDocRef = doc(db, "users", user.uid, "courses", course_id, "sets", setId);
        await deleteDoc(setDocRef);

        setSets(prevSets => prevSets.filter(set => set.id !== setId));
    };

    return (
        <IonPage>
            <AppHeader />
            <IonContent>
                <div className="course-page-container">
                    <div className="sidebar-container">
                        <CourseSidebar courses={allCourses} />
                    </div>
                    <div className="main-content">
                        {course && (
                            <div>
                                <div className='main-content-top'>
                                    <h1 className='main-content-header'>{course.title}</h1>
                                </div>
                                <h1 className='main-content-desc'>Description: {course.content}</h1>
                            </div>
                        )}
                        <div className='course-options'>
                            <div className='course-options-notes'>
                                <h1><u>Notes</u></h1>
                                <ul>
                                    {notes.map(note => (
                                        <li key={note.id}>
                                            <h4>
                                                <a href={note.url} target="_blank" rel="noopener noreferrer">
                                                    {note.title}
                                                </a>
                                            </h4>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    await deleteNote(note.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => {
                                    window.location.href = '/library/' + course_id + '/notes';
                                }}>Add New Notes</button>
                            </div>
                            
                            <div className='divider'></div>
                            
                            <div className='course-options-sets'>
                                <h1><u>Sets</u></h1>
                                <ul>
                                    {sets.map(set => (
                                        <li key={set.id}>
                                            <h4>
                                                <a href={`/library/${course_id}/sets/${set.id}`}>
                                                    {set.title}
                                                </a>
                                            </h4>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    await deleteSet(set.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => {
                                    window.location.href = '/library/' + course_id + '/sets';
                                }}>Add New Sets</button>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default Course;