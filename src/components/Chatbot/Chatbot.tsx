import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import './Chatbot.css';
import { runSearch } from '../../services/semanticSearch';

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
  
  // First check if text contains markdown list items (lines starting with - or *)
  const listItemPattern = /^[\*\-]\s+/m;
  if (listItemPattern.test(normalized)) {
    // Split by newlines and treat each list item as a paragraph
    return normalized.split('\n').map(line => line.trim()).filter(Boolean);
  }
  
  // Protect markdown links and URLs from sentence splitting
  const linkPlaceholders = new Map<string, string>();
  let protectedText = normalized;
  let placeholderIndex = 0;
  
  // Replace markdown links with placeholders
  protectedText = protectedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
    const placeholder = `__LINK_PLACEHOLDER_${placeholderIndex++}__`;
    linkPlaceholders.set(placeholder, match);
    return placeholder;
  });
  
  // Replace bare URLs with placeholders
  protectedText = protectedText.replace(/https?:\/\/[^\s)]+/g, (match) => {
    const placeholder = `__LINK_PLACEHOLDER_${placeholderIndex++}__`;
    linkPlaceholders.set(placeholder, match);
    return placeholder;
  });
  
  const sentences = protectedText.match(/[^.!?\n]+[.!?]+(?:\s|\n|$)|[^.!?\n]+$/g)?.map((s) => s.trim()) || [protectedText];
  const paragraphs: string[] = [];
  
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
    let group = sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join(' ').trim();
    
    // Restore links from placeholders
    linkPlaceholders.forEach((original, placeholder) => {
      group = group.replace(placeholder, original);
    });
    
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
    // A map to store the links found in the paragraph
    const linkMap: { [key: string]: string } = {};
    let textWithPlaceholders = paragraph;

    // 1. Replace Markdown links [label](url) with a unique placeholder token
    textWithPlaceholders = textWithPlaceholders.replace(/(\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g, (match, fullMatch, label, url, offset) => {
        const token = `__MD_LINK_${offset}__`;
        linkMap[token] = fullMatch;
        return token;
    });

    // 2. Replace raw URLs (that haven't already been consumed by a Markdown link)
    textWithPlaceholders = textWithPlaceholders.replace(/(https?:\/\/[^\s)]+)/g, (match, fullMatch, offset) => {
        const token = `__URL_LINK_${offset}__`;
        linkMap[token] = fullMatch;
        return token;
    });

    // 3. Handle bullet points (* or -) at the start of lines
    const isBulletPoint = /^[\*\-]\s+/.test(textWithPlaceholders);
    if (isBulletPoint) {
      textWithPlaceholders = textWithPlaceholders.replace(/^[\*\-]\s+/, '');
    }

    // 4. Split the text by the placeholder tokens
    const segments = textWithPlaceholders.split(/(__[A-Z_]+_\d+__)/g).filter(Boolean);

    // 5. Render the content
    const content = segments.map((segment, i) => {
      const originalLinkMatch = linkMap[segment];
      if (originalLinkMatch) {
        // This is a LINK segment
        const markdownMatch = originalLinkMatch.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
        
        if (markdownMatch) {
          const [, label, url] = markdownMatch;
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          );
        } else {
          const url = originalLinkMatch;
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          );
        }
      } else {
        // Handle bold **text** and italic *text* in plain text segments
        // NOTE: Handle bold BEFORE italic to avoid conflicts
        const parts = segment.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            return <strong key={`${i}-${j}`}>{part.slice(2, -2)}</strong>;
          } else {
            // Check for italic *text* (but not ** which is bold)
            const italicParts = part.split(/(?<!\*)(\*(?!\*)[^*]+\*)(?!\*)/g).filter(Boolean);
            return italicParts.map((iPart, k) => {
              if (iPart.startsWith('*') && iPart.endsWith('*') && !iPart.startsWith('**')) {
                return <em key={`${i}-${j}-${k}`}>{iPart.slice(1, -1)}</em>;
              }
              return <span key={`${i}-${j}-${k}`}>{iPart}</span>;
            });
          }
        });
      }
    });

    return (
      <div key={idx} className="paragraphBlock">
        {isBulletPoint ? (
          <li className="chatParagraph">{content}</li>
        ) : (
          <p className="chatParagraph">{content}</p>
        )}
      </div>
    );
};


  const renderBubbleContent = (text: string): React.ReactNode => {
    const paragraphs = splitIntoParagraphs(text);
    return <div className="bubbleContent">{paragraphs.map((p, i) => renderParagraph(p, i))}</div>;
  };

  // Animate bot responses with a typewriter effect so text appears to be typed.
  // This version is markdown-aware - it types complete markdown links at once
  // to avoid breaking the [text](url) syntax during animation.
  const animateBotMessage = (fullText: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setIsSending(false);
    setIsTyping(true);

    // clear any existing typing timers (avoid overlapping animations)
    typingTimersRef.current.forEach((t) => clearTimeout(t));
    typingTimersRef.current = [];

    // add an empty bot message first
    setMessages((m) => [...m, { id, from: 'bot', text: '' }]);
    
    // Split text into chunks that preserve markdown links
    const chunks: string[] = [];
    let remaining = fullText;
    
    while (remaining.length > 0) {
      // Check if we're at the start of a markdown link
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        // Add the complete link as one chunk
        chunks.push(linkMatch[0]);
        remaining = remaining.slice(linkMatch[0].length);
      } else {
        // Add one character
        chunks.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }
    
    // Animate by chunks instead of characters
    const baseSpeed = 10; // ms per chunk
    let currentText = '';
    
    chunks.forEach((chunk, i) => {
      const delay = i * baseSpeed;
      const t = window.setTimeout(() => {
        currentText += chunk;
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: currentText } : msg)));
        if (i === chunks.length - 1) {
          // finished typing
          setIsTyping(false);
        }
      }, delay);
      typingTimersRef.current.push(t);
    });
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

  // Run semantic search to fetch related documents
  let retrievedDocs: any[] = [];
  let docsListFormatted = '';
  
  try {
    const docs = await runSearch(text);
    if (docs && docs.length) {
      retrievedDocs = docs;
      
      // Create formatted list with links
      docsListFormatted = docs.slice(0, 5).map((d, idx) => {
        const title = d.title ?? d.name ?? d.id;
        let url = d.url ?? d.link ?? d.href ?? d.path;
        
        if (!url) {
          if (d.type === 'video' || d.category === 'video') {
            url = `/videos/${d.id}`;
          } else if (d.type === 'tutorial' || d.category === 'tutorial') {
            url = `/tutorials/${d.id}`;
          } else if (d.type === 'flashcard' || d.category === 'flashcard') {
            url = `/flashcards/${d.id}`;
          } else {
            url = `/resources/${d.id}`;
          }
        }
        
        const desc = d.description ?? d.content ?? '';
        return `${idx + 1}. **[${title}](${url})**${desc ? '\n   ' + desc.slice(0, 150) : ''}`;
      }).join('\n\n');
    }
  } catch (err) {
    console.warn('semantic search failed', err);
  }

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
      const botMsg: Message = { 
        id: Date.now() + 3, 
        from: 'bot', 
        text: `AI unavailable: failed to load model (${String(err?.message ?? err)})` 
      };
      setMessages((m) => [...m, botMsg]);
      setIsSending(false);
      return;
    }
  }

  if (usedModel) {
    try {
      let res: any = undefined;
      
      // Build an enhanced prompt that FORCES the AI to use your links
      let enhancedPrompt = text;
      
      if (retrievedDocs.length > 0) {
        enhancedPrompt = `You are a helpful assistant with access to the following resources from our database:

${docsListFormatted}

User's Question: "${text}"

CRITICAL INSTRUCTIONS:
1. Answer the user's question using ONLY the resources listed above
2. You MUST include the exact markdown links [Title](URL) from the list above in your response
3. Start your response with "Based on our resources:" and then list the relevant items
4. Keep each resource on its own line starting with a bullet point (-)
5. Do NOT search the web or use other sources - ONLY use the resources provided above
6. If none of the resources match the question, say "I couldn't find relevant resources in our database for that question."

Your response:`;
      }
      
      if (typeof usedModel.generateContent === 'function') {
        res = await usedModel.generateContent(enhancedPrompt);
      } else if (typeof usedModel.generate === 'function') {
        res = await usedModel.generate({ input: enhancedPrompt });
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

      // If AI still didn't include links, manually prepend them
      if (retrievedDocs.length > 0 && !botText.includes('](')) {
        const linksList = docsListFormatted.split('\n\n').map(item => `- ${item}`).join('\n');
        botText = `Here are the relevant resources from our database:\n\n${linksList}\n\n${botText}`;
      }

      animateBotMessage(botText);
    } catch (err) {
      console.error('AI error', err);
      animateBotMessage('Sorry — the AI failed to respond.');
    }
  } else {
    setTimeout(() => {
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
