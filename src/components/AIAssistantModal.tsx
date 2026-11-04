import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';

interface AIAssistantProps {
  userRole: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AIAssistantModal: React.FC<AIAssistantProps> = ({ userRole }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `Hello! I am your Smart Attendance AI Assistant. I have live access to institutional database records. How can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts =
    userRole === 'STUDENT'
      ? [
          'My Database Systems attendance?',
          'How many classes do I need to attend for 75%?',
          'What is my overall attendance percentage?',
        ]
      : userRole === 'TEACHER'
      ? [
          'Which students have attendance below 75%?',
          'Show Database Systems attendance summary',
          'List students with pending leave requests',
        ]
      : [
          'Which students have attendance below 75%?',
          'Summarize today\'s overall attendance stats',
          'Show low attendance warning list',
        ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, role: userRole }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        sender: 'assistant',
        text: data.reply || 'Sorry, I could not retrieve database records at this time.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Error connecting to AI service. Please verify server connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-2xl shadow-2xs overflow-hidden max-w-4xl mx-auto flex flex-col h-[650px] text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="bg-zinc-50 dark:bg-[#18181b] px-6 py-4 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-2xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              Alpine AI Attendance Assistant
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Gemini AI
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Live Database Intelligence Agent for Alpine Degree College Khanpur</p>
          </div>
        </div>

        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-[#27272a] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Clear chat"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="bg-zinc-50/50 dark:bg-[#09090b] p-3 border-b border-zinc-200 dark:border-[#27272a] flex items-center gap-2 overflow-x-auto text-xs">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 ml-2" />
        <span className="text-zinc-500 dark:text-zinc-400 font-medium shrink-0">Quick Queries:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="bg-white dark:bg-[#202023] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-700 border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1 rounded-full whitespace-nowrap transition-all shadow-2xs cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/30 dark:bg-[#09090b]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-tr-none'
                  : 'bg-white dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272a] rounded-tl-none shadow-2xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span className={`block text-[10px] mt-2 ${m.sender === 'user' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-xs animate-pulse">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Analyzing database records with Gemini AI...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white dark:bg-[#18181b] border-t border-zinc-200 dark:border-[#27272a]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask AI Assistant about attendance records, students at risk, percentages..."
            className="flex-1 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Ask AI
          </button>
        </form>
      </div>

    </div>
  );
};
