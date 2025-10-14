import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/react';
import './Memory.css';
import React, { useState } from 'react';



// Function to shuffle array randomly
const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Function to get random letters for each game
const getRandomLetters = (count: number = 4) => {
    const allLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    const shuffled = shuffleArray(allLetters);
    return shuffled.slice(0, count);
};

// Function to create cards data with random letters
const createCardsData = () => {
    const randomLetters = getRandomLetters(4); // Get 4 random letters
    
    return shuffleArray([
        ...randomLetters.map((letter, i) => [
            { id: i * 2 + 1, type: 'letter', value: letter, word: letter, image: null },
            { id: i * 2 + 2, type: 'sign', value: letter, word: letter, image: `/assets/alphaSigns/${letter.toLowerCase()}.png` }
        ]).flat()
    ]);
};

const Memory: React.FC = () => {
    const [flipped, setFlipped] = useState<number[]>([]);
    const [matched, setMatched] = useState<number[]>([]);
    const [disableAll, setDisableAll] = useState(false);
    const [gameKey, setGameKey] = useState(0); // Key to force re-render with new letters
    const [currentCardsData, setCurrentCardsData] = useState(() => createCardsData());
    const [started, setStarted] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    
    // Only create new cards data when gameKey changes (new game)
    React.useEffect(() => {
        setCurrentCardsData(createCardsData());
    }, [gameKey]);
    
    // Function to start a new game with different letters
    const startNewGame = () => {
        if (started) return; // Prevent starting a new game if one is already in progress
        setFlipped([]);
        setMatched([]);
        setDisableAll(false);
        setGameKey(prev => prev + 1); // This will trigger new random letters
        setElapsedTime(0);
        setStarted(true);
    };

    const stopWatch = () => {
        const time = elapsedTime + 100;
        setElapsedTime(time);
        return time;
    }

    // Check if game is complete
    const isGameComplete = matched.length === currentCardsData.length;

    // Auto-start new game when complete
    React.useEffect(() => {
        if (isGameComplete) {
            setStarted(false);
            setTimeout(() => {
                if (!started) {
                    startNewGame();
                }
            }, 10000); // Wait 10 seconds before starting new game
        }
    }, [isGameComplete, started]);

    React.useEffect(() => {
        if (!started) return;
        const interval = setInterval(() => {
            stopWatch();
        }, 100);
        return () => clearInterval(interval);
    }, [started, elapsedTime]);

    const handleCardClick = (id: number) => {
        if (!started) {
            setElapsedTime(0);
            setStarted(true);
        }
        if (flipped.includes(id) || matched.includes(id) || disableAll) return;

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setDisableAll(true);
            const [firstId, secondId] = newFlipped;
            const firstCard = currentCardsData.find(card => card.id === firstId);
            const secondCard = currentCardsData.find(card => card.id === secondId);

            if (firstCard && secondCard && firstCard.word === secondCard.word && firstCard.type !== secondCard.type) {
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
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>ASL Memory Game</IonTitle>
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            color: '#333',
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            minWidth: '120px'
                        }}>
                            <span>Time: {(elapsedTime / 1000).toFixed(1)}s</span>
                        </div>
                    </div>
                    
                    {isGameComplete && (
                        <div style={{ 
                            textAlign: 'center', 
                            marginBottom: '2rem',
                            padding: '1rem',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            borderRadius: '8px'
                        }}>
                            <h2>🎉 Congratulations! All matches found! 🎉</h2>
                            <p>Starting new game with different letters in 10 seconds...</p>
                            <button 
                                onClick={startNewGame}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '1rem',
                                    backgroundColor: 'white',
                                    color: '#4CAF50',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                Start New Game Now
                            </button>
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center' }}>
                        {currentCardsData.map((card) => {
                            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
                            return (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    style={{
                                        width: '120px',
                                        height: '150px',
                                        background: '#eeeeeeff',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        cursor: isFlipped || disableAll ? 'default' : 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.5s',
                                        transform: isFlipped ? 'rotateY(180deg)' : 'none',
                                        backgroundColor: isFlipped ? '#f3d593' : '#ccc',
                                        pointerEvents: isFlipped || disableAll ? 'none' : 'auto',
                                        padding: '10px',
                                        textAlign: 'center',
                                    }}>
                                    {isFlipped ? (
                                    <>
                                        {card.type === 'sign' && card.image && (
                                        <img
                                            src={card.image}
                                            style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'contain',
                                            marginBottom: '8px'
                                            }}
                                            onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                        )}

                                        {card.type === 'letter' && (
                                        <div
                                            style={{
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            color: '#2c3e50',
                                            transform: 'rotateY(180deg)'
                                            }}
                                        >
                                            {card.value}
                                        </div>
                                        )}
                                    </>
                                    ) : (
                                    <div style={{ fontSize: '2rem' }}>❓</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default Memory;
