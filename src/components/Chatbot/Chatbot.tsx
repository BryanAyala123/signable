import React, { useState } from 'react';
import './Chatbot.css';

type Message = {
  id: number;
  from: 'user' | 'bot';
  text: string;
};

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), from: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    // Placeholder bot response - replace with API call to OpenAI or other AI service
    setTimeout(() => {
      const botMsg: Message = { id: Date.now() + 1, from: 'bot', text: 'This is a placeholder response from the AI assistant.' };
      setMessages((m) => [...m, botMsg]);
    }, 700);
  };

  return (
    <div className="chatbotContainer">
      <div className="chatHeader">AI Assistant</div>
      <div className="messages">
        {messages.length === 0 && <div className="empty">Ask me anything about signing or the site.</div>}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.from}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="chatControls">
        <input
          className="chatInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="chatSend" onClick={send}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
