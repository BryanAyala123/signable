import { IonContent, IonPage} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import emailIcon from '/public/assets/emailIcon.png';
import unlockIcon from '/public/assets/unlockIcon.png';
import './RegisterPage.css';

/**
 * Login Page
 * 
 * Page to login
 * Asks for username and password
 */

const LoginPage: React.FC = () => {
    const history = useHistory();
return (
    <IonPage>
        <AppHeader />
            <IonContent className="MainLandingContent">
                <div className='RegisterPageMainDiv'>
                    <div className='LeftSideDiv'>
                        <div className='LeftSideDivText'>
                            <p className='LeftSideDivTextWelcome'>Welcome Back!</p>
                            <p className='LeftSideDivTextOther'>We're happy to</p>
                            <p className='LeftSideDivTextOther'>see you again.</p>
                        </div>
                    </div>
                    <div className='RightSideDiv'>
                        <p className='RightSideDivHeaderText'>User Login</p>
                        <div className='RightSideDivInput'>
                            <input className='RightSideDivEmailInput' type='text'/>
                            <img className='RightSideDivInputIcon' src={emailIcon}/>
                        </div>
                        <div className='RightSideDivInput'>
                            <input className='RightSideDivPasswordInput' type='text'/>
                            <img className='RightSideDivInputIcon' src={unlockIcon}/>
                        </div>
                        <div className='RightSideDivBottomInfo'>
                            <div className='RightSideDivBottomInfoDiv'>
                            <input type="checkbox" id="rememberMe" className='RightSideDivBottomInfoCheck'/>
                            <label htmlFor="rememberMe">Remember me</label>
                            </div>
                            
                            <p className='RightSideDivBottomInfoForgot'>Forgot Password?</p>
                        </div>
                        <button className='RightSideDivSignInButton' onClick={() => history.push('/home')}>Sign in</button>
                        <div className='RightSideDivNoAccountSection'>
                            <p className='RightSideDivNoAccountSectionText'>Don't have an account? <span><a className='signup'>Sign up!</a></span></p>
                        </div>
                    </div>
                </div>
                </IonContent>
        <AppFooter />
    </IonPage>
);
};

export default LoginPage;