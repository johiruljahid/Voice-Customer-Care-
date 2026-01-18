import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY;

// Initialize the client
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const sendMessageToGemini = async (history: { role: string; content: string }[], message: string): Promise<string> => {
  if (!ai) {
    throw new Error("API Key is missing. Please configure GEMINI_API_KEY.");
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview', // Using Flash 3 for speed and search capabilities
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable Google Search grounding
        temperature: 0.7,
      },
      history: history.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage({ message });
    
    // Check for grounding metadata to append sources if available
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let text = result.text || "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।";

    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk) => chunk.web?.uri)
        .filter((uri): uri is string => !!uri);
      
      if (sources.length > 0) {
        text += "\n\nতথ্যসূত্র:\n" + [...new Set(sources)].map(url => `- [${new URL(url as string).hostname}](${url})`).join("\n");
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("দুঃখিত, একটি প্রযুক্তিগত সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
  }
};