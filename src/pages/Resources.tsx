import React from 'react';
import { IonPage, IonHeader, IonContent } from '@ionic/react';
import AppHeader from '../components/layout/AppHeader';
import './Flashcards.css';
import Chatbot from '../components/Chatbot/Chatbot';

const Resources: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <AppHeader />
      </IonHeader>
      <IonContent fullscreen>
        <div className="pageContent">
          <h1>Resources</h1>
          <p>Welcome to Resources. Use the chat below to talk with the AI assistant.</p>
          <Chatbot />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Resources;
