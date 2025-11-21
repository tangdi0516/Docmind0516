import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Link, Loader2, RefreshCw, Trash2, Globe } from 'lucide-react';
import { useUser } from "@clerk/clerk-react";

const KnowledgeList = ({ refreshTrigger, filterType = 'file' }) => {
    const { user } = useUser();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    // [Temporary] Switch to localhost to show new features
    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    const fetchDocuments = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/documents`, {
                headers: {
                    'user-id': user.id
                }
            });
            setDocuments(response.data.documents);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [user, refreshTrigger]);

    const handleDelete = async (source) => {
        if (!confirm('Are you sure you want to delete this source? This cannot be undone.')) return;

        try {
            setDeleting(source);
            await axios.delete(`${API_BASE_URL}/documents`, {
                headers: { 'user-id': user.id },
                data: { source }
            });
            // Refresh list
            await fetchDocuments();
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document");
        } finally {
            setDeleting(null);
        }
    };

    if (!user) return null;

    const filteredDocuments = documents.filter(doc => doc.type === filterType);

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {filterType === 'file' ? <FileText className="w-5 h-5 text-indigo-600" /> : <Globe className="w-5 h-5 text-indigo-600" />}
                    {filterType === 'file' ? 'Manage Files' : 'Manage URLs'}
                </h3>
                <button
                    onClick={fetchDocuments}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Refresh list"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {loading && documents.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            {filterType === 'file' ? <FileText className="w-8 h-8 text-slate-300" /> : <Link className="w-8 h-8 text-slate-300" />}
                        </div>
                        <p className="text-slate-500 font-medium">
                            {filterType === 'file'
                                ? 'No files uploaded yet.'
                                : 'No URLs added yet.'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            {filterType === 'file' ? 'Upload documents to see them here.' : 'Import URLs to see them here.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 border-b border-slate-100">Name / URL</th>
                                <th className="px-6 py-3 border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocuments.map((doc, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        <div className="flex items-center gap-3">
                                            {doc.type === 'url' ? (
                                                <a href={doc.source} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline truncate max-w-[200px] sm:max-w-[300px]" title={doc.source}>
                                                    {doc.source}
                                                </a>
                                            ) : (
                                                <span className="truncate max-w-[200px] sm:max-w-[300px]" title={doc.source}>
                                                    {doc.source}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(doc.original_source)}
                                            disabled={deleting === doc.original_source}
                                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete source"
                                        >
                                            {deleting === doc.original_source ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default KnowledgeList;
