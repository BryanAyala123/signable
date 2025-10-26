import { IonContent, IonPage} from '@ionic/react';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Redirect, useHistory } from "react-router-dom";
import { doCreateUserWithEmailAndPassword} from '../../firebase/auth';
import { useAuth } from '../../contexts/authContext';
import { useState } from 'react';
import { useIonRouter } from '@ionic/react';
import { updateProfile } from "firebase/auth";
import './RegisterPage.css';

/**
 * Register Page
 * 
 * Page to display making a new user
 * takes in info like username and passwords to make a new account
 */

const RegisterPage: React.FC = () => {
    const {userLoggedIn} = useAuth()
    
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const router = useIonRouter();
    const history = useHistory();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRegistering) return;
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }
        setIsRegistering(true);
        setErrorMessage("");
        try {
            const userCredential = await doCreateUserWithEmailAndPassword(email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName: username });
                await userCredential.user.reload();
            }
            history.push('/home');
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "Failed to register");
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
                {userLoggedIn && <Redirect to="/home" />}
                <div className="RegisterPageMainDiv">
                <img
                        src='https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-arrow-back-512.png'
                        alt="Back"
                        className="back-button"
                        onClick={handleBack}
                        />
                <div className="LeftSideDiv">
                    <div className="LeftSideDivText">
                    <p className="LeftSideDivTextWelcome">Welcome to</p>
                    <p className="LeftSideDivTextSignable">Signable</p>
                    <p className="LeftSideDivTextOther">It's a pleasure</p>
                    <p className="LeftSideDivTextOther">to meet you.</p>
                    </div>
                </div>

                <div className="RightSideDiv">
                    <p className="RightSideDivHeaderText">New Account</p>

                    <input
                    className="RightSideDivInputField"
                    type="text"
                    placeholder="User name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                    className="RightSideDivInputField"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                    className="RightSideDivInputField"
                    type="password"
                    placeholder="Password (8 or more characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />

                    <input
                    className="RightSideDivInputField"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errorMessage && <p className="errorMessage">{errorMessage}</p>}

                    <button
                    className="RightSideDivSignInButton"
                    onClick={onSubmit}
                    disabled={isRegistering}
                    >
                    {isRegistering ? "Creating Account..." : "Create Account"}
                    </button>
                </div>
                </div>
                </IonContent>
        <AppFooter />
    </IonPage>
);
};

export default RegisterPage;