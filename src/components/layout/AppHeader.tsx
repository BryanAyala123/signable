import React, { useState, useRef, useEffect } from 'react';
import {
    IonHeader,
    IonToolbar,
    IonButton,
    IonAvatar,
    useIonRouter
} from '@ionic/react';
import { createPortal } from "react-dom";
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
    const { currentUser } = useAuth();

    const [headerSearch, setHeaderSearch] = useState("");
    const [showProfileCard, setShowProfileCard] = useState(false);

    const popupRef = useRef<HTMLDivElement>(null);

    // close popup when clicking outside
    useEffect(() => {
        if (!showProfileCard) return;

        const handleClickOutside = (e: Event) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setShowProfileCard(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showProfileCard]);

    const handleLogout = async () => {
        try {
            await doSignOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const toggleProfileCard = () => {
        setShowProfileCard(prev => !prev);
    };

    const navigateHome = () => {
        if (currentUser) {
            history.push('/study');
        } else {
            history.push('/welcome');
        }
    };

    const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;

        const trimmed = headerSearch.trim();
        if (!trimmed) return;

        if (!currentUser) return guardRoute('/asl-lex');

        router.push(`/asl-lex?query=${encodeURIComponent(trimmed)}`, "forward", "replace");
        if (onSearch) onSearch(trimmed);
    };


    const guardRoute = (path: string) => {
        if (!currentUser) {
            history.push('/welcome');
        } else {
            history.push(path);
        }
    };

    return (
        <IonHeader className="IonHeader">
            <IonToolbar className="mainToolbar">
                <div className="mainLayoutDiv">

                    {/* Logo */}
                    <img
                        src={logo}
                        alt="Signable home"
                        style={{ height: '80px', width: '170px', marginRight: '10px' }}
                        className="logoImage"
                        role="button"
                        tabIndex={0}
                        onClick={navigateHome}
                    />

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search for Vocab..."
                        className="headerSearch"
                        value={headerSearch}
                        onChange={(e) => setHeaderSearch(e.target.value)}
                        onKeyDown={handleSearchKey}
                    />

                    {/* Tabs */}
                    <div className="tabsContainer">
                        <IonButton fill="clear" onClick={() => guardRoute('/asl-lex')}>
                            <span className="tabText"><u>ASL-Lex</u></span>
                        </IonButton>

                        <IonButton fill="clear" onClick={() => guardRoute('/library')}>
                            <span className="tabText"><u>Library</u></span>
                        </IonButton>

                        <IonButton fill="clear" onClick={() => guardRoute('/study')}>
                            <span className="tabText"><u>Study</u></span>
                        </IonButton>

                        {/* Profile Icon */}
                        <div className="profileWrapper">
                            <IonAvatar className="profileIcon" onClick={toggleProfileCard}>
                                <img
                                    src={currentUser?.photoURL || personCircle}
                                    alt="Profile"
                                    className="profilePicture"
                                />
                            </IonAvatar>
                        </div>
                    </div>
                </div>
            </IonToolbar>

            {/* PORTAL POPUP (floats above everything) */}
            {showProfileCard &&
            createPortal(
                <div ref={popupRef} className="profilePopupCardBlue portalPopup">

                        <div className="profilePopupAvatar">
                            <img
                                src={currentUser?.photoURL || personCircle}
                                alt="Profile"
                                style={!currentUser?.photoURL ? { filter: 'invert(100%)' } : undefined}
                            />
                        </div>

                    <p className="profilePopupName">
                        {currentUser?.displayName || "Guest"}
                    </p>

                    <div className="profilePopupDivider"></div>

                    {currentUser ? (
                        <>
                            <p
                                className="profilePopupLink"
                                onClick={() => {
                                    history.push('/settings');
                                    setShowProfileCard(false);
                                }}
                            >
                                My Account
                            </p>

                            <p
                                className="profilePopupLink"
                                onClick={handleLogout}
                            >
                                Sign Out
                            </p>
                        </>
                    ) : (
                        <>
                            <p
                                className="profilePopupLink"
                                onClick={() => {
                                    history.push('/login');
                                    setShowProfileCard(false);
                                }}
                            >
                                Sign In
                            </p>

                            <p
                                className="profilePopupLink"
                                onClick={() => {
                                    history.push('/register');
                                    setShowProfileCard(false);
                                }}
                            >
                                Create Account
                            </p>
                        </>
                    )}

                </div>,
                document.getElementById("popup-root")!
            )
            }

        </IonHeader>
    );
};

export default AppHeader;
