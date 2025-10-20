import { IonContent, IonPage} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import './RegisterPage.css';

/**
 * Register Page
 * 
 * Page to display making a new user
 * takes in info like username and passwords to make a new account
 */

const RegisterPage: React.FC = () => {
    const history = useHistory();
return (
    <IonPage>
        <AppHeader />
            <IonContent className="MainLandingContent">
                <div className='RegisterPageMainDiv'>
                    <div className='LeftSideDiv'>
                        <div className='LeftSideDivText'>
                            <p className='LeftSideDivTextWelcome'>Welcome to</p>
                            <p className='LeftSideDivTextSignable'>Signable</p>
                            <p className='LeftSideDivTextOther'>Its a pleasure</p>
                            <p className='LeftSideDivTextOther'>to meet you.</p>
                        </div>
                    </div>
                    <div className='RightSideDiv'>
                        <p className='RightSideDivHeaderText'>New Account</p>
                        <input className='RightSideDivInputField' type='text' placeholder='User name'/>
                        <input className='RightSideDivInputField' type='text' placeholder='Email'/>
                        <input className='RightSideDivInputField' type='text' placeholder='Password (8 or more characters)'/>
                        <input className='RightSideDivInputField' type='text' placeholder='Confirm password'/>
                        <button className='RightSideDivSignInButton' onClick={() => history.push('/home')}>Create Account</button>
                    </div>
                </div>
                </IonContent>
        <AppFooter />
    </IonPage>
);
};

export default RegisterPage;