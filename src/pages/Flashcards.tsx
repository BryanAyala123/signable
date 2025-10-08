import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonBackButton, IonButtons, IonButton, IonIcon 
} from '@ionic/react';
import { arrowBack, arrowForward } from 'ionicons/icons';
import Flashcard from '../components/FlashCard/FlashCard';
import './Flashcards.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import alphaImgs from '../data/alphaImgs.json';
import alphaTranslations from '../data/alphaTranslations.json';

/**
 * Deck configs
 */
const DECK_IDS = {
  ALPHABET: 'alphabet',
} as const;

const DEFAULT_DECK_ID = DECK_IDS.ALPHABET;

/**
 * Card type definition
 */
interface Card {
  image: string;
  translation: string;
}

/**
 * Shuffles deck array using Fisher-Yates algorithm
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Flashcard Component
 * 
 * Displays a deck of ASL flashcards with the sign image on one side and 
 * its translation on the other. The deck is given in a random order and 
 * cycles through the deck using clickable buttons or left and right arrow keys.
 * 
 * @returns The rendered flashcard page
 */
const Flashcards: React.FC = () => {
  const { deckID } = useParams<{ deckID: string }>();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);

  /**
   * Move to the next card, wrapping to the beginning if at the end
   */
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % shuffledCards.length);
  }, [shuffledCards.length]);

  /**
   * Move to the previous card, wrapping to the end if at the beginning
   */
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
  }, [shuffledCards.length]);

  /**
   * Initialize and shuffle the card deck
   */
  useEffect(() => {
    /**
     * Maps the image to its translation
     */
    const alphabetCards: Card[] = alphaImgs.map((imagePath, index) => ({
      image: imagePath,
      translation: alphaTranslations[index]
    }));

    /**
     * Map of decks
     */
    const decks: Record<string, Card[]> = {
      [DECK_IDS.ALPHABET]: alphabetCards,
    };

    const selectedDeck = decks[deckID || DEFAULT_DECK_ID] || decks[DEFAULT_DECK_ID];
    const shuffled = shuffleArray(selectedDeck);
    
    setShuffledCards(shuffled);
    setCurrentIndex(0);
  }, [deckID]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  if (shuffledCards.length === 0) {
    return null;
  }

  const currentCard = shuffledCards[currentIndex];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>ASL Flash Cards</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="flashcard-container">
          <Flashcard
            key={currentIndex}
            front={
              <div className="card-content">
                <img 
                  src={currentCard.image}
                  alt={`ASL sign for ${currentCard.translation}`}
                />
              </div>
            }
            back={
              <div className="card-content">
                <h1>{currentCard.translation}</h1>
              </div>
            }
          />
          
          <div className="flashcard-navigation">
            <IonButton onClick={goToPrevious} aria-label="Previous card">
              <IonIcon icon={arrowBack} />
            </IonButton>
            <span className="card-counter">
              {currentIndex + 1} / {shuffledCards.length}
            </span>
            <IonButton onClick={goToNext} aria-label="Next card">
              <IonIcon icon={arrowForward} />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Flashcards;