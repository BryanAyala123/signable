// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBEnhNRTnTmuTXn-BDT0SBuMqnTORgN6eU",
    authDomain: "signable-dev.firebaseapp.com",
    projectId: "signable-dev",
    storageBucket: "signable-dev.firebasestorage.app",
    messagingSenderId: "1030810674581",
    appId: "1:1030810674581:web:eb706f5c6b7a72cb03029c",
    measurementId: "G-7LH6RJ7M24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

onAuthStateChanged(auth, user => {
    if (user != null){
        console.log('logged in');
    } else {
        console.log('No user');
    }
});

export { app, auth };