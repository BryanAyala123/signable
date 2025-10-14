import React from 'react';
import { IonFooter, IonToolbar, IonButton } from '@ionic/react';
import './Layout.css';

/**
 * App Footer
 * 
 * Prop to show the App Footer 
 * A footer that has the navigation logo
 */
const AppHeader: React.FC = () => {
    return (
        <IonFooter>
            <IonToolbar className='mainToolBarFooter'>
                <div className='mainLayoutDiv'>
                    <div className="tabsContainer">
                    <IonButton fill="clear"><span className='tabText'>About</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill="clear"><span className='tabText'>Join Us</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill="clear"><span className='tabText'>Langauges</span></IonButton>
                    <span className="separator"></span>
                    <IonButton fill='clear'><span className='tabText'>Resources</span></IonButton>
                    </div>
                </div>
        </IonToolbar>
        </IonFooter>
    );
};

export default AppHeader;