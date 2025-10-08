import React, { useState } from 'react';
import './FlashCard.css';

/**
 * FlashCardProp Interface
 * 
 * Prop for the flashcard component.
 * Each card has a 'front' and a 'back'.
 */
interface FlashCardProp {
    front: React.ReactNode;
    back: React.ReactNode;
}

/**
 * Flashcard Component
 * 
 * Displays a card that can be flipped by clicking on it.
 * @returns the rendered flipable card.
 */
const Flashcard: React.FC<FlashCardProp> = ({ front, back }) => {
    /**
     * State of the card, if its flipped, frowing the back, or not 
     * flipped, showing the front. 
     */
    const [flipped, setFlipped] = useState(false);

    /**
     * Handles chnanging the flip state when the card is clicked. 
     */
    const handleFlip = () => {
        setFlipped(!flipped);
    };

    /**
     * Renders the actual flashcard.
     */
    return (
        <div 
            className={`flip-container ${flipped ? 'flipped' : ''}`} 
            onClick={handleFlip} 
        >
            <div className='flipper'>
                <div className='front'>
                    {front}
                </div>
                <div className='back'>
                    {back}
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
