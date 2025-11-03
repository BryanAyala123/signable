import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/react';
import './Memory.css';
import React, { useState } from 'react';
import AppHeader from '../../layout/AppHeader';



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
            { id: i * 2 + 2, type: 'sign', value: letter, word: letter, image: `/assets/alphaSigns/frontCardAlphabet/handsigns_${letter.toUpperCase()}.png` }
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
                <AppHeader />
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">I want to play a game...</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen className='ion-padding'>
                    <div className='centeringDiv'>
                    <div className='outerContainer'>
                    <div className="timer-container">
                        <div className="timer-display">
                            <span>Time: {(elapsedTime / 1000).toFixed(1)}s</span>
                        </div>
                    </div>
                    
                    {isGameComplete && (
                        <div className="completion-message">
                            <h2>🎉 Congratulations! All matches found! 🎉</h2>
                            <p>Starting new game with different letters in 10 seconds...</p>
                            <button 
                                onClick={startNewGame}
                                className="new-game-button"
                            >
                                Start New Game Now
                            </button>
                        </div>
                    )}
                    
                    <div className="cards-grid">
                        {currentCardsData.map((card) => {
                            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
                            return (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    className={`card ${isFlipped ? 'flipped' : ''} ${isFlipped || disableAll ? 'disabled' : ''}`}
                                >
                                    {isFlipped ? (
                                        <>
                                            {card.type === 'sign' && card.image && (
                                                <img
                                                    src={card.image}
                                                    className="card-image"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                    alt={`ASL sign for ${card.value}`}
                                                />
                                            )}

                                            {card.type === 'letter' && (
                                                <div className="card-letter">
                                                    {card.value}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="card-back">❓</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    </div>
                    </div>
                </IonContent>
            </IonContent>
        </IonPage>
    );
};

export default Memory;
