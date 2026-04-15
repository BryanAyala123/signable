import { IonContent, IonHeader, IonPage, IonButton
} from '@ionic/react';
import Flashcard from '../components/FlashCard/FlashCard';
import './Flashcards.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import FlashcardSidebar from '../components/FlashcardSidebar/FlashcardSidebar';
import { useAuth } from '../contexts/authContext';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Deck configs
 */
const DECK_IDS = {
  ALPHABET: 'alphabet',
} as const;

const DEFAULT_DECK_ID = DECK_IDS.ALPHABET;

/**
 * Card type definitions
 */
type AlphabetCard = {
  kind: 'alphabet';
  image: string;
  translation: string;
  weight: number;
};

type VocabCard = {
  kind: 'vocab';
  term: string;
  videoUrl: string;
  weight: number;
};

type Card = AlphabetCard | VocabCard;

interface CardProgress {
  mastered: boolean;
  learning: boolean;
}

type VocabTerm = {
  term: string;
  url: string;
  dataType: string;
  videoId: string;
};

type VocabSet = {
  id: string;
  title: string;
  vocabTerms: VocabTerm[];
  creationDate: number;
};

type CourseWithContent = {
  id: string;
  title: string;
  content: string;
  sets: VocabSet[];
};

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

const calculateWeights = (cards: Card[], progress: Record<number, CardProgress>) => {
  return cards.map((card, index) => {
    const cardProg = progress[index] || { mastered: false, learning: false };

    if (cardProg.mastered) return { ...card, weight: 1 };
    if (cardProg.learning) return { ...card, weight: 10 };
    return { ...card, weight: 5 };
  });
};

const getWeightedRandomIndex = (cards: Card[]): number => {
  const totalWeight = cards.reduce((sum, card) => sum + card.weight, 0);
  const rand = Math.random() * totalWeight;
  let runningSum = 0;

  for (let i = 0; i < cards.length; i++) {
    runningSum += cards[i].weight;
    if (rand < runningSum) return i;
  }

  return 0;
};

const buildAlphabetCards = (): AlphabetCard[] =>
  alphaImgs.map((imagePath, index) => ({
    kind: 'alphabet' as const,
    image: imagePath,
    translation: alphaTranslations[index],
    weight: 5,
  }));

const getVideoDuration = (url: string): Promise<number> =>
  new Promise(resolve => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const d = video.duration;
      video.src = '';
      resolve(d);
    };
    video.onerror = () => resolve(0);
    video.src = url;
  });

const buildVocabCards = (terms: VocabTerm[]): VocabCard[] =>
  terms
    .filter(t => t.term && t.term.trim() !== '' && t.url && t.url.trim() !== '')
    .map(t => ({
      kind: 'vocab' as const,
      term: t.term,
      videoUrl: t.url,
      weight: 5,
    }));

const VocabCardBack: React.FC<{ videoUrl: string }> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  return (
    <div className="card-content">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        onEnded={() => setEnded(true)}
        className="vocab-video"
      />
      {ended && (
        <button
          className="play-again-btn"
          onClick={e => {
            e.stopPropagation();
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play();
              setEnded(false);
            }
          }}
        >
          ↺ Play Again
        </button>
      )}
    </div>
  );
};

/**
 * Flashcard Component
 */
const Flashcards: React.FC = () => {
  const { deckID } = useParams<{ deckID: string }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);
  const [currentDeckTitle, setCurrentDeckTitle] = useState('Alphabet');

  const [flipped, setFlipped] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [cardProgress, setCardProgress] = useState<Record<string, CardProgress>>({});
  const [masteredTotal, setMasteredTotal] = useState(0);
  const [learningTotal, setLearningTotal] = useState(0);

  const [allCourses, setAllCourses] = useState<CourseWithContent[]>([]);

  const { loading } = useAuth();

  // Fetch user courses + sets from Firebase
  useEffect(() => {
    const fetchCourses = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const db = getFirestore();

      const coursesRef = collection(db, 'users', user.uid, 'courses');
      const coursesSnapshot = await getDocs(coursesRef);

      const coursesWithContent = await Promise.all(
        coursesSnapshot.docs.map(async courseDoc => {
          const courseData = courseDoc.data();
          const courseId = courseDoc.id;

          const setsRef = collection(db, 'users', user.uid, 'courses', courseId, 'sets');
          const setsSnapshot = await getDocs(setsRef);
          const sets: VocabSet[] = setsSnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            vocabTerms: doc.data().vocabTerms ?? [],
            creationDate: doc.data().creationDate,
          }));

          return {
            id: courseId,
            title: courseData.title,
            content: courseData.content,
            sets,
          };
        })
      );

      setAllCourses(coursesWithContent);
    };

    fetchCourses();
  }, []);

  const loadDeck = useCallback((cards: Card[], title: string) => {
    setShuffledCards(shuffleArray(cards));
    setCurrentIndex(0);
    setFlipped(false);
    setCardProgress({});
    setMasteredTotal(0);
    setLearningTotal(0);
    setCurrentDeckTitle(title);
  }, []);

  const handleSelectAlphabet = useCallback(() => {
    loadDeck(buildAlphabetCards(), 'Alphabet');
  }, [loadDeck]);

  const handleSelectSet = useCallback(async (terms: VocabTerm[], setTitle: string) => {
    const candidates = buildVocabCards(terms);
    const withDuration = await Promise.all(
      candidates.map(async card => {
        const duration = await getVideoDuration(card.videoUrl);
        return duration >= 1 ? card : null;
      })
    );
    const cards = withDuration.filter((c): c is VocabCard => c !== null);
    if (cards.length === 0) return;
    loadDeck(cards, setTitle);
  }, [loadDeck]);

  const markMastered = () => {
    setCardProgress(prev => {
      const current = prev[currentIndex] || { mastered: false, learning: false };
      let newMastered = masteredTotal;
      let newLearning = learningTotal;

      if (!current.mastered) {
        newMastered += 1;
        if (current.learning) newLearning -= 1;
      }

      setMasteredTotal(newMastered);
      setLearningTotal(newLearning);

      return {
        ...prev,
        [currentIndex]: { mastered: true, learning: false }
      };
    });
  };

  const markLearning = () => {
    setCardProgress(prev => {
      const current = prev[currentIndex] || { mastered: false, learning: false };
      let newMastered = masteredTotal;
      let newLearning = learningTotal;

      if (!current.learning) {
        newLearning += 1;
        if (current.mastered) newMastered -= 1;
      }

      setMasteredTotal(newMastered);
      setLearningTotal(newLearning);

      return {
        ...prev,
        [currentIndex]: { mastered: false, learning: true }
      };
    });
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const toggleSidebar = () => {
    setShowSidebar(prev => {
      if (!prev) setShowProgress(false);
      return !prev;
    });
  };

  const toggleProgressPanel = () => {
    setShowProgress(prev => {
      if (!prev) setShowSidebar(false);
      return !prev;
    });
  };

  const goToNext = useCallback(() => {
    const weightedCards = calculateWeights(shuffledCards, cardProgress);
    const nextIndex = getWeightedRandomIndex(weightedCards);
    setCurrentIndex(nextIndex);
    setFlipped(false);
  }, [shuffledCards, cardProgress]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
    setFlipped(false);
  }, [shuffledCards.length]);

  // Initialize alphabet deck on mount
  useEffect(() => {
    const selectedDeckId = deckID || DEFAULT_DECK_ID;
    if (selectedDeckId === DECK_IDS.ALPHABET) {
      loadDeck(buildAlphabetCards(), 'Alphabet');
    }
  }, [deckID, loadDeck]);

  // Handle keyboard navigation
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

  if (loading) return <p>Loading...</p>;

  const cardFront = currentCard.kind === 'alphabet'
    ? (
      <div className="card-content">
        <img
          src={currentCard.image}
          alt={`ASL sign for ${currentCard.translation}`}
        />
      </div>
    )
    : (
      <div className="card-content">
        <span className="vocab-term-text">{currentCard.term}</span>
      </div>
    );

  const cardBack = currentCard.kind === 'alphabet'
    ? (
      <div className="card-content">
        <img src={currentCard.translation} alt={currentCard.translation} />
      </div>
    )
    : (
      <VocabCardBack key={currentCard.videoUrl} videoUrl={currentCard.videoUrl} />
    );

  return (
    <IonPage>
      <AppHeader />
      <IonContent fullscreen className='fullscreenBody'>
        <div className={`mainContentWrapper ${showSidebar ? 'leftOpen' : ''} ${showProgress ? 'rightOpen' : ''}`}>
          <div className='outerFlashcard'>
            <div className='innerFlashcard'>
            <IonButton fill="clear" onClick={goToPrevious} aria-label="Previous card" className="iconButton">
              <img src={prev} />
            </IonButton>
            <div className="flashcard-container">
              <Flashcard
                key={currentIndex}
                front={cardFront}
                back={cardBack}
                flipped={flipped}
                onFlip={handleFlip}
                showCardBackground={currentCard.kind === 'vocab'}
              />
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
              <IonButton fill="clear" className='bottomIonButton' onClick={markMastered}>
              <img src={correct}/>
              </IonButton>
              <IonButton fill="clear" className='bottomIonButton' onClick={markLearning}>
              <img src={wrong} />
              </IonButton>
            </div>
            </div>
          </div>
          <FlashcardSidebar
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            courses={allCourses}
            onSelectSet={handleSelectSet}
            onSelectAlphabet={handleSelectAlphabet}
            currentDeckTitle={currentDeckTitle}
          />
          <button className={`mySetToggleButton ${showSidebar ? 'open' : ''}`} onClick={toggleSidebar}>
            {showSidebar ? <img src={prev} /> : <img src={next} />}
          </button>
          <ProgressPanel
              isOpen={showProgress}
              onClose={() => setShowProgress(false)}
              masteredTotal={masteredTotal}
              learningTotal={learningTotal}
              total={shuffledCards.length}
            />
        <button className={`panelToggleButton ${showProgress ? 'open' : ''}`} onClick={toggleProgressPanel}>
          {showProgress ? <img src={next}/> : <img src={prev}/> }
        </button>
      </IonContent>
      <AppFooter />
    </IonPage>
  );
};

export default Flashcards;
