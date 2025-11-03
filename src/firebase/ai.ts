// src/firebase/ai.ts
// Initialize Firebase AI and export a GenerativeModel instance
// src/firebase/ai.ts
import { app } from './firebaseConfig';
// Remove 'Tool' from the imports
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'; 

// 🎯 Manual definition of the Google Search Tool object
const googleSearchTool = {
    googleSearch: {} 
};

// Initialize the Gemini Developer API backend service
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a GenerativeModel instance using the manually defined tool object.
export const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  // Pass the manually defined tool object
  tools: [googleSearchTool], 
});

export const tools = [{googleSearch: {}}]
export { ai };