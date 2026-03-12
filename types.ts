
export enum AppTab {
  AudioToText = 'stt',
  TextToAudio = 'tts',
  ScreenRecord = 'screen',
  MeetingRecap = 'recap',
  Translate = 'translate',
  Email = 'email',
  Chat = 'chat'
}

export type UILang = 'vi' | 'en' | 'id';

export type ThemeColor = 'green' | 'blue' | 'red' | 'orange' | 'purple';
export type ThemeMode = 'light' | 'dark';
export type BackgroundType = 'default' | 'mesh' | 'abstract' | 'minimal';

export interface UIContent {
  title: string;
  subtitle: string;
  tabs: Record<AppTab, string>;
  labels: Record<string, string>;
}

export interface NewsArticle {
  category: string;
  trend: 'up' | 'down' | 'stable' | string;
  title: string;
  summary: string;
  source: string;
  url: string;
}

export const TRANSLATIONS: Record<UILang, UIContent> = {
  vi: {
    title: "TH MIỀN ĐÔNG",
    subtitle: "BỘ CÔNG CỤ PHỤC VỤ CÔNG VIỆC",
    tabs: {
      stt: "Chuyển Âm thanh",
      tts: "Đọc Văn bản",
      screen: "Quay Màn hình",
      recap: "AI_CHAT",
      translate: "Dịch thuật",
      email: "Email mẫu",
      chat: "Chat AI"
    },
    labels: {
      heroTitle_stt: "Trợ lý Chuyển đổi Âm thanh AI",
      heroDesc_stt: "Chuyển đổi các cuộc họp, ghi âm thành văn bản tức thì với độ chính xác vượt trội từ Gemini 3 Pro.",
      heroTitle_tts: "Trình tạo Giọng nói AI Tự nhiên",
      heroDesc_tts: "Tạo giọng đọc chuyên nghiệp, truyền cảm từ văn bản phục vụ báo cáo, thuyết trình và sáng tạo nội dung.",
      heroTitle_screen: "Ghi hình Cuộc họp thông minh",
      heroDesc_screen: "Ghi lại màn hình và tự động trích xuất nội dung thảo luận thành biên bản họp chi tiết.",
      heroTitle_recap: "Trợ lý Recap họp Chuyên sâu",
      heroDesc_recap: "Phân tích transcript cuộc họp và tóm tắt theo chuẩn sản xuất hoặc đa hệ chuyên nghiệp.",
      heroTitle_translate: "Trình Dịch thuật AI Đa ngữ",
      heroDesc_translate: "Dịch thuật nội dung cuộc họp sang nhiều ngôn ngữ với độ chính xác cao và văn phong tự nhiên.",
      heroTitle_email: "Trình Soạn Email AI Chuyên nghiệp",
      heroDesc_email: "Tự động soạn thảo email báo cáo, hội ý dựa trên nội dung cuộc họp cho từng đối tượng cụ thể.",
      heroTitle_chat: "Thảo luận cùng Trợ lý AI",
      heroDesc_chat: "Hỏi đáp và khai thác thông tin từ nội dung cuộc họp thông qua giao diện chat thông minh.",
      langSwitcher: "Ngôn ngữ",
      startBtn: "Bắt đầu Xử lý",
      copyBtn: "Sao chép",
      downloadBtn: "Tải xuống",
      uploadArea: "Nhấn hoặc kéo thả tài liệu vào đây",
      uploadFile: "Tải lên file",
      recordLive: "Ghi âm trực tiếp",
      transcriptionResult: "Kết quả AI Transcription",
      placeholderSTT: "Văn bản chép lời sẽ hiển thị tại đây sau khi phân tích...",
      textContent: "Nội dung văn bản",
      voiceOptions: "Tùy chọn giọng AI",
      audioOutput: "Kết quả Âm thanh AI",
      placeholderTTS: "Nhập nội dung cần chuyển đổi thành giọng nói tại đây...",
      recordingDock: "Bảng điều khiển ghi hình",
      stopSave: "DỪNG & LƯU",
      analyzeMeeting: "PHÂN TÍCH CUỘC HỌP",
      meetingTip: "Mẹo: Chọn 'Chia sẻ âm thanh' để AI có thể nghe và chép lời nội dung họp.",
      recordingWait: "Đang chờ ghi hình...",
      convStep1: "1. Tải lên tài liệu",
      convStep2: "2. Chọn định dạng",
      complete: "Hoàn tất!",
      downloadVideo: "TẢI VIDEO",
      reRecord: "Ghi lại mới",
      recordingNote: "Mẹo: Ghi âm tối đa 60 phút để AI phân tích tốt nhất. Ghi âm không tốn API, chỉ khi 'Bắt đầu xử lý' mới tính phí.",
      downloadAudio: "Tải âm thanh",
      screenRecordingNote: "Mẹo: Ghi hình tối đa 60 phút để AI phân tích tốt nhất. Việc ghi hình không tốn API, chỉ khi 'Phân tích cuộc họp' mới tính phí.",
      themeSettings: "Cài đặt Giao diện",
      themeColor: "Màu chủ đạo",
      themeMode: "Chế độ",
      background: "Hình nền",
      light: "Sáng",
      dark: "Tối",
      bg_abstract: "Abstract (Mặc định)",
      bg_mesh: "Soft Wave",
      bg_minimal: "Elegant",
      bg_default: "Modern Tech",
    }
  },
  en: {
    title: "TH MIỀN ĐÔNG",
    subtitle: "WORK PRODUCTIVITY SUITE",
    tabs: {
      stt: "Audio to Text",
      tts: "Text to Speech",
      screen: "Screen Record",
      recap: "AI_CHAT",
      translate: "Translation",
      email: "Email Draft",
      chat: "AI Chat"
    },
    labels: {
      heroTitle_stt: "AI Speech-to-Text Assistant",
      heroDesc_stt: "Convert meetings and recordings into instant text with superior accuracy powered by Gemini 3 Pro.",
      heroTitle_tts: "Natural AI Voice Generator",
      heroDesc_tts: "Create professional and expressive voiceovers for reports, presentations, and content creation.",
      heroTitle_screen: "Smart Meeting Recorder",
      heroDesc_screen: "Record your screen and automatically extract discussion points into detailed meeting minutes.",
      heroTitle_recap: "Advanced Meeting Recap Assistant",
      heroDesc_recap: "Analyze meeting transcripts and summarize them into production-standard or multi-system reports.",
      heroTitle_translate: "Multilingual AI Translator",
      heroDesc_translate: "Translate meeting content into multiple languages with high accuracy and natural style.",
      heroTitle_email: "Professional AI Email Drafter",
      heroDesc_email: "Automatically draft report and discussion emails based on meeting content for specific audiences.",
      heroTitle_chat: "Discuss with AI Assistant",
      heroDesc_chat: "Ask questions and extract information from meeting content through an intelligent chat interface.",
      langSwitcher: "Language",
      startBtn: "Start Processing",
      copyBtn: "Copy",
      downloadBtn: "Download",
      uploadArea: "Click or drag your document here",
      uploadFile: "Upload file",
      recordLive: "Record live",
      transcriptionResult: "AI Transcription Result",
      placeholderSTT: "Transcribed text will appear here after analysis...",
      textContent: "Text content",
      voiceOptions: "AI Voice Options",
      audioOutput: "AI Audio Output",
      placeholderTTS: "Enter the content you want to convert to speech here...",
      recordingDock: "Recording Control Dock",
      stopSave: "STOP & SAVE",
      analyzeMeeting: "ANALYZE MEETING",
      meetingTip: "Tip: Select 'Share audio' so the AI can hear and transcribe the meeting content.",
      recordingWait: "Waiting for recording...",
      convStep1: "1. Upload document",
      convStep2: "2. Select format",
      complete: "Complete!",
      downloadVideo: "DOWNLOAD VIDEO",
      reRecord: "Record new",
      recordingNote: "Tip: Record up to 60 minutes for best AI analysis. Recording is free; API tokens are only used when you click 'Start Processing'.",
      downloadAudio: "Download Audio",
      screenRecordingNote: "Tip: Record up to 60 minutes for best AI analysis. Recording is free; API tokens are only used when you click 'Analyze Meeting'.",
      themeSettings: "Theme Settings",
      themeColor: "Primary Color",
      themeMode: "Mode",
      background: "Background",
      light: "Light",
      dark: "Dark",
      bg_abstract: "Abstract (Default)",
      bg_mesh: "Soft Wave",
      bg_minimal: "Elegant",
      bg_default: "Modern Tech",
    }
  },
  id: {
    title: "TH MIỀN ĐÔNG",
    subtitle: "SUITE PRODUKTIVITAS KERJA",
    tabs: {
      stt: "Suara ke Teks",
      tts: "Teks ke Suara",
      screen: "Rekam Layar",
      recap: "AI_CHAT",
      translate: "Terjemahan",
      email: "Draf Email",
      chat: "Chat AI"
    },
    labels: {
      heroTitle_stt: "Asisten Suara ke Teks AI",
      heroDesc_stt: "Ubah rapat dan rekaman menjadi teks instan dengan akurasi tinggi yang didukung oleh Gemini 3 Pro.",
      heroTitle_tts: "Generator Suara AI Alami",
      heroDesc_tts: "Buat sulih suara profesional dan ekspresif untuk laporan, presentasi, dan pembuatan konten.",
      heroTitle_screen: "Perekam Rapat Cerdas",
      heroDesc_screen: "Rekam layar Anda dan secara otomatis mengekstrak poin diskusi menjadi risalah rapat yang mendetail.",
      heroTitle_recap: "Asisten Ringkasan Rapat Canggih",
      heroDesc_converter: "Ekstrak dan ubah PDF atau gambar ke Word/Excel dengan tetap menjaga struktur tabel.",
      langSwitcher: "Bahasa",
      startBtn: "Mulai Proses",
      copyBtn: "Salin",
      downloadBtn: "Unduh",
      uploadArea: "Klik atau seret dokumen Anda di sini",
      uploadFile: "Unggah file",
      recordLive: "Rekam langsung",
      transcriptionResult: "Hasil Transkripsi AI",
      placeholderSTT: "Teks transkripsi akan muncul di sini setelah analisis...",
      textContent: "Konten teks",
      voiceOptions: "Opsi Suara AI",
      audioOutput: "Output Audio AI",
      placeholderTTS: "Masukkan konten yang ingin Anda ubah menjadi ucapan di sini...",
      recordingDock: "Dock Kontrol Rekaman",
      stopSave: "BERHENTI & SIMPAN",
      analyzeMeeting: "ANALISIS RAPAT",
      meetingTip: "Tips: Pilih 'Bagikan audio' agar AI dapat mendengar dan mentranskrip konten rapat.",
      recordingWait: "Menunggu rekaman...",
      convStep1: "1. Unggah dokumen",
      convStep2: "2. Pilih format",
      complete: "Selesai!",
      downloadVideo: "UNDUH VIDEO",
      reRecord: "Rekam baru",
      recordingNote: "Tips: Rekam hingga 60 menit untuk analisis AI terbaik. Perekaman gratis; token API hanya digunakan saat Anda mengklik 'Mulai Proses'.",
      downloadAudio: "Unduh Audio",
      screenRecordingNote: "Tips: Rekam hingga 60 menit untuk analisis AI terbaik. Perekaman gratis; token API hanya digunakan saat Anda mengklik 'Analisis Rapat'.",
      themeSettings: "Pengaturan Tema",
      themeColor: "Warna Utama",
      themeMode: "Mode",
      background: "Latar Belakang",
      light: "Terang",
      dark: "Gelap",
      bg_abstract: "Abstract (Default)",
      bg_mesh: "Soft Wave",
      bg_minimal: "Elegant",
      bg_default: "Modern Tech",
    }
  }
};

export interface VoiceOption {
  name: string;
  label: string;
  gender: 'Nam' | 'Nữ';
  tone: string;
  description: string;
  languages: string[];
  recommendedFor: string[];
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { 
    name: 'Puck', 
    label: 'Puck (Nam, Ấm áp)', 
    gender: 'Nam',
    tone: 'Nhẹ nhàng, Truyền cảm',
    description: 'Giọng nam trầm ấm, phát âm cực chuẩn.',
    languages: ['vi', 'en'],
    recommendedFor: ['vi']
  },
  { 
    name: 'Charon', 
    label: 'Charon (Nam, Đĩnh đạc)', 
    gender: 'Nam',
    tone: 'Trầm, Chuyên nghiệp',
    description: 'Giọng nam dày, uy tín. Rất tốt cho tin tức.',
    languages: ['vi', 'en'],
    recommendedFor: ['bao-cao']
  },
  { 
    name: 'Kore', 
    label: 'Kore (Nữ, Thanh tao)', 
    gender: 'Nữ',
    tone: 'Bình tĩnh, Rõ ràng',
    description: 'Giọng nữ êm dịu. Phù hợp cho tiếng Anh và tiếng Indo.',
    languages: ['en', 'id'],
    recommendedFor: ['id']
  },
  { 
    name: 'Zephyr', 
    label: 'Zephyr (Nữ, Sang trọng)', 
    gender: 'Nữ',
    tone: 'Dịu dàng, Tự nhiên',
    description: 'Giọng nữ quốc tế, phát âm tiếng Anh tự nhiên.',
    languages: ['en', 'vi'],
    recommendedFor: ['en']
  },
];

export const LANGUAGES = [
  { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'id', label: 'Bahasa Indo', flag: '🇮🇩' },
];
