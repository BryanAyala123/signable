import React from 'react';
import { IonHeader, IonToolbar, IonButton, IonAvatar } from '@ionic/react';
import logo from '/public/assets/signable-logo.png';
import { useHistory } from 'react-router-dom';
import { personCircle } from 'ionicons/icons';
import { useAuth } from '../../contexts/authContext';
import { doSignOut } from '../../firebase/auth';
import { useIonRouter } from '@ionic/react';
import './Layout.css';

/**
 * App Header
 * 
 * Prop to show the App Header 
 * A header that has the navigation logo and profile.
 */
const AppHeader: React.FC = () => {
    const history = useHistory();
    const { currentUser, loading } = useAuth();
    const router = useIonRouter();

    const handleLogout = async () => {
        try {
            await doSignOut();
            // Force a full page reload to clear all state and show landing page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
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
                    <IonButton fill="clear" onClick={() => history.push('/library')}><span className='tabText'>Library</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear' onClick={() => history.push('/games')}><span className='tabText'>Games</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear' onClick={() => history.push('/settings')}><span className='tabText'>Setting</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear' onClick={() => history.push('/resources')}><span className='tabText'>Resources</span></IonButton>
                    <IonAvatar className="profileIcon">
                        <IonButton fill='clear' onClick={handleLogout}><img src={personCircle} alt="Profile" className='profilePicture'/></IonButton>
                    </IonAvatar>
                    </div>
                </div>
        </IonToolbar>
    </IonHeader>
    );
};

export default AppHeader;