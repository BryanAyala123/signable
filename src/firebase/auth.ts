import { send } from "ionicons/icons";
import { auth } from "./firebaseConfig";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updatePassword, UserCredential} from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = (
    email: string,
    password: string
): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
};

export const doSignOut = (): Promise<void> => {
    return auth.signOut();
};

export const doPasswordReset = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
};

export const doPasswordChange = (password: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    return updatePassword(auth.currentUser, password);
};

