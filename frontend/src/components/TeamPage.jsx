import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react";
import { Users, UserPlus, Trash2, Shield } from 'lucide-react';

const TeamPage = () => {
    const { user } = useUser();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/team`, {
                headers: { 'user-id': user.id }
            });
            setMembers(response.data);
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchMembers();
    }, [user]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            await axios.post(`${API_BASE_URL}/team/invite`, { email: inviteEmail }, {
                headers: { 'user-id': user.id }
            });
            setInviteEmail('');
            fetchMembers();
            alert('Member invited!');
        } catch (error) {
            console.error("Error inviting member:", error);
            alert('Failed to invite member. They might already be invited.');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (id) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/team/${id}`, {
                headers: { 'user-id': user.id }
            });
            fetchMembers();
        } catch (error) {
            console.error("Error removing member:", error);
            alert('Failed to remove member');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading team...</div>;

    return (
        <div className="space-y-6">
            {/* Invite Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        Invite Team Member
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Invite users to collaborate on this project.
                    </p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleInvite} className="flex gap-3">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            required
                        />
                        <button
                            type="submit"
                            disabled={inviting}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {inviting ? 'Inviting...' : 'Invite'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Team Members
                    </h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {members.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No team members yet.</div>
                    ) : (
                        members.map((member) => (
                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {member.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{member.email}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> {member.role}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(member.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove member"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
