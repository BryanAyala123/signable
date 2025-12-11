import React from 'react';
import './ProgressPanel.css';
import ProgressTracker from '/public/assets/progressTracker.png';
import correct from '/public/assets/correct.png';
import incorrect from '/public/assets/incorrect.png';
import ProgressPie from '../ProgressPie/ProgressPie';
import { useAuth } from '../../contexts/authContext';

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
    masteredTotal: number;
    learningTotal: number;
    total: number;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({ isOpen, onClose, masteredTotal, learningTotal, total }) => {
    if (!isOpen) return null; 
    const { currentUser} = useAuth();

    return (
        
        <div className="progressPanelOverlay" onClick={onClose}>
            <div className="progressPanel" onClick={(e) => e.stopPropagation()}>
                <div className="panelContent">
                    <div className='progressPanelContent'>
                        <p className='progressPanelContentHeader'>Progress Tracker</p>
                        <p className='progressPanelContentText'>Great Job,</p>
                        <h1 className='progressPanelContentName'>{currentUser?.displayName}!</h1>
                        <div className='progressPanelContentInnerDiv'>
                            <div className='progressPie'>
                                <ProgressPie 
                                masteredTotal={masteredTotal} 
                                learningTotal={learningTotal} 
                                totalCards={total}
                                />
                            </div>
                            <p>You are doing great, <br/>Try to fill this whole pie with green!</p>
                        </div>
                        <div className='progressPanelContentHorizontalLine'></div>
                        <p>Manage Goals</p>
                    </div>
                    
                    <div className='tableDiv'>
                        <div className='tableDivMasterySide'>
                            <div className='tableDivMasterySideHeader'>
                                <p className='tableDivMaserySideHeaderText'>Mastered</p>
                                <img src={correct} className='tableImg'/>
                            </div>
                            <div className='tableDivMasterySideHorizontalDivider'></div>
                            <p className='tableDivMasterySideNumber'>{masteredTotal}</p>
                        </div>
                        <div className='tableDivVerticleDivider'></div>
                        <div className='tableDivLearningSide'>
                            <div className='tableDivLearningSideHeader'>
                                <p className='tableDivLearningSideHeaderText'>Learning</p>
                                <img src={incorrect} className='tableImg'/>
                            </div>
                            <div className='tableDivLearningSideHorizontalDivider'></div>
                            <p className='tableDivLearningSideNumber'>{learningTotal}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressPanel;