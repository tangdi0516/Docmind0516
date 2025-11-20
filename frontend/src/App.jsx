import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, UserButton } from "@clerk/clerk-react";
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import Chat from './components/Chat';
import WidgetGenerator from './components/WidgetGenerator';
import EmbedChat from './components/EmbedChat';
import WidgetChat from './components/WidgetChat';
import LandingPage from './components/LandingPage';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showSignIn, setShowSignIn] = useState(false);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public embed routes - no authentication required */}
                <Route path="/embed/:userId" element={<EmbedChat />} />
                <Route path="/widget" element={<WidgetChat />} />

                {/* Landing page route */}
                <Route
                    path="/home"
                    element={
                        <>
                            <SignedOut>
                                {showSignIn ? (
                                    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
                                        <button
                                            onClick={() => setShowSignIn(false)}
                                            className="absolute top-8 left-8 text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors"
                                        >
                                            ← Back to Home
                                        </button>
                                        <div className="mb-8 text-center">
                                            <div className="inline-flex items-center gap-3 mb-4">
                                                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-600/20">
                                                    <MessageSquare className="w-8 h-8 text-white" />
                                                </div>
                                                <h1 className="text-3xl font-bold text-slate-900">DocMind</h1>
                                            </div>
                                            <p className="text-slate-500 text-lg">Sign in to access your AI knowledge base</p>
                                        </div>
                                        <SignIn />
                                    </div>
                                ) : (
                                    <LandingPage onLoginClick={() => setShowSignIn(true)} />
                                )}
                            </SignedOut>
                            <SignedIn>
                                <Navigate to="/" replace />
                            </SignedIn>
                        </>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/*"
                    element={
                        <>
                            <SignedOut>
                                <Navigate to="/home" replace />
                            </SignedOut>
                            <SignedIn>
                                <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
                                    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300">
                                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                                            <div className="flex items-center gap-3 group cursor-pointer">
                                                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
                                                    <MessageSquare className="w-5 h-5 text-white" />
                                                </div>
                                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                                                    DocMind
                                                </h1>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <nav className="flex gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                                                    <button
                                                        onClick={() => setActiveTab('dashboard')}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'dashboard'
                                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                                            }`}
                                                    >
                                                        Dashboard
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveTab('chat')}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'chat'
                                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                                            }`}
                                                    >
                                                        Chat
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveTab('upload')}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'upload'
                                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                                            }`}
                                                    >
                                                        Upload & Train
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveTab('widget')}
                                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'widget'
                                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                                            }`}
                                                    >
                                                        Widget
                                                    </button>
                                                </nav>

                                                <div className="pl-2 border-l border-slate-200">
                                                    <UserButton />
                                                </div>
                                            </div>
                                        </div>
                                    </header>

                                    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                                            {activeTab === 'dashboard' && <Dashboard />}
                                            {activeTab === 'chat' && <Chat />}
                                            {activeTab === 'upload' && <Upload />}
                                            {activeTab === 'widget' && <WidgetGenerator />}
                                        </div>
                                    </main>
                                </div>
                            </SignedIn>
                        </>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;