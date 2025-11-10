// import React, { useEffect, useState } from 'react';
// import './Chatbot.css';

// type Message = {
//   id: number;
//   from: 'user' | 'bot';
//   text: string;
// };

// type ChatbotProps = {
//   model?: any;
// };

// const SENTENCES_PER_PARAGRAPH = 2;

// const ChatbotClean: React.FC<ChatbotProps> = ({ model }) => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState('');
//   const [isSending, setIsSending] = useState(false);
//   const [localModel, setLocalModel] = useState<any | undefined>(model);

//   useEffect(() => {
//     if (model) setLocalModel(model);
//   }, [model]);



//   const splitIntoParagraphs = (text: string): string[] => {
//     if (!text) return [];
//     const normalized = text.replace(/\r\n/g, '\n').trim();
//     const sentences = normalized.match(/[^.!?\n]+[.!?]+(?:\s|\n|$)|[^.!?\n]+$/g)?.map((s) => s.trim()) || [normalized];
//     const paragraphs: string[] = [];
//     for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
//       const group = sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join(' ').trim();
//       if (group) paragraphs.push(group);
//     }
//     if (paragraphs.length === 0 && normalized) {
//       const byBlank = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
//       return byBlank.length ? byBlank : [normalized];
//     }
//     return paragraphs.length ? paragraphs : [normalized];
//   };

//   const extractLinks = (text: string): Array<{ label: string; url: string }> => {
//     const links: Array<{ label: string; url: string }> = [];
//     const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
//     let m: RegExpExecArray | null;
//     const consumedRanges: Array<[number, number]> = [];
//     while ((m = mdRegex.exec(text)) !== null) {
//       links.push({ label: m[1], url: m[2] });
//       consumedRanges.push([m.index, m.index + m[0].length]);
//     }
//       const urlRegex = /https?:\/\/[^\s)]+/g;
//     while ((m = urlRegex.exec(text)) !== null) {
//       const start = m.index;
//       const end = m.index + m[0].length;
//       const overlaps = consumedRanges.some(([a, b]) => !(end <= a || start >= b));
//       if (!overlaps) links.push({ label: m[0], url: m[0] });
//     }
//     return links;
//   };

//   const renderParagraph = (paragraph: string, idx: number) => {
//     // This regex will find markdown links `[label](url)` and raw `http://...` urls
//     const linkRegex = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(https?:\/\/[^\s)]+)/g;

//     // Split the paragraph into an array of text and links
//     const parts = paragraph.split(linkRegex).filter(Boolean);

//     return (
//       <p key={idx} className="chatParagraph">
//         {parts.map((part, i) => {
//           const mdLinkMatch = part.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
//           if (mdLinkMatch) {
//             // It's a markdown link like [label](url)
//             const [, label, url] = mdLinkMatch;
//             return (
//               <a key={i} href={url} target="_blank" rel="noopener noreferrer">
//                 {label}
//               </a>
//             );
//           } else if (part.startsWith('http')) {
//             // It's a raw url like http://...
//             return (
//               <a key={i} href={part} target="_blank" rel="noopener noreferrer">
//                 {part}
//               </a>
//             );
//           } else {
//             // It's just plain text
//             return <span key={i}>{part}</span>;
//           }
//         })}
//       </p>
//     );
//   };


//   const renderBubbleContent = (text: string): React.ReactNode => {
//     const paragraphs = splitIntoParagraphs(text);
//     return <div className="bubbleContent">{paragraphs.map((p, i) => renderParagraph(p, i))}</div>;
//   };

//   const send = async () => {
//     if (!input.trim() || isSending) return;
//     const text = input.trim();
//     const userMsg: Message = { id: Date.now(), from: 'user', text };
//     setMessages((m) => [...m, userMsg]);
//     setInput('');
//     setIsSending(true);

//     let usedModel = localModel ?? model;
//     if (!usedModel) {
//       try {
//   const aiModule = await import('../../../firebase/ai');
//         const loaded = aiModule?.model;
//         if (loaded) {
//           setLocalModel(loaded);
//           usedModel = loaded;
//         }
//       } catch (err: any) {
//         console.warn('Failed to lazy-load AI module:', err);
//         const botMsg: Message = { id: Date.now() + 3, from: 'bot', text: `AI unavailable: failed to load model (${String(err?.message ?? err)})` };
//         setMessages((m) => [...m, botMsg]);
//         setIsSending(false);
//         return;
//       }
//     }

//     if (usedModel) {
//       try {
//         let res: any = undefined;
//         if (typeof usedModel.generateContent === 'function') {
//           res = await usedModel.generateContent(text);
//         } else if (typeof usedModel.generate === 'function') {
//           res = await usedModel.generate({ input: text });
//         } else {
//           throw new Error('Model does not expose generate/generateContent');
//         }

//         let botText = 'Sorry, no response from the model.';
//         if (res) {
//           if (res.response && typeof res.response.text === 'function') {
//             botText = res.response.text();
//           } else if (res.output && Array.isArray(res.output)) {
//             const first = res.output[0];
//             const content = first?.content?.[0];
//             botText = content?.text ?? JSON.stringify(res);
//           } else if (typeof res === 'string') {
//             botText = res;
//           } else if (res.text) {
//             botText = res.text;
//           } else {
//             botText = JSON.stringify(res);
//           }
//         }

//         const botMsg: Message = { id: Date.now() + 1, from: 'bot', text: botText };
//         setMessages((m) => [...m, botMsg]);
//       } catch (err) {
//         console.error('AI error', err);
//         const botMsg: Message = { id: Date.now() + 2, from: 'bot', text: 'Sorry — the AI failed to respond.' };
//         setMessages((m) => [...m, botMsg]);
//       } finally {
//         setIsSending(false);
//       }
//     } else {
//       setTimeout(() => {
//         const botMsg: Message = { id: Date.now() + 1, from: 'bot', text: 'This is a placeholder response from the AI assistant.' };
//         setMessages((m) => [...m, botMsg]);
//         setIsSending(false);
//       }, 700);
//     }
//   };

//   return (
//     <div className="chatbotContainer">
//       <div className="chatHeader">AI Assistant</div>
//       <div className="messages">
//         {messages.length === 0 && <div className="empty">Ask me anything about signing or the site.</div>}
//         {messages.map((msg) => (
//           <div key={msg.id} className={`message ${msg.from}`}>
//             <div className="bubble">{msg.from === 'bot' ? renderBubbleContent(msg.text) : <span>{msg.text}</span>}</div>
//           </div>
//         ))}
//       </div>
//       <div className="chatControls">
//         <input
//           className="chatInput"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Type a message..."
//           onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
//           disabled={isSending}
//         />
//         <button className="chatSend" onClick={send} disabled={isSending}>{isSending ? '...' : 'Send'}</button>
//       </div>
//     </div>
//   );
// };

// export default ChatbotClean;
