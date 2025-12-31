import React from 'react';
import { BlockData, BlockStatus } from '../types';

interface ListViewProps {
    blocks: BlockData[];
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: BlockStatus) => void;
}

export const ListView: React.FC<ListViewProps> = ({ blocks, onDelete, onUpdateStatus }) => {
    
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

    return (
        <div className="w-full h-full bg-slate-50 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="material-icons text-indigo-500 text-3xl">table_chart</span> 
                        Database List
                        <span className="text-sm font-normal text-slate-400 ml-2 bg-white px-2 py-1 rounded-full border border-slate-200">{blocks.length} items</span>
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4 w-16 text-center">Type</th>
                                <th className="p-4 w-1/4">Title</th>
                                <th className="p-4">Content Preview</th>
                                <th className="p-4 w-1/6">Tags</th>
                                <th className="p-4 w-1/6">Status</th>
                                <th className="p-4 w-20 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {blocks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                        No blocks created yet. Switch to Canvas to add content.
                                    </td>
                                </tr>
                            ) : (
                                blocks.map(block => (
                                    <tr key={block.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 text-center">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                                                block.type === 'rag-db' ? 'bg-slate-800 text-green-400' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <span className="material-icons text-sm">{getIcon(block.type)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-700 text-sm">{block.title || 'Untitled'}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{block.type}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-600 truncate max-w-xs opacity-80">
                                                {block.content || <span className="italic text-slate-300">No content</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {block.tags.length > 0 ? block.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                                        #{tag}
                                                    </span>
                                                )) : <span className="text-slate-300 text-xs">-</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select 
                                                value={block.status}
                                                onChange={(e) => onUpdateStatus(block.id, e.target.value as BlockStatus)}
                                                className={`text-xs font-bold uppercase py-1 px-2 rounded border outline-none cursor-pointer ${
                                                    block.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    block.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(block.id);
                                                }}
                                                className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition flex items-center justify-center cursor-pointer"
                                                title="Delete"
                                            >
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};