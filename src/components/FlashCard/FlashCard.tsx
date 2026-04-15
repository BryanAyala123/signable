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
    flipped: boolean;
    onFlip: () => void;
    showCardBackground?: boolean;
}

/**
 * Flashcard Component
 * 
 * Displays a card that can be flipped by clicking on it.
 * @returns the rendered flipable card.
 */
const Flashcard: React.FC<FlashCardProp> = ({ front, back, flipped, onFlip, showCardBackground }) => {
    /**
     * State of the card, if its flipped, frowing the back, or not 
     * flipped, showing the front. 
     */

    /**
     * Renders the actual flashcard.
     */
    return (
        <div
            className={`flip-container ${flipped ? 'flipped' : ''}`}
            onClick={onFlip}
        >
            <div className='flipper'>
                <div className={`front${showCardBackground ? ' card-bg' : ''}`}>
                    {front}
                </div>
                <div className={`back${showCardBackground ? ' card-bg' : ''}`}>
                    {back}
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
