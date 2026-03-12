
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Bot, User, Loader2, Paperclip, Trash2, Download, Copy, Check, Factory, Briefcase, Sparkles, Languages, Mail, MessageSquare } from 'lucide-react';
import { generateMeetingRecap } from '../services/geminiService';
import { UILang, TRANSLATIONS } from '../types';
import Markdown from 'react-markdown';
import Translation from './Translation';
import EmailDraft from './EmailDraft';
import AIChat from './AIChat';

import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'sx' | 'multi';
  timestamp: Date;
}

interface MeetingRecapProps {
  lang: UILang;
  initialTranscript?: string;
  onClearInitial?: () => void;
  forcedTab?: 'recap' | 'translate' | 'email' | 'chat';
}

const MeetingRecap: React.FC<MeetingRecapProps> = ({ lang, initialTranscript, onClearInitial, forcedTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'recap' | 'translate' | 'email' | 'chat'>(forcedTab || 'recap');
  const [messages, setMessages] = useState<Message[]>([]);

  // Sync with forcedTab from parent
  useEffect(() => {
    if (forcedTab) {
      setActiveSubTab(forcedTab);
    }
  }, [forcedTab]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  // Handle initial transcript from other tabs
  useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
      setFileName(lang === 'vi' ? 'Dữ liệu từ STT' : 'Data from STT');
      onClearInitial?.();
    }
  }, [initialTranscript, lang, onClearInitial]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'txt' || extension === 'md' || extension === 'json') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file);
      });
    }

    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      let fullText = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const sheetText = json.map((row: any) => row.join(' ')).join('\n');
        fullText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
      });
      return fullText;
    }

    throw new Error('Định dạng file không được hỗ trợ');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setTranscript(text);
    } catch (error) {
      console.error('Lỗi trích xuất văn bản:', error);
      alert(lang === 'vi' ? 'Không thể trích xuất văn bản từ file này.' : 'Could not extract text from this file.');
      setFileName('');
    } finally {
      setIsExtracting(false);
    }
  };

  const startRecap = async (type: string, typeName: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `${lang === 'vi' ? 'Tạo bản' : 'Generate'} ${typeName}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await generateMeetingRecap(transcript || '', type as any);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: lang === 'vi' ? 'Có lỗi xảy ra khi tạo bản recap. Vui lòng kiểm tra API Key.' : 'Error generating recap. Please check your API Key.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTranscript('');
    setFileName('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <div className="flex-grow flex flex-col overflow-hidden">
        
        {/* Chat Header */}
        <div className="px-10 py-7 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-900 flex items-center justify-center text-white shadow-2xl shadow-primary-900/30 transform hover:scale-105 transition-transform duration-300">
              {activeSubTab === 'recap' && <FileText size={28} />}
              {activeSubTab === 'translate' && <Languages size={28} />}
              {activeSubTab === 'email' && <Mail size={28} />}
              {activeSubTab === 'chat' && <MessageSquare size={28} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {activeSubTab === 'recap' && 'AI_CHAT Studio'}
                {activeSubTab === 'translate' && 'AI Translator'}
                {activeSubTab === 'email' && 'AI Email Drafter'}
                {activeSubTab === 'chat' && 'AI Chat Assistant'}
              </h3>
              <div className="flex items-center gap-2.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">AI Agent Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl">
              {[
                { id: 'recap', icon: <FileText size={18} />, label: lang === 'vi' ? 'Recap' : 'Recap' },
                { id: 'translate', icon: <Languages size={18} />, label: lang === 'vi' ? 'Dịch' : 'Trans' },
                { id: 'email', icon: <Mail size={18} />, label: lang === 'vi' ? 'Email' : 'Mail' },
                { id: 'chat', icon: <MessageSquare size={18} />, label: lang === 'vi' ? 'Chat' : 'Chat' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${
                    activeSubTab === tab.id 
                      ? 'bg-white dark:bg-gray-700 text-primary-900 dark:text-white shadow-xl scale-105' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/30'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={clearChat}
              className="p-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-300 hover:shadow-lg"
              title="Clear Chat"
            >
              <Trash2 size={22} />
            </button>
          </div>
        </div>

        {activeSubTab === 'recap' ? (
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/20 dark:bg-gray-900/20"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80 py-4">
                  <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-600 shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-110 transition-transform duration-500">
                    <FileText size={48} />
                  </div>
                  <div className="max-w-xl">
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{lang === 'vi' ? 'CHỌN KIỂU PHÂN TÍCH' : 'SELECT ANALYSIS TYPE'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                      {lang === 'vi' ? 'Đính kèm file transcript và chọn kiểu phân tích.' : 'Attach a transcript file and select analysis type.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    {[
                      { id: 'sx', label: lang === 'vi' ? 'RECAP SX' : 'PRODUCTION RECAP', icon: <Factory size={32} />, color: 'bg-emerald-600', desc: lang === 'vi' ? 'Dữ liệu sản xuất & kế hoạch.' : 'Production data & plans.' },
                      { id: 'multi', label: lang === 'vi' ? 'RECAP ĐẠI TRÀ' : 'GENERAL RECAP', icon: <Briefcase size={32} />, color: 'bg-indigo-600', desc: lang === 'vi' ? 'Báo cáo Ban Lãnh đạo.' : 'Management reports.' },
                    ].map(card => (
                      <button
                        key={card.id}
                        onClick={() => startRecap(card.id, card.label)}
                        disabled={isLoading}
                        className={`group relative p-8 rounded-[2.5rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-500 text-center flex flex-col items-center gap-4`}
                      >
                        <div className={`w-20 h-20 rounded-[1.5rem] ${card.color} flex-shrink-0 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform duration-500`}>
                          {card.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">{card.label}</h4>
                          <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest opacity-70">{card.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                      msg.role === 'user' ? 'bg-primary-900 text-white' : 'bg-white dark:bg-gray-800 text-primary-900 dark:text-primary-400 border border-gray-100 dark:border-gray-700'
                    }`}>
                      {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className="space-y-2">
                      <div className={`p-5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary-900 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                      }`}>
                        <div className="markdown-body prose dark:prose-invert max-w-none">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.role === 'assistant' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                            >
                              {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                              {copiedId === msg.id ? 'COPIED' : 'COPY'}
                            </button>
                            <button 
                              onClick={() => setMessages([])}
                              className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                            >
                              <Trash2 size={12} />
                              {lang === 'vi' ? 'CHỌN LẠI' : 'RE-SELECT'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-900 dark:text-primary-400 border border-gray-100 dark:border-gray-700">
                      <Bot size={20} />
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <Loader2 size={18} className="animate-spin text-primary-600" />
                      <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Gemini is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Area */}
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-4">
              {/* File Attachment Status */}
              {fileName && (
                <div className="flex items-center justify-between px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-primary-600" />
                    <span className="text-xs font-bold text-primary-900 dark:text-primary-400 truncate max-w-[300px]">{fileName}</span>
                  </div>
                  <button 
                    onClick={() => { setFileName(''); setTranscript(''); }}
                    className="text-primary-600 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4">
                {/* Attachment Button */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  className={`flex-grow flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-transparent shadow-sm ${
                    isExtracting 
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-200 hover:shadow-md'
                  }`}
                >
                  {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                  {isExtracting 
                    ? (lang === 'vi' ? 'ĐANG TRÍCH XUẤT...' : 'EXTRACTING...') 
                    : (lang === 'vi' ? 'ĐÍNH KÈM FILE' : 'ATTACH FILE')}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".txt,.json,.md,.docx,.pdf,.xlsx,.xls" 
                  className="hidden" 
                />
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-center text-gray-400 font-black uppercase tracking-[0.3em] opacity-80">
                  Powered by Gemini 3.1 Pro • Factory Operations Analyst Agent
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-hidden flex flex-col">
              {activeSubTab === 'translate' && (
                <Translation 
                  lang={lang} 
                  initialTranscript={transcript} 
                  onClearInitial={() => {}}
                  hideHeader={true}
                />
              )}
              {activeSubTab === 'email' && (
                <EmailDraft 
                  lang={lang} 
                  initialTranscript={transcript} 
                  onClearInitial={() => {}}
                  hideHeader={true}
                />
              )}
              {activeSubTab === 'chat' && (
                <AIChat 
                  lang={lang} 
                  hideHeader={true}
                />
              )}
            </div>
            
            {/* Unified Footer for sub-components */}
            <div className="px-10 py-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-80">
                Powered by Gemini 3.1 Pro • Factory Operations Analyst Agent
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRecap;
