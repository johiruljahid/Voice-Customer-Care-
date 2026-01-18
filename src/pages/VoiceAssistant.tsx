import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SYSTEM_INSTRUCTION } from '../constants';
import { Mic, MicOff, Heart, Sparkles, Music } from 'lucide-react';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from '../utils/audio';
import { saveRoutine, getCurrentUser } from '../utils/db';
import { clsx } from 'clsx';

// --- Tool Definitions ---
const createRoutineTool: FunctionDeclaration = {
  name: 'createRoutine',
  parameters: {
    type: Type.OBJECT,
    description: 'Create and save a daily routine for the user.',
    properties: {
      title: { type: Type.STRING, description: 'Title of the routine (e.g., Work Day, Holiday)' },
      tasks: {
        type: Type.ARRAY,
        description: 'List of tasks with times',
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: 'Time (e.g., 7:00 AM)' },
            activity: { type: Type.STRING, description: 'Activity description' }
          }
        }
      },
    },
    required: ['title', 'tasks'],
  },
};

const VoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("Touch my heart to connect...");
  const [visualizerHeight, setVisualizerHeight] = useState<number[]>(new Array(5).fill(20));
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Auth Check
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    return () => disconnect();
  }, []);

  // Simple Visualizer Animation
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setVisualizerHeight(prev => prev.map(() => Math.random() * 40 + 10));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setVisualizerHeight(new Array(5).fill(10));
    }
  }, [isSpeaking]);

  const initializeAudioContexts = () => {
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!outputContextRef.current) {
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const connect = async () => {
    const user = getCurrentUser();
    if (!user) return navigate('/login');
    if (!process.env.API_KEY) {
      setStatusText("API Key Missing!");
      return;
    }

    try {
      initializeAudioContexts();
      await outputContextRef.current?.resume();
      await inputContextRef.current?.resume();

      setStatusText("Connecting to your heart...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsListening(true);
            setStatusText(`I'm here, ${user.name}... tell me anything.`);
            
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
                for (const fc of message.toolCall.functionCalls) {
                    if (fc.name === 'createRoutine') {
                        setStatusText("Planning your day, sweetheart...");
                        const args = fc.args as any;
                        
                        saveRoutine({
                          id: crypto.randomUUID(),
                          userId: user.id,
                          title: args.title || "Daily Routine",
                          tasks: args.tasks || [],
                          createdAt: new Date().toISOString()
                        });

                        const result = { status: "success", message: "Routine saved to your dashboard." };
                        
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
                   setStatusText("Maya is speaking...");
                   
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
                        setStatusText("I'm listening, Jaan...");
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
            setStatusText("Disconnected.");
          },
          onerror: (err) => {
            console.error(err);
            disconnect();
            setStatusText("Connection Error. Try again.");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            // Using 'Fenrir' or 'Kore' - Kore is usually female/softer in live demos
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [
              { googleSearch: {} }, 
              { functionDeclarations: [createRoutineTool] }
          ]
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatusText("Microphone Error");
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setStatusText("Touch my heart to connect...");
    
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
    <div className="flex flex-col h-screen bg-rose-50 font-sans">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-200 rounded-full blur-[100px] opacity-30 animate-blob"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        
        {/* Status Text */}
        <div className="mb-16 text-center z-10 min-h-[80px]">
          <h2 className={clsx(
            "text-2xl md:text-3xl font-bold transition-all duration-500 font-handwriting",
            isSpeaking ? "text-rose-600 scale-110" : "text-gray-600"
          )}>
            {statusText}
          </h2>
          
          {/* Audio Visualizer */}
          {isSpeaking && (
             <div className="flex items-center justify-center gap-1 mt-4 h-8">
                {visualizerHeight.map((h, i) => (
                    <div 
                        key={i} 
                        className="w-1.5 bg-rose-500 rounded-full transition-all duration-75"
                        style={{ height: `${h}px` }}
                    ></div>
                ))}
             </div>
          )}
        </div>

        {/* Main Heart Button */}
        <div className="relative z-10 group">
          {(isListening || isSpeaking) && (
            <>
                <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-20 duration-[2s]"></div>
                <div className="absolute inset-0 bg-rose-300 rounded-full animate-ping opacity-20 delay-150 duration-[2s]"></div>
            </>
          )}

          <button
            onClick={toggleConnection}
            className={clsx(
              "relative w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform hover:scale-105 border-4 border-white",
              isConnected 
                ? "bg-gradient-to-br from-rose-500 to-rose-700" 
                : "bg-white hover:bg-rose-50"
            )}
          >
            {isConnected ? (
              <div className="flex flex-col items-center animate-pulse-slow text-white">
                 <Heart size={64} className="fill-current" />
              </div>
            ) : (
              <div className="flex flex-col items-center text-rose-500">
                 <Mic size={48} />
                 <span className="text-xs font-medium mt-2">Connect</span>
              </div>
            )}
          </button>
        </div>

        {/* Feature Hints */}
        {!isConnected && (
            <div className="mt-16 flex flex-wrap justify-center gap-4 text-center z-10 max-w-2xl">
                <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-rose-100 flex items-center gap-2 text-gray-600 text-sm shadow-sm">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>"Amar mon valo na"</span>
                </div>
                <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-rose-100 flex items-center gap-2 text-gray-600 text-sm shadow-sm">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span>"Routine baniye dao"</span>
                </div>
                <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-rose-100 flex items-center gap-2 text-gray-600 text-sm shadow-sm">
                    <Music className="w-4 h-4 text-purple-500" />
                    <span>"Ekta gan geye shonao"</span>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default VoiceAssistant;