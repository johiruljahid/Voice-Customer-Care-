import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Header } from '../components/Header';
import { SYSTEM_INSTRUCTION } from '../constants';
import { Mic, MicOff, Activity, CalendarCheck, ShieldCheck } from 'lucide-react';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from '../utils/audio';
import { saveAppointment } from '../utils/db';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

// --- Tool Definitions ---
const bookAppointmentTool: FunctionDeclaration = {
  name: 'bookAppointment',
  parameters: {
    type: Type.OBJECT,
    description: 'Book a doctor appointment for a patient.',
    properties: {
      patientName: { type: Type.STRING, description: 'Name of the patient' },
      doctorName: { type: Type.STRING, description: 'Name of the doctor' },
      preferredTime: { type: Type.STRING, description: 'Preferred time for the appointment (e.g., "Monday 5 PM")' },
    },
    required: ['patientName', 'doctorName'],
  },
};

const VoiceAssistant: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("কথা বলতে নিচের বাটনে চাপ দিন");
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const initializeAudioContexts = () => {
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!outputContextRef.current) {
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const connect = async () => {
    if (!process.env.API_KEY) {
      setStatusText("API Key Missing!");
      return;
    }

    try {
      initializeAudioContexts();
      await outputContextRef.current?.resume();
      await inputContextRef.current?.resume();

      setStatusText("সংযোগ হচ্ছে...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsListening(true);
            setStatusText("আমি শুনছি... বলুন");
            
            if (inputContextRef.current && streamRef.current) {
              const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
              sourceRef.current = source;
              const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(processor);
              processor.connect(inputContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Function Calls
             if (message.toolCall) {
                setStatusText("বুকিং কনফার্ম করা হচ্ছে...");
                for (const fc of message.toolCall.functionCalls) {
                    if (fc.name === 'bookAppointment') {
                        const ticketNumber = "POP-" + Math.floor(1000 + Math.random() * 9000);
                        const args = fc.args as any;
                        
                        // Save to Database
                        saveAppointment({
                          id: crypto.randomUUID(),
                          ticketNumber,
                          patientName: args.patientName || "Unknown",
                          doctorName: args.doctorName || "General Physician",
                          preferredTime: args.preferredTime || "Not Specified",
                          createdAt: new Date().toISOString(),
                          status: 'confirmed'
                        });

                        console.log("Booking Saved:", args);
                        
                        const result = { 
                          status: "success", 
                          ticketNumber: ticketNumber,
                          message: "Appointment booked successfully and saved to admin panel." 
                        };
                        
                        sessionPromise.then(session => {
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result }
                                }
                            });
                        });
                    }
                }
             }

             // Handle Audio Output
             const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                if (outputContextRef.current) {
                   setIsSpeaking(true);
                   setStatusText("বলছি...");
                   
                   nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                   
                   const audioBuffer = await decodeAudioData(
                     base64ToUint8Array(audioData),
                     outputContextRef.current,
                     24000
                   );
                   
                   const source = outputContextRef.current.createBufferSource();
                   source.buffer = audioBuffer;
                   source.connect(outputContextRef.current.destination);
                   
                   source.addEventListener('ended', () => {
                     audioSourcesRef.current.delete(source);
                     if (audioSourcesRef.current.size === 0) {
                        setIsSpeaking(false);
                        setStatusText("আমি শুনছি...");
                     }
                   });
                   
                   source.start(nextStartTimeRef.current);
                   nextStartTimeRef.current += audioBuffer.duration;
                   audioSourcesRef.current.add(source);
                }
             }

             if (message.serverContent?.interrupted) {
                 audioSourcesRef.current.forEach(src => src.stop());
                 audioSourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
                 setIsSpeaking(false);
             }
          },
          onclose: () => {
            disconnect();
            setStatusText("সংযোগ বিচ্ছিন্ন হয়েছে");
          },
          onerror: (err) => {
            console.error(err);
            disconnect();
            setStatusText("ত্রুটি হয়েছে, আবার চেষ্টা করুন");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [
              { googleSearch: {} }, 
              { functionDeclarations: [bookAppointmentTool] }
          ]
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatusText("মাইক্রোফোন সমস্যা");
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setStatusText("কথা বলতে নিচের বাটনে চাপ দিন");
    
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    
    if (sourceRef.current) sourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    
    audioSourcesRef.current.forEach(src => src.stop());
    audioSourcesRef.current.clear();
    
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close && s.close());
        sessionRef.current = null;
    }
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-hospital-50 font-sans">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-hospital-200 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="mb-12 text-center z-10">
          <h2 className={clsx(
            "text-2xl md:text-3xl font-bold transition-colors duration-500",
            isSpeaking ? "text-hospital-700" : "text-gray-700"
          )}>
            {statusText}
          </h2>
          {isSpeaking && (
             <p className="text-hospital-600 mt-2 animate-pulse">
                AI কথা বলছে...
             </p>
          )}
        </div>

        <div className="relative z-10 group">
          {(isListening || isSpeaking) && (
            <>
                <div className="absolute inset-0 bg-hospital-400 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 bg-hospital-300 rounded-full animate-ping opacity-20 delay-150"></div>
            </>
          )}

          <button
            onClick={toggleConnection}
            className={clsx(
              "relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-105",
              isConnected 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-hospital-600 hover:bg-hospital-700 text-white"
            )}
          >
            {isConnected ? (
              <MicOff size={48} strokeWidth={1.5} />
            ) : (
              <Mic size={48} strokeWidth={1.5} />
            )}
          </button>
        </div>

        {!isConnected && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-center z-10 max-w-lg">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-hospital-100">
                    <Activity className="w-6 h-6 text-hospital-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">ডাক্তার বা টেস্ট সম্পর্কে জানুন</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-hospital-100">
                    <CalendarCheck className="w-6 h-6 text-hospital-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">অ্যাপয়েন্টমেন্ট বুকিং করুন</p>
                </div>
            </div>
        )}

        {/* Admin Link (Bottom Right) */}
        <Link to="/admin" className="absolute bottom-6 right-6 text-gray-400 hover:text-hospital-600 flex items-center gap-1 text-xs">
           <ShieldCheck size={14} /> Admin Access
        </Link>
      </main>
      
      <footer className="bg-white py-4 border-t border-gray-100 text-center text-xs text-gray-400">
        পপুলার ডায়াগনস্টিক এআই • ভয়েস অ্যাসিস্ট্যান্ট
      </footer>
    </div>
  );
};

export default VoiceAssistant;