// src/firebase/ai.ts
// Initialize Firebase AI and export a GenerativeModel instance
import { app } from './firebaseConfig';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

// Initialize the Gemini Developer API backend service using the pre-initialized app
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a GenerativeModel instance (change model id if you want a different model)
export const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });

export { ai };

