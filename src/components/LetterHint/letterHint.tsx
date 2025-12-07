import React, { useState, useRef, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { generateLetterHint, startChatSession } from '../../firebase/ai';
import './letterHint.css';

    interface LetterHintProps {
    targetLetter: string;
    detectedLetter?: string;
    attemptContext?: string;
    onSuccess?: () => void; // Optional callback when correct letter is detected
    }

    const LETTER_HINTS: Record<string, string[]> = {
    A: [
        "Create a closed fist with the thumb pressed against the side of the index finger, knuckles facing out.",
        "Keep the thumb tight to the fingers instead of covering them."
    ],
    B: [
        "Extend all four fingers straight up together while the thumb crosses the palm.",
        "Flatten the palm toward your audience so the fingers stay parallel."
    ],
    C: [
        "Curve your hand like the letter C as if holding a small ball, thumb opposite the fingers.",
        "Only curl the fingers and thumb; keep the wrist straight."
    ],
    D: [
        "Point the index finger straight up and touch the thumb to the middle finger, other fingers curled.",
        "Tuck the ring and pinky tightly against the palm so only one finger is up."
    ],
    E: [
        "Curl all fingertips toward the thumb so they meet the pad of the thumb, palm forward.",
        "Avoid flattening the fingers like B - keep them bent into a compact shape."
    ],
    F: [
        "Touch the index finger tip to the thumb to form a circle; other three fingers stay extended.",
        "Let the remaining fingers spread slightly so they do not collapse toward the palm."
    ],
    G: [
        "Hold the thumb and index finger parallel pointing sideways while other fingers curl down.",
        "Rotate the wrist so the thumb edge faces forward, keeping the hand level."
    ],
    H: [
        "Extend index and middle fingers together pointing sideways, thumb tucked, other fingers folded.",
        "Stack the two extended fingers evenly so the top edges align."
    ],
    I: [
        "Make a fist and raise just the pinky finger straight up.",
        "Wrap the thumb across the fingers so it does not poke out like Y."
    ],
    J: [
        "Trace the letter J in the air with the pinky starting from the I handshape.",
        "Lead the motion with the pinky while the rest of the hand stays relaxed."
    ],
    K: [
        "Extend index and middle fingers in a V while the thumb touches the base of the middle finger, palm out.",
        "Spread the two fingers slightly so the V shape is clear."
    ],
    L: [
        "Raise the index finger vertically and the thumb horizontally to make an L shape, other fingers tucked.",
        "Face the palm outward so the viewer clearly sees the outline."
    ],
    M: [
        "Lay the thumb across the palm and fold three fingers over it, pinky resting to the side.",
        "Cover the thumb completely so it does not peek between the fingers."
    ],
    N: [
        "Tuck the thumb across the palm and cover it with the index and middle fingers only.",
        "Keep the two covering fingers snug so the thumb remains hidden."
    ],
    O: [
        "Touch all fingertips to the thumb to form a small O shape, palm angled forward.",
        "Round the fingers from the knuckles rather than just bending the tips."
    ],
    P: [
        "Make the K handshape then tip the wrist so the extended fingers point downward.",
        "Keep the thumb contacting the middle finger while the index points outward like the leg of P."
    ],
    Q: [
        "Start with the G handshape and drop the wrist so the index finger points down.",
        "Aim both the thumb and index finger toward the floor with the palm facing inward."
    ],
    R: [
        "Cross the middle finger over the index finger, palm forward, other fingers curled.",
        "Keep the two crossed fingers straight and close together."
    ],
    S: [
        "Form a fist with the thumb folded across the front of the fingers.",
        "Do not push the thumb between fingers - let it rest on top of the index and middle finger."
    ],
    T: [
        "Make a fist and insert the thumb between the index and middle finger with the thumb tip showing.",
        "Ensure the thumb sticks out slightly so it is distinct from S."
    ],
    U: [
        "Extend the index and middle fingers together pointing up while other fingers curl.",
        "Keep the two fingers touching rather than spread apart."
    ],
    V: [
        "Raise the index and middle fingers in a V shape, remaining fingers curled to the palm.",
        "Spread the two fingers just enough to show the V without exaggerating."
    ],
    W: [
        "Extend index, middle, and ring fingers with slight spacing; pinky and thumb stay tucked.",
        "Hold the three fingers level so they form the points of the W."
    ],
    X: [
        "Curl the index finger like a hook while other fingers stay folded and the thumb rests on them.",
        "Point the knuckle upward so the hooked finger faces forward."
    ],
    Y: [
        "Extend the thumb and pinky while the other fingers remain curled.",
        "Stretch the thumb and pinky away from each other to suggest the Y shape."
    ],
    Z: [
        "Use the extended index finger to draw the letter Z in the air: across, diagonal, across.",
        "Keep the diagonal stroke sharp so the letter outline is clear."
    ],
    };

    const DEFAULT_HINT = "Focus on matching the exact ASL handshape: adjust finger placement, thumb position, and palm orientation.";

    const LetterHint: React.FC<LetterHintProps> = ({
    targetLetter,
    detectedLetter,
    attemptContext,
    onSuccess
    }) => {
    const [hintMessage, setHintMessage] = useState<string>("");
    const [hintStatus, setHintStatus] = useState<"info" | "success" | "error" | "">("");
    const [hintLoading, setHintLoading] = useState(false);
    const [hintError, setHintError] = useState<string>("");
    const hintRequestIdRef = useRef(0);
    const coachChatRef = useRef<any | null>(null);

    const ensureCoachChat = () => {
        if (!coachChatRef.current) {
        try {
            coachChatRef.current = startChatSession();
        } catch (error) {
            console.error("Failed to start coach chat session:", error);
            return null;
        }
        }
        return coachChatRef.current;
    };

    useEffect(() => {
        ensureCoachChat();
    }, []);

    const getBaselineHintForLetter = (letter: string) => {
        const normalized = letter?.toUpperCase() ?? "";
        const candidates = LETTER_HINTS[normalized];
        if (!candidates || candidates.length === 0) {
        return DEFAULT_HINT;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const resetHint = () => {
        hintRequestIdRef.current += 1;
        setHintMessage("");
        setHintStatus("");
        setHintError("");
        setHintLoading(false);
    };

    const showSuccessHint = (letter: string) => {
        hintRequestIdRef.current += 1;
        setHintStatus("success");
        setHintMessage(`Great job signing ${letter.toUpperCase()}!`);
        setHintError("");
        setHintLoading(false);
    };

    const requestLetterHint = async (
        target: string,
        detected?: string,
        context?: string
    ) => {
        if (!target) return;
        const uppercaseTarget = target.toUpperCase();
        const baselineHint = getBaselineHintForLetter(uppercaseTarget);
        const requestId = ++hintRequestIdRef.current;
        const chat = ensureCoachChat();

        setHintStatus("info");
        setHintMessage(baselineHint);
        setHintError("");
        setHintLoading(true);

        try {
        const aiHint = await generateLetterHint({
            targetLetter: uppercaseTarget,
            detectedLetter: detected?.toUpperCase(),
            baselineHint,
            attemptContext: context,
            chat,
        });

        if (hintRequestIdRef.current === requestId && aiHint) {
            setHintMessage(aiHint);
        }
        } catch (error) {
        console.error("generateLetterHint error:", error);
        if (hintRequestIdRef.current === requestId) {
            setHintError("Chatbot hint is temporarily unavailable. Use the baseline tip above.");
        }
        } finally {
        if (hintRequestIdRef.current === requestId) {
            setHintLoading(false);
        }
        }
    };

    // Effect to handle when detectedLetter changes
    useEffect(() => {
        if (!targetLetter) {
        resetHint();
        return;
        }

        // Check if correct
        if (detectedLetter && detectedLetter.toUpperCase() === targetLetter.toUpperCase()) {
        showSuccessHint(targetLetter);
        if (onSuccess) {
            onSuccess();
        }
        } else if (detectedLetter) {
        // Incorrect attempt
        requestLetterHint(
            targetLetter,
            detectedLetter,
            attemptContext || "The learner signed a different letter than requested."
        );
        } else {
        // No detection yet, show baseline hint
        const baselineHint = getBaselineHintForLetter(targetLetter);
        setHintStatus("info");
        setHintMessage(baselineHint);
        setHintError("");
        setHintLoading(false);
        }
    }, [targetLetter, detectedLetter, attemptContext]);

    // Don't render if no target letter
    if (!targetLetter || (!hintLoading && !hintMessage && !hintError)) {
        return null;
    }

    return (
        <div className={`hint-card${hintStatus ? " " + hintStatus : ""}`}>
        {hintLoading ? (
            <div className="hint-loading">
            <IonSpinner name="lines" className='lineLoad'/>
            <span>Generating Hint...</span>
            </div>
        ) : hintError ? (
            <p className="hint-error-text">{hintError}</p>
        ) : (
            <p className="hint-message">{hintMessage}</p>
        )}
        </div>
    );
    };

export default LetterHint;