import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react";
import {
    LayoutDashboard,
    Bot,
    FileText,
    MessageSquare,
    Loader2,
    ExternalLink
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useUser();
    const [stats, setStats] = useState({
        message_count: 0,
        bot_name: 'DocMind',
        system_prompt: ''
    });
    const [saving, setSaving] = useState(false);
    const [docCount, setDocCount] = useState(0);

    // [Temporary] Switch to localhost to show new features
    const API_BASE_URL = 'http://localhost:8000';

    const fetchData = async () => {
        if (!user) return;
        try {
            const [docsRes, settingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/documents`, { headers: { 'user-id': user.id } }),
                axios.get(`${API_BASE_URL}/user/settings`, { headers: { 'user-id': user.id } })
            ]);

            setDocCount(docsRes.data.documents.length);
            setStats(settingsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            await axios.post(`${API_BASE_URL}/user/settings`, {
                bot_name: stats.bot_name,
                system_prompt: stats.system_prompt
            }, {
                headers: { 'user-id': user.id }
            });
            alert("Settings saved!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    const statsCards = [
        {
            title: 'Bots',
            value: '1 / 1',
            icon: Bot,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            link: 'View all'
        },
        {
            title: 'Source Pages',
            value: `${docCount} / 50`,
            icon: FileText,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            link: 'Manage'
        },
        {
            title: 'Messages',
            value: `${stats.message_count} / 100`,
            icon: MessageSquare,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            link: 'View logs'
        },
        {
            title: 'Team Members',
            value: '1 / 1',
            icon: LayoutDashboard,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            link: 'Manage'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <div className="text-sm text-slate-500">
                    {user.fullName}'s Team
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-2xl font-bold text-slate-900 mb-4">{stat.value}</p>
                        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                            {stat.link} <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Bot Settings</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bot Name</label>
                        <input
                            type="text"
                            value={stats.bot_name}
                            onChange={(e) => setStats({ ...stats, bot_name: e.target.value })}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">System Prompt</label>
                        <textarea
                            value={stats.system_prompt}
                            onChange={(e) => setStats({ ...stats, system_prompt: e.target.value })}
                            rows={4}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                            placeholder="You are a helpful assistant..."
                        />
                        <p className="text-xs text-slate-500 mt-2">Customize how your bot behaves and answers questions.</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
