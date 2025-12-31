export type BlockType = 'note' | 'image' | 'video' | 'synthesis' | 'audio' | 'refinement' | 'chat' | 'link' | 'youtube' | 'pdf' | 'rag-db';
export type BlockStatus = 'todo' | 'in-progress' | 'done';

export interface Position {
  x: number;
  y: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface RagDocument {
  id: string;
  sourceId: string; // The ID of the block it came from
  title: string;
  content: string;
  timestamp: number;
  type: BlockType;
}

export interface BlockData {
  id: string;
  type: BlockType;
  content: string; // Used for text content, image URL, transcription, or extracted text
  title?: string;
  position: Position;
  width: number;
  height: number;
  selected?: boolean;
  isProcessing?: boolean;
  status: BlockStatus;
  createdAt: number;
  tags: string[]; // New: Database categorization
  
  // Specific fields for new nodes
  audioUrl?: string; // For playing back recorded audio
  instruction?: string; // For Refinement Node
  chatHistory?: ChatMessage[]; // For Contextual Chat Node
  sourceUrl?: string; // For Link/YouTube blocks to store the original URL
  
  // RAG Specific fields
  ragDbName?: string; // Global identifier for the DB
  ragIndexedDocs?: RagDocument[]; // The actual snapshot of knowledge
  ragLastSynced?: number;
}

export interface Connection {
  id: string;
  from: string; // Block ID (Output / Right side)
  to: string;   // Block ID (Input / Left side)
}

export interface Workspace {
  id: string;
  name: string;
  blocks: BlockData[];
  connections: Connection[];
  lastModified: number;
}

export enum CanvasMode {
  IDLE = 'IDLE',
  DRAGGING_BLOCK = 'DRAGGING_BLOCK',
  PANNING = 'PANNING',
  CONNECTING = 'CONNECTING'
}

export type ViewMode = 'canvas' | 'kanban' | 'history' | 'list';

export type DocTheme = 'minimal' | 'bold' | 'elegant' | 'cyber' | 'handwritten' | 'corporate';

// Global Registry Interface for simulating a backend DB
export interface GlobalRagDatabase {
  name: string;
  docs: RagDocument[];
  updatedAt: number;
}