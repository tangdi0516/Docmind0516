import React, { useState } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Loader2, Globe, Link } from 'lucide-react';
import { useUser } from "@clerk/clerk-react";
import KnowledgeList from './KnowledgeList';

const Upload = () => {
    const { user } = useUser();

    const [mode, setMode] = useState('file'); // 'file' or 'url'
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle, uploading, training, success, error
    const [message, setMessage] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // [Temporary] Switch to localhost to show new features
    const API_BASE_URL = 'http://localhost:8000';

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (mode === 'file' && !file) return;
        if (mode === 'url' && !url) return;

        if (!user) {
            setMessage("User not authenticated");
            return;
        }

        setStatus('uploading');

        try {
            const authHeaders = {
                'user-id': user.id
            };

            if (mode === 'file') {
                const formData = new FormData();
                formData.append('file', file);

                await axios.post(`${API_BASE_URL}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...authHeaders
                    },
                });
            } else {
                let finalUrl = url.trim();
                if (!/^https?:\/\//i.test(finalUrl)) {
                    finalUrl = 'https://' + finalUrl;
                }

                await axios.post(`${API_BASE_URL}/train/url`, { url: finalUrl }, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders
                    }
                });
            }

            setStatus('training');
            await axios.post(`${API_BASE_URL}/train`, {}, {
                headers: authHeaders
            });

            setStatus('success');
            setMessage(mode === 'file' ? 'Document uploaded and indexed successfully!' : 'URL content ingested successfully!');
            setRefreshTrigger(prev => prev + 1);

            // Reset inputs
            if (mode === 'file') setFile(null);
            if (mode === 'url') setUrl('');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 3000);

        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('An error occurred during processing.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Upload Section */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden h-full flex flex-col">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <UploadIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Add Knowledge</h2>
                                <p className="text-slate-500">Train your bot with files or web pages</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-200/50 rounded-xl inline-flex w-full">
                            <button
                                onClick={() => setMode('file')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'file'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <File className="w-4 h-4" />
                                Upload File
                            </button>
                            <button
                                onClick={() => setMode('url')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'url'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Import URL
                            </button>
                        </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                        {mode === 'file' ? (
                            <div className="space-y-6 flex-1">
                                <div className={`group relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 h-full flex flex-col items-center justify-center ${file ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                                    }`}>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        accept=".pdf,.txt,.md"
                                    />
                                    <div className="flex flex-col items-center pointer-events-none">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                                            }`}>
                                            {file ? <File className="w-8 h-8" /> : <UploadIcon className="w-8 h-8" />}
                                        </div>
                                        <p className="text-lg font-semibold text-slate-700">
                                            {file ? file.name : 'Drop your file here'}
                                        </p>
                                        <p className="text-sm text-slate-400 mt-2">
                                            Supports PDF, TXT, MD (Max 10MB)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Web Page URL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Link className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://example.com/article"
                                            className="w-full rounded-xl border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <span className="font-semibold text-slate-700 block mb-1">How it works:</span>
                                        We'll extract the text content from this page to train your bot. This is useful for blog posts, documentation, and articles.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleUpload}
                                disabled={status === 'uploading' || status === 'training' || (mode === 'file' && !file) || (mode === 'url' && !url)}
                                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.99]"
                            >
                                {status === 'uploading' || status === 'training' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    mode === 'file' ? <UploadIcon className="w-5 h-5" /> : <Globe className="w-5 h-5" />
                                )}
                                <span className="text-lg">
                                    {status === 'idle' && (mode === 'file' ? 'Upload and Train' : 'Import URL')}
                                    {status === 'uploading' && (mode === 'file' ? 'Uploading...' : 'Importing...')}
                                    {status === 'training' && 'Indexing...'}
                                    {status === 'success' && 'Success!'}
                                    {status === 'error' && 'Try Again'}
                                </span>
                            </button>
                        </div>

                        {/* Status Messages */}
                        {status === 'success' && (
                            <div className="mt-6 flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                                <span className="font-medium">{message}</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="mt-6 flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                <span className="font-medium">{message}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Knowledge List */}
                <div className="h-full min-h-[500px]">
                    <KnowledgeList refreshTrigger={refreshTrigger} filterType={mode} />
                </div>
            </div>
        </div >
    );
};

export default Upload;