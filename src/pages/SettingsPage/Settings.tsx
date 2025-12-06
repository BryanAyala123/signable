import React from 'react';
import {
IonPage,
IonHeader,
IonToolbar,
IonTitle,
IonContent,
IonList,
IonItem,
IonLabel,
IonInput,
IonToggle,
IonButton,
IonAvatar,
IonIcon,
} from '@ionic/react';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { useAuth } from '../../contexts/authContext';
import { doSignOut } from '../../firebase/auth';
import './Settings.css';
import TLeft from '/public/assets/settings/Vector 90.svg';
import MLeft from '/public/assets/settings/Vector 91.svg';
import BLeft from '/public/assets/settings/Vector 92.svg';
import TRight from '/public/assets/settings/Vector 93.svg';
import MRight from '/public/assets/settings/Vector 94.svg';
import BRight from '/public/assets/settings/Vector 95.svg';

const Settings: React.FC = () => {
const [username, setUsername] = React.useState('John Doe');
const [email, setEmail] = React.useState('john@example.com');
const [notifications, setNotifications] = React.useState(true);
const { currentUser } = useAuth();

const handleSave = () => {
    // Save logic here
};

// const handleLogout = async () => {
//     try {
//         await doSignOut();
//         window.location.href = '/';
//     } catch (error) {
//         console.error('Logout error:', error);
//     }
// };

return (
    <IonPage>
        <AppHeader />
        <IonContent className="MainLandingContent">
            <br />
            <div style={{ width: '66.666%', margin: '0 auto' }}>
                <IonList>
                    <IonItem style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {TLeft && <img src={TLeft} alt="Top Left Decoration" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-170px, -110px)' }} />}
                        {MLeft && <img src={MLeft} alt="Middle Left Decoration" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-185px, -70px)' }} />}
                        {BLeft && <img src={BLeft} alt="Bottom Left Decoration" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-165px, -50px)' }} />}
                        {TRight && <img src={TRight} alt="Top Right Decoration" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(120px, 5px)' }} />}
                        {MRight && <img src={MRight} alt="Middle Right Decoration" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(110px, 40px)' }} />}
                        {BRight && <img src={BRight} alt="Bottom Right Decoration" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(100px, 70px)' }} />}
                        <span
                            style={{
                                width: 221,
                                height: 221,
                                background: '#353534',
                                borderRadius: '50%',
                                margin: '0 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}
                        >
                            <span className='settingsCommandText' style={{ color: '#EBE7DB', textAlign: 'center', whiteSpace: 'pre-line' }}>
                                Upload{'\n'}Image
                            </span>
                        </span>
                    </IonItem>
                    <br />
                    <IonItem>
                        <div className='MainHeaderText' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <h1 className='settingsTextName'>Hi, {currentUser?.displayName}!</h1>
                            <div className='settingsCommandText' style={{color:'#353534'}}>Edit Username</div>
                        </div>
                    </IonItem>
                    <br />
                    <div style={{width: '100%', height: '100%', outline: '1px black solid', outlineOffset: '-0.50px'}}></div>
                    <br />
                    <IonItem>
                        <div className='settingsTextRegular' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            Email: {currentUser?.email}
                        </div>
                    </IonItem>
                    <br /><br /><br />
                    <IonItem>
                        <div className='MainHeaderText' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <div className='settingsTextRegular'>
                                Password: {currentUser?.uid?.substring(0, 3)}******
                            </div>
                            <div className='settingsCommandText' style={{color:'#353534'}}>Change Password</div>
                        </div>
                    </IonItem>
                    <br />
                    <div style={{width: '100%', height: '100%', outline: '1px black solid', outlineOffset: '-0.50px'}}></div>
                    <br />
                    <IonItem>
                        <div className='settingsCommandText' style={{color:'#353534', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>Sign Out</div>
                    </IonItem>
                    <br />
                    <IonItem>
                        <div className='settingsCommandText' style={{color:'#353534', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>Delete Account</div>
                    </IonItem>
                </IonList>
                <br /><br />
            </div>
        </IonContent>
        <AppFooter />
    </IonPage>
    );
};

export default Settings;