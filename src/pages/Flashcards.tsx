import { IonContent, IonHeader, IonPage, IonButton 
} from '@ionic/react';
import Flashcard from '../components/FlashCard/FlashCard';
import './Flashcards.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import alphaImgs from '../data/alphaImgs.json';
import alphaTranslations from '../data/alphaTranslations.json';
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';
import prev from '/public/assets/prevIcon.png';
import next from '/public/assets/nextIcon.png'
import flip from '/public/assets/Buttons/flipButton.png';
import correct from '/public/assets/Buttons/correctButton.png';
import wrong from '/public/assets/Buttons/wrongButton.png';
import ProgressPanel from '../components/ProgressPanel/ProgressPanel';
import SetPanel from '../components/SetSelection/SetSelection';
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

  const [flipped, setFlipped] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showUserSet, setUserSet] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const toggleSetsPanel = () => {
    setUserSet(prev => {
      if (!prev) setShowProgress(false); 
      return !prev;
    });
  };
  
  const toggleProgressPanel = () => {
    setShowProgress(prev => {
      if (!prev) setUserSet(false); 
      return !prev;
    });
  };

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
        <AppHeader />
      </IonHeader>
      <SetPanel
              isOpen={showUserSet}
              onClose={() => setUserSet(false)}
            />
        <button className={`mySetToggleButton ${showUserSet ? 'open' : ''}`} onClick={toggleSetsPanel}>
          {showUserSet ? <img src={prev}/> : <img src={next}/> }
        </button>
      <IonContent fullscreen className='fullscreenBody'>
        <div className={`mainContentWrapper ${showUserSet ? 'leftOpen' : ''} ${showProgress ? 'rightOpen' : ''}`}>
          <div className='outerFlashcard'>
            <div className='innerFlashcard'>
            <IonButton fill="clear" onClick={goToPrevious} aria-label="Previous card" className="iconButton">
              <img src={prev} />
            </IonButton>
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
                    <img 
                      src={currentCard.translation}
                    />
                  </div>
                }
                flipped={flipped}
                onFlip={handleFlip}
              />
              <div className="flashcard-navigation">
                <span className="card-counter">
                  {currentIndex + 1} / {shuffledCards.length}
                </span>
              </div>
            </div>
                <IonButton fill="clear" onClick={goToNext} aria-label="Next card" className="iconButton">
                  <img src={next}/>
                </IonButton>
                </div>
          </div>
          <div className='bottomCard'>
            <div className='bottomButtons'>
              <IonButton fill="clear" className='bottomIonButton' onClick={handleFlip}>
                <img src={flip} />
              </IonButton>
              <div className="dividerLine"></div>
              <IonButton fill="clear" className='bottomIonButton'>
              <img src={correct}/>
              </IonButton>
              <IonButton fill="clear" className='bottomIonButton'>
              <img src={wrong} />
              </IonButton>
            </div>
            </div>
          </div>
          
      </IonContent>
      <ProgressPanel
              isOpen={showProgress}
              onClose={() => setShowProgress(false)}
            />
        <button className={`panelToggleButton ${showProgress ? 'open' : ''}`} onClick={toggleProgressPanel}>
          {showProgress ? <img src={next}/> : <img src={prev}/> }
        </button>
      <AppFooter />
    </IonPage>
  );
};

export default Flashcards;