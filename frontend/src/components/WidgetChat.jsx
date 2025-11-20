import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, X, Minimize2 } from 'lucide-react';

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

    const API_BASE_URL = 'http://localhost:8000';

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
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 text-white shadow-lg"
                style={{ backgroundColor: headerColor }}
            >
                <div className="flex items-center gap-3">
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
                        <h2 className="font-semibold text-lg">{settings.bot_name || 'Assistant'}</h2>
                        <p className="text-xs text-white/80">Online</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleMinimize}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Minimize"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                                        }`}
                                    style={msg.role === 'user' ? { backgroundColor: headerColor } : {}}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-slate-200 p-4 bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="px-4 py-2.5 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                                style={{ backgroundColor: headerColor }}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WidgetChat;
