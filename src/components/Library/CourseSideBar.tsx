import React from 'react';
import {
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
} from '@ionic/react';
import { chevronDown, chevronForward, add, document, albums } from 'ionicons/icons';
import courseIcon from '/public/assets/courseIcon.svg';
import pencil from '/public/assets/blackPencil.svg';
import './CourseSideBar.css';
import { useHistory } from 'react-router';

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

interface CourseSidebarProps {
    courses: CourseWithContent[];
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ courses }) => {
    const [expandedCourses, setExpandedCourses] = React.useState<Set<string>>(new Set());
    const history = useHistory();

    const toggleCourse = (courseId: string) => {
        setExpandedCourses((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) {
                newSet.delete(courseId);
            } else {
                newSet.add(courseId);
            }
            return newSet;
        });
    };

    const handleNoteClick = (courseId: string) => {
        window.location.href = `/library/${courseId}/notes`;
    };

    const handleSetClick = (courseId: string, setId: string) => {
        window.location.href = `/library/${courseId}/sets/${setId}`;
    };

    const handleAddNotes = (courseId: string) => {
        window.location.href = `/library/${courseId}/notes`;
    };

    const handleAddSets = (courseId: string) => {
        window.location.href = `/library/${courseId}/sets`;
    };

    return (
        <div className='content'>
            <div className="course-sidebar">
                <div className='course-sidebar-header'>
                    <h1 onClick={() => history.push('/library')}><u>My Library</u></h1>
                </div>
                <IonList>
                    {courses.map(course => {
                        const isExpanded = expandedCourses.has(course.id);
                        return (
                            <div key={course.id} className="course-section">
                                <IonItem 
                                    button 
                                    onClick={() => toggleCourse(course.id)}
                                    className="course-header"
                                >
                                    <img src={courseIcon} className='iconImage' slot="start"/>
                                    <IonLabel>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h2><u>{course.title}</u></h2>
                                            <IonIcon 
                                                icon={isExpanded ? chevronDown : chevronForward} 
                                                className='ionIcon'
                                            />
                                        </div>
                                    </IonLabel>
                                </IonItem>

                                {isExpanded && (
                                    <div className="course-content">
                                        {/* Notes Section */}
                                        <div className="content-section">
                                            <div className="section-header">
                                                <IonIcon icon={document} className="section-icon" />
                                                <span className="section-title">Notes</span>
                                            </div>
                                            <div className="items-list">
                                                {course.notes.length > 0 ? (
                                                    course.notes.map(note => (
                                                        <IonItem 
                                                            key={note.id}
                                                            button
                                                            onClick={() => handleNoteClick(note.url)}
                                                            className="nested-item"
                                                        >
                                                            <IonLabel>{note.title}</IonLabel>
                                                        </IonItem>
                                                    ))
                                                ) : (
                                                    <div className="empty-message">No notes yet</div>
                                                )}
                                                <IonButton
                                                    fill="clear"
                                                    size="small"
                                                    onClick={() => handleAddNotes(course.id)}
                                                    className="add-button"
                                                >
                                                    <IonIcon icon={add} slot="start" />
                                                    Add Note
                                                </IonButton>
                                            </div>
                                        </div>
                                        <div className="content-section">
                                            <div className="section-header">
                                                <IonIcon icon={albums} className="section-icon" />
                                                <span className="section-title">Vocab Sets</span>
                                            </div>
                                            <div className="items-list">
                                                {course.sets.length > 0 ? (
                                                    course.sets.map(set => (
                                                        <IonItem 
                                                            key={set.id}
                                                            button
                                                            onClick={() => handleSetClick(course.id, set.id)}
                                                            className="nested-item"
                                                        >
                                                            <IonLabel>{set.title}</IonLabel>
                                                        </IonItem>
                                                    ))
                                                ) : (
                                                    <div className="empty-message">No vocab sets yet</div>
                                                )}
                                                <IonButton
                                                    fill="clear"
                                                    size="small"
                                                    onClick={() => handleAddSets(course.id)}
                                                    className="add-button"
                                                >
                                                    <IonIcon icon={add} slot="start" />
                                                    Add Vocab Set
                                                </IonButton>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </IonList>
            </div>
            <div className='divider'></div>
        </div>
    );
};

export default CourseSidebar;