'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Ghost, Trophy, Compass, BookOpen, Baby, X, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  desc: string;
  unlocked: boolean;
}

let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playPop = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

const playMagic = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.08 + 0.2);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.2);
    });
  } catch(e) {}
};

const playGhost = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.4);
    osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);

    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 6;
    vibratoGain.gain.value = 20;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    
    vibrato.start();
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
    vibrato.stop(ctx.currentTime + 0.8);
  } catch(e) {}
};

const MARILUZ_TIPS = [
  "No olvidéis que el pretérito imperfecto describe acciones que solían ocurrir, ¡como los paseos de Chispitas!",
  "¡Ojo con los verbos irregulares! Si la raíz cambia al conjugarlo, como 'dormir' a 'duermo', repasad bien.",
  "La primera conjugación termina en -ar, la segunda en -er y la tercera en -ir. ¡Muy fácil!",
  "El modo subjuntivo expresa deseos, dudas o posibilidades. ¡Ojalá aprendáis mucho!",
  "Los verbos defectivos no se pueden conjugar en todas las personas, como 'acanecer', 'llover' o 'soler'.",
  "El condicional nos dice qué pasaría si se cumpliese una condición: 'Yo estudiaría si no estuviese flotando'.",
  "Recuerda que el aspecto perfectivo indica que la acción ya ha concluido del todo."
];

export default function ChispitasApp() {
  const INITIAL_MESSAGE = "¡Hola! Soy **Chispitas**. Estaba flotando por el techo de la clase y me he enterado de que hoy toca misión especial en El Haya. ✨\n\nTe ayudaré a analizar verbos. Cada vez que aciertes ganarás Ectoplasmas de Sabiduría y subiremos de nivel.\n\nPara calentar motores: dime persona, número, tiempo, modo y tipo (regular/irregular) del verbo **cantan**.";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: INITIAL_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Gamification State
  const [xp, setXp] = useState(450);
  const [level, setLevel] = useState(4);
  const [nextLevelXp, setNextLevelXp] = useState(1000);
  const [showTrophies, setShowTrophies] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const stickers = [
    { id: 's1', emoji: '🌟', name: 'Estrella Principiante', level: 1, rotate: '-rotate-6' },
    { id: 's2', emoji: '🎓', name: 'Estudiante Genial', level: 2, rotate: 'rotate-3' },
    { id: 's3', emoji: '🔥', name: 'Racha Ardiente', level: 3, rotate: '-rotate-3' },
    { id: 's4', emoji: '🧠', name: 'Mente Brillante', level: 4, rotate: 'rotate-6' },
    { id: 's5', emoji: '⚡', name: 'Rayo Ortográfico', level: 5, rotate: '-rotate-12' },
    { id: 's6', emoji: '🦉', name: 'Saber Ancestral', level: 6, rotate: 'rotate-12' },
    { id: 's7', emoji: '🚀', name: 'Magia del Tiempo', level: 7, rotate: '-rotate-6' },
    { id: 's8', emoji: '👑', name: 'Corona Verbal', level: 8, rotate: 'rotate-3' },
  ];

  const [badges, setBadges] = useState<Badge[]>([
    { id: 'first', name: 'Primer Paso', icon: <Baby size={24} />, desc: 'Tu primer mensaje', unlocked: false },
    { id: 'explorer', name: 'Espíritu Explorador', icon: <Compass size={24} />, desc: '5 interacciones', unlocked: false },
    { id: 'grammarian', name: 'Mente Gramatical', icon: <BookOpen size={24} />, desc: '10 interacciones', unlocked: false },
    { id: 'ghost_friend', name: 'Colega Espectral', icon: <Ghost size={24} />, desc: 'Nivel 2 alcanzado', unlocked: false }
  ]);

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % MARILUZ_TIPS.length);
    }, 12000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const userMsgs = messages.filter(m => m.role === 'user').length;
    let shouldUpdate = false;
    
    setTimeout(() => {
      setBadges(prev => {
        let updated = false;
        const newBadges = prev.map(b => {
          let shouldUnlock = false;
          if (b.id === 'first' && userMsgs >= 1) shouldUnlock = true;
          if (b.id === 'explorer' && userMsgs >= 5) shouldUnlock = true;
          if (b.id === 'grammarian' && userMsgs >= 10) shouldUnlock = true;
          if (b.id === 'ghost_friend' && level >= 2) shouldUnlock = true;
          if (shouldUnlock && !b.unlocked) {
            updated = true;
            return { ...b, unlocked: true };
          }
          return b;
        });
        return updated ? newBadges : prev;
      });
    }, 0);
  }, [messages, level]);

  const addXp = (amount: number) => {
    playMagic();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22d3ee', '#c084fc', '#facc15']
    });

    setXp(prev => {
      let newXp = prev + amount;
      if (newXp >= nextLevelXp) {
        setLevel(l => l + 1);
        setNextLevelXp(nl => nl + 500);
        return newXp - nextLevelXp;
      }
      return newXp;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    playPop();
    const userMessage: Message = { role: 'user', content: input.trim() };
    const newChatHistory = [...messages, userMessage];
    
    setMessages(newChatHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newChatHistory }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      let botResponseText = data.message || "La niebla interfiere y no puedo escucharte bien...";

      const xpRegex = /\[XP:\s*(\d+)\]/i;
      const xpMatch = botResponseText.match(xpRegex);
      let earnedXP = 0;

      if (xpMatch) {
        earnedXP = parseInt(xpMatch[1], 10);
        botResponseText = botResponseText.replace(xpRegex, '').trim();
      }

      playGhost();
      setMessages(prev => [...prev, { role: 'assistant', content: botResponseText }]);
      
      if (earnedXP > 0) {
        addXp(earnedXP);
        setStreak(s => s + 1);
      } else {
        setStreak(0);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '¡Ay! Ocurrió una turbulencia espectral. Revisa tu consola de hechizos e inténtalo de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <b key={index} className="font-bold text-cyan-300">{part.slice(2, -2)}</b>;
      }
      return <span key={index}>{part.split('\n').map((str, i, arr) => (
        <span key={i}>{str}{i !== arr.length - 1 && <br />}</span>
      ))}</span>;
    });
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden text-white flex flex-col font-sans select-none relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `linear-gradient(to bottom, rgba(12, 10, 30, 0.85), rgba(30, 27, 75, 0.95)), url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2600&auto=format&fit=crop')` }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <header className="w-full flex items-center justify-between px-4 sm:px-8 py-2 bg-white/5 backdrop-blur-md border-b border-white/10 z-20 shrink-0 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <span className="text-xl sm:text-2xl">👻</span>
          </div>
          <div>
            <h1 className="text-base flex flex-col sm:flex-row sm:text-lg font-bold tracking-tight leading-tight">
              <span>CHISPITAS </span>
              <span className="text-cyan-400 font-light italic sm:ml-1">de El Haya</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest hidden sm:inline">Guía Espectral Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 justify-end">
          {streak > 1 && (
            <div className="flex items-center gap-1 bg-orange-500/20 text-orange-300 px-3 py-1.5 rounded-full border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse">
              <Flame size={16} fill="currentColor" />
              <span className="text-xs font-bold font-mono">x{streak}</span>
            </div>
          )}
          <div className="flex flex-col items-end hidden md:flex">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest">Ectoplasma</span>
              <span className="text-sm font-mono">{xp} / {nextLevelXp}</span>
            </div>
            <div className="w-32 lg:w-48 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500" style={{ width: `${(xp / nextLevelXp) * 100}%` }}></div>
            </div>
          </div>
          <div className="h-8 sm:h-10 w-[1px] bg-white/10 hidden md:block"></div>
          <div className="text-right flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <span className="text-[10px] text-purple-300 block font-bold">NIVEL</span>
              <span className="text-xl sm:text-2xl font-black text-white">{level.toString().padStart(2, '0')}</span>
            </div>
            <button 
              onClick={() => setShowTrophies(true)} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 md:hidden flex items-center justify-center"
              title="Ver Trofeos"
            >
              <Trophy className="text-cyan-400" size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-2 sm:p-4 z-10 overflow-hidden relative">
        {/* Left Panel: Sidebar / Mission */}
        <section className="hidden md:flex w-64 lg:w-72 flex-col gap-4 min-h-0">
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-5 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <span className="text-lg">⏳</span> Línea Temporal
            </h3>
            <ul className="space-y-3 mb-6 shrink-0">
              <li className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-xs text-cyan-200 mb-1">Misión Actual</p>
                <p className="text-sm font-medium">Análisis Morfológico</p>
              </li>
            </ul>

            <div className="mt-auto overflow-y-auto">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-4 sticky top-0 bg-[#161234] p-1 rounded z-10">Colección Espectral</h3>
              <div className="grid grid-cols-2 gap-2">
                {badges.map(b => (
                  <div key={b.id} className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 ${
                    b.unlocked 
                      ? 'bg-cyan-500/20 border-cyan-500/50 shadow-inner' 
                      : 'bg-white/5 border-white/10 opacity-40 grayscale'
                  }`} title={b.desc}>
                    <div className={`mb-2 ${b.unlocked ? 'text-cyan-300' : 'text-gray-400'}`}>
                      {b.icon}
                    </div>
                    <span className="text-[10px] font-bold text-center leading-tight px-1 break-words">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-purple-600/20 backdrop-blur-lg rounded-3xl border border-purple-500/30 p-4 lg:p-5 shrink-0">
            <p className="text-[10px] uppercase font-bold text-purple-300 mb-2">Lo que dijo MariLuz...</p>
            <p key={currentTipIndex} className="text-xs italic leading-relaxed text-purple-100 animate-pulse">
              &quot;{MARILUZ_TIPS[currentTipIndex]}&quot;
            </p>
          </div>
        </section>

        {/* Right Panel: Interaction Area */}
        <section className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
          {/* Chat Box */}
          <div className="flex-1 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 flex flex-col p-3 sm:p-5 lg:p-6 overflow-hidden min-h-0 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <div className="flex-1 space-y-5 sm:space-y-6 overflow-y-auto pr-2 pb-2 scroll-smooth">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''} message-appear`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center border ${
                      isUser ? 'bg-purple-500/20 border-purple-400/30' : 'bg-cyan-500/20 border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    }`}>
                      {isUser ? <span className="text-[10px] sm:text-xs font-bold text-purple-200">TU</span> : <span className="text-lg sm:text-xl">👻</span>}
                    </div>
                    <div className={`px-4 py-3 max-w-[85%] sm:max-w-[80%] shadow-md ${
                      isUser 
                        ? 'bg-purple-600/40 rounded-2xl rounded-tr-none border border-purple-400/20' 
                        : 'bg-white/10 rounded-2xl rounded-tl-none border border-white/10'
                    }`}>
                      <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {formatText(m.content)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 sm:gap-4 message-appear">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 flex-shrink-0 flex items-center justify-center border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <span className="text-lg sm:text-xl">👻</span>
                  </div>
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 max-w-[80%] flex items-center space-x-1 shadow-md">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-3 sm:mt-4 pt-4 border-t border-white/10 flex gap-2 sm:gap-3 shrink-0">
              <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 flex items-center px-3 sm:px-4 focus-within:border-cyan-400 focus-within:bg-black/40 transition-colors shadow-inner">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu análisis espectral..." 
                  className="bg-transparent border-none outline-none w-full text-xs sm:text-sm placeholder-white/40 py-3 sm:py-4"
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Stickers Band */}
      <div className="h-14 sm:h-16 bg-black/40 backdrop-blur-md border-t border-white/10 shrink-0 flex items-center px-4 sm:px-8 overflow-x-auto no-scrollbar gap-4 sm:gap-6 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        <div className="text-[10px] sm:text-xs font-bold text-cyan-300 uppercase tracking-widest shrink-0 mr-2 flex flex-col items-center gap-1">
          <span>Tus</span>
          <span>Pegatinas</span>
        </div>
        <div className="flex gap-4 sm:gap-6 items-center flex-1">
          {stickers.map(s => {
            const unlocked = level >= s.level;
            return (
              <div 
                key={s.id} 
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0 transition-all duration-300 ${
                  unlocked 
                    ? `bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-110 ${s.rotate} cursor-pointer hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]` 
                    : 'bg-black/50 border border-white/10 opacity-40 grayscale pointer-events-none'
                }`}
                title={unlocked ? s.name : `Se desbloquea en el Nivel ${s.level}`}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-xl sm:text-2xl drop-shadow-md z-10">{s.emoji}</span>
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full z-20">
                      <span className="text-[10px] font-bold text-white/80">Lvl {s.level}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="h-6 sm:h-8 shrink-0 bg-black/60 flex items-center justify-between px-4 sm:px-8 text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 border-t border-white/5 z-10">
        <div className="flex gap-4 sm:gap-6">
          <span className="hidden sm:inline">Sincronizado con: <b className="text-white/60">Archivo El Haya</b></span>
          <span>Estado: <b className="text-green-400/80">Espectro Estable</b></span>
        </div>
        <div className="flex gap-4 text-cyan-400/60">
          <span className="hidden sm:inline">Session ID: GHOST-2024-X</span>
        </div>
      </footer>

      {/* Trophy Modal Overlay for Mobile */}
      {showTrophies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm message-appear md:hidden">
          <div className="bg-[#1e1b4b]/95 border-2 border-cyan-500/50 w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-cyan-500/20 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <Trophy className="text-cyan-400 mr-3" size={24} /> 
                Colección Espectral
              </h2>
              <button onClick={() => setShowTrophies(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {badges.map(b => (
                <div key={b.id} className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all ${
                  b.unlocked 
                    ? 'bg-cyan-500/20 border-cyan-500/50 shadow-inner badge-unlocked text-cyan-300' 
                    : 'bg-white/5 border-white/10 badge-locked grayscale text-gray-400'
                }`}>
                  <div className="mb-2 drop-shadow-md">
                    {React.cloneElement(b.icon as React.ReactElement<any>, { size: 28 })}
                  </div>
                  <span className="text-xs sm:text-sm font-bold leading-tight text-white mb-1">{b.name}</span>
                  <p className="text-[9px] sm:text-[10px] text-purple-200 opacity-80">{b.desc}</p>
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowTrophies(false)} className="w-full mt-6 py-3 bg-cyan-600/30 border border-cyan-500/50 rounded-xl font-bold hover:bg-cyan-500/40 text-cyan-100 transition-all shadow-lg active:scale-95">
              Volver al Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
