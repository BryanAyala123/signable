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
IonModal,
} from '@ionic/react';
import { getAuth, updateProfile, updatePassword } from "firebase/auth";



import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { useAuth } from '../../contexts/authContext';
import { doSignOut } from '../../firebase/auth';
import './Settings.css';
import TLeft from '/assets/settings/Vector 90.svg';
import MLeft from '/assets/settings/Vector 91.svg';
import BLeft from '/assets/settings/Vector 92.svg';
import TRight from '/assets/settings/Vector 93.svg';
import MRight from '/assets/settings/Vector 94.svg';
import BRight from '/assets/settings/Vector 95.svg';
import { getStorage, ref, listAll, deleteObject, getDownloadURL, uploadBytes } from "firebase/storage";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const Settings: React.FC = () => {
const { currentUser } = useAuth();
const [username, setUsername] = React.useState(currentUser?.displayName || '');
const [showUsernamePopup, setShowUsernamePopup] = React.useState(false);
const [showChangePasswordPopup, setShowChangePasswordPopup] = React.useState(false);
const [newPassword, setNewPassword] = React.useState('');



const handleLogout = async () => {
    try {
        await doSignOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
};


const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
};

const updateUsername = async () => {
    const auth = getAuth();
    if (auth.currentUser && username.trim()) {
        try {
            await updateProfile(auth.currentUser, { displayName: username.trim() });
            window.location.reload();
        } catch (error) {
            console.error('Error updating username:', error);
        }
    }
};





    const handleChangePassword = async () => {
        const auth = getAuth();
        if (auth.currentUser && newPassword.trim()) {
            try {
                await updatePassword(auth.currentUser, newPassword.trim());
            } catch (error: any) {
                console.error('Error updating password:', error);
                alert(error.message || 'Failed to update password.');
            }
        } else {
            alert('Please enter a valid new password.');
        }
        setNewPassword('');
    };

    async function handleDeleteAccount(event: React.MouseEvent<HTMLDivElement, MouseEvent>): Promise<void> {
        event.preventDefault();
        const auth = getAuth();
        if (auth.currentUser) {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                try {
                    const uid = auth.currentUser.uid;
                    const storage = getStorage();
                    const userRootRef = ref(storage, `users/${uid}`);

                    // Helper to recursively delete all files/folders in a given ref
                    async function deleteAllStorage(refToDelete: any) {
                        const list = await listAll(refToDelete);
                        await Promise.all(list.items.map((itemRef: any) => deleteObject(itemRef)));
                        await Promise.all(list.prefixes.map((folderRef: any) => deleteAllStorage(folderRef)));
                    }

                    // Delete everything in users/{uid}
                    await deleteAllStorage(userRootRef);

                    // Delete all Firestore documents under users/{uid}
                    const db = getFirestore();

                    // Helper to recursively delete all documents in a collection (and subcollections)
                    async function deleteCollectionRecursive(collRef: any) {
                        const snapshot = await getDocs(collRef);
                        await Promise.all(snapshot.docs.map(async (docSnap: any) => {
                            // Delete the document itself
                            await deleteDoc(docSnap.ref);
                        }));
                    }

                    // Delete notes
                    await deleteCollectionRecursive(collection(db, `users/${uid}/notes`));
                    // Delete courses and their subcollections
                    const coursesSnap = await getDocs(collection(db, `users/${uid}/courses`));
                    await Promise.all(coursesSnap.docs.map(async (courseDoc) => {
                        // Delete notes in course
                        await deleteCollectionRecursive(collection(db, `users/${uid}/courses/${courseDoc.id}/notes`));
                        // Delete sets in course
                        await deleteCollectionRecursive(collection(db, `users/${uid}/courses/${courseDoc.id}/sets`));
                        // Delete the course doc itself
                        await deleteDoc(courseDoc.ref);
                    }));
                    // Delete the user root doc if it exists
                    await deleteDoc(doc(db, `users/${uid}`));

                    

                    // Finally, delete the user account
                    await auth.currentUser.delete();
                    alert('Your account has been deleted.');
                    window.location.href = '/';
                } catch (error: any) {
                    console.error('Error deleting account:', error);
                    alert(error.message || 'Failed to delete account. You may need to re-authenticate.');
                }
            }
        }
    }



    async function handleChangeProfilePicture(event: React.MouseEvent<HTMLSpanElement, MouseEvent>): Promise<void> {
        event.preventDefault();
        // Create a hidden file input to select an image
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) {
                    alert('No user is signed in.');
                    return;
                }
                const storage = getStorage();
                const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                // Upload file
                await uploadBytes(storageRef, file);
                // Get download URL
                const url = await getDownloadURL(storageRef);
                // Update user profile photoURL
                await updateProfile(user, { photoURL: url });
                window.location.reload();
            } catch (error: any) {
                console.error('Error uploading profile picture:', error);
                alert(error.message || 'Failed to upload profile picture.');
            }
        };
        input.click();
    }

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
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {currentUser?.photoURL && (
                                <img
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        zIndex: 1
                                    }}
                                />
                            )}
                            <span
                                className='settingsCommandText'
                                onClick={handleChangeProfilePicture}
                                style={{
                                    color: '#EBE7DB',
                                    textAlign: 'center',
                                    whiteSpace: 'pre-line',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 2,
                                    background: 'rgba(53, 53, 52, 0.3)', // optional: slight overlay for visibility
                                    cursor: 'pointer'
                                }}
                            >
                                Upload{'\n'}Image
                            </span>
                        </span>
                    </IonItem>
                    <br />
                    <IonItem>
                        <div className='MainHeaderText' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <h1 className='settingsTextName'>Hi, {currentUser?.displayName}!</h1>
                            <div
                                className='settingsCommandText'
                                style={{ color: '#353534', cursor: 'pointer' }}
                                onClick={() => setShowUsernamePopup(true)}
                            >
                                Edit Username
                            </div>
                            {/* Username Edit Popup */}
                            <IonModal className="settingsPopupInput" isOpen={showUsernamePopup} onDidDismiss={() => setShowUsernamePopup(false)}>
                                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <h2 className="settingsTextRegular" style={{ textAlign: 'center', fontSize: 25 }}>Edit Username</h2>
                                    <br />
                                    <IonInput
                                        value={username}
                                        onIonChange={e => setUsername(e.detail.value!)}
                                        placeholder="Enter new username"
                                        className='settingsTextRegular'
                                        style={{
                                            textAlign: 'center',
                                            outline: '2px solid #222', // dark outline
                                            outlineOffset: '2px',
                                            borderRadius: 8,
                                        }}
                                    />
                                    <br />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                                        <IonButton className='settingsCommandText' fill="clear" color="light" onClick={async () => { await updateUsername(); setShowUsernamePopup(false); }}>
                                            Save
                                        </IonButton>
                                        <IonButton className='settingsCommandText' fill="clear" color="medium" onClick={() => setShowUsernamePopup(false)}>
                                            Cancel
                                        </IonButton>
                                    </div>
                                    <br /><br /><br />
                                </div>
                            </IonModal>
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
                                Password: *********
                            </div>
                            <div className='settingsCommandText' style={{ color: '#353534', cursor: 'pointer' }} onClick={() => setShowChangePasswordPopup(true)}>Change Password</div>
                            <IonModal className="settingsPopupInput" isOpen={showChangePasswordPopup} onDidDismiss={() => setShowChangePasswordPopup(false)}>
                                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <h2 className="settingsTextRegular" style={{ textAlign: 'center', fontSize: 25 }}>Change Password</h2>
                                    <br />
                                    <IonInput
                                        type="password"
                                        value={newPassword}
                                        onIonChange={e => setNewPassword(e.detail.value!)}
                                        placeholder="Enter new password"
                                        className='settingsTextRegular'
                                        style={{
                                            textAlign: 'center',
                                            outline: '2px solid #222',
                                            outlineOffset: '2px',
                                            borderRadius: 8,
                                        }}
                                    />
                                    <br />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                                        <IonButton className='settingsCommandText' fill="clear" color="light" onClick={async () => { await handleChangePassword(); setShowChangePasswordPopup(false); }}>Save</IonButton>
                                        <IonButton className='settingsCommandText' fill="clear" color="medium" onClick={() => setShowChangePasswordPopup(false)}>Cancel</IonButton>
                                    </div>
                                    <br /><br /><br />
                                </div>
                            </IonModal>
                        </div>
                    </IonItem>
                    <br />
                    <div style={{width: '100%', height: '100%', outline: '1px black solid', outlineOffset: '-0.50px'}}></div>
                    <br />
                    <IonItem>
                        <div className='settingsCommandText' onClick={handleLogout} style={{color:'#353534', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>Sign Out</div>
                    </IonItem>
                    <br />
                    <IonItem>
                        <div className='settingsCommandText' onClick={handleDeleteAccount} style={{color:'#353534', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>Delete Account</div>
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