
import React, { useState, useRef, useEffect } from 'react';
import { Mail, Bot, User, Loader2, Trash2, Copy, Check, ChevronDown, Sparkles, Globe } from 'lucide-react';
import { generateEmail } from '../services/geminiService';
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

interface EmailDraftProps {
  lang: UILang;
  initialTranscript?: string;
  onClearInitial?: () => void;
  hideHeader?: boolean;
}

const STATIC_TEMPLATES: Record<string, string> = {
  'team': `# TIÊU ĐỀ: HỘI Ý NHÓM ĐỊNH KỲ
  
**Kính gửi:** Toàn thể thành viên nhóm,

Dựa trên nội dung thảo luận, chúng ta thống nhất các điểm sau:

### 1. Tóm tắt nội dung chính
- [Nội dung 1]
- [Nội dung 2]

### 2. Các hành động cần thực hiện (Action items)
- **[Tên người]:** [Việc cần làm] - Hạn chót: [Ngày]
- **[Tên người]:** [Việc cần làm] - Hạn chót: [Ngày]

### 3. Kết luận
[Lời kết và lời chào]

Trân trọng,
[Họ tên của bạn]`,
  'dept': `# THÔNG BÁO PHÒNG BAN
  
**Kính gửi:** Anh/Chị em phòng [Tên phòng],

Tôi xin thông báo các kế hoạch và chỉ đạo mới như sau:

1. **Kế hoạch sản xuất:** [Chi tiết]
2. **Chỉ đạo mới:** [Chi tiết]
3. **Lưu ý:** [Chi tiết]

Đề nghị mọi người nghiêm túc thực hiện.

Trân trọng,
[Họ tên của bạn]`,
  'bld': `# BÁO CÁO BAN LÃNH ĐẠO
  
**Kính gửi:** Ban Lãnh đạo Công ty,

Tôi xin báo cáo tình hình hoạt động dựa trên nội dung hội ý vừa qua:

* **Kết quả đạt được:** [Số liệu/Kết quả]
* **Rủi ro tiềm ẩn:** [Chi tiết rủi ro]
* **Đề xuất phê duyệt:** [Nội dung cần phê duyệt]

Rất mong nhận được chỉ đạo từ Ban Lãnh đạo.

Trân trọng,
[Họ tên của bạn]`,
  'invitation': `# THƯ MỜI HỌP
  
**Chủ đề:** [Tên cuộc họp]

**Thời gian:** [Giờ], ngày [Ngày]
**Địa điểm:** [Phòng họp/Link họp online]

**Mục đích:**
[Nêu rõ mục đích cuộc họp]

**Tài liệu chuẩn bị:**
1. [Tài liệu 1]
2. [Tài liệu 2]

Rất mong mọi người tham dự đầy đủ và đúng giờ.

Trân trọng,`,
  'followup': `# EMAIL THEO DÕI SAU CUỘC HỌP
  
Chào mọi người,

Cảm ơn mọi người đã tham gia buổi họp vừa qua. Tôi xin nhắc lại các điểm chính và bước tiếp theo:

* **Điểm chính 1:** [Nội dung]
* **Điểm chính 2:** [Nội dung]
* **Bước tiếp theo:** [Nội dung]

Mọi người vui lòng cập nhật tiến độ vào [Ngày].

Trân trọng,`,
  'announcement': `# THÔNG BÁO QUAN TRỌNG
  
**Kính gửi:** Toàn thể cán bộ nhân viên,

Công ty xin thông báo về việc [Nội dung thông báo]:

- **Thời gian áp dụng:** [Ngày]
- **Đối tượng:** [Đối tượng]
- **Chi tiết:** [Nội dung chi tiết]

Mọi thắc mắc vui lòng liên hệ phòng [Tên phòng].

Trân trọng,`
};

const EmailDraft: React.FC<EmailDraftProps> = ({ lang, initialTranscript, onClearInitial, hideHeader }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [showEmailMenu, setShowEmailMenu] = useState(false);
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

  const handleGenerateEmail = async (emailType: string, typeName: string) => {
    setShowEmailMenu(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `${lang === 'vi' ? 'Sử dụng mẫu' : 'Use template'} ${typeName}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Simulate a small delay for better UX
    setIsLoading(true);
    setTimeout(() => {
      const template = STATIC_TEMPLATES[emailType] || STATIC_TEMPLATES['team'];
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: template,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 500);
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
              <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-2xl shadow-orange-600/30 transform hover:scale-105 transition-transform duration-300">
                <Mail size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AI Email Drafter</h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Email Engine Active</span>
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
              <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-gray-800 flex items-center justify-center text-orange-600 shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-110 transition-transform duration-500">
                <Mail size={48} />
              </div>
              <div className="max-w-xl">
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{lang === 'vi' ? 'MẪU EMAIL SOẠN SẴN' : 'PRE-DRAFTED EMAIL TEMPLATES'}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {lang === 'vi' ? 'Chọn một trong các mẫu soạn sẵn dưới đây.' : 'Select one of the pre-drafted templates below.'}
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
                      <div className="flex gap-4">
                        <button onClick={() => copyToClipboard(msg.content, msg.id)} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedId === msg.id ? 'COPIED' : 'COPY'}
                        </button>
                        <button onClick={() => setMessages([])} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                          <Trash2 size={14} />
                          {lang === 'vi' ? 'CHỌN MẪU KHÁC' : 'SELECT ANOTHER'}
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
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-900 dark:text-primary-400 border border-gray-100 dark:border-gray-700">
                  <Bot size={24} />
                </div>
                <div className="flex items-center gap-4 px-7 py-5 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                  <Loader2 size={20} className="animate-spin text-primary-600" />
                  <span className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Drafting Email...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {[
              { id: 'team', label: lang === 'vi' ? 'Hội ý nhóm' : 'Team Discussion', icon: <User size={18} />, color: 'bg-blue-500' },
              { id: 'dept', label: lang === 'vi' ? 'Phòng ban' : 'Department', icon: <Bot size={18} />, color: 'bg-emerald-500' },
              { id: 'bld', label: lang === 'vi' ? 'Ban Lãnh đạo' : 'Board of Directors', icon: <Sparkles size={18} />, color: 'bg-purple-500' },
              { id: 'invitation', label: lang === 'vi' ? 'Mời họp' : 'Meeting Invitation', icon: <Mail size={18} />, color: 'bg-orange-500' },
              { id: 'followup', label: lang === 'vi' ? 'Theo dõi' : 'Follow-up', icon: <Check size={18} />, color: 'bg-indigo-500' },
              { id: 'announcement', label: lang === 'vi' ? 'Thông báo' : 'Announcement', icon: <Globe size={18} />, color: 'bg-red-500' },
            ].map(e => (
              <button
                key={e.id}
                onClick={() => handleGenerateEmail(e.id, e.label)}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 group shadow-sm"
              >
                <div className={`w-8 h-8 rounded-lg ${e.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  {e.icon}
                </div>
                <span className="text-[9px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-center leading-tight">{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDraft;
