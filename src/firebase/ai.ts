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
  generationConfig: {
    temperature: 0,
  },
});

export const tools = [{ googleSearch: {} }];
export { ai };

// 🎯 Key Step: Create the Chat Session
// This function will be called once per user session (e.g., when the user opens the chatbot)
export function startChatSession() {
  const chat = model.startChat();
  return chat; // Return the chat object to be used for all communication
}

type LetterHintOptions = {
  targetLetter: string;
  detectedLetter?: string;
  baselineHint?: string;
  attemptContext?: string;
  chat?: any;
};

export async function generateLetterHint({
  targetLetter,
  detectedLetter,
  baselineHint,
  attemptContext,
  chat,
}: LetterHintOptions): Promise<string> {
  const uppercaseTarget = targetLetter?.toUpperCase()?.trim();
  if (!uppercaseTarget) {
    throw new Error('targetLetter is required');
  }

  const comparisonText = detectedLetter
    ? `The system interpreted the sign as "${detectedLetter.toUpperCase()}" instead.`
    : 'The system could not interpret the handshape.';

  const baseline = baselineHint?.trim()
    ? `Here is a baseline hint crafted by the product team: "${baselineHint.trim()}". You may expand or refine it.`
    : 'If you do not have a baseline hint, provide a concise reminder focusing on handshape and palm orientation.';

  const context = attemptContext?.trim()
    ? `Additional context: ${attemptContext.trim()}`
    : '';

  const prompt = `You are "Signable Coach Bot", an encouraging American Sign Language tutor helping a learner finger-spell. ` +
    `They were asked to sign the letter "${uppercaseTarget}". ${comparisonText} ` +
    `${baseline} ${context}

TASK: Describe how to adjust the handshape to correctly produce the target letter, explaining the changes needed from the detected letter to the correct one. Limit your response to 1–2 short sentences. ` +
  `CONTEXT: The system detected a letter, but the detection may be incorrect. Use uncertain phrasing such as "It seems the system detected…" to avoid assuming the user meant that letter. ` +
  `FOCUS: Compare the detected handshape to the correct one and explain only hand position, finger placement, and motion. No spoken-language mnemonics. ` +
  `STYLE: Make the hint slightly challenging to encourage improvement while keeping the tone positive and supportive.`;

  const result = chat
    ? await chat.sendMessage(prompt)
    : await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 180,
        },
      });

  const text = result.response?.text()?.trim();
  if (!text) {
    throw new Error('Empty coach response');
  }
  return text;
}