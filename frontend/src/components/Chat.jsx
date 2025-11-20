import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2 } from 'lucide-react';
// 1. 引入 Clerk Hook
import { useUser } from "@clerk/clerk-react";

const Chat = () => {
    // 2. 获取当前用户对象
    const { user } = useUser();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [botName, setBotName] = useState('DocMind');
    const messagesEndRef = useRef(null);

    // [Temporary] Switch to localhost to fix chat error
    const API_BASE_URL = 'http://localhost:8000';

    useEffect(() => {
        // Fetch bot settings
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/user/settings`, {
                    headers: { 'user-id': user.id }
                });
                setBotName(response.data.bot_name || 'DocMind');

                // Set initial message with custom name
                setMessages([
                    { role: 'assistant', content: `Hello! I am ${response.data.bot_name || 'DocMind'}. Ask me anything about your documents.` }
                ]);
            } catch (error) {
                console.error("Error fetching settings:", error);
                setMessages([
                    { role: 'assistant', content: 'Hello! I am DocMind. Ask me anything about your documents.' }
                ]);
            }
        };
        fetchSettings();
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        if (!user) {
            // 如果未登录（理论上 App.jsx 已拦截，但双重保险）
            setMessages(prev => [...prev, { role: 'assistant', content: 'Please sign in to chat.' }]);
            return;
        }

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // 4. 发送请求时带上 user-id header
            const response = await axios.post(`${API_BASE_URL}/chat`,
                { question: userMessage.content },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'user-id': user.id // [关键] 传递用户身份
                    }
                }
            );

            const botMessage = { role: 'assistant', content: response.data.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 h-[600px] flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl px-6 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-slate-900 text-white rounded-br-none'
                                : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 shadow-inner ring-2 ring-white">
                                <User className="w-6 h-6 text-slate-500" />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4 justify-start animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white opacity-50">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-slate-50 rounded-2xl rounded-bl-none px-6 py-4 flex items-center border border-slate-100">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 absolute bottom-0 left-0 right-0">
                <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your documents..."
                        className="w-full rounded-xl border-0 bg-slate-100 pl-5 pr-14 py-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;