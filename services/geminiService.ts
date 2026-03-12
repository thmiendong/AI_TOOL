
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { base64ToUint8Array, addWavHeader } from "../utils/audioUtils";

const getAI = () => {
  const customKey = localStorage.getItem('google_api_key');
  const apiKey = customKey || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: "Hãy chuyển âm thanh này thành văn bản một cách chính xác." }]
      }
    });
    return response.text || "Không thể tạo bản chép lời.";
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Puck'): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });
    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(part => part.inlineData);
    const base64Audio = audioPart?.inlineData?.data;
    if (!base64Audio) throw new Error("Không nhận được dữ liệu âm thanh.");
    const pcmData = base64ToUint8Array(base64Audio);
    const wavBuffer = addWavHeader(pcmData, 24000, 1, 16);
    return URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
};

export const analyzeDocument = async (base64Data: string, mimeType: string, targetFormat: 'word' | 'excel' | 'ppt'): Promise<string> => {
  try {
    const ai = getAI();
    let prompt = targetFormat === 'excel' ? "Chuyển thành bảng HTML sạch cho Excel." : 
                 targetFormat === 'word' ? "Tái tạo HTML cho Word." : "Tạo dàn ý slide PPT.";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] }
    });
    return (response.text || "").replace(/```html/g, "").replace(/```/g, "");
  } catch (error) {
    throw error;
  }
};

// Fixed: Added missing fetchNewsFeed implementation using Search Grounding and improved JSON extraction.
export const fetchNewsFeed = async (): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Tổng hợp 5 tin tức mới nhất về thị trường giày da, túi xách và kinh tế Việt Nam. Trả về định dạng JSON.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  trend: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING },
                },
                required: ['category', 'trend', 'title', 'summary', 'source', 'url'],
              },
            },
            market_stats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  change: { type: Type.STRING },
                },
                required: ['label', 'value', 'change'],
              },
            },
          },
          required: ['articles', 'market_stats'],
        },
      },
    });

    let jsonStr = response.text || "{}";
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }
    const data = JSON.parse(jsonStr);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { data, sources };
  } catch (error) {
    console.error("News fetch error:", error);
    throw error;
  }
};

export const generateMeetingRecap = async (transcript: string, promptType: 'sx' | 'multi' | 'quick' | 'minutes' | 'actions' | 'deep'): Promise<string> => {
  try {
    const ai = getAI();
    
    const prompts: Record<string, string> = {
      'sx': `Bạn là Factory Operations Analyst chuyên phân tích dữ liệu sản xuất trong nhà máy gia công túi xách.
Nhiệm vụ của bạn là đọc nội dung cuộc họp (ghi âm hoặc transcript) và tóm tắt lại thành bản RECAP cuộc họp sản xuất ngắn gọn, rõ ràng theo đúng cấu trúc dưới đây.
Yêu cầu:
- Viết ngắn gọn
- Dùng bullet point
- Giữ số liệu chính xác
- Văn phong báo cáo nội bộ nhà máy
- Không diễn giải dài dòng
- Tập trung vào: sản lượng, kế hoạch, tồn kho, cảnh báo, chỉ đạo.
Cấu trúc bắt buộc:
1. Kết quả thực hiện hôm qua
2. Kế hoạch và tình hình hôm nay
3. Tình hình tồn và cảnh báo
4. Kế hoạch giao gia công
5. Các điểm cần lưu ý
6. Chỉ đạo và cải tiến
Quy tắc viết: Chỉ giữ thông tin quan trọng, số liệu giữ nguyên, độ dài tối đa 200 chữ.`,
      'multi': `# 🎭 VAI TRÒ
Bạn là một Senior Business Analyst kiêm Factory Operations Consultant chuyên sâu về túi xách cao cấp.
# 🎯 NHIỆM VỤ CỦA BẠN:
Phân tích toàn bộ transcript cuộc họp/hội ý được cung cấp và tạo ra một bản RECAP CHUYÊN NGHIỆP phục vụ báo cáo Ban Lãnh đạo. Bản recap phải:
- Chính xác, súc tích, không bỏ sót thông tin quan trọng
- Dùng thuật ngữ ngành phù hợp nhưng vẫn dễ hiểu với lãnh đạo cấp cao
- Phân loại rõ ràng theo từng bộ phận/chức năng liên quan
- Highlight các rủi ro, cơ hội và điểm cần quyết định ngay`,
      'quick': `Tóm tắt nhanh các ý chính của cuộc họp trong vòng 1 phút đọc. Tập trung vào các quyết định quan trọng nhất.`,
      'minutes': `Soạn biên bản họp chi tiết bao gồm: Thời gian, Thành phần tham dự, Nội dung thảo luận chi tiết từng mục, Các ý kiến đóng góp và Kết luận.`,
      'actions': `Trích xuất danh sách các hành động kế tiếp (Next Actions/To-do list). Ghi rõ: Việc cần làm, Người phụ trách (nếu có) và Thời hạn (nếu có).`,
      'deep': `Phân tích chuyên sâu nội dung cuộc họp: Đưa ra các nhận định về tình hình hiện tại, các rủi ro tiềm ẩn, cơ hội phát triển và các đề xuất chiến lược cho tương lai.`
    };

    const basePrompt = prompts[promptType] || prompts['quick'];
    const finalPrompt = transcript 
      ? `${basePrompt}\n\nNội dung cuộc họp:\n${transcript}`
      : `Hãy tạo một MẪU (Template) trống cho: ${basePrompt}. Vì chưa có nội dung cuộc họp, hãy tạo khung sườn chuyên nghiệp để người dùng có thể tự điền vào.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts: [{ text: finalPrompt }] }
    });
    return response.text || "Không thể tạo bản recap.";
  } catch (error) {
    console.error("Recap error:", error);
    throw error;
  }
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dịch văn bản sau sang ${targetLang}. Chỉ trả về nội dung đã dịch, không thêm lời dẫn:\n\n${text}`
    });
    return response.text || "Lỗi dịch thuật.";
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

export const generateEmail = async (transcript: string, emailType: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompts: Record<string, string> = {
      'team': 'Soạn một email hội ý nhóm ngắn gọn, súc tích. Email bao gồm: Tiêu đề, Lời chào, Tóm tắt nội dung chính, Các hành động cần thực hiện (Action items) và Lời kết.',
      'dept': 'Soạn một email thông báo cho toàn phòng ban. Văn phong chuyên nghiệp, rõ ràng, tập trung vào các kế hoạch và chỉ đạo mới.',
      'bld': 'Soạn một email báo cáo Ban Lãnh đạo (BLĐ). Văn phong trang trọng, tập trung vào kết quả, số liệu, rủi ro và các đề xuất cần phê duyệt.',
      'invitation': 'Soạn một email mời họp chuyên nghiệp. Bao gồm: Tiêu đề, Thời gian, Địa điểm/Link, Mục đích cuộc họp và các tài liệu cần chuẩn bị.',
      'followup': 'Soạn một email theo dõi (follow-up) sau cuộc họp hoặc sau một sự kiện. Nhắc lại các điểm chính và các bước tiếp theo cần thực hiện.',
      'announcement': 'Soạn một email thông báo quan trọng (Announcement) gửi toàn thể nhân viên hoặc khách hàng. Văn phong trang trọng, rõ ràng và đầy đủ thông tin.'
    };

    const basePrompt = prompts[emailType] || prompts['team'];
    const finalPrompt = transcript 
      ? `${basePrompt}\n\nDựa trên nội dung cuộc họp này:\n${transcript}`
      : `Hãy tạo một MẪU EMAIL (Email Template) chuyên nghiệp cho mục đích: ${basePrompt}. Để các phần [Họ tên], [Nội dung],... trong ngoặc vuông để người dùng tự điền.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `${finalPrompt}`
    });
    return response.text || "Không thể soạn email.";
  } catch (error) {
    console.error("Email generation error:", error);
    throw error;
  }
};

export const pureChatWithAI = async (userMessage: string, history: { role: string, content: string }[]): Promise<string> => {
  try {
    const ai = getAI();
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('vi-VN');

    const contents = [
      ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: contents as any,
      config: {
        systemInstruction: `Hôm nay là ${dateStr}, bây giờ là ${timeStr}. Bạn là một trợ lý ảo thông minh. Hãy luôn ghi nhớ thời gian hiện tại để trả lời các câu hỏi liên quan đến ngày tháng một cách chính xác.`
      }
    });
    return response.text || "Tôi không thể trả lời lúc này.";
  } catch (error) {
    console.error("Pure AI Chat error:", error);
    throw error;
  }
};
