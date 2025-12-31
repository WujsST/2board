import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginViewProps {
    onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const user: UserProfile = {
            name: name.trim(),
            joinedAt: Date.now()
        };
        onLogin(user);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden selection:bg-blue-100">
            {/* Navbar */}
            <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-lg">2</div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">2Board</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
                    <span className="hover:text-slate-900 cursor-pointer transition">Canvas</span>
                    <span className="hover:text-slate-900 cursor-pointer transition">RAG Engine</span>
                    <span className="hover:text-slate-900 cursor-pointer transition">Synthesis</span>
                </div>
                <div>
                     <button className="px-5 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-400 transition bg-white">
                        About
                     </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center relative px-4 mt-8 lg:mt-0">
                
                {/* Text Content */}
                <div className="text-center max-w-3xl mx-auto z-20 mb-12">
                    <h1 className="text-5xl md:text-7xl text-slate-900 mb-6 leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        2Board for all your <br/>
                        <span className="italic text-blue-600">knowledge.</span>
                    </h1>
                    <p className="text-slate-500 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
                        Gain clarity on your projects. Discover intelligent methods for synthesizing ideas. Begin creating with AI assurance.
                    </p>

                    {/* Login Form Input */}
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full sm:w-auto flex-1 px-6 py-3.5 rounded-full border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner text-sm font-medium"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            Enter Workspace
                        </button>
                    </form>
                </div>

                {/* Floating UI Elements (The "Apex" Look) */}
                <div className="relative w-full max-w-6xl h-[400px] md:h-[500px] mt-8 select-none pointer-events-none">
                    
                    {/* Center: Main Dashboard Card */}
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[300px] md:w-[380px] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-6 z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <span className="material-icons text-sm text-slate-500">face</span>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-800">Welcome back</div>
                                    <div className="text-[10px] text-slate-400">Workspace Active</div>
                                </div>
                            </div>
                            <span className="material-icons text-slate-300">notifications</span>
                        </div>

                        {/* Blue Card inside */}
                        <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200 mb-4 relative overflow-hidden">
                             <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500 rounded-full opacity-50 blur-xl"></div>
                             <div className="relative z-10">
                                 <div className="text-xs opacity-80 mb-1">Knowledge Assets</div>
                                 <div className="text-2xl font-bold mb-4">1,234 Nodes</div>
                                 <div className="flex gap-2">
                                     <div className="flex-1 bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                                         <div className="material-icons text-sm mb-1">chat</div>
                                         <div className="text-[10px] font-bold">Chat</div>
                                     </div>
                                     <div className="flex-1 bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                                         <div className="material-icons text-sm mb-1">dns</div>
                                         <div className="text-[10px] font-bold">RAG</div>
                                     </div>
                                     <div className="flex-1 bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                                         <div className="material-icons text-sm mb-1">auto_awesome</div>
                                         <div className="text-[10px] font-bold">AI</div>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Tokens Used</div>
                                <div className="text-lg font-bold text-slate-800 flex items-center gap-1">
                                    <span className="material-icons text-green-500 text-sm">arrow_upward</span> 250k
                                </div>
                            </div>
                             <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 text-right">Documents</div>
                                <div className="text-lg font-bold text-slate-800 text-right flex items-center justify-end gap-1">
                                    125 <span className="material-icons text-red-400 text-sm">description</span> 
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left: Private Payments / Security Pill */}
                    <div className="absolute left-[5%] md:left-[15%] top-[20%] md:top-[30%] bg-white rounded-2xl p-3 pr-6 shadow-xl border border-slate-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-10 duration-1000 delay-150 max-w-[200px]">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                            <span className="material-icons text-white text-sm">lock</span>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-800">Private Context</div>
                            <div className="text-[9px] text-slate-400 leading-tight">Local-first data privacy</div>
                        </div>
                    </div>

                    {/* Bottom Left: Green "Join" Card */}
                    <div className="absolute left-[10%] md:left-[20%] bottom-[10%] bg-emerald-500 rounded-2xl p-4 text-white shadow-xl shadow-emerald-100 w-40 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 hidden md:block">
                        <div className="flex -space-x-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-white/30 border border-white"></div>
                            <div className="w-6 h-6 rounded-full bg-white/50 border border-white"></div>
                            <div className="w-6 h-6 rounded-full bg-white/80 border border-white flex items-center justify-center text-[8px] text-emerald-600 font-bold">AI</div>
                        </div>
                        <div className="text-xs font-bold">Multi-modal AI</div>
                        <div className="text-[9px] opacity-80">Images, Audio, PDF</div>
                    </div>

                    {/* Right: Yellow Stats Card */}
                    <div className="absolute right-[5%] md:right-[15%] top-[25%] bg-yellow-400 rounded-2xl p-5 shadow-xl shadow-yellow-100 w-40 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
                        <div className="text-[10px] font-bold text-yellow-900 mb-1">Analysis Speed</div>
                        <div className="text-3xl font-bold text-yellow-900 mb-1">10x</div>
                        <div className="text-[9px] text-yellow-800 opacity-80">Faster than manual synthesis</div>
                    </div>

                    {/* Bottom Right: Mobile/App Promo */}
                    <div className="absolute right-[8%] md:right-[22%] bottom-[15%] bg-slate-50 rounded-2xl p-3 flex items-center gap-4 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 hidden md:flex">
                        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <span className="material-icons text-lg">qr_code_2</span>
                        </div>
                        <div>
                             <div className="text-xs font-bold text-slate-800">Get 2Board Mobile</div>
                             <div className="text-[9px] text-slate-400">Scan to sync devices</div>
                        </div>
                        <div className="h-12 w-20 bg-blue-100 rounded-lg ml-2 overflow-hidden relative">
                             <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600"></div>
                        </div>
                    </div>

                </div>
            </main>
            
            {/* Simple Footer */}
            <footer className="py-6 text-center text-[10px] text-slate-400">
                &copy; {new Date().getFullYear()} 2Board Inc. All rights reserved.
            </footer>
        </div>
    );
};