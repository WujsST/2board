import React, { useState } from 'react';
import { Workspace, UserProfile } from '../types';

interface DashboardViewProps {
    user: UserProfile;
    workspaces: Workspace[];
    onCreateWorkspace: (name: string) => void;
    onSelectWorkspace: (id: string) => void;
    onDeleteWorkspace: (id: string) => void;
    onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
    user, 
    workspaces, 
    onCreateWorkspace, 
    onSelectWorkspace, 
    onDeleteWorkspace,
    onLogout
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        onCreateWorkspace(newName.trim());
        setNewName('');
        setIsCreating(false);
    };

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    return (
        <div className="w-screen h-screen bg-[#f8fafc] flex flex-col relative overflow-hidden font-sans text-slate-800">
            {/* Header */}
            <div className="w-full bg-white/60 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">2</div>
                    <span className="font-bold text-xl tracking-tight text-slate-700">2Board</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(user.name)}
                        </div>
                        <span className="text-sm font-medium text-slate-600 pr-2">{user.name}</span>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                        title="Logout"
                    >
                        <span className="material-icons">logout</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10 z-10 dot-grid">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 mb-2">My Workspaces</h1>
                            <p className="text-slate-500">Manage your boards, ideas, and strategies.</p>
                        </div>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-105"
                        >
                            <span className="material-icons text-sm">add</span> New Board
                        </button>
                    </div>

                    {/* Create Modal (Inline) */}
                    {isCreating && (
                         <div className="mb-8 p-6 bg-white rounded-2xl border border-indigo-100 shadow-xl max-w-lg animate-in fade-in slide-in-from-top-4">
                             <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                                 <h3 className="font-bold text-slate-700">Create New Workspace</h3>
                                 <input 
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="E.g. Marketing Strategy Q4..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                 />
                                 <div className="flex justify-end gap-2">
                                     <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
                                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm">Create Board</button>
                                 </div>
                             </form>
                         </div>
                    )}

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspaces.map(ws => (
                            <div 
                                key={ws.id}
                                onClick={() => onSelectWorkspace(ws.id)}
                                className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer relative flex flex-col min-h-[180px]"
                            >
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                            <span className="material-icons">dashboard</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteWorkspace(ws.id); }}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Delete Workspace"
                                        >
                                            <span className="material-icons text-lg">delete</span>
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{ws.name}</h3>
                                    <p className="text-xs text-slate-400">
                                        Last modified: {new Date(ws.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1"><span className="material-icons text-[14px]">widgets</span> {ws.blocks.length} blocks</span>
                                        <span className="flex items-center gap-1"><span className="material-icons text-[14px]">timeline</span> {ws.connections.length} links</span>
                                    </div>
                                    <span className="material-icons text-slate-300 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {workspaces.length === 0 && !isCreating && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                                    <span className="material-icons text-3xl">inbox</span>
                                </div>
                                <h3 className="text-slate-600 font-bold text-lg">No workspaces found</h3>
                                <p className="text-slate-400 text-sm mt-1">Create your first board to get started.</p>
                                <button 
                                    onClick={() => setIsCreating(true)}
                                    className="mt-6 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 font-medium text-sm"
                                >
                                    Create Board
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        </div>
    );
};