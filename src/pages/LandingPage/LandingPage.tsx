import { IonContent, IonPage} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import landingImage from '/public/assets/signaldo.gif';
import landingImage2 from '/public/assets/landingPageImage2.png';
import landingImage3 from '/public/assets/landingPageImage3.png';
import UsbIcon from '/public/assets/usbIcon.png';
import EditIcon from '/public/assets/editIcon.png';
import WorldIcon from '/public/assets/worldIcon.png';
import PlusIcon from '/public/assets/plusSignIcon.png';
import './LandingPage.css';

/**
 * Landing Page Page
 * 
 * Page to display first page
 * The first page to the user contains details like register and log in
 */

const LandingPage: React.FC = () => {
    const history = useHistory();
    const [name, setName] = useState("");

    const goToHero = () => {
        history.push(`/heroslr?name=${encodeURIComponent(name)}`);
    };
    
    useEffect(() => {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px'
        };
    
        const observerCallback = (entries: any[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const containers = entry.target.querySelectorAll('.SecondBlockDivDiscContainer');
                    containers.forEach((container: { classList: { add: (arg0: string) => void; }; }) => {
                        container.classList.add('animate');
                    });
                }
            });
        };
    
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const targetSection = document.querySelector('.SecondBlockDivDisc');
        if (targetSection) {
            observer.observe(targetSection);
        }
    
        const thirdBlockCallback = (entries: any[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const blocks = entry.target.querySelectorAll('.ThirdBlockDivContentBlock');
                    blocks.forEach((block: { classList: { add: (arg0: string) => void; }; }) => {
                        block.classList.add('animate');
                    });
                }
            });
        };
    
        const thirdBlockObserver = new IntersectionObserver(thirdBlockCallback, observerOptions);
        const thirdBlockContent = document.querySelector('.ThirdBlockDivContent');
        if (thirdBlockContent) {
            thirdBlockObserver.observe(thirdBlockContent);
        }

        return () => {
            if (targetSection) {
                observer.unobserve(targetSection);
            }
            if (thirdBlockContent) {
                thirdBlockObserver.unobserve(thirdBlockContent);
            }
        };
    }, []);

return (
    <IonPage>
        <AppHeader />
            <IonContent className="MainLandingContent">
                    <div className='MainLandingDiv'>
                        <div className='landingSection'>
                        <div className='FirstBlockDiv'>
                            <div className='FirstBlockDivInner'>
                                <div className='FirstBlockLeftSide'>
                                    <div className='FirstBlockLeftSideHeader'>
                                        <h1 className='FirstBlockText'>Because <span className='FirstBlockTextUnderline'>everyone</span></h1>
                                        <h1 className='FirstBlockText' >should be understood.</h1>
                                    </div>
                                    <div className='FirstBlockLeftSideDisc'>
                                        <p>Start practicing ASL today!</p>
                                    </div>
                                    <div className='FirstBlockLeftSideButtons'>
                                        <button className='FirstBlockLeftSideButton' onClick={() => history.push('/login')}>
                                            Log In
                                        </button>
                                        <button className='FirstBlockLeftSideButton' onClick={() => history.push('/register')}>
                                            Sign Up
                                        </button>
                                    </div>
                                </div>
                                <div className='FirstBlockRightSide'>
                                    <img src={landingImage} className='FirstBlockRightSideImage'/>
                                </div>
                            </div>
                        </div>
                        </div>

                        <div className='learnToSignNameBlockDiv'>
                            <div className='learnToSignNameBlockDivHeader'>
                                <h1 className='learnToSignNameBlockDivHeaderText'>Learn to sign your name- no account needed!</h1>
                            </div>
                            <div className='learnToSignNameBlockDivContent'>
                                <input
                                type='text'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder='Enter Your Name'
                                />

                                <p 
                                    onClick={name ? goToHero : undefined} 
                                    style={{ opacity: name ? 1 : 0.4, pointerEvents: name ? "auto" : "none" }}
                                    className='learnToSignNameBlockDivContentGo'>
                                    <u>Go!</u>
                                </p>

                            </div>
                        </div>

                        <div className='SecondBlockDiv'>
                            <div className='SecondBlockDivLargerHeader'>
                                <h1 className='SecondBlockDivLargerHeaderText'>Gain confidence and accuracy to become a more knowledgeable you.</h1>
                            </div>
                            <div className='SecondBlockDivLargeHeader'>
                                <p>With <span className="SecondBlockDivLargeHeaderSignable">Signable</span>, you can:</p>
                            </div>
                            <div className='SecondBlockDivDisc'>
                                <div className='SecondBlockDivDiscContainer'>
                                    <div className='SecondBlockDivDiscContainerImg'>
                                        <img className='SecondBlockDivDiscContainerImgIcon' src={UsbIcon}/>
                                    </div>
                                    <div className='SecondBlockDivDiscContainerText'>
                                        <p>Use ASL recognition tools to practice your signing and get feedback in real-time!</p>
                                    </div>
                                </div>

                                <div className='SecondBlockDivDiscContainer'>
                                    <div className='SecondBlockDivDiscContainerImg'>
                                        <img className='SecondBlockDivDiscContainerImgIcon' src={EditIcon}/>
                                    </div>
                                    <div className='SecondBlockDivDiscContainerText'>
                                        <p>Record notes and chat with Signaldo to help determine accuracy!</p>
                                    </div>
                                </div>

                                <div className='SecondBlockDivDiscContainer'>
                                    <div className='SecondBlockDivDiscContainerImg'>
                                        <img className='SecondBlockDivDiscContainerImgIcon' src={WorldIcon}/>
                                    </div>
                                    <div className='SecondBlockDivDiscContainerText'>
                                        <p>Interact with other ASL learners, learn about ASL culture, and get info about meetups!</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='ThirdBlockDiv'>
                            <div className='ThirdBlockDivTitle'>
                                <h1 className='thirdDivText'>What sets us apart</h1>
                            </div>
                            <div className='ThirdBlockDivContent'>
                                <div className='ThirdBlockDivContentBlock'>
                                    <p className='ThirdBlockDivContentBlockHeader'>Our commitment to the deaf community</p>
                                    <img className='ThirdBlockDivContentBlockImg' src={landingImage2}/>
                                    <p className='ThirdBlockDivContentBlockText'>We've conducted dozens of interviews with deaf individuals including professors, students, and more. We have an obligation to adhere to their wants and needs.</p>
                                </div>
                                <div className='ThirdBlockDivContentPlusSign'>
                                    <img className='ThirdBlockDivContentPlusSignImg' src={PlusIcon}/>
                                </div>
                                <div className='ThirdBlockDivContentBlock'>
                                    <p className='ThirdBlockDivContentBlockHeader'>Cutting-edge technology and features</p>
                                    <img className='ThirdBlockDivContentBlockImg' src={landingImage3}/>
                                    <p className='ThirdBlockDivContentBlockText'>Signable uses modern AI and machine vision technologies to bring you the ultimate ASL studying platform. It is our mission to make it as easy as possible to learn and grow.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </IonContent>
        <AppFooter />
    </IonPage>
);
};

export default LandingPage;