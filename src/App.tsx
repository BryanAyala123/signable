import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Flashcards from './pages/Flashcards';
import Games from './pages/Games';
import Resources from './pages/Resources';
import Memory from './components/Games/Memory/Memory';
import SignLanguageRecognition from './components/SignLanguageRecognition/SignLanguageRecognition';
import FreePlay from './components/SLRFreePlay/FreePlay';
import './theme/variables.css';
import VideoNotetaking from './components/VideoNotetaking/VideoNotetaking';
import AddEventBoard from './components/EventBoard/AddEventBoard';
import EventBoard from './components/EventBoard/EventBoard';
import EditEventBoard from './components/EventBoard/EditEventBoard';
import AslLex from './components/AslLex/asl-lex';
import Library from './components/Library/Library';
import Course from './components/Library/Course';
import Sets from './Sets/Sets';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import MemoryContainer from './components/Games/Memory/MemoryContainer';
import LandingPage from './pages/LandingPage/LandingPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LoginPage from './pages/RegisterPage/LoginPage';
import PrivateRoute from './components/routes/ProtectedRoute';
import studyPage from './pages/studyPage/studyPage';
import StudyPage from './pages/studyPage/studyPage';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <PrivateRoute exact path="/home" component={Home} />
        <PrivateRoute exact path="/flashcards/:deckID" component={Flashcards} />
        <Route exact path="/">
          <Redirect to="/welcome" />
        </Route>
        <Route exact path="/games">
          <Games />
        </Route>
        <Route exact path="/resources">
          <Resources />
        </Route>
        <Route exact path="/games/memory">
          <Memory />
        </Route>
        <Route exact path="/slr">
            <SignLanguageRecognition />
            </Route>
        <Route exact path="/slrfreeplay">
            <FreePlay />
            </Route>
        <Route exact path="/notes">
            <VideoNotetaking />
            </Route>
        <Route exact path="/asl-lex">
            <AslLex />
            </Route>
        <Route exact path="/add-event">
            <AddEventBoard />
            </Route>
        <Route exact path="/edit-events">
            <EditEventBoard />
            </Route>
        <Route exact path="/events">
            <EventBoard />
            </Route>
        <Route exact path="/welcome">
          <LandingPage />
        </Route>
        <Route exact path="/library">
          <Library />
        </Route>
        <Route exact path="/library/:course_id">
          <Course />
        </Route>
        <Route exact path="/library/:course_id/notes">
            <VideoNotetaking />
        </Route>
        <Route exact path="/library/:course_id/sets">
            <Sets />
        </Route>
        <Route exact path="/library/:course_id/sets/:set_id">
            <Sets />
        </Route>
        <Route exact path="/register">
          <RegisterPage />
        </Route>
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/study">
          <StudyPage/>
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
