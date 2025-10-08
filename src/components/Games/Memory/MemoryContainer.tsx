import React, { useState } from "react";
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

    const handleInfoOpen = () => setInfoOpen(true);
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
            <div className="memory-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: 500 }}>Memory Game Preview</span>
                <button onClick={handleInfoOpen} style={{ display: "flex", alignItems: "center", fontSize: "0.9rem", padding: "4px 8px", cursor: "pointer" }}>
                    <span style={{ marginRight: 4 }}>ℹ️</span> Info
                </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", margin: "24px 0" }}>
                {sampleCards.map((card) => (
                    <div
                        key={card.id}
                        className={`memory-card${previewFlipped.includes(card.id) ? " flipped" : ""}`}
                        onClick={() => handlePreviewFlip(card.id)}
                        style={{
                            width: "60px",
                            height: "80px",
                            background: "#89e2a8ff",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                            cursor: "pointer",
                            boxShadow: previewFlipped.includes(card.id) ? "0 0 8px #90caf9" : "none",
                            transition: "box-shadow 0.2s"
                        }}
                    >
                        <span>{previewFlipped.includes(card.id) ? card.value : "?"}</span>
                    </div>
                ))}
            </div>
            <button
                style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 24px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    marginTop: "16px"
                }}
                onClick={handlePlay}
            >
                Play
            </button>
            {infoOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                    onClick={handleInfoClose}
                >
                    <div
                        style={{
                            background: "#76be8dff",
                            borderRadius: "8px",
                            padding: "24px",
                            minWidth: "300px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
                            position: "relative"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "12px" }}>How to Play</div>
                        <div style={{ marginBottom: "20px" }}>
                            Match 2 cards with the same symbol to keep them face up. Try to remember their positions!
                        </div>
                        <button
                            style={{
                                background: "#b51818ff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 16px",
                                cursor: "pointer"
                            }}
                            onClick={handleInfoClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryContainer;
