import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <AppHeader />
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="home-content">
          <h1>Practice ASL with Flash Cards</h1>
          <p>Practice American Sign Language with interactive flash cards</p>
          
          <IonButton 
            expand="block" 
            onClick={() => history.push('/flashcards/alphabet')}
          >
            Start Practicing
          </IonButton>
        </div>
        
        <div className="home-content">
          <h1>Sign Your Way to Victory!</h1>
          <p>Practice ASL the Fun Way — One Game at a Time!</p>
          
          <IonButton 
            expand="block" 
            onClick={() => history.push('/games')}
          >
            Start Playing
          </IonButton>
        </div>

        <div className="home-content">
          <h1>Sign</h1>
          <p>Practice ASL</p>
          
          <IonButton 
            expand="block" 
            onClick={() => history.push('/slr')}
          >
            Start Playing
          </IonButton>
        </div>

        <div className="home-content">
          <h1>Take Notes!</h1>
          <p>Get the edge on your learning with video notes.</p>

          <IonButton
            expand="block"
            onClick={() => history.push('/notes')}
          >
            Start Notetaking
          </IonButton>
        </div>
      </IonContent>
      <AppFooter />
    </IonPage>
  );
};

export default Home;