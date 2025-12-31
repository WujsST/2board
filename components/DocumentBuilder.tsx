import React, { useState, useRef } from 'react';
import { BlockData, DocTheme } from '../types';

declare const html2pdf: any;

interface DocumentBuilderProps {
  blocks: BlockData[];
  initialSelection?: Set<string>;
  onClose: () => void;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({ blocks, initialSelection, onClose }) => {
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
      initialSelection || new Set(blocks.map(b => b.id))
  );
  
  const [theme, setTheme] = useState<DocTheme>('minimal');
  const [docTitle, setDocTitle] = useState('My Creative Synthesis');
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const toggleBlock = (id: string) => {
    const newSet = new Set(selectedBlockIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedBlockIds(newSet);
  };

  const sortedBlocks = blocks
    .filter(b => selectedBlockIds.has(b.id))
    .sort((a, b) => {
       if (Math.abs(a.position.y - b.position.y) > 50) return a.position.y - b.position.y;
       return a.position.x - b.position.x;
    });

  const handleExport = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    
    const element = previewRef.current;
    const opt = {
      margin: 0, // Zero margin to allow full bleed backgrounds
      filename: `${docTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (e) {
        console.error("PDF Export failed", e);
        alert("Could not generate PDF. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  // Theme Configs with Rich Backgrounds
  const getThemeStyles = () => {
      switch(theme) {
          case 'bold':
              return {
                  containerStyle: {
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      color: '#0f172a'
                  },
                  containerClass: 'theme-bold relative overflow-hidden',
                  bgElement: (
                      <>
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-yellow-400 rounded-bl-[100%] opacity-20 z-0"></div>
                        <div className="absolute bottom-0 left-0 w-[200px] h-[400px] bg-blue-500 rounded-tr-[100%] opacity-10 z-0"></div>
                      </>
                  ),
                  header: 'bg-slate-900 p-12 -mx-[15mm] -mt-[15mm] mb-12 text-white relative z-10 shadow-lg',
                  title: 'text-6xl font-bold tracking-tighter uppercase leading-none',
                  blockTitle: 'text-2xl font-bold text-slate-900 mt-10 mb-4 border-l-8 border-yellow-400 pl-4 uppercase tracking-wide bg-white/50 py-2 backdrop-blur-sm',
                  text: 'text-lg leading-relaxed font-medium text-slate-900 relative z-10',
                  date: 'text-yellow-400 mt-4 font-mono text-sm tracking-widest border-t border-slate-700 pt-4 inline-block',
                  image: 'border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
              };
          case 'elegant':
              return {
                  containerStyle: {
                      backgroundColor: '#fdfbf7',
                      backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                      color: '#292524'
                  },
                  containerClass: 'theme-elegant',
                  bgElement: (
                       <div className="absolute inset-0 border-[15mm] border-[#f3efe7] pointer-events-none z-20"></div>
                  ),
                  header: 'border-b-2 border-stone-300 pb-10 mb-12 text-center pt-8 relative z-10',
                  title: 'text-6xl font-medium italic text-stone-800 mb-4',
                  blockTitle: 'text-xl font-semibold text-stone-700 border-b border-stone-200 pb-2 mb-6 mt-12 inline-block',
                  text: 'text-lg leading-[2] text-stone-700 font-light relative z-10',
                  date: 'text-center text-xs tracking-[0.3em] text-stone-500 uppercase mt-6 font-semibold',
                  image: 'rounded-sm shadow-2xl sepia-[0.1]'
              };
          case 'cyber':
              return {
                  containerStyle: {
                      backgroundColor: '#0f172a',
                      color: '#4ade80' // Green-400
                  },
                  containerClass: 'theme-cyber relative overflow-hidden',
                  bgElement: (
                    <>
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    </>
                  ),
                  header: 'border-b-2 border-green-500/50 pb-8 mb-10 pt-4 relative z-10',
                  title: 'text-5xl font-bold tracking-tighter uppercase text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]',
                  blockTitle: 'text-xl font-bold text-pink-500 mt-10 mb-4 uppercase tracking-[0.2em] before:content-[">_"] before:mr-2',
                  text: 'text-sm font-mono leading-relaxed text-green-300/90',
                  date: 'text-green-600 text-xs font-mono mt-2 uppercase tracking-widest',
                  image: 'border border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)] grayscale opacity-80'
              };
          case 'handwritten':
              return {
                  containerStyle: {
                      backgroundColor: '#fffdf0', // Yellowish paper
                      color: '#1e293b'
                  },
                  containerClass: 'theme-handwritten',
                  bgElement: null,
                  header: 'mb-10 text-center pt-8 border-b border-slate-300 border-dashed pb-6',
                  title: 'text-6xl text-slate-800 rotate-[-1deg] decoration-wavy underline decoration-slate-300',
                  blockTitle: 'text-2xl text-indigo-600 mt-8 mb-2 font-bold rotate-[0.5deg]',
                  text: 'text-xl leading-normal text-slate-700',
                  date: 'text-slate-500 text-lg mt-4 italic',
                  image: 'rotate-1 shadow-md border-4 border-white transform hover:rotate-0 transition'
              };
          case 'corporate':
              return {
                  containerStyle: {
                      backgroundColor: 'white',
                      color: '#334155'
                  },
                  containerClass: 'theme-corporate',
                  bgElement: (
                     <div className="absolute top-0 left-0 w-full h-[30mm] bg-slate-800 z-0"></div>
                  ),
                  header: 'mb-12 pt-8 pb-4 relative z-10 text-white',
                  title: 'text-4xl font-bold tracking-tight',
                  blockTitle: 'text-lg font-bold text-slate-800 border-b-2 border-blue-600 pb-1 mb-3 mt-8 inline-block',
                  text: 'text-base leading-relaxed text-slate-600',
                  date: 'text-slate-400 text-xs mt-1 uppercase tracking-wide',
                  image: 'rounded border border-slate-200 shadow-sm'
              };
          case 'minimal':
          default:
              return {
                  containerStyle: {
                      background: 'white',
                      color: '#334155'
                  },
                  containerClass: 'theme-minimal relative',
                  bgElement: null,
                  header: 'mb-16 border-b border-slate-100 pb-8 pt-4',
                  title: 'text-4xl font-semibold text-slate-900 tracking-tight',
                  blockTitle: 'text-xs font-bold text-indigo-500 uppercase tracking-widest mt-10 mb-4 flex items-center gap-2 after:content-[""] after:h-px after:flex-1 after:bg-indigo-100',
                  text: 'text-sm leading-relaxed text-slate-600 text-justify',
                  date: 'text-slate-400 text-sm mt-2',
                  image: 'rounded-lg border border-slate-100 shadow-sm'
              };
      }
  };

  const s = getThemeStyles();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto z-30 shadow-xl">
            <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-icons text-indigo-600">picture_as_pdf</span> Document Builder
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Turn your blocks into a professional document.
                </p>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Document Title</label>
                <input 
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Choose Theme</label>
                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={() => setTheme('minimal')}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${theme === 'minimal' ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white shadow-md' : 'border-slate-200 hover:bg-white'}`}
                    >
                        <div className="font-bold text-sm text-slate-800 relative z-10">Minimal Tech</div>
                        <div className="text-[10px] text-slate-500 relative z-10">Clean, sans-serif, grid.</div>
                    </button>
                    <button 
                        onClick={() => setTheme('bold')}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${theme === 'bold' ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-100 shadow-md' : 'border-slate-200 hover:bg-white'}`}
                    >
                         <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-200 opacity-50"></div>
                        <div className="font-bold text-sm text-slate-800 font-display relative z-10">Bold Impact</div>
                        <div className="text-[10px] text-slate-500 relative z-10">High contrast, geometry.</div>
                    </button>
                    <button 
                        onClick={() => setTheme('elegant')}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${theme === 'elegant' ? 'border-orange-400 ring-1 ring-orange-400 bg-[#fdfbf7] shadow-md' : 'border-slate-200 hover:bg-white'}`}
                    >
                        <div className="font-bold text-sm text-slate-800 font-serif relative z-10">Elegant Paper</div>
                        <div className="text-[10px] text-slate-500 relative z-10">Warm tones, serif fonts.</div>
                    </button>
                    
                    {/* New Themes */}
                    <button 
                        onClick={() => setTheme('cyber')}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${theme === 'cyber' ? 'border-green-500 ring-1 ring-green-500 bg-slate-900 shadow-md' : 'border-slate-200 hover:bg-white'}`}
                    >
                        <div className={`font-bold text-sm relative z-10 ${theme === 'cyber' ? 'text-green-400' : 'text-slate-800'}`}>Cyberpunk</div>
                        <div className={`text-[10px] relative z-10 ${theme === 'cyber' ? 'text-green-600' : 'text-slate-500'}`}>Dark mode, mono font.</div>
                    </button>
                    <button 
                        onClick={() => setTheme('handwritten')}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${theme === 'handwritten' ? 'border-yellow-400 ring-1 ring-yellow-400 bg-[#fffdf0] shadow-md' : 'border-slate-200 hover:bg-white'}`}
                    >
                        <div className="font-bold text-sm text-slate-800 font-serif relative z-10" style={{fontFamily: 'Caveat'}}>Handwritten</div>
                        <div className="text-[10px] text-slate-500 relative z-10">Casual, sketch style.</div>
                    </button>
                    <button 
                        onClick={() => setTheme('corporate')}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${theme === 'corporate' ? 'border-blue-700 ring-1 ring-blue-700 bg-white shadow-md' : 'border-slate-200 hover:bg-white'}`}
                    >
                        <div className="font-bold text-sm text-slate-800 relative z-10">Corporate Pro</div>
                        <div className="text-[10px] text-slate-500 relative z-10">Blue headers, clean layout.</div>
                    </button>
                </div>
            </div>

            <div className="flex-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Include Content</label>
                 <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                     {blocks.map(b => (
                         <label key={b.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 cursor-pointer transition">
                             <input 
                                type="checkbox" 
                                checked={selectedBlockIds.has(b.id)} 
                                onChange={() => toggleBlock(b.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                             />
                             <div className="truncate text-xs text-slate-600 font-medium w-full">
                                 {b.title || 'Untitled'}
                             </div>
                         </label>
                     ))}
                 </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button onClick={onClose} className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition">Cancel</button>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                    {isExporting ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons text-sm">download</span>}
                    Export
                </button>
            </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 bg-slate-800/90 overflow-y-auto p-8 flex justify-center backdrop-blur-md">
            <div 
                id="doc-preview" 
                ref={previewRef}
                style={s.containerStyle}
                className={`w-[210mm] min-h-[297mm] shadow-2xl p-[15mm] transition-all duration-300 ${s.containerClass}`}
            >
                {s.bgElement}
                
                <div className={s.header}>
                    <h1 className={s.title}>{docTitle}</h1>
                    <div className={s.date}>Generated by 2Board • {new Date().toLocaleDateString()}</div>
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                    {sortedBlocks.map(block => (
                        <div key={block.id} className="break-inside-avoid">
                            {block.title && <h3 className={s.blockTitle}>{block.title}</h3>}
                            
                            {block.type === 'image' && block.content.startsWith('data:image') ? (
                                <img src={block.content} alt={block.title} className={`w-full max-h-[100mm] object-contain my-4 bg-white/50 ${s.image || ''}`} />
                            ) : (
                                <div className={`${s.text} whitespace-pre-wrap`}>
                                    {block.type === 'chat' && block.chatHistory ? (
                                        block.chatHistory.map((msg, i) => (
                                            <div key={i} className={`mb-3 p-3 rounded-lg border ${msg.role === 'user' ? 'bg-indigo-50/50 border-indigo-100 text-xs italic ml-8' : 'bg-white/60 border-slate-200 mr-8'}`}>
                                                <span className="font-bold uppercase text-[10px] opacity-50 block mb-1 tracking-wider">{msg.role}</span>
                                                {msg.text}
                                            </div>
                                        ))
                                    ) : (
                                        block.content || <span className="italic opacity-40">(Empty block)</span>
                                    )}
                                </div>
                            )}

                            {block.tags.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                    {block.tags.map(t => (
                                        <span key={t} className="text-[10px] border border-current opacity-40 px-1.5 rounded-full uppercase tracking-wider">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};