import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react";
import { MessageSquare, Clock, User, Bot } from 'lucide-react';

const LogsPage = () => {
    const { user } = useUser();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/logs`, {
                    headers: { 'user-id': user.id }
                });
                setLogs(response.data);
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchLogs();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading logs...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Chat Logs
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        View recent conversations with your bot.
                    </p>
                </div>
                <div className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No logs found.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        {log.role === 'user' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                                <User className="w-3 h-3" /> User
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                                                <Bot className="w-3 h-3" /> Assistant
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 font-mono">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-slate-800 text-sm whitespace-pre-wrap pl-2 border-l-2 border-slate-200">
                                    {log.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogsPage;
