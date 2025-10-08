import { IonContent, IonHeader, IonButtons, IonBackButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import MemoryContainer from '../components/Games/Memory/MemoryContainer';


const Games: React.FC = () => {

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>ASL Games</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">I want to play a game...</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen className='ion-padding'>
                    <MemoryContainer />
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default Games;
