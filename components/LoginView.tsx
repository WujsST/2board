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
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 bg-white/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-md mx-4">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                        2
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Welcome to 2Board</h1>
                    <p className="text-slate-500 text-sm mt-2 text-center">Your AI-First Infinite Workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            What should we call you?
                        </label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 placeholder-slate-400 font-medium"
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Get Started
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400">
                        By entering, you agree to become organized and creative.<br/>
                        Data is stored locally in your browser.
                    </p>
                </div>
            </div>
        </div>
    );
};