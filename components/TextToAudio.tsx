
import React, { useState, useEffect, useMemo } from 'react';
import { Download, Sparkles, AlertCircle, Quote, Info, Headphones, Check } from 'lucide-react';
import { VOICE_OPTIONS, LANGUAGES, UILang, TRANSLATIONS } from '../types';
import { generateSpeech } from '../services/geminiService';

interface Props { lang: UILang }

const TextToAudio: React.FC<Props> = ({ lang }) => {
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  const filteredVoices = useMemo(() => {
    return VOICE_OPTIONS.filter(v => v.languages.includes(selectedLanguage));
  }, [selectedLanguage]);

  useEffect(() => {
    const recommended = filteredVoices.find(v => v.recommendedFor.includes(selectedLanguage)) || filteredVoices[0];
    if (recommended) setSelectedVoice(recommended.name);
  }, [selectedLanguage, filteredVoices]);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    try {
      const url = await generateSpeech(text, selectedVoice);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err.message || "Failed to generate audio.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-12 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        
        {/* Editor Area */}
        <div className="xl:col-span-8 space-y-8">
          <div className="card-premium rounded-[2.5rem] overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800 p-8 flex flex-wrap justify-between items-center gap-6 bg-gray-50/30 dark:bg-gray-800/30">
              <label className="flex items-center gap-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                <Quote size={20} className="text-primary-900 dark:text-primary-400" />
                {t.labels.textContent}
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLanguage(l.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                      selectedLanguage === l.id 
                        ? 'bg-primary-900 text-white shadow-lg' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-primary-900 dark:hover:text-primary-400'
                    }`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.labels.placeholderTTS}
              className="w-full h-[480px] p-12 text-gray-800 dark:text-gray-200 border-0 focus:ring-0 resize-none text-xl md:text-2xl font-medium leading-relaxed bg-white dark:bg-gray-900 placeholder-gray-300 dark:placeholder-gray-700 custom-scrollbar"
            />

            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                <Info size={18} className="text-primary-400" />
                Gemini AI Voice Engine
              </div>
              <button 
                onClick={handleGenerate} 
                disabled={!text.trim() || isLoading} 
                className={`px-12 h-16 rounded-2xl text-lg font-black transition-all shadow-xl flex items-center gap-3 ${
                  !text.trim() || isLoading 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : 'bg-primary-900 text-white hover:bg-primary-800 shadow-primary-900/10'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={22} />
                )}
                <span>{t.labels.startBtn.toUpperCase()}</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-3xl flex items-center gap-5 border border-red-100 dark:border-red-900/30 animate-fade-in">
              <AlertCircle size={24} />
              <p className="text-base font-bold uppercase">{error}</p>
            </div>
          )}
        </div>

        {/* Options & Result Area */}
        <div className="xl:col-span-4 space-y-8">
          <div className="card-premium p-10 rounded-[2.5rem]">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-3">
              <Headphones size={22} className="text-primary-900 dark:text-primary-400" />
              {t.labels.voiceOptions}
            </h3>
            
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-3 custom-scrollbar">
              {filteredVoices.map((voice) => {
                const isActive = selectedVoice === voice.name;
                return (
                  <button
                    key={voice.name}
                    onClick={() => setSelectedVoice(voice.name)}
                    className={`w-full group p-6 rounded-3xl border-2 text-left transition-all ${
                      isActive 
                        ? 'border-primary-900 bg-primary-50/50 dark:bg-primary-900/20 shadow-md' 
                        : 'border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`font-black text-base ${isActive ? 'text-primary-900 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}`}>{voice.name}</span>
                        {isActive && <Check size={16} className="text-primary-900 dark:text-primary-400" />}
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${voice.gender === 'Nam' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'}`}>
                        {voice.gender.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">{voice.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {audioUrl && (
            <div className="bg-primary-900 text-white p-10 rounded-[2.5rem] shadow-2xl animate-fade-in">
              <h3 className="text-[11px] font-black text-primary-200 uppercase tracking-widest mb-8">{t.labels.audioOutput}</h3>
              <div className="space-y-8">
                <audio controls src={audioUrl} className="w-full h-12 invert brightness-150" autoPlay />
                <a 
                  href={audioUrl} 
                  download={`VPTX-AI-Audio-${Date.now()}.wav`} 
                  className="flex items-center justify-center gap-3 w-full py-5 bg-white text-primary-900 rounded-3xl text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Download size={20} />
                  <span>{t.labels.downloadBtn.toUpperCase()} (WAV)</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToAudio;
