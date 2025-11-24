import React, { useRef, useState } from 'react';
import {
    IonPage,
    IonHeader,
    IonContent,
    IonButton,
    IonFooter,
} from '@ionic/react';
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useParams } from 'react-router-dom';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';
import './Sets.css'
import CourseSidebar from '../components/Library/CourseSideBar';

type VocabTerm = {
    term: string;
    url: string;
    dataType: string;
    videoId: string;
};

type Note = {
    id: string;
    title: string;
    content: string;
    url: string;
    creationDate: number;
};

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

interface RouteParams {
    course_id: string;
    set_id?: string;
}

const Sets: React.FC = () => {
    const [title, setTitle] = React.useState<string>('Sample Vocabulary Set');
    const [vocabTerms, setVocabTerms] = React.useState<VocabTerm[]>([]);
    const [creationDate, setCreationDate] = React.useState<number>(Date.now());
    const [allCourses, setAllCourses] = React.useState<CourseWithContent[]>([]);
    const initialized = useRef(false);
    let { course_id, set_id } = useParams<RouteParams>();

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recording, setRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const chunks = useRef<Blob[]>([]);
    const [video, setVideo] = useState<string>("");
    
    const [selectedTermIndex, setSelectedTermIndex] = useState<number | null>(null);
    const [isAddingNewTerm, setIsAddingNewTerm] = useState(false);
    const [newTermName, setNewTermName] = useState<string>('');
    const [newTermDataType, setNewTermDataType] = useState<string>('');

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
                    vocabTerms: [],
                    creationDate: Date.now()
                };
                await setDoc(newSetRef, newSet);
                const newId = newSetRef.id;
                window.location.replace(`/library/${course_id}/sets/${newId}`);
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

            // Fetch ALL courses for sidebar
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            const db = getFirestore();
            
            const coursesRef = collection(db, "users", user.uid, "courses");
            const coursesSnapshot = await getDocs(coursesRef);
            
            const coursesWithContent = await Promise.all(
                coursesSnapshot.docs.map(async (courseDoc) => {
                    const courseData = courseDoc.data();
                    const courseId = courseDoc.id;

                    const courseNotesRef = collection(db, "users", user.uid, "courses", courseId, "notes");
                    const courseNotesSnapshot = await getDocs(courseNotesRef);
                    const courseNotes = courseNotesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        title: doc.data().title,
                        content: doc.data().content,
                        url: doc.data().url,
                        creationDate: doc.data().creationDate
                    }));
                    courseNotes.sort((a, b) => a.creationDate - b.creationDate);

                    const courseSetsRef = collection(db, "users", user.uid, "courses", courseId, "sets");
                    const courseSetsSnapshot = await getDocs(courseSetsRef);
                    const courseSets = courseSetsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        title: doc.data().title,
                        vocabTerms: doc.data().vocabTerms,
                        creationDate: doc.data().creationDate
                    }));
                    courseSets.sort((a, b) => a.creationDate - b.creationDate);

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
        initializeSet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                alert('Camera access is not supported in this browser');
                return;
            }
            
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.muted = true;
                videoRef.current.controls = false;
                await videoRef.current.play();
            }
            
            mediaRecorderRef.current = new MediaRecorder(mediaStream);
            chunks.current = [];
            
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };
            
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'video/webm' });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    setVideo(base64data);
                    
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                        videoRef.current.src = base64data;
                        videoRef.current.controls = true;
                        videoRef.current.muted = false;
                        videoRef.current.load();
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
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access camera: ' + (error as Error).message);
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    async function uploadVideoBase64ToFirebase(base64Video: string, userId: string, setId: string, videoId: string): Promise<string> {
        const storage = getStorage();
        const base64 = base64Video.split(",")[1] || base64Video;
        const videoRef = ref(storage, `users/${userId}/sets/${setId}/videos/${videoId}.webm`);
        await uploadString(videoRef, base64, "base64");
        const url = await getDownloadURL(videoRef);
        return url;
    }

    const saveNewTerm = async () => {
        if (!newTermName.trim()) {
            alert("Please enter a term name");
            return;
        }
        
        if (!newTermDataType) {
            alert("Please record or upload a video");
            return;
        }

        const videoId = Math.random().toString(36).substr(2, 9);
        let url = '';
        
        if (newTermDataType === "video") {
            if (!set_id) return;
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            url = await uploadVideoBase64ToFirebase(video, user.uid, set_id, videoId);
        }
        
        const newTerm = { 
            term: newTermName, 
            url, 
            dataType: newTermDataType, 
            videoId: videoId 
        };
        
        setVocabTerms(prevTerms => {
            const updatedTerms = [...prevTerms, newTerm];
            persistVocabTerms(updatedTerms);
            return updatedTerms;
        });
        
        // Reset form
        setNewTermName('');
        setVideo('');
        setNewTermDataType('');
        setIsAddingNewTerm(false);
        
        if (videoRef.current) {
            videoRef.current.src = '';
            videoRef.current.srcObject = null;
        }
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

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || !set_id || !videoId) return;
        const storage = getStorage();
        const videoRef = ref(storage, `users/${user.uid}/sets/${set_id}/videos/${videoId}.webm`);
        try {
            await (await import("firebase/storage")).deleteObject(videoRef);
        } catch (error) {
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
            vocabTerms: terms,
            creationDate
        });
    };

    const selectedCourse = allCourses.find(c => c.id === course_id);

    return (
        <IonPage>
            <IonHeader>
                <AppHeader />
            </IonHeader>
            <IonContent>
                <div style={{ display: 'flex', height: '100%' }} className='mainContent'>
                    {/* Sidebar */}
                    <div style={{ width: '300px'}}>
                        <CourseSidebar courses={allCourses} />
                    </div>
                    
                    {/* Main Content Area */}
                    <div className='mainSetContent'>
                        {/* Left Side - Term List */}
                        <div className='mainSetContentLeftSide'>
                            <div className='courseTitle'>
                                <h1>{selectedCourse?.title || "Loading Course..."}</h1>
                            </div>
                            <div className='setNameInput'>
                                <input
                                    type="text"
                                    className="title-input"
                                    placeholder="Enter set name"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    onBlur={() => {
                                        const auth = getAuth();
                                        const user = auth.currentUser;
                                        if (!user || !set_id) return;
                                        const db = getFirestore();
                                        const setDocRef = doc(db, "users", user.uid, "courses", course_id, "sets", set_id);
                                        setDoc(setDocRef, {
                                            title,
                                            vocabTerms
                                        });
                                    }}
                                />
                            </div>
                            <div className='termsList'>
                                {vocabTerms.map((term, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`termItem ${selectedTermIndex === idx ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedTermIndex(idx);
                                            setIsAddingNewTerm(false);
                                        }}
                                    >
                                        <span className='termName'>{term.term}</span>
                                    </div>
                                ))}
                            </div>
                            <div className='addTermSection'>
                                <IonButton
                                    expand="block"
                                    className="add-term-button"
                                    onClick={() => {
                                        setIsAddingNewTerm(true);
                                        setSelectedTermIndex(null);
                                        setNewTermName('');
                                        setVideo('');
                                        setNewTermDataType('');
                                        if (videoRef.current) {
                                            videoRef.current.src = '';
                                            videoRef.current.srcObject = null;
                                        }
                                    }}
                                >
                                    <u>New Term</u>
                                </IonButton>
                            </div>
                        </div>

                        {/* Right Side - Term Card or Add Form */}
                        <div className='mainSetContentRightSide'>
                            {isAddingNewTerm ? (
                                <div className='termCard'>
                                    <div className='termCardHeader'>
                                        <h1 className='newTermHeader'>New Term</h1>
                                        <div>
                                            <button 
                                            className='newTermButton'
                                                onClick={saveNewTerm}
                                            >
                                                <p><u>Save</u></p>
                                            </button>
                                            <button 
                                            className='newTermButton'
                                                onClick={() => {
                                                    setIsAddingNewTerm(false);
                                                    setNewTermName('');
                                                    setVideo('');
                                                    setNewTermDataType('');
                                                }}
                                            >
                                                <p><u>Cancel</u></p>
                                            </button>
                                        </div>
                                    </div>
                                    <div className='termCardContent'>
                                        <div className='newTermFormContainer'>
                                            <label className='newTermFormLabel'>
                                                <p>Term Name:</p>
                                            </label>
                                            <input
                                                type="text"
                                                className='newTermNameInput'
                                                placeholder="Enter term name"
                                                value={newTermName}
                                                onChange={e => setNewTermName(e.target.value)}
                                            />
                                        </div>
                                        <div className='videoSection'>
                                            <label className='newTermFormLabel'>
                                                <p>Video:</p>
                                            </label>
                                            <div className="videoPreviewContainer">
                                                <video ref={videoRef} width="100%" height="240" autoPlay muted />
                                            </div>
                                            <div className='videoButtonsContainer'>
                                                <button
                                                    className={`video-button videoButtonFlex ${recording ? 'recording' : ''}`}
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
                                                            setNewTermDataType('video');
                                                        }
                                                    }}
                                                >
                                                    <p className='recordingVid'>{recording ? 'Stop Recording' : 'Record Video'}</p>
                                                </button>
                                                <label className='videoUploadLabel'>
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        className='videoUploadInput'
                                                        onChange={e => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    if (event.target?.result) {
                                                                        const base64data = event.target.result as string;
                                                                        setVideo(base64data);
                                                                        setNewTermDataType('video');
                                                                        if (videoRef.current) {
                                                                            videoRef.current.srcObject = null;
                                                                            videoRef.current.src = base64data;
                                                                            videoRef.current.controls = true;
                                                                            videoRef.current.muted = false;
                                                                        }
                                                                    }
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="video-button videoUploadButton"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                                                        }}
                                                    >
                                                        <p>Upload Video</p>
                                                    </button>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedTermIndex !== null && vocabTerms[selectedTermIndex] ? (
                                <div className='termCard'>
                                    <div className='termCardHeader'>
                                        <button 
                                            className='deleteButton'
                                            onClick={() => {
                                                deleteVocabTerm(selectedTermIndex);
                                                setSelectedTermIndex(null);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className='termCardContent'>
                                        <h2 className='termCardTitle'>{vocabTerms[selectedTermIndex].term}</h2>
                                        {vocabTerms[selectedTermIndex].dataType === "video" && vocabTerms[selectedTermIndex].url && (
                                            <video 
                                                src={vocabTerms[selectedTermIndex].url} 
                                                controls 
                                                className="termCardVideo"
                                            />
                                        )}
                                        {vocabTerms[selectedTermIndex].dataType === "image" && vocabTerms[selectedTermIndex].url && (
                                            <img 
                                                src={vocabTerms[selectedTermIndex].url} 
                                                alt={vocabTerms[selectedTermIndex].term} 
                                                className="termCardImage"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className='emptyState'>
                                    <p className='emptyStateMessage'>Select a term to view details or click "Add New Term" to create one</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </IonContent>
            <IonFooter>
                <AppFooter/>
            </IonFooter>
        </IonPage>
    );
};

export default Sets;