import React, { useState } from "react";
import exitbttn from '/public/assets/exitButton.svg';
import './MemoryContainer.css';

const sampleCards = [
    { id: 1, value: "🍎" },
    { id: 2, value: "🍎" },
    { id: 3, value: "🍌" },
    { id: 4, value: "🍌" },
];

const MemoryContainer: React.FC = () => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [previewFlipped, setPreviewFlipped] = useState<number[]>([]);

    const handleInfoClose = () => setInfoOpen(false);

    const handlePreviewFlip = (id: number) => {
        setPreviewFlipped((prev) =>
            prev.includes(id) ? prev.filter((cardId) => cardId !== id) : [...prev, id]
        );
    };

    const handlePlay = () => {
        window.location.href = '/games/memory';
    };

    return (
        <div className="memory-container">
            <div className="header-buttons">
        </div>
            <div className="memory-header">
                <div className="topPortion">
                    <p className="headerTextMain">Tutorial</p>
                    <div className="exit-buttondiv">
                        <button className="exit-button" onClick={handlePlay}>
                        <img src={exitbttn} className="exitbutton"/>
                        </button>
                    </div>
                </div>
                <p className="headerText">Match two cards with the same symbol to keep them face up</p>
                <p className="headerText">Try to remember their positions!</p>
            </div>
            <div className="cards-container">
                {sampleCards.map((card) => (
                    <div
                        key={card.id}
                        className={`memory-card${previewFlipped.includes(card.id) ? " flipped" : ""}`}
                        onClick={() => handlePreviewFlip(card.id)}
                    >
                        <span>{previewFlipped.includes(card.id) ? card.value : "?"}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemoryContainer;
