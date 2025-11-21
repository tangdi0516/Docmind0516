import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, X, Minimize2, Zap } from 'lucide-react';

const WidgetChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);

    // Get owner ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ownerId = urlParams.get('ownerId');

    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    useEffect(() => {
        if (!ownerId) {
            console.error('No owner ID provided');
            return;
        }

        // Fetch bot settings
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/user/settings`, {
                    headers: { 'user-id': ownerId }
                });
                setSettings(response.data);

                // Add initial message if configured
                if (response.data.initial_message) {
                    setMessages([{
                        role: 'assistant',
                        content: response.data.initial_message
                    }]);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                // Set default settings
                setSettings({
                    bot_name: 'Assistant',
                    widget_color: '#4F46E5',
                    header_logo: '',
                    initial_message: 'Hello! How can I help you today?'
                });
                setMessages([{
                    role: 'assistant',
                    content: 'Hello! How can I help you today?'
                }]);
            }
        };

        fetchSettings();
    }, [ownerId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim() || loading || !ownerId) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/chat`,
                { question: userMessage },
                { headers: { 'user-id': ownerId } }
            );

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer
            }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClose = () => {
        // Send message to parent window to close widget
        window.parent.postMessage({ type: 'CLOSE_WIDGET' }, '*');
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (!ownerId) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center p-8">
                    <p className="text-red-600 font-medium">Error: No owner ID provided</p>
                    <p className="text-slate-500 text-sm mt-2">Please check your widget configuration</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const headerColor = settings.widget_color || '#4F46E5';

    return (

        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Subtle Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white pointer-events-none" />

            {/* Header - Glassmorphism */}
            <div
                className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between backdrop-blur-md border-b border-white/10 shadow-sm transition-all duration-300"
                style={{
                    backgroundColor: `${headerColor}E6`, // 90% opacity for glass effect
                    color: '#fff'
                }}
            >
                <div className="flex items-center gap-3">
                    {settings.header_logo ? (
                        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-inner border border-white/10">
                            <img src={settings.header_logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div>
                        <h2 className="font-bold text-base tracking-tight">{settings.bot_name || 'Assistant'}</h2>
                        <div className="flex items-center gap-1.5 opacity-90">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                            <p className="text-xs font-medium">Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={handleMinimize}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                        title="Minimize"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24 space-y-6 scroll-smooth">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm mr-2 shrink-0 mt-1">
                                        {settings.header_logo ? (
                                            <img src={settings.header_logo} alt="Bot" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-indigo-600" />
                                        )}
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed ${msg.role === 'user'
                                        ? 'text-white rounded-tr-sm'
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-slate-200/50'
                                        }`}
                                    style={msg.role === 'user' ? { backgroundColor: headerColor } : {}}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm mr-2 shrink-0 mt-1">
                                    {settings.header_logo ? (
                                        <img src={settings.header_logo} alt="Bot" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-indigo-600" />
                                    )}
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm shadow-slate-200/50">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Floating Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10">
                        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg shadow-slate-200/50 p-2 flex items-end gap-2 ring-1 ring-slate-900/5">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none text-[15px]"
                                rows={1}
                                disabled={loading}
                                style={{ height: 'auto' }}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="p-2.5 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95 shrink-0 mb-0.5"
                                style={{ backgroundColor: headerColor }}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <a href="https://docmind.com" target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-slate-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1">
                                <Zap className="w-3 h-3" /> Powered by DocMind
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WidgetChat;
