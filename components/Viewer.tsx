
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThreeFireworkEngine from './ThreeFireworkEngine';

const Viewer: React.FC = () => {
  const { name, note } = useParams<{ name: string; note: string }>();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Special Sequence State
  const [isSpecialSequence, setIsSpecialSequence] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  const displayName = name ? decodeURIComponent(name).replace(/_/g, ' ') : 'Distinguished Guest';
  const displayNote = note ? decodeURIComponent(note).replace(/_/g, ' ') : 'May the coming year bring you boundless elegance and timeless success.';

  const startSpecialSequence = () => {
    setUiVisible(false);
    setIsSpecialSequence(true);
  };

  const handleSpecialComplete = () => {
    setIsSpecialSequence(false);
    // Reveal effect
    setTimeout(() => setUiVisible(true), 1000);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#00040a] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
        <div className="text-center space-y-10 md:space-y-16 z-10 animate-in fade-in zoom-in duration-1000 w-full max-w-lg">
          <div className="space-y-4">
            <h2 className="text-slate-400 font-royal tracking-[0.8em] md:tracking-[1.4em] uppercase text-[10px] md:text-xs">Private Invitation</h2>
            <div className="w-24 md:w-40 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mt-4"></div>
          </div>

          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-16 bg-white/5 blur-[100px] rounded-full transition-opacity opacity-0 group-hover:opacity-100"></div>
            <button
              onClick={() => setStarted(true)}
              className="silver-border-fancy luxury-glass px-10 md:px-20 py-5 md:py-8 rounded-full text-white hover:text-black hover:bg-white transition-all font-serif italic text-xl md:text-3xl tracking-widest hover:scale-105 active:scale-95 w-full md:w-auto relative overflow-hidden group"
            >
              <span className="relative z-10">Step Into 2026</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.5em] md:tracking-[0.8em] animate-pulse">Experience With Audio</p>
            <p className="text-slate-700 text-[9px] uppercase tracking-widest">Designed for your celebration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-hidden flex flex-col items-center justify-center text-center p-4 md:p-6 sm:cursor-none">
      {/* Background Layer: Deep midnight space */}
      <div className="fixed inset-0 bg-[#020617] z-0"></div>

      {/* Middle Layer: Fireworks Engine - Positioned above background but below content */}
      <ThreeFireworkEngine
        soundEnabled={soundEnabled}
        triggerSpecial={isSpecialSequence}
        specialName={displayName}
        onSpecialComplete={handleSpecialComplete}
      />

      {/* Visual Depth Overlay: Subtle vignette */}
      <div className={`fixed inset-0 bg-[radial-gradient(circle_at_bottom,rgba(0,0,0,0.6)_0%,transparent_70%)] pointer-events-none z-[2] transition-opacity duration-1000 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Content Layer: Text and UI components */}
      <div className={`relative z-10 space-y-12 md:space-y-20 w-full max-w-6xl pointer-events-none transition-all duration-1000 ${uiVisible ? 'opacity-100 translate-y-0 blur-0 delay-300' : 'opacity-0 translate-y-10 blur-xl'}`}>
        <div className="space-y-6 md:space-y-10">
          <div className="flex items-center justify-center gap-4 md:gap-10 text-white/40">
            <div className="h-[1px] flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-white/40"></div>
            <h3 className="uppercase tracking-[0.6em] md:tracking-[1.2em] text-[9px] md:text-sm font-royal whitespace-nowrap">A Grand New Year Greeting</h3>
            <div className="h-[1px] flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-white/40"></div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white/60 font-serif italic text-xl md:text-3xl tracking-widest animate-in slide-in-from-bottom-4 duration-1000 delay-300">Happy New Year</h4>
            <h1 className="text-5xl sm:text-7xl md:text-[10rem] font-serif silver-gradient font-black drop-shadow-[0_15px_45px_rgba(0,0,0,1)] leading-none glow-text cursor-default break-words px-4 pointer-events-auto">
              {displayName}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto luxury-glass p-10 md:p-24 rounded-[3rem] md:rounded-[6rem] silver-border-fancy relative group diamond-shadow transition-all duration-1000 mx-4 md:mx-auto pointer-events-auto hover:bg-white/[0.05]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#020617] px-6 md:px-10 text-white/30 text-4xl md:text-7xl font-serif italic">“</div>
          <p className="text-xl md:text-4xl font-serif italic text-white/95 leading-relaxed font-light tracking-wide glow-text cursor-default drop-shadow-md">
            {displayNote}
          </p>
          <div className="mt-10 md:mt-20 text-white font-serif text-5xl md:text-8xl tracking-[0.3em] md:tracking-[0.4em] font-extrabold opacity-40">2026</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#020617] px-6 md:px-10 text-white/30 text-4xl md:text-7xl font-serif italic">”</div>
        </div>
      </div>

      {/* Control Layer: Bottom controls */}
      <div className={`fixed bottom-8 right-8 md:bottom-16 md:right-16 z-50 flex flex-row items-center gap-4 md:gap-8 safe-bottom-margin transition-all duration-700 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <button
          onClick={startSpecialSequence}
          className="h-14 md:h-20 px-8 rounded-full luxury-glass border border-yellow-500/40 text-yellow-100 hover:bg-yellow-500 hover:text-black font-royal uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] active:scale-95 pointer-events-auto flex items-center gap-3"
        >
          <span className="text-xl">✨</span> Grand Finale
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Mute" : "Unmute"}
          className="w-14 h-14 md:w-20 md:h-20 rounded-full luxury-glass border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group shadow-2xl active:scale-90 pointer-events-auto"
        >
          {soundEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
        <button
          onClick={() => navigate('/')}
          className="platinum-button px-8 md:px-12 h-14 md:h-20 rounded-full font-royal text-[10px] md:text-xs tracking-[0.3em] shadow-2xl font-bold uppercase active:scale-95 whitespace-nowrap pointer-events-auto"
        >
          Create New
        </button>
      </div>
    </div>
  );
};

export default Viewer;
