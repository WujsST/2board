import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BlockData, Connection, CanvasMode, Position, BlockType, ChatMessage, ViewMode, BlockStatus, Workspace, GlobalRagDatabase, RagDocument, UserProfile } from './types';
import { BlockComponent } from './components/BlockComponent';
import { DocumentBuilder } from './components/DocumentBuilder';
import { ListView } from './components/ListView';
import { KanbanView } from './components/KanbanView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { synthesizeBlocks, chatWithCanvas, generateImageAsset, transcribeAudio, refineText, chatWithContext, processUrlSource, processPdf, queryRagDatabase } from './services/geminiService';

// Initial dummy data
const INITIAL_BLOCKS: BlockData[] = [
  { id: '1', type: 'note', content: 'Idea: AI Workflow Builder', title: 'Concept', position: { x: 100, y: 150 }, width: 280, height: 160, status: 'done', createdAt: Date.now(), tags: ['idea', 'mvp'] },
  { id: '2', type: 'audio', content: '', title: 'Voice Note', position: { x: 450, y: 150 }, width: 280, height: 200, status: 'todo', createdAt: Date.now() + 10, tags: ['voice'] },
];

const DEFAULT_WORKSPACE_ID = 'default';

// App Modes
type AppScreen = 'login' | 'dashboard' | 'workspace';

function App() {
  // --- User State ---
  const [user, setUser] = useState<UserProfile | null>(() => {
      const saved = localStorage.getItem('2board_user');
      return saved ? JSON.parse(saved) : null;
  });

  const [appScreen, setAppScreen] = useState<AppScreen>(() => {
      if (!localStorage.getItem('2board_user')) return 'login';
      return 'dashboard';
  });

  // --- Global RAG Registry State ---
  const [globalRags, setGlobalRags] = useState<GlobalRagDatabase[]>(() => {
      const saved = localStorage.getItem('synapse_global_rag_dbs');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { console.error("RAG load error", e); }
      }
      return [];
  });

  useEffect(() => {
      localStorage.setItem('synapse_global_rag_dbs', JSON.stringify(globalRags));
  }, [globalRags]);


  // --- Workspace State ---
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('synapse_workspaces');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { console.error("Failed to parse workspaces", e); }
    }
    return [{ 
      id: DEFAULT_WORKSPACE_ID, 
      name: 'Main Board', 
      blocks: INITIAL_BLOCKS, 
      connections: [], 
      lastModified: Date.now() 
    }];
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
     return localStorage.getItem('synapse_active_ws') || DEFAULT_WORKSPACE_ID;
  });

  // Derived active state
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  // Helper to update current workspace blocks/connections
  const updateWorkspaceState = (
      newBlocks?: BlockData[] | ((prev: BlockData[]) => BlockData[]), 
      newConnections?: Connection[] | ((prev: Connection[]) => Connection[])
  ) => {
      setWorkspaces(prevWorkspaces => {
          return prevWorkspaces.map(ws => {
              if (ws.id === activeWorkspaceId) {
                  const updatedBlocks = newBlocks 
                    ? (typeof newBlocks === 'function' ? newBlocks(ws.blocks) : newBlocks)
                    : ws.blocks;
                  
                  const updatedConnections = newConnections 
                    ? (typeof newConnections === 'function' ? newConnections(ws.connections) : newConnections)
                    : ws.connections;
                  
                  return { ...ws, blocks: updatedBlocks, connections: updatedConnections, lastModified: Date.now() };
              }
              return ws;
          });
      });
  };

  // Local proxies for cleaner code in render (mimicking old state)
  const blocks = activeWorkspace.blocks;
  const connections = activeWorkspace.connections;
  
  const setBlocks = (val: any) => updateWorkspaceState(val, undefined);
  const setConnections = (val: any) => updateWorkspaceState(undefined, val);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('synapse_workspaces', JSON.stringify(workspaces));
    localStorage.setItem('synapse_active_ws', activeWorkspaceId);
  }, [workspaces, activeWorkspaceId]);

  // --- UI State ---
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [mode, setMode] = useState<CanvasMode>(CanvasMode.IDLE);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [view, setView] = useState<ViewMode>('canvas');
  
  // Document Builder State
  const [docBuilderConfig, setDocBuilderConfig] = useState<{isOpen: boolean, preSelectedIds?: Set<string>}>({ isOpen: false });
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  // Global Chat Panel
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Refs
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const blockStartPosRef = useRef<Position>({ x: 0, y: 0 });
  const activeBlockIdRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- App Level Actions ---

  const handleLogin = (newUser: UserProfile) => {
      setUser(newUser);
      localStorage.setItem('2board_user', JSON.stringify(newUser));
      setAppScreen('dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('2board_user');
      setAppScreen('login');
  };

  const handleSelectWorkspace = (id: string) => {
      setActiveWorkspaceId(id);
      setAppScreen('workspace');
  };

  const handleCreateWorkspace = (name?: string) => {
    const wsName = name || prompt("Enter name for new workspace:", "New Project");
    if (!wsName) return;
    const newWs: Workspace = {
      id: Date.now().toString(),
      name: wsName,
      blocks: [],
      connections: [],
      lastModified: Date.now()
    };
    setWorkspaces(prev => [...prev, newWs]);
    
    // Switch to the new workspace immediately
    setActiveWorkspaceId(newWs.id);
    if (name) {
        setAppScreen('workspace');
    }
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length === 1 && appScreen === 'workspace') {
      alert("Cannot delete the last active workspace.");
      return;
    }
    if (confirm("Are you sure you want to delete this workspace?")) {
      const newWorkspaces = workspaces.filter(w => w.id !== id);
      setWorkspaces(newWorkspaces);
      if (activeWorkspaceId === id) {
          if (newWorkspaces.length > 0) setActiveWorkspaceId(newWorkspaces[0].id);
          else {
              // Should create a default if empty?
              handleCreateWorkspace("Default Board");
          }
      }
    }
  };

  // --- Workspace Logic --- (Mostly unchanged logic, just wrapped in render)

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow') as BlockType;
      if (type) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = (e.clientX - rect.left - pan.x) / scale;
          const y = (e.clientY - rect.top - pan.y) / scale;
          addBlockAt(type, x, y);
      }
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const addBlockAt = (type: BlockType, x: number, y: number) => {
    const newBlock: BlockData = {
      id: Date.now().toString(),
      type,
      content: '',
      title: type === 'rag-db' ? 'New Knowledge Base' : type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: x - 140, y: y - 80 }, 
      width: 280,
      height: type === 'chat' || type === 'audio' || type === 'youtube' || type === 'rag-db' ? 240 : 160,
      status: 'todo',
      createdAt: Date.now(),
      tags: []
    };
    setBlocks((prev: BlockData[]) => [...prev, newBlock]);
  };

  const deleteBlock = (id: string) => {
    updateWorkspaceState(
        (prevBlocks) => prevBlocks.filter(b => b.id !== id),
        (prevConns) => prevConns.filter(c => c.from !== id && c.to !== id)
    );
    setSelectedBlockIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  // --- New Handlers (Gemini & Actions) ---

  const handleGenerateImage = async () => {
    const prompt = prompt("Describe the image you want to generate:");
    if (!prompt) return;

    // Calculate center position for new block
    const centerX = (-pan.x + (window.innerWidth / 2)) / scale;
    const centerY = (-pan.y + (window.innerHeight / 2)) / scale;

    const id = Date.now().toString();
    const newBlock: BlockData = {
        id,
        type: 'image',
        content: 'Loading image...',
        title: 'Generated Image',
        position: { x: centerX, y: centerY },
        width: 300,
        height: 300,
        status: 'todo',
        createdAt: Date.now(),
        tags: ['ai-generated'],
        isProcessing: true
    };

    setBlocks((prev: BlockData[]) => [...prev, newBlock]);

    const imageUrl = await generateImageAsset(prompt);
    
    setBlocks((prev: BlockData[]) => prev.map(b => 
        b.id === id ? { ...b, content: imageUrl || 'Failed to generate image', isProcessing: false } : b
    ));
  };

  const handleBlockExport = (id: string) => {
      setDocBuilderConfig({
          isOpen: true,
          preSelectedIds: new Set([id])
      });
  };

  const handleAudioRecordFinish = async (id: string, blob: Blob) => {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
          const base64data = reader.result as string;
          // Format: data:audio/webm;base64,.....
          const mimeType = base64data.split(';')[0].split(':')[1];
          const base64Content = base64data.split(',')[1];

          setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, isProcessing: true } : b));

          const text = await transcribeAudio(base64Content, mimeType);

          setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, content: text, isProcessing: false } : b));
      };
  };

  const handleRunRefinement = async (id: string) => {
      const block = blocks.find(b => b.id === id);
      if (!block || !block.instruction) {
          alert("Please enter an instruction first.");
          return;
      }

      // Find input blocks
      const inputIds = connections.filter(c => c.to === id).map(c => c.from);
      const inputBlocks = blocks.filter(b => inputIds.includes(b.id));
      const inputText = inputBlocks.map(b => b.content).join('\n\n');

      if (!inputText) {
          alert("Connect some blocks with content to refine.");
          return;
      }

      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, isProcessing: true } : b));

      const result = await refineText(inputText, block.instruction);

      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, content: result, isProcessing: false } : b));
  };

  const handleInstructionChange = (id: string, instruction: string) => {
      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, instruction } : b));
  };

  const handleChatNodeSubmit = async (id: string, message: string) => {
      const block = blocks.find(b => b.id === id);
      if (!block) return;

      const newHistory: ChatMessage[] = [...(block.chatHistory || []), { role: 'user', text: message }];
      
      // Optimistic update
      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { 
          ...b, 
          chatHistory: newHistory,
          isProcessing: true 
      } : b));

      // 7. RAG Database Query check
      if (block.type === 'rag-db') {
          const docs = block.ragIndexedDocs || [];
          const response = await queryRagDatabase(newHistory, docs, message);
          
          setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { 
              ...b, 
              chatHistory: [...newHistory, { role: 'model', text: response }],
              isProcessing: false 
          } : b));
          return;
      }

      // Normal Context Chat
      const inputIds = connections.filter(c => c.to === id).map(c => c.from);
      const inputBlocks = blocks.filter(b => inputIds.includes(b.id));
      const contextText = inputBlocks.map(b => `[${b.title}]: ${b.content}`).join('\n\n');

      const response = await chatWithContext(newHistory, contextText, message, block.instruction);

      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { 
          ...b, 
          chatHistory: [...newHistory, { role: 'model', text: response }],
          isProcessing: false 
      } : b));
  };

  const handleSaveChatAsNote = (sourceId: string, text: string) => {
      const sourceBlock = blocks.find(b => b.id === sourceId);
      if (!sourceBlock) return;

      const newBlock: BlockData = {
          id: Date.now().toString(),
          type: 'note',
          title: 'Saved Chat',
          content: text,
          position: { x: sourceBlock.position.x + 300, y: sourceBlock.position.y },
          width: 280,
          height: 160,
          status: 'todo',
          createdAt: Date.now(),
          tags: ['saved-chat']
      };

      setBlocks((prev: BlockData[]) => [...prev, newBlock]);
      // Connect them
      setConnections((prev: Connection[]) => [...prev, { id: `${sourceId}-${newBlock.id}`, from: sourceId, to: newBlock.id }]);
  };

  const handleProcessSourceUrl = async (id: string, url: string, type: 'link' | 'youtube') => {
      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, sourceUrl: url, isProcessing: true } : b));
      
      const content = await processUrlSource(url, type);
      
      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, content, isProcessing: false } : b));
  };

  const handleProcessPdf = async (id: string, file: File) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          
          setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, title: file.name, isProcessing: true } : b));
          
          const text = await processPdf(base64Content);
          
          setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, content: text, isProcessing: false } : b));
      };
  };

  const handleRagIndex = async (id: string) => {
      const block = blocks.find(b => b.id === id);
      if (!block) return;

      // Find connected blocks
      const inputIds = connections.filter(c => c.to === id).map(c => c.from);
      const inputBlocks = blocks.filter(b => inputIds.includes(b.id));

      if (inputBlocks.length === 0) {
          alert("Connect blocks to this Knowledge Base to ingest them.");
          return;
      }

      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, isProcessing: true } : b));

      // Simulate indexing (creating RagDocuments)
      const newDocs: RagDocument[] = inputBlocks.map(b => ({
          id: `${b.id}-${Date.now()}`,
          sourceId: b.id,
          title: b.title || 'Untitled',
          content: b.content,
          timestamp: Date.now(),
          type: b.type
      }));

      // Simulate delay for "embedding"
      setTimeout(() => {
           setBlocks((prev: BlockData[]) => prev.map(b => {
               if (b.id === id) {
                   const existingDocs = b.ragIndexedDocs || [];
                   return { 
                       ...b, 
                       ragIndexedDocs: [...existingDocs, ...newDocs],
                       isProcessing: false,
                       ragLastSynced: Date.now()
                   };
               }
               return b;
           }));

           // Update Global Registry if this block is linked to one
           if (block.ragDbName) {
               setGlobalRags(prev => {
                   const existingIndex = prev.findIndex(r => r.name === block.ragDbName);
                   if (existingIndex >= 0) {
                       const updated = [...prev];
                       updated[existingIndex] = {
                           ...updated[existingIndex],
                           docs: [...updated[existingIndex].docs, ...newDocs],
                           updatedAt: Date.now()
                       };
                       return updated;
                   }
                   return prev;
               });
           }
      }, 1000);
  };

  const handleRagCreateGlobal = (id: string, name: string) => {
       setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, ragDbName: name, ragIndexedDocs: [] } : b));
       
       // Add to global registry if not exists
       if (!globalRags.find(r => r.name === name)) {
           setGlobalRags(prev => [...prev, { name, docs: [], updatedAt: Date.now() }]);
       }
  };

  const handleRagLoadGlobal = (id: string, ragDb: GlobalRagDatabase) => {
      setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { 
          ...b, 
          ragDbName: ragDb.name, 
          ragIndexedDocs: ragDb.docs 
      } : b));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;

      const newMessage: ChatMessage = { role: 'user', text: chatInput };
      setChatHistory(prev => [...prev, newMessage]);
      setChatInput('');
      setIsChatLoading(true);

      const response = await chatWithCanvas(chatHistory, blocks, newMessage.text);
      
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      setIsChatLoading(false);
  };

  // --- Rendering Logic Switch ---

  if (appScreen === 'login') {
      return <LoginView onLogin={handleLogin} />;
  }

  if (appScreen === 'dashboard' && user) {
      return (
          <DashboardView 
              user={user}
              workspaces={workspaces}
              onCreateWorkspace={handleCreateWorkspace}
              onSelectWorkspace={handleSelectWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              onLogout={handleLogout}
          />
      );
  }

  // --- Main Workspace Render ---

  const renderConnections = () => {
    return connections.map(conn => {
      const from = blocks.find(b => b.id === conn.from);
      const to = blocks.find(b => b.id === conn.to);
      if (!from || !to) return null;
      const startX = from.position.x + from.width + 6;
      const startY = from.position.y + from.height / 2;
      const endX = to.position.x - 6;
      const endY = to.position.y + to.height / 2;
      const dist = Math.abs(endX - startX);
      const minMargin = 50; 
      const controlOffset = Math.max(dist * 0.4, minMargin);
      const cp1X = startX + controlOffset;
      const cp1Y = startY;
      const cp2X = endX - controlOffset;
      const cp2Y = endY;
      const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      return (
        <path key={conn.id} d={pathData} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className="opacity-60 hover:opacity-100 hover:stroke-indigo-500 transition-colors pointer-events-auto" />
      );
    });
  };
  
  const renderGhostConnection = () => {
      if (mode === CanvasMode.CONNECTING && connectionStartId) {
          const startBlock = blocks.find(b => b.id === connectionStartId);
          if (!startBlock) return null;
          const startX = startBlock.position.x + startBlock.width + 6;
          const startY = startBlock.position.y + startBlock.height / 2;
          const mouseX = (mousePos.x - pan.x) / scale;
          const mouseY = (mousePos.y - pan.y) / scale;
          const dist = Math.abs(mouseX - startX);
          const controlOffset = Math.max(dist * 0.4, 50);
          const cp1X = startX + controlOffset;
          const cp1Y = startY;
          const cp2X = mouseX - controlOffset;
          const cp2Y = mouseY;
          return <path d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${mouseX} ${mouseY}`} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" className="opacity-50 pointer-events-none" />;
      }
      return null;
  };

  const DraggableTool = ({ type, icon, color, label }: { type: BlockType, icon: string, color: string, label: string }) => (
      <div 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)}
        className={`p-2 hover:bg-${color}-50 rounded-xl transition flex flex-col items-center gap-1 text-xs font-semibold text-slate-600 cursor-grab active:cursor-grabbing w-16`}
      >
          <div className={`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center text-${color}-600 mb-1`}>
              <span className="material-icons text-sm">{icon}</span>
          </div>
          <span className="text-[10px]">{label}</span>
      </div>
  );

  // Mouse Handlers for Canvas (Need to be defined here to close over current active workspace scope)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (view !== 'canvas') return;
    if (mode === CanvasMode.IDLE && e.target === canvasRef.current) {
      setMode(CanvasMode.PANNING);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleBlockMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (view !== 'canvas') return;
    if (e.shiftKey) {
        setSelectedBlockIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    } else if (!selectedBlockIds.has(id)) {
        setSelectedBlockIds(new Set([id]));
    }
    setMode(CanvasMode.DRAGGING_BLOCK);
    activeBlockIdRef.current = id;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const block = blocks.find(b => b.id === id);
    if(block) blockStartPosRef.current = { ...block.position };
  };
  const handleConnectStart = (e: React.MouseEvent, id: string) => { setMode(CanvasMode.CONNECTING); setConnectionStartId(id); };
  const handleConnectEnd = (e: React.MouseEvent, targetId: string) => {
      if (mode === CanvasMode.CONNECTING && connectionStartId && connectionStartId !== targetId) {
          const exists = connections.some(c => c.from === connectionStartId && c.to === targetId);
          if (!exists) setConnections((prev: Connection[]) => [...prev, { id: `${connectionStartId}-${targetId}-${Date.now()}`, from: connectionStartId, to: targetId }]);
      }
      setMode(CanvasMode.IDLE); setConnectionStartId(null);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (mode === CanvasMode.PANNING) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    } else if (mode === CanvasMode.DRAGGING_BLOCK && activeBlockIdRef.current) {
        const dx = (e.clientX - dragStartRef.current.x) / scale;
        const dy = (e.clientY - dragStartRef.current.y) / scale;
        setBlocks((prev: BlockData[]) => prev.map(b => { if (b.id === activeBlockIdRef.current) return { ...b, position: { x: blockStartPosRef.current.x + dx, y: blockStartPosRef.current.y + dy } }; return b; }));
    }
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mode === CanvasMode.CONNECTING) { setMode(CanvasMode.IDLE); setConnectionStartId(null); }
    setMode(CanvasMode.IDLE); activeBlockIdRef.current = null;
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (view !== 'canvas') return;
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 3);
      setScale(newScale);
    } else { setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY })); }
  };

  // Handler for specific block actions passed down
  const updateBlockContent = (id: string, content: string) => setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, content } : b));
  const updateBlockTitle = (id: string, title: string) => setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, title } : b));
  const updateBlockStatus = (id: string, status: BlockStatus) => setBlocks((prev: BlockData[]) => prev.map(b => b.id === id ? { ...b, status } : b));
  const handleAddTag = (id: string, tag: string) => setBlocks((prev: BlockData[]) => prev.map(b => { if (b.id === id && !b.tags.includes(tag)) return { ...b, tags: [...b.tags, tag] }; return b; }));
  const handleRemoveTag = (id: string, tagToRemove: string) => setBlocks((prev: BlockData[]) => prev.map(b => { if (b.id === id) return { ...b, tags: b.tags.filter(t => t !== tagToRemove) }; return b; }));

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-slate-50 text-slate-800 font-sans">
      
      {/* --- Sidebar (Navigation) --- */}
      <div className="w-16 h-screen glass-panel border-r border-white/50 flex flex-col items-center py-6 z-50 shadow-sm bg-white/60">
          <div 
             className="mb-8 w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 cursor-pointer hover:bg-indigo-700 transition"
             onClick={() => setAppScreen('dashboard')}
             title="Back to Dashboard"
          >
              2
          </div>
          
          <nav className="flex flex-col gap-4 w-full px-2">
              <button onClick={() => setView('canvas')} className={`p-3 rounded-xl transition-all flex justify-center ${view === 'canvas' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`} title="Canvas"><span className="material-icons">dashboard</span></button>
              <button onClick={() => setView('list')} className={`p-3 rounded-xl transition-all flex justify-center ${view === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`} title="Database List"><span className="material-icons">table_chart</span></button>
              <button onClick={() => setView('kanban')} className={`p-3 rounded-xl transition-all flex justify-center ${view === 'kanban' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`} title="Kanban"><span className="material-icons">view_kanban</span></button>
              <button onClick={() => setView('history')} className={`p-3 rounded-xl transition-all flex justify-center ${view === 'history' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`} title="Log"><span className="material-icons">history</span></button>
              
              <div className="h-px bg-slate-200 w-8 mx-auto my-2"></div>
              
              <div className="relative group">
                  <button onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)} className="p-3 rounded-xl text-slate-400 hover:bg-white/50 hover:text-indigo-600 flex justify-center" title="Workspaces">
                      <span className="material-icons">layers</span>
                  </button>
                  {isWorkspaceMenuOpen && (
                      <div className="absolute left-14 top-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                          <h3 className="text-xs font-bold text-slate-400 uppercase px-2 mb-2">Switch Workspace</h3>
                          <div className="max-h-40 overflow-y-auto mb-2 space-y-1">
                              {workspaces.map(ws => (
                                  <div key={ws.id} className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer ${ws.id === activeWorkspaceId ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`} onClick={() => { setActiveWorkspaceId(ws.id); setIsWorkspaceMenuOpen(false); }}>
                                      <span className="truncate flex-1">{ws.name}</span>
                                  </div>
                              ))}
                          </div>
                          <button onClick={() => setAppScreen('dashboard')} className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-indigo-600 font-medium hover:bg-indigo-50 flex items-center gap-1">
                              <span className="material-icons text-[12px]">grid_view</span> All Boards
                          </button>
                      </div>
                  )}
              </div>
          </nav>

          <div className="mt-auto">
             <button onClick={() => setDocBuilderConfig({isOpen: true})} className="p-3 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex justify-center" title="Document Builder">
                 <span className="material-icons">picture_as_pdf</span>
             </button>
          </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* --- Toolbar --- */}
        {view === 'canvas' && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-2">
                <div className="bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-500 border border-white/60 shadow-sm flex items-center gap-2">
                    {activeWorkspace.name}
                </div>
                <div className="flex gap-1 p-2 rounded-2xl glass-panel shadow-2xl bg-white/90 backdrop-blur-xl border border-white/60">
                    <DraggableTool type="note" icon="sticky_note_2" color="slate" label="Note" />
                    <DraggableTool type="audio" icon="mic" color="orange" label="Audio" />
                    <DraggableTool type="refinement" icon="build_circle" color="emerald" label="Refine" />
                    <DraggableTool type="chat" icon="chat" color="blue" label="Chat" />
                    <DraggableTool type="rag-db" icon="dns" color="slate" label="RAG DB" />
                    <div className="w-px bg-slate-200 mx-1 h-8 self-center"></div>
                    <DraggableTool type="link" icon="link" color="cyan" label="Link" />
                    <DraggableTool type="youtube" icon="play_circle" color="red" label="YouTube" />
                    <DraggableTool type="pdf" icon="description" color="rose" label="PDF" />
                    <div className="w-px bg-slate-200 mx-1 h-8 self-center"></div>
                    <button onClick={handleGenerateImage} className="p-2 rounded-xl hover:bg-pink-50 flex flex-col items-center gap-1 w-16 text-[10px] font-semibold text-slate-600">
                        <span className="material-icons text-pink-500 text-lg">image</span>
                        Gen Img
                    </button>
                </div>
            </div>
        )}

        {/* --- Main Content Area --- */}
        {view === 'canvas' && (
            <div 
                ref={canvasRef}
                className="w-full h-full relative cursor-crosshair dot-grid"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div 
                    className="absolute origin-top-left w-full h-full pointer-events-none"
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    }}
                >
                    <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none -z-10 overflow-visible">
                        {renderConnections()}
                        {renderGhostConnection()}
                    </svg>

                    <div className="pointer-events-auto">
                        {blocks.map(block => (
                            <BlockComponent
                                key={block.id}
                                data={block}
                                scale={1}
                                isSelected={selectedBlockIds.has(block.id)}
                                connectionStartId={connectionStartId}
                                onMouseDown={handleBlockMouseDown}
                                onConnectStart={handleConnectStart}
                                onConnectEnd={handleConnectEnd}
                                onContentChange={updateBlockContent}
                                onTitleChange={updateBlockTitle}
                                onDelete={deleteBlock}
                                onExport={handleBlockExport}
                                onAddTag={handleAddTag}
                                onRemoveTag={handleRemoveTag}
                                onAudioRecordFinish={handleAudioRecordFinish}
                                onRunRefinement={handleRunRefinement}
                                onInstructionChange={handleInstructionChange}
                                onChatSubmit={handleChatNodeSubmit}
                                onSaveChatAsNote={handleSaveChatAsNote}
                                onProcessSourceUrl={handleProcessSourceUrl}
                                onProcessPdf={handleProcessPdf}
                                availableGlobalRags={globalRags}
                                onRagIndex={handleRagIndex}
                                onRagCreateGlobal={handleRagCreateGlobal}
                                onRagLoadGlobal={handleRagLoadGlobal}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {view === 'list' && <ListView blocks={blocks} onDelete={deleteBlock} onUpdateStatus={updateBlockStatus} />}
        {view === 'kanban' && <KanbanView blocks={blocks} onDelete={deleteBlock} onUpdateStatus={updateBlockStatus} />}
        {view === 'history' && (
             <div className="w-full h-full bg-slate-50 p-10 overflow-y-auto">
                 <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                     <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <span className="material-icons text-slate-400">history</span> Activity Log
                     </h2>
                     <div className="space-y-4">
                         {blocks.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                             <div key={b.id} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                                 <div className="text-xs font-mono text-slate-400">{new Date(b.createdAt).toLocaleString()}</div>
                                 <div className="flex-1">
                                     <span className="font-bold text-slate-700">{b.title || 'Untitled'}</span>
                                     <span className="text-slate-500 text-sm"> created as </span>
                                     <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase">{b.type}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
        )}

      </div>

      {/* --- Modals & Panels --- */}
      {docBuilderConfig.isOpen && (
          <DocumentBuilder 
              blocks={blocks} 
              initialSelection={docBuilderConfig.preSelectedIds}
              onClose={() => setDocBuilderConfig({isOpen: false})} 
          />
      )}

      {/* Global Chat Panel (Available in Workspace Mode) */}
      <div className={`fixed top-4 right-4 bottom-4 w-80 glass-panel rounded-2xl shadow-2xl z-50 flex flex-col transition-transform duration-300 transform ${isChatOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
         <div className="p-4 border-b border-white/50 flex justify-between items-center bg-white/40 rounded-t-2xl">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                <span className="material-icons text-indigo-500">auto_awesome</span> 2Board Chat
            </h2>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="material-icons">close</span></button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {chatHistory.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white/80 text-slate-700 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
                 </div>
             ))}
             {isChatLoading && <div className="flex justify-start"><div className="bg-white/50 p-3 rounded-2xl rounded-bl-none text-xs text-slate-500 animate-pulse">Thinking...</div></div>}
         </div>
         <div className="p-3 border-t border-white/50 bg-white/30 rounded-b-2xl">
            <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input className="flex-1 bg-white/70 border-none rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Ask 2Board..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl p-2 transition flex items-center justify-center"><span className="material-icons text-sm">send</span></button>
            </form>
         </div>
      </div>

      {!isChatOpen && (
          <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40">
              <span className="material-icons">chat_bubble_outline</span>
          </button>
      )}

      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
}

export default App;