import React from 'react';
import './ProgressPanel.css';
import ProgressTracker from '/public/assets/progressTracker.png';
import ProgressTable from '/public/assets/masteryTable.png';

/**
 * Progress Panel Interface
 * 
 * Prop for the progress checker on the right side panel.
 * Shows the current progress and the mastery table.
 * 
 * TO DO: Populate the table to match the flashcards
 */
interface ProgressPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null; 

    return (
        
        <div className="progressPanelOverlay" onClick={onClose}>
            <div className="progressPanel" onClick={(e) => e.stopPropagation()}>
                <div className="panelHeader">
                    <p>ASL 102 | Unit 1</p>
                    <div className="panelHeaderClassType">
                        <p>Alphabet</p>
                    </div>
                </div>
                <div className="panelContent">
                    <img src={ProgressTracker}/>
                    <img src={ProgressTable} />
                </div>
            </div>
        </div>
    );
};

export default ProgressPanel;