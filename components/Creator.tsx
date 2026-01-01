
import React, { useState } from 'react';

const Creator: React.FC = () => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedName = encodeURIComponent(name.trim().replace(/\s+/g, '_'));
    const formattedNote = encodeURIComponent(note.trim().replace(/\s+/g, '_') || 'wishing_you_a_grand_year');
    
    // Construct cleaner URL structure: example.com/#/name/note
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}#/${formattedName}/${formattedNote}`;
    setGeneratedUrl(url);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-10 bg-[#00040a] relative overflow-y-auto overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)', backgroundSize: '60px 60px' }}></div>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-2xl w-full luxury-glass p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] silver-border-fancy diamond-shadow space-y-8 md:space-y-12 relative overflow-hidden transition-all duration-700 hover:shadow-[0_0_100px_rgba(255,255,255,0.06)] my-8">
        <div className="text-center space-y-4 md:space-y-6">
          <div className="inline-block px-4 py-1 rounded-full border border-white/10 bg-white/5 mb-2">
             <h2 className="text-[9px] md:text-[11px] font-royal tracking-[0.5em] md:tracking-[0.8em] text-slate-400 uppercase">The 2026 Collection</h2>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif silver-gradient font-bold tracking-tighter glow-text cursor-default leading-tight">Craft Your Greeting</h1>
          <p className="text-slate-500 text-xs md:text-base font-light tracking-widest italic max-w-sm mx-auto">"Personalize a celebration for those who deserve the extraordinary."</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-10 md:space-y-14">
          <div className="group space-y-4">
            <label className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-slate-400 font-bold ml-1 transition-colors group-focus-within:text-white">Recipient's Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Honorable always"
              className="w-full bg-transparent border-b border-white/10 focus:border-white/60 py-4 md:py-6 text-xl md:text-3xl outline-none transition-all placeholder:text-slate-800 font-serif text-white tracking-wide"
            />
          </div>

          <div className="group space-y-4">
            <label className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-slate-400 font-bold ml-1 transition-colors group-focus-within:text-white">A Grand Message</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="May your year be filled with golden opportunities..."
              rows={3}
              className="w-full bg-transparent border-b border-white/10 focus:border-white/60 py-4 md:py-6 text-lg md:text-2xl outline-none transition-all placeholder:text-slate-800 resize-none font-light text-slate-300 leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="platinum-button w-full h-16 md:h-24 rounded-2xl md:rounded-3xl font-royal font-bold text-xs md:text-base tracking-[0.3em] md:tracking-[0.5em] shadow-2xl active:scale-95 uppercase transition-all"
          >
            Generate Wishing Link
          </button>
        </form>

        {generatedUrl && (
          <div className="pt-10 md:pt-14 mt-10 md:mt-14 border-t border-white/10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="text-center">
               <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Your Signature Link is Ready</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-xs md:text-sm text-slate-400 font-mono break-all line-clamp-2 leading-loose silver-border-fancy">
                {generatedUrl}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={copyToClipboard}
                  className="py-5 rounded-2xl border border-white/20 text-white hover:bg-white hover:text-black transition-all text-[11px] font-royal tracking-[0.3em] uppercase font-bold"
                >
                  {isCopied ? 'COPIED TO CLIPBOARD' : 'COPY PRIVATE LINK'}
                </button>
                <button
                  onClick={() => window.open(generatedUrl, '_blank')}
                  className="py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all text-[11px] font-royal tracking-[0.3em] uppercase font-bold"
                >
                  PREVIEW GREETING
                </button>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 text-center tracking-[0.2em] uppercase">Private & Encrypted Sharing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Creator;
