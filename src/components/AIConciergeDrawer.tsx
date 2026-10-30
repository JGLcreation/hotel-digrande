import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';

interface AIConciergeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBookRoomType: (roomTypeId: string) => void;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

export const AIConciergeDrawer: React.FC<AIConciergeDrawerProps> = ({
  isOpen,
  onClose,
  onBookRoomType
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Warm greetings. I am your personal Concierge at The Grand Luxe Hotel & Resort. Whether you seek guidance on our signature penthouse suites, private yacht charters, or a candlelit tasting dinner at Le Belvédère, it is my absolute pleasure to assist."
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: queryText };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "Our concierge team is at your beck and call. Please feel free to select one of our palatial suites or reach our front desk directly at +1 (555) 019-2831."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-[#12151b] h-full shadow-2xl flex flex-col border-l border-[#E8E4DA] dark:border-[#27272a] pb-safe transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="p-4 bg-[#18181B] dark:bg-[#0c0e12] text-white flex items-center justify-between shrink-0 border-b dark:border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#B89358]/20 border border-[#B89358] flex items-center justify-center text-[#D8B77D]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-light tracking-wide text-[#FAF9F6]">
                Grand Luxe Concierge
              </h3>
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">
                Bespoke Guest Assistant
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors cursor-pointer"
            aria-label="Close concierge"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-3.5 py-2 bg-[#FAF9F6] dark:bg-[#161a22] border-b border-[#E8E4DA] dark:border-[#27272a] flex gap-1.5 overflow-x-auto text-[11px] text-[#52525B] dark:text-[#a1a1aa] scrollbar-none shrink-0 transition-colors">
          <button
            onClick={() => handleSend("What is the most luxurious suite for a special anniversary?")}
            className="px-3 py-1.5 min-h-[36px] bg-white dark:bg-[#181c24] border border-[#D4CFBE] dark:border-[#27272a] dark:text-[#e4e4e7] rounded-full hover:border-[#B89358] dark:hover:border-[#B89358] whitespace-nowrap cursor-pointer transition-colors"
          >
            Anniversary Suite?
          </button>
          <button
            onClick={() => handleSend("Tell me about dining at Le Belvédère.")}
            className="px-3 py-1.5 min-h-[36px] bg-white dark:bg-[#181c24] border border-[#D4CFBE] dark:border-[#27272a] dark:text-[#e4e4e7] rounded-full hover:border-[#B89358] dark:hover:border-[#B89358] whitespace-nowrap cursor-pointer transition-colors"
          >
            Michelin Dining?
          </button>
          <button
            onClick={() => handleSend("What thermal spa treatments do you offer?")}
            className="px-3 py-1.5 min-h-[36px] bg-white dark:bg-[#181c24] border border-[#D4CFBE] dark:border-[#27272a] dark:text-[#e4e4e7] rounded-full hover:border-[#B89358] dark:hover:border-[#B89358] whitespace-nowrap cursor-pointer transition-colors"
          >
            Spa Sanctuary?
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#18181B] dark:bg-zinc-800 text-[#D8B77D] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-xl leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#18181B] dark:bg-[#B89358] text-white dark:text-[#0c0e12] font-medium rounded-br-none'
                    : 'bg-[#FAF9F6] dark:bg-[#181c24] text-[#27272A] dark:text-[#e4e4e7] border border-[#E8E4DA] dark:border-[#27272a] rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-[#B89358] dark:bg-[#d8b77d] text-white dark:text-black flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-[#71717A] dark:text-[#a1a1aa] text-[11px] italic">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#B89358]" />
              <span>The Concierge is composing recommendations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 bg-white dark:bg-[#161a22] border-t border-[#E8E4DA] dark:border-[#27272a] shrink-0 transition-colors">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about suites or dining..."
              className="flex-1 text-xs p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-[#FAF9F6] dark:bg-[#181c24] text-[#18181B] dark:text-white placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] focus:outline-none focus:border-[#B89358]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 min-h-[44px] min-w-[44px] bg-[#18181B] dark:bg-[#B89358] hover:bg-[#B89358] dark:hover:bg-[#d8b77d] text-white dark:text-[#0c0e12] active:scale-95 rounded-lg transition-colors flex items-center justify-center disabled:opacity-40 cursor-pointer"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
