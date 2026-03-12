
import React, { useState, useRef, useEffect } from 'react';
import { MonitorPlay, Square, Download, FileText, AlertCircle, Video, Check, Copy, Sparkles, Wand2 } from 'lucide-react';
import Button from './Button';
import { transcribeAudio } from '../services/geminiService';
import { blobToBase64 } from '../utils/audioUtils';
import { UILang, TRANSLATIONS } from '../types';

interface Props { lang: UILang }

const ScreenRecorder: React.FC<Props> = ({ lang }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [copied, setCopied] = useState(false);

  const t = TRANSLATIONS[lang];
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [videoUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoUrl(URL.createObjectURL(blob));
        setRecordingBlob(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') setError("Permission required to record screen.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const handleTranscribeMeeting = async () => {
    if (!recordingBlob) return;
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await blobToBase64(recordingBlob);
      const result = await transcribeAudio(base64, 'video/webm');
      setTranscript(result);
    } catch (err: any) {
      setError("Analysis Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="card-premium p-10 rounded-[2.5rem] ring-1 ring-black/5">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-3">
              <Video size={20} className="text-primary-900 dark:text-primary-400" />
              {t.labels.recordingDock}
            </h3>
            {!isRecording && !videoUrl && (
              <div className="space-y-6">
                <div className="p-6 bg-primary-50/50 dark:bg-primary-900/20 rounded-3xl border border-primary-100 dark:border-primary-800 text-primary-900 dark:text-primary-400 text-sm font-medium leading-relaxed">
                  {t.labels.meetingTip}
                </div>
                <button 
                  onClick={startRecording} 
                  className="w-full h-16 rounded-3xl bg-primary-900 text-white font-black text-sm uppercase shadow-xl shadow-primary-900/10 flex items-center justify-center gap-3 hover:bg-primary-800 transition-all"
                >
                  <MonitorPlay size={20} />
                  <span>{t.labels.startBtn.toUpperCase()}</span>
                </button>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed px-4 text-center italic">
                  {t.labels.screenRecordingNote}
                </p>
              </div>
            )}
            {isRecording && (
              <div className="text-center space-y-8 animate-pulse">
                <div className="text-6xl font-black text-red-700 dark:text-red-500 tracking-tighter font-mono">{formatTime(recordingTime)}</div>
                <button 
                  onClick={stopRecording} 
                  className="w-full h-16 rounded-3xl bg-red-700 text-white font-black text-sm uppercase flex items-center justify-center gap-3 hover:bg-red-800 transition-all shadow-xl shadow-red-100 dark:shadow-red-900/20"
                >
                  <Square size={20} />
                  <span>{t.labels.stopSave}</span>
                </button>
              </div>
            )}
            {videoUrl && !isRecording && (
              <div className="space-y-4">
                <button onClick={() => { setVideoUrl(null); setTranscript(''); }} className="w-full h-14 rounded-2xl font-black text-xs uppercase text-gray-400 dark:text-gray-500 hover:text-primary-900 dark:hover:text-primary-400 transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-800">
                  {t.labels.reRecord}
                </button>
                <a href={videoUrl} download="VPTX_Meeting.webm" className="flex items-center justify-center gap-3 w-full h-16 bg-gray-900 dark:bg-gray-800 text-white rounded-3xl font-black text-sm uppercase shadow-2xl hover:bg-black dark:hover:bg-gray-700 transition-all">
                  <Download size={20} /> 
                  <span>{t.labels.downloadVideo}</span>
                </a>
              </div>
            )}
          </div>
          {videoUrl && !isRecording && (
            <div className="card-premium p-10 rounded-[2.5rem] text-center space-y-6">
               <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto text-primary-900 dark:text-primary-400"><Sparkles size={32} /></div>
               <div className="space-y-2">
                  <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">GEMINI AI ANALYTICS</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-4 opacity-80">AI Gemini will process the audio and create an automated summary for you.</p>
               </div>
               <button 
                 onClick={handleTranscribeMeeting} 
                 disabled={isLoading} 
                 className={`w-full h-14 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-3 transition-all ${
                   isLoading ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : 'bg-primary-900 text-white hover:bg-primary-800 shadow-primary-900/10'
                 }`}
               >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Wand2 size={18} />}
                  <span>{t.labels.analyzeMeeting}</span>
               </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-10">
          {videoUrl ? (
            <div className="bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/10 aspect-video ring-1 ring-black/10">
              <video src={videoUrl} controls className="w-full h-full" />
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-gray-900/40 border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] h-[500px] flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
              <MonitorPlay size={80} className="mb-6 opacity-10" />
              <p className="font-black text-sm uppercase tracking-[0.4em] opacity-40 italic">{t.labels.recordingWait}</p>
            </div>
          )}

          {transcript && (
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up">
              <div className="bg-gray-50/50 dark:bg-gray-800/50 px-10 py-7 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest flex items-center gap-3">
                   <FileText size={18} className="text-primary-900 dark:text-primary-400" /> {t.labels.transcriptionResult}
                </h3>
                <button 
                  onClick={() => { navigator.clipboard.writeText(transcript); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                  className="text-primary-900 dark:text-primary-400 font-black text-xs hover:underline uppercase tracking-widest"
                >
                  {copied ? 'COPIED' : t.labels.copyBtn.toUpperCase()}
                </button>
              </div>
              <div className="p-10">
                <div className="text-gray-700 dark:text-gray-300 text-xl font-medium leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar">{transcript}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenRecorder;
