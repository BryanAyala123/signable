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

const Settings: React.FC = () => {
const [username, setUsername] = React.useState('John Doe');
const [email, setEmail] = React.useState('john@example.com');
const [notifications, setNotifications] = React.useState(true);

const handleSave = () => {
    // Save logic here
};

const handleLogout = () => {
    // Logout logic here
};

return (
    <IonPage>
        <AppHeader />
        <IonContent className="MainLandingContent">
            <br />
            <div style={{ width: '66.666%', margin: '0 auto' }}>
                <IonList>
                    <IonItem>
                        <div
                            style={{
                                width: 221,
                                height: 221,
                                background: '#353534',
                                borderRadius: '50%',
                                margin: '0 auto'
                            }}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Username</IonLabel>
                        <IonInput value={username} onIonChange={e => setUsername(e.detail.value!)} />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Email</IonLabel>
                        <IonInput value={email} onIonChange={e => setEmail(e.detail.value!)} />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Notifications</IonLabel>
                        <IonToggle checked={notifications} onIonChange={e => setNotifications(e.detail.checked)} />
                    </IonItem>
                    <IonButton expand="block" onClick={handleSave}>Save</IonButton>
                    <IonButton expand="block" color="danger" onClick={handleLogout}>Logout</IonButton>
                </IonList>
            </div>
            
        </IonContent>
        <AppFooter />
    </IonPage>
);
};

export default Settings;