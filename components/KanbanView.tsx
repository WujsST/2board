import React, { useState } from 'react';
import { BlockData, BlockStatus } from '../types';

interface KanbanViewProps {
    blocks: BlockData[];
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: BlockStatus) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ blocks, onDelete, onUpdateStatus }) => {
    const [dragOverColumn, setDragOverColumn] = useState<BlockStatus | null>(null);

    const getIcon = (type: string) => {
        switch(type) {
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
    };

    const columns: { id: BlockStatus, label: string, color: string }[] = [
        { id: 'todo', label: 'To Do', color: 'slate' },
        { id: 'in-progress', label: 'In Progress', color: 'blue' },
        { id: 'done', label: 'Done', color: 'green' }
    ];

    // Drag Handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('blockId', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, status: BlockStatus) => {
        e.preventDefault(); // Necessary to allow dropping
        if (dragOverColumn !== status) {
            setDragOverColumn(status);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Simple check to prevent flickering when moving over children
    };

    const handleDrop = (e: React.DragEvent, status: BlockStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('blockId');
        if (id) {
            onUpdateStatus(id, status);
        }
        setDragOverColumn(null);
    };

    return (
        <div className="w-full h-full bg-slate-50 p-8 overflow-x-auto">
            <div className="flex gap-6 h-full min-w-[1000px]">
                {columns.map(col => {
                    const colBlocks = blocks.filter(b => b.status === col.id);
                    const isDragOver = dragOverColumn === col.id;
                    
                    return (
                        <div 
                            key={col.id} 
                            className={`flex-1 flex flex-col h-full rounded-2xl border transition-colors duration-200 p-4
                                ${isDragOver ? `bg-${col.color}-50 border-${col.color}-300 ring-2 ring-${col.color}-200` : `bg-slate-100/50 border-slate-200/60`}
                            `}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            {/* Header */}
                            <div className={`flex items-center justify-between mb-4 pb-3 border-b border-${col.color}-200`}>
                                <h3 className={`font-bold text-${col.color}-700 uppercase tracking-wider text-sm flex items-center gap-2`}>
                                    <div className={`w-2 h-2 rounded-full bg-${col.color}-500`}></div>
                                    {col.label}
                                </h3>
                                <span className={`text-xs font-semibold bg-${col.color}-100 text-${col.color}-600 px-2 py-0.5 rounded-full`}>
                                    {colBlocks.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                                {colBlocks.map(block => (
                                    <div 
                                        key={block.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, block.id)}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group hover:shadow-md transition-all relative cursor-grab active:cursor-grabbing"
                                    >
                                        
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-md ${block.type === 'rag-db' ? 'bg-slate-800 text-green-400' : 'bg-slate-50 text-slate-500'}`}>
                                                     <span className="material-icons text-[14px] leading-none">{getIcon(block.type)}</span>
                                                </div>
                                                <div className="font-semibold text-sm text-slate-700 truncate max-w-[120px]" title={block.title}>
                                                    {block.title || 'Untitled'}
                                                </div>
                                            </div>
                                            <button 
                                                onMouseDown={(e) => e.stopPropagation()} // Stop drag start
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(block.id);
                                                }}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            >
                                                <span className="material-icons text-[16px]">close</span>
                                            </button>
                                        </div>

                                        {/* Content Preview */}
                                        <div className="text-xs text-slate-500 line-clamp-3 mb-3 min-h-[1.5em] bg-slate-50/50 p-2 rounded border border-slate-50 select-none">
                                            {block.type === 'image' ? (
                                                <div className="flex items-center gap-1 italic"><span className="material-icons text-[12px]">image</span> Image Content</div>
                                            ) : (
                                                block.content || 'Empty...'
                                            )}
                                        </div>

                                        {/* Footer / Controls */}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex gap-1">
                                                {block.tags.slice(0, 2).map(t => (
                                                    <span key={t} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">#{t}</span>
                                                ))}
                                                {block.tags.length > 2 && <span className="text-[9px] text-slate-400">+{block.tags.length - 2}</span>}
                                            </div>
                                            
                                            {/* Manual movers backup */}
                                            <div className="flex bg-slate-100 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 {columns.map(c => (
                                                     <button
                                                        key={c.id}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateStatus(block.id, c.id);
                                                        }}
                                                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${block.status === c.id ? `bg-${c.color}-500 text-white shadow-sm` : 'text-slate-400 hover:bg-white'}`}
                                                        title={`Move to ${c.label}`}
                                                     >
                                                         <div className={`w-1.5 h-1.5 rounded-full ${block.status === c.id ? 'bg-white' : `bg-${c.color}-400`}`}></div>
                                                     </button>
                                                 ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {colBlocks.length === 0 && (
                                    <div className={`text-center py-10 text-xs italic border-2 border-dashed rounded-xl transition-colors ${isDragOver ? `border-${col.color}-300 text-${col.color}-500 bg-${col.color}-50` : 'border-slate-100 text-slate-300'}`}>
                                        {isDragOver ? 'Drop here' : 'Empty'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};