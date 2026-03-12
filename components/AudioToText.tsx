
import React, { useState } from 'react';
import { Upload, FileAudio, Copy, Check, AlertCircle, Mic2, Sparkles, Wand2, ArrowRight } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import Button from './Button';
import { transcribeAudio } from '../services/geminiService';
import { blobToBase64 } from '../utils/audioUtils';
import { UILang, TRANSLATIONS } from '../types';

interface Props { 
  lang: UILang;
  onTransferToRecap?: (text: string) => void;
}

const AudioToText: React.FC<Props> = ({ lang, onTransferToRecap }) => {
  const [file, setFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setRecordedBlob(null);
      setTranscript('');
      setError(null);
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    setFile(null);
    setTranscript('');
    setError(null);
  };

  const handleTranscribe = async () => {
    const audioSource = file || recordedBlob;
    if (!audioSource) return;

    setIsLoading(true);
    setError(null);
    setTranscript('');

    try {
      const base64 = await blobToBase64(audioSource);
      const mimeType = file ? file.type : 'audio/webm';
      const result = await transcribeAudio(base64, mimeType);
      setTranscript(result);
    } catch (err: any) {
      setError(err.message || "Error processing audio.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeSource = file || recordedBlob;

  return (
    <div className="space-y-12 animate-fade-in max-w-screen-xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Input Area */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`card-premium p-8 rounded-3xl ${file ? 'ring-2 ring-primary-900' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <Upload size={22} className="text-primary-900 dark:text-primary-400" />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-widest">{t.labels.uploadFile}</h3>
              </div>
              <label className="relative block h-44 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-primary-50/30 dark:hover:bg-primary-900/10 hover:border-primary-300 transition-all cursor-pointer">
                <input type="file" accept="audio/*" onChange={handleFileChange} className="sr-only" />
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  {file ? (
                    <div className="flex flex-col items-center animate-fade-in">
                      <FileAudio size={40} className="text-primary-900 dark:text-primary-400 mb-3" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <FileAudio size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase leading-relaxed text-center px-4">{t.labels.uploadArea}</span>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className={`card-premium p-8 rounded-3xl ${recordedBlob ? 'ring-2 ring-primary-900' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <Mic2 size={22} className="text-red-700 dark:text-red-500" />
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-widest">{t.labels.recordLive}</h3>
              </div>
              <AudioRecorder onRecordingComplete={handleRecordingComplete} lang={lang} />
            </div>
          </div>

          <button 
            onClick={handleTranscribe} 
            disabled={!activeSource || isLoading}
            className={`w-full h-20 rounded-3xl text-xl font-black shadow-xl shadow-primary-900/10 transition-all active:scale-95 flex items-center justify-center gap-4 ${
              !activeSource || isLoading 
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'bg-primary-900 text-white hover:bg-primary-800'
            }`}
          >
            {isLoading ? (
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 <span>PROCESSING...</span>
               </div>
            ) : (
              <>
                <Sparkles size={24} />
                <span>{t.labels.startBtn.toUpperCase()}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed px-4 text-center italic">
            {t.labels.recordingNote}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-3xl flex items-center gap-5 border border-red-100 dark:border-red-900/30 animate-fade-in">
              <AlertCircle size={24} />
              <p className="text-base font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Transcription Output Area */}
        <div className="card-premium rounded-[2.5rem] overflow-hidden flex flex-col h-[600px]">
          <div className="bg-gray-50/50 dark:bg-gray-800/50 px-10 py-7 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center backdrop-blur-sm">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-3">
              <Wand2 size={18} className="text-primary-900 dark:text-primary-400" />
              {t.labels.transcriptionResult}
            </h3>
            {transcript && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onTransferToRecap?.(transcript)}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white transition-all flex items-center gap-2.5 text-xs font-black shadow-md hover:bg-indigo-700 active:scale-95"
                >
                  <ArrowRight size={16} />
                  {lang === 'vi' ? 'CHUYỂN AI TOOLS' : 'TRANSFER TO AI TOOLS'}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className={`px-6 py-2.5 rounded-2xl transition-all flex items-center gap-2.5 text-xs font-black shadow-md ${
                    copied ? 'bg-primary-900 text-white shadow-primary-200' : 'bg-white dark:bg-gray-800 text-primary-900 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'COPIED' : t.labels.copyBtn.toUpperCase()}
                </button>
              </div>
            )}
          </div>
          <div className="p-10 flex-grow">
            <textarea 
              readOnly 
              value={transcript} 
              className="w-full h-full p-0 border-0 focus:ring-0 text-gray-800 dark:text-gray-200 leading-relaxed resize-none bg-transparent text-xl md:text-2xl font-medium placeholder-gray-300 dark:placeholder-gray-700 custom-scrollbar"
              placeholder={t.labels.placeholderSTT}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioToText;
