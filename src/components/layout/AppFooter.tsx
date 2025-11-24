import React from 'react';
import { IonFooter, IonToolbar, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Layout.css';

/**
 * App Footer
 * 
 * Prop to show the App Footer 
 * A footer that has the navigation logo
 */
const AppFooter: React.FC = () => {  
    const history = useHistory();
    return (
        <IonFooter className="IonFooter">  
            <IonToolbar className='mainToolBarFooter'>
                <div className='mainLayoutDivFooter'>
                    <div className="tabsContainer">
                        <IonButton fill="clear" onClick={() => history.push('/about')}>
                            <span className='tabText'>About</span>
                        </IonButton>
                        <span className="separator"></span>
                        <IonButton fill="clear" onClick={() => history.push('/join')}>
                            <span className='tabText'>Join Us</span>
                        </IonButton>
                        <span className="separator"></span>
                        <IonButton fill="clear" onClick={() => history.push('/languages')}>
                            <span className='tabText'>Languages</span>
                        </IonButton>
                        <span className="separator"></span>
                        <IonButton fill='clear' onClick={() => history.push('/resources')}>
                            <span className='tabText'>Resources</span>
                        </IonButton>
                    </div>
                </div>
            </IonToolbar>
        </IonFooter>
    );
};

export default AppFooter; 