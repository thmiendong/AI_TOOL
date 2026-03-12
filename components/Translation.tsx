
import React, { useState, useRef, useEffect } from 'react';
import { Languages, Bot, User, Loader2, Paperclip, Trash2, Copy, Check, Globe, ChevronDown, FileText } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { UILang, TRANSLATIONS } from '../types';
import Markdown from 'react-markdown';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import * as XLSX from 'xlsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranslationProps {
  lang: UILang;
  initialTranscript?: string;
  onClearInitial?: () => void;
  hideHeader?: boolean;
}

const Translation: React.FC<TranslationProps> = ({ lang, initialTranscript, onClearInitial, hideHeader }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
      setFileName(lang === 'vi' ? 'Dữ liệu từ STT' : 'Data from STT');
      onClearInitial?.();
    }
  }, [initialTranscript, lang, onClearInitial]);

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
    throw new Error('Unsupported file format');
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
      alert(lang === 'vi' ? 'Không thể trích xuất văn bản.' : 'Could not extract text.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTranslate = async (targetLang: string, langName: string) => {
    if (!transcript) return;
    setShowTranslateMenu(false);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `${lang === 'vi' ? 'Dịch nội dung sang' : 'Translate content to'} ${langName}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await translateText(transcript, targetLang);
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
              <div className="w-14 h-14 rounded-2xl bg-primary-900 flex items-center justify-center text-white shadow-2xl shadow-primary-900/30 transform hover:scale-105 transition-transform duration-300">
                <Languages size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AI Translator</h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Translation Engine Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => { setMessages([]); setTranscript(''); setFileName(''); }} className="p-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-300 hover:shadow-lg">
              <Trash2 size={22} />
            </button>
          </div>
        )}

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/20 dark:bg-gray-900/20">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80 py-4">
              <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-gray-800 flex items-center justify-center text-primary-600 shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-110 transition-transform duration-500">
                <Globe size={48} />
              </div>
              <div className="max-w-xl">
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{lang === 'vi' ? 'SẴN SÀNG DỊCH THUẬT' : 'READY TO TRANSLATE'}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {lang === 'vi' ? 'Nhập văn bản hoặc đính kèm file để bắt đầu.' : 'Enter text or attach a file to start.'}
                </p>
              </div>

              <div className="w-full max-w-4xl mx-auto">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập nội dung cần dịch tại đây...' : 'Enter content to translate here...'}
                  className="w-full h-40 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/20 outline-none transition-all dark:text-white resize-none shadow-inner"
                />
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-10">
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
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-900 dark:text-primary-400 border border-gray-100 dark:border-gray-700">
                  <Bot size={24} />
                </div>
                <div className="flex items-center gap-4 px-7 py-5 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                  <Loader2 size={20} className="animate-spin text-primary-600" />
                  <span className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Translating...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-auto space-y-4">
          {fileName && (
            <div className="flex items-center justify-between px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl animate-fade-in max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary-600" />
                <span className="text-xs font-bold text-primary-900 dark:text-primary-400 truncate max-w-[300px]">{fileName}</span>
              </div>
              <button onClick={() => { setFileName(''); setTranscript(''); }} className="text-primary-600 hover:text-red-500 transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-transparent shadow-sm ${isExtracting ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-200 hover:shadow-md'}`}>
              {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              {isExtracting ? (lang === 'vi' ? 'ĐANG TRÍCH XUẤT...' : 'EXTRACTING...') : (lang === 'vi' ? 'ĐÍNH KÈM FILE' : 'ATTACH FILE')}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.json,.md,.docx,.pdf,.xlsx,.xls" className="hidden" />

            <div className="relative flex-grow">
              <button 
                onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                disabled={isLoading || !transcript.trim()}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl ${!transcript.trim() ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-primary-900 text-white shadow-primary-900/30 scale-100 hover:scale-[1.02]'}`}
              >
                <Languages size={18} />
                {lang === 'vi' ? 'CHỌN NGÔN NGỮ' : 'SELECT LANGUAGE'}
                <ChevronDown size={14} className={`ml-auto transition-transform duration-300 ${showTranslateMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showTranslateMenu && (
                <div className="absolute bottom-full left-0 mb-4 w-full bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-3 z-50 animate-fade-in origin-bottom">
                  {[
                    { id: 'Vietnamese', label: 'Tiếng Việt', flag: '🇻🇳' },
                    { id: 'English', label: 'English', flag: '🇺🇸' },
                    { id: 'Indonesian', label: 'Indonesian', flag: '🇮🇩' },
                    { id: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
                  ].map(l => (
                    <button key={l.id} onClick={() => handleTranslate(l.id, l.label)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300">
                      <span className="text-xl">{l.flag}</span>
                      <span className="uppercase tracking-widest">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translation;
