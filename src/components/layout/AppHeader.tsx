import React, { useState } from 'react';
import { IonHeader, IonToolbar, IonButton, IonAvatar, useIonRouter } from '@ionic/react';
import logo from '/public/assets/signableLogo.svg';
import { useHistory } from 'react-router-dom';
import { personCircle } from 'ionicons/icons';
import { useAuth } from '../../contexts/authContext';
import { doSignOut } from '../../firebase/auth';
import './Layout.css';

interface AppHeaderProps {
    onSearch?: (term: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onSearch }) => {
    const history = useHistory();
    const router = useIonRouter();
    const { currentUser, loading } = useAuth();

    const [headerSearch, setHeaderSearch] = useState("");

    const handleLogout = async () => {
        try {
            await doSignOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navigateHome = () => {
        history.push('/home');
    };

    const handleLogoKey = (e: React.KeyboardEvent<HTMLImageElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateHome();
        }
    };

    const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const trimmed = headerSearch.trim();
            if (!trimmed) return;

            // Redirect to ASL-Lex page with query parameter
            router.push(`/asl-lex?query=${encodeURIComponent(trimmed)}`, "forward", "replace");

            // If ASL-Lex passed a handler, call it
            if (onSearch) onSearch(trimmed);
        }
    };

    return (
        <IonHeader className="IonHeader">
            <IonToolbar className="mainToolbar">
                <div className="mainLayoutDiv">
                    <img
                        src={logo}
                        alt="Signable home"
                        style={{ height: '80px', width: '170px', marginRight: '10px' }}
                        className="logoImage"
                        role="button"
                        tabIndex={0}
                        onClick={navigateHome}
                        onKeyDown={handleLogoKey}
                    />

                    <input
                        type="text"
                        placeholder="Search for Vocab..."
                        className="headerSearch"
                        value={headerSearch}
                        onChange={(e) => setHeaderSearch(e.target.value)}
                        onKeyDown={handleSearchKey}
                    />

                    <div className="tabsContainer">
                        <IonButton fill="clear" onClick={() => history.push('/asl-lex')}>
                            <span className="tabText"><u>ASL-Lex</u></span>
                        </IonButton>

                        <IonButton fill="clear" onClick={() => history.push('/library')}>
                            <span className="tabText"><u>Library</u></span>
                        </IonButton>

                        <IonButton fill="clear" onClick={() => history.push('/study')}>
                            <span className="tabText"><u>Study</u></span>
                        </IonButton>

                        <IonButton fill="clear" onClick={() => history.push('/settings')}>
                            <span className="tabText"><u>My Account</u></span>
                        </IonButton>

                        <IonAvatar className="profileIcon">
                            <IonButton fill="clear" onClick={handleLogout}>
                                <img src={personCircle} alt="Profile" className="profilePicture" />
                            </IonButton>
                        </IonAvatar>
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default AppHeader;
