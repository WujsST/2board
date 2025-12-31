import React from 'react';
import { BlockData, BlockStatus } from '../types';

interface KanbanViewProps {
    blocks: BlockData[];
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: BlockStatus) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ blocks, onDelete, onUpdateStatus }) => {
    
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

    return (
        <div className="w-full h-full bg-slate-50 p-8 overflow-x-auto">
            <div className="flex gap-6 h-full min-w-[1000px]">
                {columns.map(col => {
                    const colBlocks = blocks.filter(b => b.status === col.id);
                    
                    return (
                        <div key={col.id} className="flex-1 flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200/60 p-4">
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
                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                {colBlocks.map(block => (
                                    <div key={block.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group hover:shadow-md transition-shadow relative">
                                        
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
                                                onClick={() => onDelete(block.id)}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-icons text-[16px]">close</span>
                                            </button>
                                        </div>

                                        {/* Content Preview */}
                                        <div className="text-xs text-slate-500 line-clamp-3 mb-3 min-h-[1.5em] bg-slate-50/50 p-2 rounded border border-slate-50">
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
                                            
                                            <div className="flex bg-slate-100 rounded p-0.5">
                                                 {columns.map(c => (
                                                     <button
                                                        key={c.id}
                                                        onClick={() => onUpdateStatus(block.id, c.id)}
                                                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${block.status === c.id ? `bg-${c.color}-500 text-white shadow-sm` : 'text-slate-400 hover:bg-white'}`}
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
                                    <div className="text-center py-10 text-slate-300 text-xs italic border-2 border-dashed border-slate-100 rounded-xl">
                                        Empty
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