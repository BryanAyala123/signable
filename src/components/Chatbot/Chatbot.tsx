import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import './Chatbot.css';

type Message = {
  id: number;
  from: 'user' | 'bot';
  text: string;
};

type ChatbotProps = {
  model?: any;
  placeholder?: string;
};


const SENTENCES_PER_PARAGRAPH = 2;

const Chatbot: React.FC<ChatbotProps> = ({ model, placeholder }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [localModel, setLocalModel] = useState<any | undefined>(model);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const firstScrollDoneRef = useRef(false);
  const typingTimersRef = useRef<number[]>([]);

  useEffect(() => {
    if (model) setLocalModel(model);
  }, [model]);

  // cleanup any pending typing timers when component unmounts
  useEffect(() => {
    return () => {
      typingTimersRef.current.forEach((t) => clearTimeout(t));
      typingTimersRef.current = [];
    };
  }, []);

  // (No initial greeting) -- start with an empty conversation; messages will be
  // added when the user sends input or AI responds.

  const splitIntoParagraphs = (text: string): string[] => {
    if (!text) return [];
    const normalized = text.replace(/\r\n/g, '\n').trim();
    const sentences = normalized.match(/[^.!?\n]+[.!?]+(?:\s|\n|$)|[^.!?\n]+$/g)?.map((s) => s.trim()) || [normalized];
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
      const group = sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join(' ').trim();
      if (group) paragraphs.push(group);
    }
    if (paragraphs.length === 0 && normalized) {
      const byBlank = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      return byBlank.length ? byBlank : [normalized];
    }
    return paragraphs.length ? paragraphs : [normalized];
  };

  const extractLinks = (text: string): Array<{ label: string; url: string }> => {
    const links: Array<{ label: string; url: string }> = [];
    const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    let m: RegExpExecArray | null;
    const consumedRanges: Array<[number, number]> = [];
    while ((m = mdRegex.exec(text)) !== null) {
      links.push({ label: m[1], url: m[2] });
      consumedRanges.push([m.index, m.index + m[0].length]);
    }
    const urlRegex = /https?:\/\/[^\s)]+/g;
    while ((m = urlRegex.exec(text)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      const overlaps = consumedRanges.some(([a, b]) => !(end <= a || start >= b));
      if (!overlaps) links.push({ label: m[0], url: m[0] });
    }
    return links;
  };

  const renderParagraph = (paragraph: string, idx: number) => {
    const links = extractLinks(paragraph);
    const cleaned = paragraph.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1');
    const cleanedFinal = cleaned.replace(/https?:\/\/[^\s)]+/g, '').trim();
    return (
      <div key={idx} className="paragraphBlock">
        {cleanedFinal ? <p className="chatParagraph">{cleanedFinal}</p> : null}
        {links.map((lnk, i) => (
          <p className="chatLink" key={`link-${idx}-${i}`}>
            <a href={lnk.url} target="_blank" rel="noopener noreferrer">{lnk.label}</a>
          </p>
        ))}
      </div>
    );
  };

  const renderBubbleContent = (text: string): React.ReactNode => {
    const paragraphs = splitIntoParagraphs(text);
    return <div className="bubbleContent">{paragraphs.map((p, i) => renderParagraph(p, i))}</div>;
  };

  // Animate bot responses with a typewriter effect so text appears to be typed.
  const animateBotMessage = (fullText: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    // when typing animation starts, hide the loading indicator (isSending)
    // but mark that we're in the typing phase so inputs remain disabled until
    // typing finishes.
    setIsSending(false);
    setIsTyping(true);

    // clear any existing typing timers (avoid overlapping animations)
    typingTimersRef.current.forEach((t) => clearTimeout(t));
    typingTimersRef.current = [];

    // add an empty bot message first
    setMessages((m) => [...m, { id, from: 'bot', text: '' }]);
    // faster fixed speed per character (ms). Lower = faster typing.
    const speedPerChar = 3;

    for (let i = 1; i <= fullText.length; i++) {
      const t = window.setTimeout(() => {
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: fullText.slice(0, i) } : msg)));
        if (i === fullText.length) {
          // finished typing
          setIsTyping(false);
        }
      }, i * speedPerChar);
      typingTimersRef.current.push(t);
    }
  };

  // Scroll conversation to bottom whenever messages change (start at bottom on mount)
  // Only auto-scroll if the user is already near the bottom (so reading older messages
  // isn't interrupted). On the first render we always jump to bottom.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const THRESHOLD_PX = 120; // how close to the bottom we'll auto-scroll

    const isAtBottom = () => {
      // distance from bottom
      const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
      return distance <= THRESHOLD_PX;
    };

    const shouldAuto = firstScrollDoneRef.current ? isAtBottom() : true;
    if (!shouldAuto) {
      // user has scrolled up; don't force-scroll them to bottom
      return;
    }

    const behavior: ScrollBehavior = firstScrollDoneRef.current ? 'smooth' : 'auto';
    try {
      container.scrollTo({ top: container.scrollHeight, behavior });
    } catch (e) {
      container.scrollTop = container.scrollHeight;
    }
    firstScrollDoneRef.current = true;
  }, [messages, isSending]);

  // No special per-message exit animation; keep all messages in DOM so the
  // user can scroll up to see older messages. We rely on container scrolling
  // to bring the newest message into view.

  const send = async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    const userMsg: Message = { id: Date.now(), from: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsSending(true);

    let usedModel = localModel ?? model;
    if (!usedModel) {
      try {
        const aiModule = await import('../../firebase/ai');
        const loaded = aiModule?.model;
        if (loaded) {
          setLocalModel(loaded);
          usedModel = loaded;
        }
      } catch (err: any) {
        console.warn('Failed to lazy-load AI module:', err);
        const botMsg: Message = { id: Date.now() + 3, from: 'bot', text: `AI unavailable: failed to load model (${String(err?.message ?? err)})` };
        setMessages((m) => [...m, botMsg]);
        setIsSending(false);
        return;
      }
    }

    if (usedModel) {
      try {
        let res: any = undefined;
        if (typeof usedModel.generateContent === 'function') {
          res = await usedModel.generateContent(text);
        } else if (typeof usedModel.generate === 'function') {
          res = await usedModel.generate({ input: text });
        } else {
          throw new Error('Model does not expose generate/generateContent');
        }

  let botText = 'Sorry, no response from the model.';
        if (res) {
          if (res.response && typeof res.response.text === 'function') {
            botText = res.response.text();
          } else if (res.output && Array.isArray(res.output)) {
            const first = res.output[0];
            const content = first?.content?.[0];
            botText = content?.text ?? JSON.stringify(res);
          } else if (typeof res === 'string') {
            botText = res;
          } else if (res.text) {
            botText = res.text;
          } else {
            botText = JSON.stringify(res);
          }
        }

        // animate the bot response so it types out
        animateBotMessage(botText);
      } catch (err) {
        console.error('AI error', err);
        // animate the error message as well
        animateBotMessage('Sorry — the AI failed to respond.');
      } finally {
        // isSending will be cleared once typing animation completes
      }
    } else {
      setTimeout(() => {
        // simulate an AI reply and animate it
        animateBotMessage('This is a placeholder response from the AI assistant.');
      }, 700);
    }
  };

  return (
    <div className="chatbotContainer">
      <div className="chatHeader">AI Assistant</div>
  <div className="messages" ref={messagesContainerRef}>
        {messages.length === 0 && !input.trim() && (
          <div className="empty">{placeholder ?? 'Ask me anything about signing or the site.'}</div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.from}`}>
            <div className="bubble">{msg.from === 'bot' ? renderBubbleContent(msg.text) : <span>{msg.text}</span>}</div>
          </div>
        ))}

        {isSending && (
          <div className={`message bot typingMessage`}>
            <div className="bubble typingBubble">
              <span className="typingDots" aria-hidden>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          </div>
        )}
        {/* anchor to keep scroll at bottom */}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatControls">
        <input
          className="chatInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          disabled={isSending || isTyping}
        />
        <button className="chatSend" onClick={send} disabled={isSending || isTyping}>{isSending || isTyping ? '...' : 'Send'}</button>
      </div>
    </div>
  );
};

export default Chatbot;
