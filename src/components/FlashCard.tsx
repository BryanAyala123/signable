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
    onClick?: () => void;
    disabled?: boolean;
    flipped?: boolean;
}

/**
 * Flashcard Component
 * 
 * Displays a card that can be flipped by clicking on it.
 * @returns the rendered flipable card.
 */
const Flashcard: React.FC<FlashCardProp> = ({ front, back, onClick, disabled = false, flipped = false }) => {
    /**
     * Handles changing the flip state when the card is clicked. 
     */
    const handleFlip = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };

    /**
     * Renders the actual flashcard.
     */
    return (
        <div 
            className={`flip-container ${flipped ? 'flipped' : ''} ${disabled ? 'disabled' : ''}`} 
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
