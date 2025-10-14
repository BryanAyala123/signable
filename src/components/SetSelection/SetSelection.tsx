import React from 'react';
import './SetSelection.css';
import { IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';

/**
 * SetSelection Interface
 * 
 * Prop for the set left side panel.
 * Shows the different sets and an add set button.
 */
interface SetSelection {
    isOpen: boolean;
    onClose: () => void;
}

const SetSelection: React.FC<SetSelection> = ({ isOpen, onClose }) => {
    if (!isOpen) return null; 

    return (
        
        <div className="SetsPanelOverlay" onClick={onClose}>
            <div className="SetsPanel" onClick={(e) => e.stopPropagation()}>
                <div className='InnerPanel'>
                    <div className="SetspanelHeader">
                        My Sets
                    </div>
                    <div className="SetspanelContent">
                        <div className='classNameSet' style={{backgroundColor: '#F25749'}}>
                            ASL 101 
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#F25749'}}>
                            ASL 102 
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#2E5AAC'}}>
                            Unit 1 
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#2f2f2f'}}>
                            Greatings
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#2f2f2f'}}>
                            Animals 
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#2f2f2f'}}>
                            Alphabet
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#2f2f2f'}}>
                            Numbers
                        </div>
                        <div className='classNameSet' style={{backgroundColor: '#2E5AAC'}}>
                            Unit 2
                        </div>
                    </div>
                    <div className='bottomSection'>
                        <div className='divider'></div>
                        <div className='addNewSets'>
                            New Sets  <IonIcon icon={add} style={{ color: 'green', fontSize: '20px' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetSelection;