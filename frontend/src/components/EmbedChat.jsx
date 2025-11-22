import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Loader2, Bot, User } from 'lucide-react';

// Helper function to determine if text should be white or black based on background color
const getContrastColor = (hexColor) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const EmbedChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [botName, setBotName] = useState('DocMind Assistant');
    const [settings, setSettings] = useState({
        widget_color: '#4F46E5',
        header_logo: '',
        initial_message: 'Hello! How can I help you today?'
    });
    const [sessionId, setSessionId] = useState('');
    const messagesEndRef = useRef(null);
    const [userId, setUserId] = useState(null);

    // [Temporary] Switch to localhost
    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    useEffect(() => {
        setSessionId(crypto.randomUUID());
    }, []);

    useEffect(() => {
        // Extract user_id from URL path: /embed/<user_id>
        const pathParts = window.location.pathname.split('/');
        const extractedUserId = pathParts[pathParts.length - 1]; // Assumes /embed/USER_ID format

        if (extractedUserId) {
            setUserId(extractedUserId);
            fetchSettings(extractedUserId);
        }
    }, []);

    const fetchSettings = async (uid) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/user/settings`, {
                headers: { 'user-id': uid }
            });
            const name = response.data.bot_name || 'DocMind';
            setBotName(name);
            setSettings({
                widget_color: response.data.widget_color || '#4F46E5',
                header_logo: response.data.header_logo || '',
                initial_message: response.data.initial_message || 'Hello! How can I help you today?'
            });
            setMessages([
                { role: 'assistant', content: response.data.initial_message || `Hello! I am ${name}. How can I help you today?` }
            ]);
        } catch (error) {
            console.error("Error fetching settings:", error);
            setMessages([
                { role: 'assistant', content: 'Hello! I am DocMind Assistant. How can I help you today?' }
            ]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !userId) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/chat`, {
                question: input,
                session_id: sessionId
            }, {
                headers: { 'user-id': userId }
            });

            const botMessage = { role: 'assistant', content: response.data.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
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

    if (!userId) {
        return <div className="flex items-center justify-center h-screen text-slate-500">Invalid Chat Configuration</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-slate-900">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shadow-sm sticky top-0 z-10 transition-colors"
                style={{ backgroundColor: settings.widget_color, color: getContrastColor(settings.widget_color) }}
            >
                {settings.header_logo ? (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/10">
                        <img src={settings.header_logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border" style={{ backgroundColor: `${getContrastColor(settings.widget_color)}20`, borderColor: `${getContrastColor(settings.widget_color)}10` }}>
                        <Bot className="w-5 h-5" style={{ color: getContrastColor(settings.widget_color) }} />
                    </div>
                )}

                <div>
                    <h1 className="font-bold text-base leading-tight" style={{ color: getContrastColor(settings.widget_color) }}>{botName}</h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                        <span className="text-xs font-medium" style={{ color: `${getContrastColor(settings.widget_color)}e6` }}>Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        {msg.role === 'assistant' && (
                            <span className="text-xs text-slate-400 mb-1">{botName}</span>
                        )}

                        <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Bubble */}
                            <div
                                className={`px-4 py-3 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'rounded-2xl rounded-tr-sm'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
                                    }`}
                                style={msg.role === 'user' ? { backgroundColor: settings.widget_color, color: getContrastColor(settings.widget_color) } : {}}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-xs text-slate-400 mb-1">{botName}</span>
                        <div className="flex gap-2 max-w-[90%]">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full py-3 pl-4 pr-12 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-slate-200 text-slate-800 placeholder:text-slate-400 text-[15px]"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <a href="https://docmind-frontend-app.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-slate-300 hover:text-slate-500 transition-colors flex items-center justify-center gap-1">
                        Powered by DocMind
                    </a>
                </div>
            </div>
        </div>
    );
};

export default EmbedChat;
