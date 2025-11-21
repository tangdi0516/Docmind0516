import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Loader2, Bot, User } from 'lucide-react';

const EmbedChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [botName, setBotName] = useState('DocMind');
    const [settings, setSettings] = useState({
        widget_color: '#4F46E5',
        header_logo: '',
        initial_message: 'Hello! How can I help you today?'
    });
    const messagesEndRef = useRef(null);
    const [userId, setUserId] = useState(null);

    // [Temporary] Switch to localhost
    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

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
                { role: 'assistant', content: 'Hello! I am DocMind. How can I help you today?' }
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
                question: input
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
        <div className="flex flex-col h-screen bg-white font-sans">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shadow-sm sticky top-0 z-10 transition-colors"
                style={{ backgroundColor: settings.widget_color }}
            >
                {settings.header_logo ? (
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                        <img src={settings.header_logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                )}

                <div>
                    <h1 className="font-bold text-white text-sm">{botName}</h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-xs text-white/80 font-medium">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-50'
                            }`}
                            style={msg.role !== 'user' ? { backgroundColor: `${settings.widget_color}20` } : {}}
                        >
                            {msg.role === 'user' ?
                                <User className="w-5 h-5 text-slate-600" /> :
                                <Bot className="w-5 h-5" style={{ color: settings.widget_color }} />
                            }
                        </div>

                        <div className={`group relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                            ? 'text-white rounded-tr-sm'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                            }`}
                            style={msg.role === 'user' ? { backgroundColor: settings.widget_color } : {}}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
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
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 text-white rounded-lg disabled:opacity-50 transition-all shadow-sm"
                        style={{ backgroundColor: settings.widget_color }}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <a href="#" className="text-[10px] text-slate-400 hover:text-indigo-500 font-medium transition-colors">
                        Powered by DocMind
                    </a>
                </div>
            </div>
        </div>
    );
};

export default EmbedChat;
