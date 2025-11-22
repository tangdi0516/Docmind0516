import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, X, Minimize2, Zap, ChevronLeft, Sparkles, ThumbsUp, ThumbsDown, Copy, Info, ExternalLink, MessageSquare } from 'lucide-react';

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
                    bot_name: 'DocMind Assistant',
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
        <div className="flex flex-col h-screen bg-white relative overflow-hidden font-sans text-slate-900">
            {/* Header - Custom Color */}
            <div
                className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between backdrop-blur-md border-b border-white/10 shadow-sm transition-all duration-300"
                style={{
                    backgroundColor: headerColor,
                    color: getContrastColor(headerColor)
                }}
            >
                <div className="flex items-center gap-3">
                    {settings.header_logo ? (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/10">
                            <img src={settings.header_logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border" style={{ backgroundColor: `${getContrastColor(headerColor)}20`, borderColor: `${getContrastColor(headerColor)}10` }}>
                            <MessageSquare className="w-4 h-4" style={{ color: getContrastColor(headerColor) }} />
                        </div>
                    )}

                    <div>
                        <h2 className="font-bold text-base leading-tight" style={{ color: getContrastColor(headerColor) }}>{settings.bot_name || 'DocMind AI'}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-1" style={{ color: `${getContrastColor(headerColor)}e6` }}>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full transition-colors"
                        style={{ color: getContrastColor(headerColor) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${getContrastColor(headerColor)}20`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24 space-y-6 bg-white">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                {msg.role === 'assistant' && (
                                    <span className="text-xs text-slate-400 mb-1">{settings.bot_name || 'DocMind AI'}</span>
                                )}

                                <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Bubble */}
                                    <div className="flex flex-col gap-1">
                                        <div
                                            className={`px-4 py-3 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'rounded-2xl rounded-tr-sm'
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
                                                }`}
                                            style={msg.role === 'user' ? { backgroundColor: headerColor, color: getContrastColor(headerColor) } : {}}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {/* Bot Actions */}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center justify-between px-1 mt-1">
                                                <div className="flex gap-2">
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                                                        <ThumbsDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <span className="text-xs text-slate-400 mb-1">{settings.bot_name || 'Assistant'}</span>
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
                        <div className="relative flex items-center">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message here..."
                                className="w-full py-3 pl-4 pr-12 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-slate-200 text-slate-800 placeholder:text-slate-400 resize-none text-[15px] max-h-32 min-h-[48px]"
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
                                className="absolute right-2 p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <a href="https://docmind.com" target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-slate-300 hover:text-slate-500 transition-colors flex items-center justify-center gap-1">
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
