import React, {createContext,useState,useEffect,useContext,ReactNode,} from "react";
import { auth } from "../../firebase/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";

//Handles auth logic from firebase

type AuthContextType = {
    currentUser: User | null;
    userLoggedIn: boolean;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userLoggedIn: false,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
    }, []);

    async function initializeUser(user: User | null) {
    if (user) {
        await user.reload();
        setCurrentUser(user);
        setUserLoggedIn(true);
    } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
    }
    setLoading(false);
    }

    const value: AuthContextType = {
    currentUser,
    userLoggedIn,
    loading,
    };

    return (
    <AuthContext.Provider value={value}>
        {!loading && children}
    </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
