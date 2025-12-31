import React, { useState, useEffect, useRef } from 'react';
import { BlockData, BlockType, ChatMessage, GlobalRagDatabase } from '../types';
import { enhancePrompt } from '../services/geminiService';

interface BlockProps {
  data: BlockData;
  scale: number;
  isSelected: boolean;
  connectionStartId: string | null;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onConnectStart: (e: React.MouseEvent, id: string) => void;
  onConnectEnd: (e: React.MouseEvent, id: string) => void; 
  onContentChange: (id: string, newContent: string) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  
  // Tag Actions
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;

  // Specific Actions
  onAudioRecordFinish?: (id: string, blob: Blob) => void;
  onRunRefinement?: (id: string) => void;
  onInstructionChange?: (id: string, instruction: string) => void;
  onChatSubmit?: (id: string, message: string) => void;
  onSaveChatAsNote?: (id: string, text: string) => void;
  
  // New Source Actions
  onProcessSourceUrl?: (id: string, url: string, type: 'link' | 'youtube') => void;
  onProcessPdf?: (id: string, file: File) => void;

  // RAG Actions
  availableGlobalRags?: GlobalRagDatabase[];
  onRagIndex?: (id: string) => void;
  onRagCreateGlobal?: (id: string, name: string) => void;
  onRagLoadGlobal?: (id: string, ragDb: GlobalRagDatabase) => void;
}

const PROMPT_TEMPLATES = [
    { label: "Expert Consultant", text: "You are a senior strategic consultant with 20 years of experience. Analyze the input context critically, identifying risks, opportunities, and hidden patterns. Be concise, professional, and results-oriented." },
    { label: "Creative Visionary", text: "You are a creative visionary. Use the input context as inspiration to generate wild, out-of-the-box ideas. Use metaphorical language, vivid imagery, and encourage lateral thinking." },
    { label: "Socratic Teacher", text: "You are a Socratic teacher. Do not give the answer directly. Instead, ask guiding questions based on the input context to help the user discover the solution themselves." },
    { label: "ELI5", text: "Explain the input context as if I were a 5-year-old. Use simple analogies, basic vocabulary, and short sentences to clarify complex topics." },
    { label: "Code Architect", text: "You are a Principal Software Architect. Analyze the context for technical feasibility, scalability, and best practices. Provide code snippets where relevant and focus on system design." }
];

export const BlockComponent: React.FC<BlockProps> = ({
  data,
  scale,
  isSelected,
  connectionStartId,
  onMouseDown,
  onConnectStart,
  onConnectEnd,
  onContentChange,
  onTitleChange,
  onDelete,
  onExport,
  onAddTag,
  onRemoveTag,
  onAudioRecordFinish,
  onRunRefinement,
  onInstructionChange,
  onChatSubmit,
  onSaveChatAsNote,
  onProcessSourceUrl,
  onProcessPdf,
  availableGlobalRags,
  onRagIndex,
  onRagCreateGlobal,
  onRagLoadGlobal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  
  // Chat Config State
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  
  // Source States
  const [sourceInput, setSourceInput] = useState(data.sourceUrl || '');
  
  // RAG States
  const [newDbName, setNewDbName] = useState('');
  const [ragMode, setRagMode] = useState<'chat' | 'docs'>('chat');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState("");

  // Auto-resize text area
  useEffect(() => {
    if (textAreaRef.current && isEditing) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [data.content, isEditing]);

  // --- Styles ---

  const getBorderColor = () => {
    if (isSelected) return 'border-indigo-500 ring-2 ring-indigo-200/50';
    if (data.type === 'synthesis') return 'border-purple-300';
    if (data.type === 'audio') return 'border-orange-300';
    if (data.type === 'refinement') return 'border-emerald-300';
    if (data.type === 'chat') return 'border-blue-300';
    if (data.type === 'link') return 'border-cyan-300';
    if (data.type === 'youtube') return 'border-red-300';
    if (data.type === 'pdf') return 'border-rose-300';
    if (data.type === 'rag-db') return 'border-slate-600 bg-slate-50';
    return 'border-white/60';
  };

  const getHeaderStyle = () => {
    switch (data.type) {
      case 'image': return 'bg-pink-50 text-pink-700';
      case 'synthesis': return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white';
      case 'audio': return 'bg-orange-50 text-orange-700';
      case 'refinement': return 'bg-emerald-50 text-emerald-700';
      case 'chat': return 'bg-blue-50 text-blue-700';
      case 'link': return 'bg-cyan-50 text-cyan-700';
      case 'youtube': return 'bg-red-50 text-red-700';
      case 'pdf': return 'bg-rose-50 text-rose-700';
      case 'rag-db': return 'bg-slate-800 text-green-400';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getIcon = () => {
      switch(data.type) {
          case 'audio': return 'mic';
          case 'refinement': return 'build_circle';
          case 'chat': return 'chat';
          case 'image': return 'image';
          case 'synthesis': return 'auto_awesome';
          case 'link': return 'link';
          case 'youtube': return 'play_circle';
          case 'pdf': return 'description';
          case 'rag-db': return 'dns';
          default: return 'sticky_note_2';
      }
  }

  // --- Handlers ---

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          const chunks: BlobPart[] = [];

          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              if (onAudioRecordFinish) onAudioRecordFinish(data.id, blob);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
          setIsRecording(true);
      } catch (err) {
          console.error("Mic error", err);
          alert("Microphone access needed.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleLocalChatSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !onChatSubmit) return;
      onChatSubmit(data.id, chatInput);
      setChatInput("");
  };
  
  const handleEnhancePrompt = async () => {
      if (!data.instruction || !onInstructionChange) return;
      setIsEnhancingPrompt(true);
      const enhanced = await enhancePrompt(data.instruction);
      onInstructionChange(data.id, enhanced);
      setIsEnhancingPrompt(false);
  };
  
  const handleTagSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(tagInput.trim()) {
          onAddTag(data.id, tagInput.trim());
          setTagInput('');
          setShowTagInput(false);
      }
  };
  
  // Source Handlers
  const handleUrlSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(sourceInput && onProcessSourceUrl && (data.type === 'link' || data.type === 'youtube')) {
          onProcessSourceUrl(data.id, sourceInput, data.type);
      }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0] && onProcessPdf) {
          onProcessPdf(data.id, e.target.files[0]);
      }
  };
  
  const getYoutubeEmbedUrl = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };
  
  const handleRagCreate = () => {
      if (!newDbName.trim() || !onRagCreateGlobal) return;
      onRagCreateGlobal(data.id, newDbName.trim());
  };

  // --- Renderers ---

  const renderContent = () => {
    // 8. RAG Database Node (NEW)
    if (data.type === 'rag-db') {
        const docCount = data.ragIndexedDocs?.length || 0;
        const hasDbName = !!data.ragDbName;

        return (
            <div className="flex flex-col h-[280px] flex-1">
                {/* RAG Header Controls */}
                {!hasDbName ? (
                    <div className="flex flex-col gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-500 uppercase">Init RAG Database</div>
                        <div className="flex gap-1">
                             <input 
                                className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                                placeholder="Name your DB (e.g. 'Project Alpha')"
                                value={newDbName}
                                onChange={e => setNewDbName(e.target.value)}
                             />
                             <button onClick={handleRagCreate} className="bg-slate-700 text-white rounded px-2 py-1 text-xs font-bold hover:bg-slate-600">Create</button>
                        </div>
                        {availableGlobalRags && availableGlobalRags.length > 0 && (
                            <div className="border-t border-slate-200 pt-2 mt-1">
                                <div className="text-[10px] text-slate-400 mb-1">OR LOAD GLOBAL DB</div>
                                <select 
                                    className="w-full text-xs border border-slate-200 rounded p-1"
                                    onChange={(e) => {
                                        const db = availableGlobalRags.find(r => r.name === e.target.value);
                                        if (db && onRagLoadGlobal) onRagLoadGlobal(data.id, db);
                                    }}
                                >
                                    <option value="">Select a database...</option>
                                    {availableGlobalRags.map(db => <option key={db.name} value={db.name}>{db.name} ({db.docs.length} docs)</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2 bg-slate-100 p-1 rounded border border-slate-200">
                             <div className="text-[10px] font-mono text-slate-600 pl-1">
                                 DB: <span className="font-bold text-indigo-600">{data.ragDbName}</span>
                             </div>
                             <div className="flex gap-1">
                                 <button 
                                     onClick={() => setRagMode('docs')}
                                     className={`px-2 py-0.5 rounded text-[10px] font-bold ${ragMode === 'docs' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                                 >
                                     Docs ({docCount})
                                 </button>
                                 <button 
                                     onClick={() => setRagMode('chat')}
                                     className={`px-2 py-0.5 rounded text-[10px] font-bold ${ragMode === 'chat' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                                 >
                                     Chat
                                 </button>
                             </div>
                        </div>

                        {ragMode === 'docs' && (
                            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 rounded border border-slate-200 p-2 space-y-2">
                                    {docCount === 0 ? (
                                        <div className="text-center text-slate-400 text-[10px] italic mt-4">
                                            No documents indexed.<br/>Connect notes and click "Ingest".
                                        </div>
                                    ) : (
                                        data.ragIndexedDocs?.map((doc, i) => (
                                            <div key={i} className="text-[10px] bg-white border border-slate-200 p-1.5 rounded shadow-sm">
                                                <div className="font-bold truncate text-slate-700">{doc.title}</div>
                                                <div className="text-slate-400 text-[9px] flex justify-between">
                                                    <span>{doc.type}</span>
                                                    <span>{new Date(doc.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button 
                                    onClick={() => onRagIndex && onRagIndex(data.id)}
                                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold flex justify-center items-center gap-2 transition"
                                >
                                    {data.isProcessing ? <span className="material-icons animate-spin text-xs">refresh</span> : <span className="material-icons text-xs">system_update_alt</span>}
                                    Ingest Connected Blocks
                                </button>
                            </div>
                        )}

                        {ragMode === 'chat' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                 <div className="flex-1 overflow-y-auto p-2 bg-white/50 rounded border border-slate-200 mb-2 space-y-2 custom-scrollbar">
                                      {(!data.chatHistory || data.chatHistory.length === 0) && (
                                          <div className="text-center text-slate-400 text-[10px] mt-4">
                                              Ask questions about the {docCount} indexed documents.
                                          </div>
                                      )}
                                      {data.chatHistory?.map((msg, i) => (
                                          <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-100 ml-4 text-indigo-900' : 'bg-white mr-4 text-slate-800 border border-slate-200 shadow-sm'}`}>
                                                <div className="font-bold text-[8px] uppercase opacity-50 mb-1">{msg.role === 'model' ? 'RAG Agent' : 'You'}</div>
                                                {msg.text}
                                          </div>
                                      ))}
                                      {data.isProcessing && <div className="text-[10px] text-slate-400 animate-pulse ml-2">Searching Knowledge Base...</div>}
                                 </div>
                                 <form onSubmit={handleLocalChatSubmit} className="flex gap-1">
                                      <input 
                                         className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-green-500"
                                         placeholder="Query database..."
                                         value={chatInput}
                                         onChange={e => setChatInput(e.target.value)}
                                         disabled={docCount === 0}
                                      />
                                      <button type="submit" disabled={docCount === 0} className="bg-green-600 text-white rounded p-1 px-2 hover:bg-green-700 transition disabled:opacity-50">
                                          <span className="material-icons text-xs">search</span>
                                      </button>
                                 </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    // 1. Link / Web Source
    if (data.type === 'link') {
        return (
            <div className="flex flex-col gap-3 h-full">
                <form onSubmit={handleUrlSubmit} className="flex gap-1">
                    <input 
                        className="flex-1 bg-white/50 border border-cyan-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-cyan-400"
                        placeholder="Paste URL (e.g. blog post)..."
                        value={sourceInput}
                        onChange={e => setSourceInput(e.target.value)}
                    />
                    <button type="submit" disabled={data.isProcessing} className="bg-cyan-500 text-white rounded p-1 px-2 hover:bg-cyan-600 transition disabled:opacity-50">
                        {data.isProcessing ? <span className="material-icons text-xs animate-spin">refresh</span> : <span className="material-icons text-xs">download</span>}
                    </button>
                </form>
                <div className="flex-1 overflow-y-auto bg-white/40 border border-cyan-100 rounded p-2 text-xs text-slate-600 custom-scrollbar">
                    {data.content ? data.content : <span className="text-slate-400 italic text-center block mt-4">Extracted content will appear here...</span>}
                </div>
            </div>
        );
    }

    // 2. YouTube Source
    if (data.type === 'youtube') {
        const embedUrl = data.sourceUrl ? getYoutubeEmbedUrl(data.sourceUrl) : null;
        return (
            <div className="flex flex-col gap-3 h-full">
                {!data.sourceUrl ? (
                    <form onSubmit={handleUrlSubmit} className="flex gap-1">
                        <input 
                            className="flex-1 bg-white/50 border border-red-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-red-400"
                            placeholder="Paste YouTube Link..."
                            value={sourceInput}
                            onChange={e => setSourceInput(e.target.value)}
                        />
                        <button type="submit" disabled={data.isProcessing} className="bg-red-500 text-white rounded p-1 px-2 hover:bg-red-600 transition disabled:opacity-50">
                            {data.isProcessing ? <span className="material-icons text-xs animate-spin">refresh</span> : <span className="material-icons text-xs">smart_display</span>}
                        </button>
                    </form>
                ) : (
                   <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-sm relative group">
                       {embedUrl ? (
                           <iframe src={embedUrl} className="w-full h-full" allowFullScreen frameBorder="0"></iframe>
                       ) : <div className="text-white text-xs p-4">Invalid Video URL</div>}
                       <button onClick={() => { 
                           if(onProcessSourceUrl) onProcessSourceUrl(data.id, data.sourceUrl!, 'youtube'); // Re-summarize
                       }} className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow hover:bg-white text-red-500 opacity-0 group-hover:opacity-100 transition" title="Re-summarize">
                           <span className="material-icons text-xs">refresh</span>
                       </button>
                   </div>
                )}
                <div className="flex-1 overflow-y-auto bg-white/40 border border-red-100 rounded p-2 text-xs text-slate-600 custom-scrollbar">
                     <div className="font-bold text-[10px] uppercase text-red-400 mb-1">Video Summary</div>
                    {data.content ? data.content : <span className="text-slate-400 italic">Summary will appear here after analysis...</span>}
                </div>
            </div>
        );
    }

    // 3. PDF Source
    if (data.type === 'pdf') {
        return (
            <div className="flex flex-col gap-3 h-full">
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-rose-200 rounded-lg bg-rose-50/30 hover:bg-rose-50/50 transition relative">
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={data.isProcessing}
                    />
                    <div className="text-center">
                        <span className="material-icons text-rose-300 text-2xl mb-1">upload_file</span>
                        <div className="text-[10px] text-rose-500 font-medium">
                            {data.isProcessing ? "Analyzing PDF..." : "Drop PDF or Click to Upload"}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-white/40 border border-rose-100 rounded p-2 text-xs text-slate-600 custom-scrollbar">
                    {data.content ? data.content : <span className="text-slate-400 italic text-center block mt-2">Extracted text will appear here. This text can be used in chat context.</span>}
                </div>
            </div>
        );
    }

    // 4. Image
    if (data.type === 'image' && data.content.startsWith('data:image')) {
      return (
        <div className="w-full h-40 overflow-hidden rounded-md bg-slate-100 flex items-center justify-center">
             <img src={data.content} alt={data.title} className="w-full h-full object-cover" />
        </div>
      );
    }

    // 5. Audio Node
    if (data.type === 'audio') {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 justify-center py-2 bg-orange-50/50 rounded-lg border border-orange-100">
                    {!isRecording ? (
                        <button onClick={startRecording} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-medium transition">
                            <span className="material-icons text-[14px]">mic</span> Record
                        </button>
                    ) : (
                        <button onClick={stopRecording} className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-medium transition animate-pulse">
                            <span className="material-icons text-[14px]">stop</span> Stop
                        </button>
                    )}
                </div>
                {data.isProcessing ? (
                    <div className="text-xs text-center text-slate-400 italic">Transcribing audio...</div>
                ) : (
                    <textarea 
                        className="w-full h-24 bg-white/50 border border-slate-200 rounded-md p-2 text-xs text-slate-700 resize-none outline-none focus:ring-1 focus:ring-orange-200"
                        placeholder="Transcription will appear here..."
                        value={data.content}
                        onChange={(e) => onContentChange(data.id, e.target.value)}
                    />
                )}
            </div>
        )
    }

    // 6. Refinement Node
    if (data.type === 'refinement') {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Instruction</label>
                    <textarea 
                        className="w-full h-16 bg-emerald-50/30 border border-emerald-100 rounded-md p-2 text-xs text-slate-700 resize-none outline-none focus:ring-1 focus:ring-emerald-200"
                        placeholder="e.g. Fix grammar, Summarize, Translate..."
                        value={data.instruction || ''}
                        onChange={(e) => onInstructionChange && onInstructionChange(data.id, e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => onRunRefinement && onRunRefinement(data.id)}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-medium transition flex justify-center items-center gap-1"
                >
                    {data.isProcessing ? <span className="material-icons animate-spin text-xs">refresh</span> : <span className="material-icons text-xs">play_arrow</span>}
                    Run Refinement
                </button>
                <div className="border-t border-slate-100 pt-2">
                     <label className="text-[10px] uppercase font-bold text-slate-400">Output</label>
                     <div className="text-xs text-slate-600 max-h-20 overflow-y-auto mt-1 p-1 bg-white/40 rounded">
                         {data.content || <span className="italic text-slate-300">No output yet</span>}
                     </div>
                </div>
            </div>
        )
    }

    // 7. Chat Node (ENHANCED)
    if (data.type === 'chat') {
        return (
            <div className="flex flex-col h-[280px] flex-1">
                 
                 {/* Settings Toggle */}
                 <div className="flex justify-end px-1 -mt-2 mb-1">
                     <button 
                        onClick={() => setShowChatSettings(!showChatSettings)}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full transition ${showChatSettings ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-blue-500'}`}
                     >
                         <span className="material-icons text-[12px]">settings</span>
                         {showChatSettings ? 'Hide Config' : 'Configure Persona'}
                     </button>
                 </div>

                 {/* Configuration Panel */}
                 {showChatSettings && (
                     <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 mb-2 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                         <div className="flex items-center justify-between">
                             <label className="text-[10px] uppercase font-bold text-blue-800">System Instruction</label>
                             
                             {/* Prompt Builder Dropdown */}
                             <div className="relative group">
                                 <button className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                     Templates <span className="material-icons text-[10px]">expand_more</span>
                                 </button>
                                 <div className="absolute right-0 top-full mt-1 w-48 bg-white shadow-xl rounded-lg border border-slate-100 py-1 z-50 hidden group-hover:block">
                                     {PROMPT_TEMPLATES.map((tmpl, i) => (
                                         <button 
                                            key={i} 
                                            onClick={() => onInstructionChange && onInstructionChange(data.id, tmpl.text)}
                                            className="w-full text-left px-3 py-2 text-[10px] hover:bg-blue-50 text-slate-700 border-b border-slate-50 last:border-0"
                                         >
                                             <div className="font-bold">{tmpl.label}</div>
                                             <div className="text-slate-400 truncate">{tmpl.text}</div>
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         <textarea 
                             className="w-full h-16 bg-white border border-blue-200 rounded p-2 text-[10px] text-slate-700 resize-none outline-none focus:ring-1 focus:ring-blue-300 placeholder-blue-200"
                             placeholder="Define how the AI should behave (e.g., 'You are a critical expert...')"
                             value={data.instruction || ''}
                             onChange={(e) => onInstructionChange && onInstructionChange(data.id, e.target.value)}
                         />
                         
                         <button 
                            onClick={handleEnhancePrompt}
                            disabled={!data.instruction || isEnhancingPrompt}
                            className="w-full py-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition"
                         >
                             {isEnhancingPrompt ? (
                                 <span className="material-icons animate-spin text-[12px]">refresh</span>
                             ) : (
                                 <span className="material-icons text-[12px]">auto_fix_high</span>
                             )}
                             Enhance Prompt with AI
                         </button>
                     </div>
                 )}

                 <div className="flex-1 overflow-y-auto p-2 bg-white/40 rounded-md border border-slate-100 mb-2 space-y-2 custom-scrollbar">
                      {(!data.chatHistory || data.chatHistory.length === 0) && (
                          <div className="text-center text-slate-400 text-[10px] mt-4">
                              Connect inputs & configure persona to start.
                          </div>
                      )}
                      {data.chatHistory?.map((msg, i) => (
                          <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-4 text-blue-900' : 'bg-white mr-4 text-slate-800 border border-slate-100 shadow-sm'}`}>
                                {msg.text}
                                {msg.role === 'model' && onSaveChatAsNote && (
                                    <button onClick={() => onSaveChatAsNote(data.id, msg.text)} className="block mt-2 text-[9px] text-blue-500 hover:underline flex items-center gap-1">
                                        <span className="material-icons text-[10px]">add_box</span> Save as Note
                                    </button>
                                )}
                          </div>
                      ))}
                      {data.isProcessing && <div className="text-[10px] text-slate-400 animate-pulse ml-2">Thinking...</div>}
                 </div>
                 <form onSubmit={handleLocalChatSubmit} className="flex gap-1">
                      <input 
                         className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-300"
                         placeholder="Ask connected context..."
                         value={chatInput}
                         onChange={e => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="bg-blue-500 text-white rounded-md p-1 px-2 hover:bg-blue-600 transition">
                          <span className="material-icons text-xs">send</span>
                      </button>
                 </form>
            </div>
        )
    }
    
    // Default Note
    if (isEditing) {
        return (
            <textarea
                ref={textAreaRef}
                className="w-full bg-transparent outline-none resize-none text-slate-700 text-sm leading-relaxed min-h-[60px]"
                value={data.content}
                onChange={(e) => onContentChange(data.id, e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
            />
        )
    }

    return (
      <div 
        className="w-full min-h-[60px] cursor-text text-slate-700 text-sm leading-relaxed whitespace-pre-wrap"
        onClick={() => setIsEditing(true)}
      >
        {data.content || <span className="text-slate-400 italic">Empty block. Click to edit...</span>}
      </div>
    );
  };

  // Improved Handle Component with Visual Feedback
  const Handle = ({ type, side }: { type: 'input' | 'output', side: 'left' | 'right' }) => {
    // Highlight logic
    const isTarget = connectionStartId && connectionStartId !== data.id && type === 'input';
    const isSource = connectionStartId === data.id && type === 'output';
    const isConnecting = !!connectionStartId;

    return (
        <div
            className={`absolute w-3 h-3 bg-white border-2 rounded-full transition-all duration-200 z-30 flex items-center justify-center
                ${side === 'left' ? '-left-1.5' : '-right-1.5'}
                ${isTarget ? 'border-indigo-500 bg-indigo-50 scale-150 ring-2 ring-indigo-200 shadow-md cursor-cell' : 'border-indigo-300'}
                ${isSource ? 'bg-indigo-600 border-indigo-600 scale-110' : ''}
                ${!isConnecting ? 'hover:scale-125 hover:border-indigo-600 cursor-crosshair' : ''}
                ${isConnecting && !isTarget && !isSource ? 'opacity-30' : 'opacity-100'}
            `}
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            onMouseDown={(e) => { 
                e.stopPropagation(); 
                if(type === 'output') onConnectStart(e, data.id); 
            }}
            onMouseUp={(e) => {
                e.stopPropagation();
                if(type === 'input') onConnectEnd(e, data.id);
            }}
            title={type === 'output' ? 'Drag to connect' : 'Drop connection here'}
        >
            {/* Inner dot for extra polish */}
            <div className={`w-1 h-1 rounded-full transition-colors ${isTarget ? 'bg-indigo-500' : 'bg-indigo-300'} ${isSource ? 'bg-white' : ''}`} />
        </div>
    );
  };

  return (
    <div
      className={`absolute flex flex-col rounded-xl glass-panel shadow-sm transition-shadow duration-200 group
        ${getBorderColor()} ${isSelected ? 'shadow-xl z-20' : 'hover:shadow-md z-10'}
        ${data.isProcessing ? 'animate-pulse' : ''}
      `}
      style={{
        left: data.position.x,
        top: data.position.y,
        width: data.width,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={(e) => onMouseDown(e, data.id)}
    >
      {/* FLOW HANDLES: Left (Input), Right (Output) - Anchored Strictly */}
      <Handle type="input" side="left" />
      <Handle type="output" side="right" />

      {/* Header */}
      <div className={`h-8 w-full rounded-t-xl px-3 flex items-center justify-between select-none cursor-grab active:cursor-grabbing ${getHeaderStyle()}`}>
        <div className="flex items-center gap-2 flex-1">
            <span className="material-icons text-sm opacity-80">{getIcon()}</span>
            <input 
                value={data.title || ''}
                onChange={(e) => onTitleChange(data.id, e.target.value)}
                placeholder="Untitled"
                className={`bg-transparent outline-none text-xs font-semibold w-full ${data.type === 'synthesis' ? 'text-white placeholder-white/70' : data.type === 'rag-db' ? 'text-green-400 placeholder-green-600/50' : 'text-slate-700 placeholder-slate-400'}`}
            />
        </div>
        <div className="flex items-center gap-1">
            {/* PDF Export Button */}
            <button 
                className="p-1 rounded-full hover:bg-white/20 hover:text-indigo-900 transition-colors"
                title="Export this block to PDF"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onExport(data.id); }}
            >
                <span className="material-icons text-[14px]">picture_as_pdf</span>
            </button>
            {/* Delete Button - Fixed for Robustness */}
            <button 
                className="p-1.5 -mr-1 rounded-full hover:bg-black/10 hover:text-red-600 transition-colors z-50 flex items-center justify-center cursor-pointer nodrag"
                title="Delete block"
                onPointerDown={(e) => {
                    e.stopPropagation();
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(data.id);
                }}
            >
                <span className="material-icons text-[14px] leading-none">close</span>
            </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        {renderContent()}
      </div>
      
      {/* Footer: Tags & Status */}
      <div className="px-3 pb-3 flex flex-wrap gap-1 items-center">
         {data.tags && data.tags.map(tag => (
             <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                 #{tag}
                 <button onClick={() => onRemoveTag(data.id, tag)} className="hover:text-red-500">×</button>
             </span>
         ))}
         {showTagInput ? (
             <form onSubmit={handleTagSubmit}>
                 <input 
                    className="w-16 text-[10px] bg-white border border-slate-300 rounded px-1 outline-none focus:ring-1 focus:ring-indigo-300"
                    placeholder="New tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    autoFocus
                    onBlur={() => !tagInput && setShowTagInput(false)}
                 />
             </form>
         ) : (
             <button onClick={() => setShowTagInput(true)} className="text-[10px] text-slate-400 hover:text-indigo-500 px-1">+ Tag</button>
         )}
      </div>

      {/* Node Type Label (Bottom) */}
      <div className="absolute -bottom-5 left-0 w-full text-center">
          <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold bg-white/80 px-2 py-0.5 rounded-full shadow-sm">{data.type}</span>
      </div>
    </div>
  );
};