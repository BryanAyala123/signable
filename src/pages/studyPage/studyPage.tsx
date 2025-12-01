import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import './studyPage.css';

/**
 * Study Page
 * 
 *  This is the page that the user will first see
 *  It will contain SLR, Flashcards, and memory game
 */
const StudyPage: React.FC = () => {  
    const history = useHistory();
    return (
        <IonPage>
            <AppHeader />
            <IonContent className="ion-padding">
                <div className='mainContentDivStudy'>
                    <div className='mainContentDivHeader'>
                        <h1 className='mainContentDivHeaderText'>Study</h1>
                    </div>
                    <div className='dividerStudy'></div>
                    <div className='mainContentSelection'>
                        <div className='cardWrapper'>
                            <div className='mainContentSelectionType'>
                                <h1 className='mainContentSelectionTypeHeader'>ASL Practice</h1>
                                <p className='mainContentSelectionTypeText'>Use Sign Language recognition to learn vocab!</p>
                                <button className='mainContentSelectionTypeButton' onClick={() => history.push('/slr')}>Go!</button>
                            </div>
                            <p className='mainContentSelectionTypeFooter'>
                                <a onClick={() => history.push('/slrfreeplay')} style={{ cursor: 'pointer' }}>
                                    <u>Free Play Recognition</u>
                                </a>
                            </p>
                        </div>
                        <div className='mainContentSelectionType'>
                            <h1 className='mainContentSelectionTypeHeader'>Flash Cards</h1>
                            <p className='mainContentSelectionTypeText'>See and track how well you know your notes!</p>
                            <button className='mainContentSelectionTypeButton' onClick={() => history.push('/flashcards/alphabet')}>Go!</button>
                        </div>
                        <div className='mainContentSelectionType'>
                            <h1 className='mainContentSelectionTypeHeader'>Memory Game</h1>
                            <p className='mainContentSelectionTypeText'>Match your vocab to the hand sign in record time!</p>
                            <button className='mainContentSelectionTypeButton' onClick={() => history.push('/games')}>Go!</button>
                        </div>
                    </div>
                </div>
            </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default StudyPage; 