import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import React, { useState } from 'react';

const cardsData = [
    { id: 1, value: '🍎' },
    { id: 2, value: '🍌' },
    { id: 3, value: '🍎' },
    { id: 4, value: '🍌' },
];

const Games: React.FC = () => {
    const [flipped, setFlipped] = useState<number[]>([]);
    const [matched, setMatched] = useState<number[]>([]);
    const [disableAll, setDisableAll] = useState(false);

    const handleCardClick = (id: number) => {
        if (flipped.includes(id) || matched.includes(id) || disableAll) return;

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setDisableAll(true);
            const [firstId, secondId] = newFlipped;
            const firstCard = cardsData.find(card => card.id === firstId);
            const secondCard = cardsData.find(card => card.id === secondId);

            if (firstCard && secondCard && firstCard.value === secondCard.value) {
                setTimeout(() => {
                    setMatched(prev => [...prev, firstId, secondId]);
                    setFlipped([]);
                    setDisableAll(false);
                }, 800);
            } else {
                setTimeout(() => {
                    setFlipped([]);
                    setDisableAll(false);
                }, 800);
            }
        }
    };

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
                        <IonTitle size="large">I want to play a game...</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen className='ion-padding'>
                    <h1>Memory Game!</h1>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                        {cardsData.map((card) => {
                            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
                            return (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    style={{
                                        width: '80px',
                                        height: '120px',
                                        background: '#eee',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        cursor: isFlipped || disableAll ? 'default' : 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.3s',
                                        transform: isFlipped ? 'rotateY(180deg)' : 'none',
                                        backgroundColor: isFlipped ? '#fff' : '#ccc',
                                        pointerEvents: isFlipped || disableAll ? 'none' : 'auto',
                                    }}
                                >
                                    {isFlipped ? card.value : '❓'}
                                </div>
                            );
                        })}
                    </div>
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default Games;
