
import React, { useState, useEffect } from 'react';
import { Mic, Volume2, MonitorPlay, FileInput, FileText, Sparkles, Globe, ChevronDown, Key, Settings, Moon, Sun, Palette, Image as ImageIcon, Trash2 } from 'lucide-react';
import AudioToText from './components/AudioToText';
import TextToAudio from './components/TextToAudio';
import ScreenRecorder from './components/ScreenRecorder';
import MeetingRecap from './components/MeetingRecap';
import Translation from './components/Translation';
import EmailDraft from './components/EmailDraft';
import AIChat from './components/AIChat';
import { AppTab, UILang, TRANSLATIONS, ThemeColor, ThemeMode, BackgroundType } from './types';
import { Languages, Mail, MessageSquare } from 'lucide-react';

const THEME_COLORS: Record<ThemeColor, { primary: string; rgb: string; shades: string[] }> = {
  green: { primary: '#154d3c', rgb: '21, 77, 60', shades: ['#f1f8f6', '#dcece7', '#bdd9d1', '#90bab0', '#649688', '#43786a', '#326055', '#284d44', '#223f38', '#154d3c'] },
  blue: { primary: '#1e3a8a', rgb: '30, 58, 138', shades: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'] },
  red: { primary: '#7f1d1d', rgb: '127, 29, 29', shades: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'] },
  orange: { primary: '#7c2d12', rgb: '124, 45, 18', shades: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'] },
  purple: { primary: '#581c87', rgb: '88, 28, 135', shades: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87'] },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.AudioToText);
  const [lang, setLang] = useState<UILang>('vi');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('google_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [recapTranscript, setRecapTranscript] = useState<string>('');
  
  // Theme State
  const [themeColor, setThemeColor] = useState<ThemeColor>((localStorage.getItem('theme_color') as ThemeColor) || 'green');
  const [themeMode, setThemeMode] = useState<ThemeMode>((localStorage.getItem('theme_mode') as ThemeMode) || 'light');
  const [bgType, setBgType] = useState<BackgroundType>((localStorage.getItem('bg_type') as BackgroundType) || 'abstract');
  const [showSettings, setShowSettings] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('google_api_key', apiKey);
    } else {
      localStorage.removeItem('google_api_key');
    }
  }, [apiKey]);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const theme = THEME_COLORS[themeColor];

    // Apply primary shades
    theme.shades.forEach((color, i) => {
      root.style.setProperty(`--primary-${(i === 0 ? 50 : i * 100)}`, color);
    });
    root.style.setProperty('--primary-rgb', theme.rgb);
    root.style.setProperty('--primary-dark', theme.primary);

    // Apply mode
    if (themeMode === 'dark') {
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      body.classList.add('light');
    }

    localStorage.setItem('theme_color', themeColor);
    localStorage.setItem('theme_mode', themeMode);
    localStorage.setItem('bg_type', bgType);
  }, [themeColor, themeMode, bgType]);

  const isLegacyTab = activeTab === AppTab.AudioToText || activeTab === AppTab.TextToAudio || activeTab === AppTab.ScreenRecord;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300`}>
      {/* Background Layers */}
      <div className={`bg-layer bg-${bgType}`}></div>
      {bgType === 'abstract' && <div className="bg-layer bg-abstract"></div>}

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 mica border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-5">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6xx_-xxD3VLmS5XLZZFmOwh5k2_1MJJVhCw&s" 
              alt="TH MIỀN ĐÔNG Logo" 
              className="w-14 h-14 object-contain rounded-xl shadow-sm border border-white/50 dark:border-white/10"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-primary-900 leading-tight dark:text-primary-400">{t.title}</span>
              <span className="text-[11px] font-bold text-primary-600 tracking-widest mt-1 opacity-90 dark:text-primary-500">{t.subtitle}</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 p-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-[1.5rem]">
            {[
              { id: AppTab.AudioToText, icon: <Mic size={18} />, label: t.tabs.stt },
              { id: AppTab.TextToAudio, icon: <Volume2 size={18} />, label: t.tabs.tts },
              { id: AppTab.ScreenRecord, icon: <MonitorPlay size={18} />, label: t.tabs.screen },
              { id: AppTab.MeetingRecap, icon: <FileText size={18} />, label: 'AI_CHAT' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-6 h-12 rounded-2xl text-[11px] font-black transition-all duration-500 flex items-center gap-3 uppercase tracking-widest ${
                  activeTab === item.id || (item.id === AppTab.MeetingRecap && (activeTab === AppTab.Translate || activeTab === AppTab.Email || activeTab === AppTab.Chat))
                    ? 'bg-primary-900 text-white shadow-[0_10px_25px_-5px_rgba(var(--primary-rgb),0.4)] scale-105 z-10' 
                    : 'text-gray-500 hover:text-primary-700 hover:bg-white/80 dark:hover:bg-gray-700/80'
                }`}
              >
                <span className={activeTab === item.id || (item.id === AppTab.MeetingRecap && (activeTab === AppTab.Translate || activeTab === AppTab.Email || activeTab === AppTab.Chat)) ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Settings Button */}
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
              >
                <Settings size={20} className={showSettings ? 'rotate-90 transition-transform' : 'transition-transform'} />
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in origin-top-right z-[70]">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{t.labels.themeSettings}</h4>
                  
                  <div className="space-y-6">
                    {/* Mode Switcher */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {themeMode === 'light' ? <Sun size={12} /> : <Moon size={12} />} {t.labels.themeMode}
                      </label>
                      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <button 
                          onClick={() => setThemeMode('light')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${themeMode === 'light' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-400'}`}
                        >
                          {t.labels.light}
                        </button>
                        <button 
                          onClick={() => setThemeMode('dark')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${themeMode === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}
                        >
                          {t.labels.dark}
                        </button>
                      </div>
                    </div>

                    {/* Color Switcher */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Palette size={12} /> {t.labels.themeColor}
                      </label>
                      <div className="flex gap-2.5">
                        {(['green', 'blue', 'red', 'orange', 'purple'] as ThemeColor[]).map(color => (
                          <button
                            key={color}
                            onClick={() => setThemeColor(color)}
                            className={`w-8 h-8 rounded-full transition-all border-2 ${themeColor === color ? 'border-primary-900 scale-110 shadow-lg' : 'border-transparent scale-100'}`}
                            style={{ backgroundColor: THEME_COLORS[color].primary }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Background Switcher */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={12} /> {t.labels.background}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['abstract', 'mesh', 'minimal', 'default'] as BackgroundType[]).map(bg => (
                          <button
                            key={bg}
                            onClick={() => setBgType(bg)}
                            className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${bgType === bg ? 'bg-primary-900 text-white border-primary-900' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-primary-200'}`}
                          >
                            {(t.labels as any)[`bg_${bg}`] || bg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* API Key Input */}
            <div className="relative">
              <button 
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-black transition-all shadow-sm ${
                  apiKey ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-900 dark:text-primary-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Google API Key"
              >
                <Key size={16} className={apiKey ? 'text-primary-600' : 'text-gray-400'} />
                <span className="hidden sm:inline">{apiKey ? 'API KEY SET' : 'SET API KEY'}</span>
              </button>

              {showApiKeyInput && (
                <div className="absolute right-0 mt-3 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in origin-top-right z-[60]">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Gemini API Key</label>
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary-900 focus:border-transparent outline-none transition-all dark:text-white"
                    />
                    <p className="text-[10px] text-gray-400 leading-relaxed italic">
                      {lang === 'vi' ? '* Để trống để sử dụng API mặc định của hệ thống.' : '* Leave empty to use system default API.'}
                    </p>
                    <button 
                      onClick={() => setShowApiKeyInput(false)}
                      className="w-full py-2.5 bg-primary-900 text-white rounded-xl text-xs font-black hover:bg-primary-800 transition-colors"
                    >
                      {lang === 'vi' ? 'LƯU CẤU HÌNH' : 'SAVE CONFIG'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-black transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-200 shadow-sm"
              >
                <Globe size={16} className="text-primary-600" />
                <span className="uppercase">{lang}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showLangMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in origin-top-right z-[60]">
                  {[
                    { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
                    { id: 'en', label: 'English', flag: '🇺🇸' },
                    { id: 'id', label: 'Bahasa Indo', flag: '🇮🇩' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setLang(l.id as UILang); setShowLangMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                        lang === l.id ? 'bg-primary-900 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-10 py-8 md:py-16 relative z-10 flex flex-col items-center">
        {isLegacyTab ? (
          <div className="w-full max-w-7xl animate-fade-in">
            {activeTab === AppTab.AudioToText && (
              <AudioToText 
                lang={lang} 
                onTransferToRecap={(text) => {
                  setRecapTranscript(text);
                  setActiveTab(AppTab.MeetingRecap);
                }} 
              />
            )}
            {activeTab === AppTab.TextToAudio && <TextToAudio lang={lang} />}
            {activeTab === AppTab.ScreenRecord && <ScreenRecorder lang={lang} />}
          </div>
        ) : (
          /* Main Application Container for AI Tools */
          <div className="w-full max-w-[1440px] relative flex flex-col items-stretch">
            
            {/* Central Content Card */}
            <div className="flex-grow bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/10 overflow-hidden h-[780px] flex flex-col relative z-20 transition-all duration-500">
              
              {/* Dynamic Content Area */}
              <div className="flex-grow flex flex-col overflow-hidden">
                {(activeTab === AppTab.MeetingRecap || activeTab === AppTab.Translate || activeTab === AppTab.Email || activeTab === AppTab.Chat) && (
                  <MeetingRecap 
                    lang={lang} 
                    initialTranscript={recapTranscript} 
                    onClearInitial={() => setRecapTranscript('')}
                    forcedTab={activeTab === AppTab.MeetingRecap ? 'recap' : activeTab === AppTab.Translate ? 'translate' : activeTab === AppTab.Email ? 'email' : 'chat'}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50 mica rounded-[2.5rem] p-3 shadow-2xl flex justify-around items-center border border-white/50 dark:border-white/10 ring-1 ring-black/5 overflow-x-auto">
          {[
            { id: AppTab.AudioToText, icon: <Mic size={20} /> },
            { id: AppTab.TextToAudio, icon: <Volume2 size={20} /> },
            { id: AppTab.ScreenRecord, icon: <MonitorPlay size={20} /> },
            { id: AppTab.MeetingRecap, icon: <FileText size={20} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-3.5 rounded-full transition-all ${
                activeTab === item.id || (item.id === AppTab.MeetingRecap && (activeTab === AppTab.Translate || activeTab === AppTab.Email || activeTab === AppTab.Chat))
                  ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20 scale-110' 
                  : 'text-gray-400 hover:text-primary-600'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </main>

      <footer className="py-12 border-t border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm text-center relative z-10">
        <p className="text-gray-400 dark:text-gray-500 text-[11px] font-black uppercase tracking-[0.5em] opacity-60">
          © 2026 DATACENTER VPTX • ADVANCED AI SYSTEMS
        </p>
      </footer>
    </div>
  );
};

export default App;
