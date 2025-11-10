import { IonContent, IonHeader, IonButtons, IonBackButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import MemoryContainer from '../components/Games/Memory/MemoryContainer';
import AppHeader from '../components/layout/AppHeader';


const Games: React.FC = () => {

    return (
        <IonPage>
            <IonHeader>
                <AppHeader />
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
