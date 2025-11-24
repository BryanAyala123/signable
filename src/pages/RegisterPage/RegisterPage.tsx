import { IonContent, IonPage} from '@ionic/react';
// Removed opening markdown fence
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Redirect, useHistory } from "react-router-dom";
import { doCreateUserWithEmailAndPassword} from '../../firebase/auth';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../../contexts/authContext';
import { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import React from 'react';

const RegisterPage: React.FC = () => {
    const { userLoggedIn } = useAuth();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [showSubtext, setShowSubtext] = useState(false);
    const router = useIonRouter();
    const history = useHistory();

    useEffect(() => {
        const timer1 = setTimeout(() => setShowWelcome(true), 100);
        const timer2 = setTimeout(() => setShowSubtext(true), 800);
        
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRegistering) return;
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }
        setIsRegistering(true);
        setErrorMessage('');
        try {
            const userCredential = await doCreateUserWithEmailAndPassword(email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName: username });
                await userCredential.user.reload();
            }
            history.push('/home');
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || 'Failed to register');
            setIsRegistering(false);
        }
    };

    const handleBack = () => {
        router.push('/', 'back', 'replace');
    };

    return (
        <IonPage>
            <AppHeader />
            <IonContent className="MainLandingContent">
                {userLoggedIn && <Redirect to="/study" />}
                <div className="RegisterPageMainDiv">
                    <img
                        src="https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-arrow-back-512.png"
                        alt="Back"
                        className="back-button"
                        onClick={handleBack}
                    />

                    <div className="LeftSideDiv">
                    <div className="LeftSideDivText">
                        <p className="LeftSideDivTextWelcome">Welcome to</p>
                        <p className="LeftSideDivTextSignable">
                            Signable
                        </p>
                        <p className="LeftSideDivTextOther">It's a pleasure</p>
                        <p className="LeftSideDivTextOther">to meet you.</p>
                    </div>
                    </div>

                    <div className="RightSideDiv">
                        <p className="RightSideDivHeaderText">New Account</p>

                        <form className="RegisterForm" onSubmit={onSubmit}>
                            <input
                                className="RightSideDivInputField"
                                type="text"
                                placeholder="User name"
                                value={username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                            />

                            <input
                                className="RightSideDivInputField"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            />

                            <input
                                className="RightSideDivInputField"
                                type="password"
                                placeholder="Password (8 or more characters)"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            />

                            <input
                                className="RightSideDivInputField"
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                            />

                            {errorMessage && <p className="errorMessage">{errorMessage}</p>}

                            <button
                                type="submit"
                                className="RightSideDivSignInButton"
                                disabled={isRegistering}
                            >
                                {isRegistering ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default RegisterPage;