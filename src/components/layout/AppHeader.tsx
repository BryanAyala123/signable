import React from 'react';
import { IonHeader, IonToolbar, IonButton, IonAvatar } from '@ionic/react';
import logo from '/public/assets/signable-logo.png';
import { useHistory } from 'react-router-dom';
import { personCircle } from 'ionicons/icons';
import './Layout.css';

/**
 * App Header
 * 
 * Prop to show the App Header 
 * A header that has the navigation logo and profile.
 */
const AppHeader: React.FC = () => {
    const history = useHistory();
    return (
    <IonHeader className='IonHeader'>
        <IonToolbar className='mainToolbar'>
                <div className='mainLayoutDiv'>
                    <img src={logo} alt="Logo" style={{ height: '80px', width: '170px', marginRight: '10px' }} />
                    <input type='text' placeholder='Enter Words Here' className='headerSearch'/>
                    <div className="tabsContainer">
                    <IonButton fill="clear" onClick={() => history.push('/home')}><span className='tabText'>Home</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill="clear" onClick={() => history.push('/flashcards/0')}><span className='tabText'>Flashcards</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill="clear"><span className='tabText'>Social</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear' onClick={() => history.push('/games')}><span className='tabText'>Games</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear' onClick={() => history.push('/settings')}><span className='tabText'>Setting</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear' onClick={() => history.push('/resources')}><span className='tabText'>Resources</span></IonButton>
                    <IonAvatar className="profileIcon">
                        <img src={personCircle} alt="Profile" className='profilePicture'/>
                    </IonAvatar>
                    </div>
                </div>
        </IonToolbar>
    </IonHeader>
    );
};

export default AppHeader;