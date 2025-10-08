import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Signable</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Welcome to Signable!</IonTitle>
          </IonToolbar>
        </IonHeader>
        
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
      </IonContent>
    </IonPage>
  );
};

export default Home;