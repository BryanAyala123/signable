import { IonContent, IonPage} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import emailIcon from '/public/assets/emailIcon.png';
import unlockIcon from '/public/assets/unlockIcon.png';
import { Redirect } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { doPasswordReset, doSignInWithEmailAndPassword, doSignInWithGoogle} from '../../firebase/auth';
import { useAuth } from '../../contexts/authContext';
import './RegisterPage.css';
import { useState, useEffect } from 'react';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

/**
 * Login Page
 * 
 * Page to login
 * Asks for username and password
 */

const LoginPage: React.FC = () => {
    const {userLoggedIn} = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSigninIn, setIsSigningIn] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [resetMessage, setResetMessage] = useState("");
    const [showWelcome, setShowWelcome] = useState(false);
    const [showSubtext, setShowSubtext] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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
        if (isSigninIn) return;
        setIsSigningIn(true);
        setErrorMessage("");

        try {
            await setPersistence(
                auth,
                rememberMe ? browserLocalPersistence : browserSessionPersistence
            );

            await doSignInWithEmailAndPassword(email, password);

        } catch (err: any) {
            console.error(err);
            setErrorMessage("Failed to sign in");
            setIsSigningIn(false);
        }
    };

    const onGoogleSignIn = (e: React.FormEvent) => {
        e.preventDefault()
        if(!isSigninIn){
            setIsSigningIn(true)
            doSignInWithGoogle().catch(err => {
                setIsSigningIn(false)
            })
        }
    }

    const handlePasswordReset = async () => {
        if (!email) {
            setResetMessage("Please enter your email first");
            return;
            }
        
            try {
            await doPasswordReset(email);
            setResetMessage("Reset email sent! Please check your inbox.");
            } catch (err: any) {
            console.error(err);
            setResetMessage("Failed to send reset email");
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
                        src='https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-arrow-back-512.png'
                        alt="Back"
                        className="back-button"
                        onClick={handleBack}
                        />
                        <div className="LeftSideDiv">
                            <div className="LeftSideDivText">
                            <p className={`LeftSideDivTextWelcome`}>
                                <span className="dash-third"></span>Welcome Back!</p>
                            <p className="LeftSideDivTextOther">We're happy to</p>
                            <p className="LeftSideDivTextOther">see you again.</p>
                            </div>
                        </div>

                        <div className="RightSideDiv">
                            <p className="RightSideDivHeaderText">User Login</p>
                            <div className="RightSideDivInput">
                            <input
                                className="RightSideDivEmailInput"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <img className="RightSideDivInputIcon" src={emailIcon} />
                            </div>
                            <div className="RightSideDivInput">
                            <input
                                className="RightSideDivPasswordInput"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <img className="RightSideDivInputIcon" src={unlockIcon} />
                            </div>

                            <div className="RightSideDivBottomInfo">
                            <div className="RightSideDivBottomInfoDiv">
                                <input 
                                    type="checkbox" 
                                    id="rememberMe" 
                                    className="RightSideDivBottomInfoCheck"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />

                                <label htmlFor="rememberMe">Remember me</label>
                            </div>
                            <p className="RightSideDivBottomInfoForgot"> <span className="forgotLink" onClick={handlePasswordReset}>Forgot Password? </span></p>
                            </div>
                            {resetMessage && (<p className="resetMessage">{resetMessage}</p>)}
                            <button
                            className="RightSideDivSignInButton"
                            onClick={onSubmit}
                            disabled={isSigninIn}
                            >
                            {isSigninIn ? "Signing in..." : "Sign in"}
                            </button>
                            {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                            <div className="RightSideDivNoAccountSection">
                            <p className="RightSideDivNoAccountSectionText">
                                Don't have an account?{" "}
                                <span>
                                <a className="signup" onClick={() => history.push("/register")}>
                                    Sign up!
                                </a>
                                </span>
                            </p>
                            </div>
                            <button onClick={onGoogleSignIn} disabled={isSigninIn} className='googleSignIn'>
                            Sign in with Google
                            </button>
                        </div>
                        </div>
                    </IonContent>
            <AppFooter />
        </IonPage>
    );
};

export default LoginPage;