import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDown, chevronForward, albums } from 'ionicons/icons';
import courseIcon from '/public/assets/courseIcon.svg';
import './FlashcardSidebar.css';

type VocabTerm = {
    term: string;
    url: string;
    dataType: string;
    videoId: string;
};

type VocabSet = {
    id: string;
    title: string;
    vocabTerms: VocabTerm[];
    creationDate: number;
};

type CourseWithContent = {
    id: string;
    title: string;
    content: string;
    sets: VocabSet[];
};

interface FlashcardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    courses: CourseWithContent[];
    onSelectSet: (terms: VocabTerm[], setTitle: string) => void;
    onSelectAlphabet: () => void;
    currentDeckTitle: string;
}

const isValidTerm = (t: VocabTerm) =>
    t.term && t.term.trim() !== '' && t.url && t.url.trim() !== '';

const FlashcardSidebar: React.FC<FlashcardSidebarProps> = ({
    isOpen,
    onClose,
    courses,
    onSelectSet,
    onSelectAlphabet,
    currentDeckTitle,
}) => {
    const [expandedCourses, setExpandedCourses] = React.useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseId)) {
                next.delete(courseId);
            } else {
                next.add(courseId);
            }
            return next;
        });
    };

    // Only show sets that have at least one valid term
    const getValidSets = (sets: VocabSet[]) =>
        sets.filter(s => s.vocabTerms && s.vocabTerms.some(isValidTerm));

    // Only show courses that have at least one valid set
    const validCourses = courses.filter(c => getValidSets(c.sets).length > 0);

    return (
        <div className="flashcard-sidebar-overlay" onClick={onClose}>
            <div className="flashcard-sidebar-panel" onClick={e => e.stopPropagation()}>
                <div className="flashcard-sidebar-inner">
                    <div className="flashcard-sidebar-header">My Library</div>

                    {/* Built-in Alphabet deck */}
                    <div
                        className={`flashcard-deck-item alphabet-deck ${currentDeckTitle === 'Alphabet' ? 'active' : ''}`}
                        onClick={() => { onSelectAlphabet(); onClose(); }}
                    >
                        Alphabet
                    </div>

                    {/* User courses + sets */}
                    {validCourses.length === 0 ? (
                        <div className="flashcard-sidebar-empty">No sets with vocab yet</div>
                    ) : (
                        validCourses.map(course => {
                            const isExpanded = expandedCourses.has(course.id);
                            const validSets = getValidSets(course.sets)
                                .slice()
                                .sort((a, b) => a.creationDate - b.creationDate);

                            return (
                                <div key={course.id} className="flashcard-course-section">
                                    <div
                                        className="flashcard-course-header"
                                        onClick={() => toggleCourse(course.id)}
                                    >
                                        <img src={courseIcon} className="flashcard-course-icon" alt="" />
                                        <span className="flashcard-course-title">{course.title}</span>
                                        <IonIcon
                                            icon={isExpanded ? chevronDown : chevronForward}
                                            className="flashcard-chevron"
                                        />
                                    </div>

                                    {isExpanded && (
                                        <div className="flashcard-sets-list">
                                            <div className="flashcard-sets-section-label">
                                                <IonIcon icon={albums} className="flashcard-sets-icon" />
                                                Vocab Sets
                                            </div>
                                            {validSets.map(set => (
                                                <div
                                                    key={set.id}
                                                    className={`flashcard-set-item ${currentDeckTitle === set.title ? 'active' : ''}`}
                                                    onClick={() => { onSelectSet(set.vocabTerms, set.title); onClose(); }}
                                                >
                                                    {set.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlashcardSidebar;
