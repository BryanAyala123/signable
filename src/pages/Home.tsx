import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Signable</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Hello World!</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className='ion-padding'>
          <h1>Hello World!</h1>
        </IonContent>
        <ExploreContainer />
      </IonContent>
    </IonPage>
  );
};

export default Home;
