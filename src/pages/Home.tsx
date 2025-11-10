import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';
import { useAuth } from '../contexts/authContext';
import { doSignOut } from '../firebase/auth';
import { useIonRouter } from '@ionic/react';
import MtSetTable from '../components/MtSetTable/MtSetTable';
import Notebook from '../components/Notebook/Notebook';
import ChatBot from '../components/Chatbot/Chatbot';
import eyeball from '/public/assets/eyeball.svg';
import computer from '/public/assets/computer.svg';
import squareCheck from '/public/assets/square-check.svg';
import squareQuestion from '/public/assets/square-question.svg';
import lessThan from '/public/assets/lessThan.svg';
import moreThan from '/public/assets/moreThan.svg';
import phone from '/public/assets/phone.svg';
import checker from '/public/assets/checker.svg';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const { currentUser, loading } = useAuth();
  const router = useIonRouter();

  const handleLogout = async () => {
    await doSignOut();
    router.push('/login', 'forward', 'replace'); 
  };

  if (loading) return <p>Loading...</p>;

  return (
    <IonPage>
      <IonHeader>
        <AppHeader />
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="home-content">
          <div className='homeContentLeftSide'>
            <MtSetTable />
            <div className='homeContentLeftSideStudy'>
              <div className='homeContentLeftSideStudyHeader'>
                <p><u>Study</u></p>
              </div>
              <div className='homeContentLeftSideStudyContent'>
                <button onClick={() => history.push('/slr')}>
                  <div className='homeContentLeftSideStudyContentSLR'>
                    <p className='homeContentLeftSideStudyContentSLRText'>ASL Recognition</p>
                    <img className='eyeballImg'  src={eyeball}/>
                    <img className='computerImg'  src={computer}/>
                  </div>
                </button>
                <button onClick={() => history.push('/games')}>
                  <div className='homeContentLeftSideStudyContentMemory'>
                    <p className='homeContentLeftSideStudyContentMemText'>Memory</p>
                    <div className='homeContentLeftSideStudyContentMemoryImages'>
                      <img src={squareQuestion} className='homeContentLeftSideStudyContentMemoryImg'/>
                      <img src={squareQuestion} className='homeContentLeftSideStudyContentMemoryImg'/>
                      <img src={squareCheck} className='homeContentLeftSideStudyContentMemoryImg'/>
                    </div>
                    <div className='homeContentLeftSideStudyContentMemoryImages'>
                      <img src={squareCheck} className='homeContentLeftSideStudyContentMemoryImg'/>
                      <img src={squareQuestion} className='homeContentLeftSideStudyContentMemoryImg'/>
                      <img src={squareQuestion} className='homeContentLeftSideStudyContentMemoryImg'/>
                    </div>
                  </div>
                </button>
                <button onClick={() => history.push('/flashcards/alphabet')}>
                  <div className='homeContentLeftSideStudyContentFlashcard'>
                    <p className='homeContentLeftSideStudyContentFlashText'>Flashcards</p>
                    <div className='homeContentLeftSideStudyContentFlashcardInnerDiv'>
                      <img src={lessThan} className='homeContentLeftSideStudyContentFlashcardInnerDivImg'/>
                      <img src={phone} className='homeContentLeftSideStudyContentFlashcardInnerDivImgPhone'/>
                      <img src={moreThan} className='homeContentLeftSideStudyContentFlashcardInnerDivImg'/>
                    </div>
                    <img src={checker} className='homeContentLeftSideStudyContentFlashcardChecker'/>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className='homeContentRightSide'>
            <div className='homeRightSideTopDiv'>
              <div className='homeContentRightSideNameDiv'>
                <div className='MainHeaderText'>
                  <h1 className='MainHeaderTextName'>Hi, {currentUser?.displayName}!</h1>
                </div>
                <div className='MainHeaderStreak'>
                  <p><span>7</span>/8 Terms Memorized Today</p>
                </div>
                <div className='ViewGoals'>
                  <u>View Daily Goals</u>
                </div>
              </div>

              <div className='MessageBoard'>
                <div className='MessageBoardOuterDiv'>
                  <div className='MessageBoardInnerDiv'>
                    <p className='AmountMessages'>5</p>
                  </div>
                  <p className='MessagesLink'><u>Messages</u></p>
                </div>
              </div>
            </div>
            <div className='homeRightSideBottomDiv'>
              <div className='homeContentNotebook'>
                <div className='homeContentNotebookHeader'>
                  <p><u>Notebook</u></p>
                </div>
                <div className='NotebookContent'>
                  <Notebook />
                </div>
              </div>

              <div className='homeContentChatbot'>
                <div className='homeContentChatBotHeader'>
                  <p><u>Chat with Signaldo</u></p>
                  </div>
                  <ChatBot miniMode={true}/>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
      <AppFooter />
    </IonPage>
  );
};

export default Home;