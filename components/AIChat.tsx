
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Bot, User, Loader2, Paperclip, Trash2, Copy, Check, Send, FileText } from 'lucide-react';
import { pureChatWithAI } from '../services/geminiService';
import { UILang, TRANSLATIONS } from '../types';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  lang: UILang;
  hideHeader?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ lang, hideHeader }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const result = await pureChatWithAI(userMessage, history);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`w-full h-full animate-fade-in flex flex-col overflow-hidden`}>
      <div className={`flex-grow overflow-hidden flex flex-col`}>
        {!hideHeader && (
          <div className="px-10 py-7 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-900 flex items-center justify-center text-white shadow-2xl shadow-indigo-900/30 transform hover:scale-105 transition-transform duration-300">
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AI Chat Assistant</h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">AI Agent Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="p-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-300 hover:shadow-lg">
              <Trash2 size={22} />
            </button>
          </div>
        )}

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/20 dark:bg-gray-900/20">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80 py-4">
              <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-600 shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-110 transition-transform duration-500">
                <MessageSquare size={48} />
              </div>
              <div className="max-w-xl">
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{lang === 'vi' ? 'TRÒ CHUYỆN CÙNG AI' : 'CHAT WITH AI'}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {lang === 'vi' ? 'Hỏi AI bất cứ điều gì bạn muốn.' : 'Ask AI anything you want.'}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-primary-900 text-white' : 'bg-white dark:bg-gray-800 text-primary-900 dark:text-primary-400 border border-gray-100 dark:border-gray-700'}`}>
                  {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
                </div>
                <div className="space-y-2">
                  <div className={`p-6 rounded-[2rem] shadow-sm text-base leading-relaxed ${msg.role === 'user' ? 'bg-primary-900 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}>
                    <div className="markdown-body prose dark:prose-invert max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                  <div className={`flex items-center gap-4 text-[11px] font-black text-gray-400 uppercase tracking-widest ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyToClipboard(msg.content, msg.id)} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                        {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === msg.id ? 'COPIED' : 'COPY'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-900 dark:text-primary-400 border border-gray-100 dark:border-gray-700">
                  <Bot size={24} />
                </div>
                <div className="flex items-center gap-4 px-7 py-5 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                  <Loader2 size={20} className="animate-spin text-primary-600" />
                  <span className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <form onSubmit={handleChat} className="relative max-w-5xl mx-auto">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isLoading}
              placeholder={lang === 'vi' ? 'Nhập tin nhắn...' : 'Type message...'}
              className="w-full pl-6 pr-16 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/20 outline-none transition-all dark:text-white disabled:opacity-50 shadow-inner"
            />
            <button 
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-900/30 hover:scale-105 active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
