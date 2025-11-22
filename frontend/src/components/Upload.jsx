import React, { useState } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Loader2, Globe, Link, Search, Check } from 'lucide-react';
import { useUser } from "@clerk/clerk-react";
import KnowledgeList from './KnowledgeList';

const Upload = () => {
    const { user } = useUser();

    const [mode, setMode] = useState('file'); // 'file', 'url', or 'website'
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [discoveredUrls, setDiscoveredUrls] = useState([]);
    const [urlGroups, setUrlGroups] = useState([]);
    const [selectedUrls, setSelectedUrls] = useState(new Set());
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [websiteStep, setWebsiteStep] = useState(1); // 1: input, 2: select pages, 3: importing
    const [status, setStatus] = useState('idle'); // idle, uploading, training, success, error, scanning
    const [message, setMessage] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleScanWebsite = async () => {
        if (!websiteUrl.trim()) return;

        setStatus('scanning');
        setMessage('Scanning website for pages...');

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

            const response = await axios.post(
                `${API_BASE_URL}/scan/website`,
                { url: websiteUrl },
                {
                    headers: { 'user-id': user.id },
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (response.data.total_count === 0) {
                const debugInfo = response.data.debug_logs ? response.data.debug_logs.join('\n') : '';
                console.error("Crawler Debug Logs:", debugInfo);
                setStatus('error');
                setMessage(`No pages found. Debug info:\n${debugInfo || 'Connection failed'}`);
                return;
            }

            setUrlGroups(response.data.groups);
            setDiscoveredUrls(response.data.all_urls);
            setExpandedGroups(new Set([response.data.groups[0]?.name])); // Expand first group by default
            setWebsiteStep(2);
            setStatus('idle');
            setMessage('');
        } catch (error) {
            console.error(error);
            if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
                setStatus('error');
                setMessage('Scan timed out (>2 min). The website is very large or slow.');
            } else {
                setStatus('error');
                setMessage('Failed to scan website. Please check the URL and try again.');
            }
        }
    };

    const handleSelectAll = () => {
        if (selectedUrls.size === discoveredUrls.length) {
            setSelectedUrls(new Set());
        } else {
            setSelectedUrls(new Set(discoveredUrls));
        }
    };

    const handleToggleGroup = (groupName) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedGroups(newExpanded);
    };

    const handleSelectGroup = (group) => {
        const groupUrls = group.urls;
        const allSelected = groupUrls.every(url => selectedUrls.has(url));

        const newSelected = new Set(selectedUrls);
        if (allSelected) {
            groupUrls.forEach(url => newSelected.delete(url));
        } else {
            groupUrls.forEach(url => newSelected.add(url));
        }
        setSelectedUrls(newSelected);
    };

    const handleToggleUrl = (url) => {
        const newSelected = new Set(selectedUrls);
        if (newSelected.has(url)) {
            newSelected.delete(url);
        } else {
            newSelected.add(url);
        }
        setSelectedUrls(newSelected);
    };

    const handleTrainWebsite = async () => {
        if (selectedUrls.size === 0) return;

        setStatus('uploading');
        setWebsiteStep(3);

        try {
            await axios.post(
                `${API_BASE_URL}/train/website`,
                { urls: Array.from(selectedUrls) },
                { headers: { 'user-id': user.id } }
            );

            setStatus('success');
            setMessage(`Successfully indexed ${selectedUrls.size} pages!`);
            setRefreshTrigger(prev => prev + 1);

            setTimeout(() => {
                setStatus('idle');
                setMessage('');
                setWebsiteUrl('');
                setDiscoveredUrls([]);
                setSelectedUrls(new Set());
                setWebsiteStep(1);
            }, 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Failed to index pages. Please try again.');
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

            if (mode === 'file') setFile(null);
            if (mode === 'url') setUrl('');

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
                                <p className="text-slate-500">Train your bot with files, URLs, or websites</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-200/50 rounded-xl w-full">
                            <button
                                onClick={() => setMode('file')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'file'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <File className="w-4 h-4" />
                                File
                            </button>
                            <button
                                onClick={() => setMode('url')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'url'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                URL
                            </button>
                            <button
                                onClick={() => setMode('website')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'website'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Search className="w-4 h-4" />
                                Website
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
                                        accept=".pdf,.txt,.md,.doc,.docx,.html,.htm,.eml,.zip,.csv,.tsv,.srt,.jpg,.jpeg,.png,.gif,.bmp,.svg,.xls,.xlsx,.ppt,.pptx"
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
                                            Supports PDF, Word, Excel, PowerPoint, Text, HTML, MD, Images, CSV, and more
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : mode === 'url' ? (
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
                                        We'll extract the text content from this page to train your bot.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 flex-1">
                                {websiteStep === 1 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Website URL</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Globe className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <input
                                                    type="url"
                                                    value={websiteUrl}
                                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                                    placeholder="https://example.com"
                                                    className="w-full rounded-xl border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                                                />
                                            </div>
                                            <p className="text-sm text-slate-500 mt-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                                <span className="font-semibold text-slate-700 block mb-1">🔍 Scan entire website:</span>
                                                We'll discover all pages on this website and let you choose which ones to index.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {websiteStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-900">
                                                Found {discoveredUrls.length} pages
                                            </h3>
                                            <button
                                                onClick={handleSelectAll}
                                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                                {selectedUrls.size === discoveredUrls.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
                                            {urlGroups.map((group, groupIndex) => {
                                                const groupUrls = group.urls;
                                                const allSelected = groupUrls.every(url => selectedUrls.has(url));
                                                const someSelected = groupUrls.some(url => selectedUrls.has(url)) && !allSelected;
                                                const isExpanded = expandedGroups.has(group.name);

                                                return (
                                                    <div key={groupIndex} className="border-b border-slate-100 last:border-b-0">
                                                        {/* Group Header */}
                                                        <div className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={allSelected}
                                                                ref={input => {
                                                                    if (input) input.indeterminate = someSelected;
                                                                }}
                                                                onChange={() => handleSelectGroup(group)}
                                                                className="mr-3 w-4 h-4 text-indigo-600 rounded"
                                                            />
                                                            <button
                                                                onClick={() => handleToggleGroup(group.name)}
                                                                className="flex-1 flex items-center justify-between text-left"
                                                            >
                                                                <span className="font-medium text-slate-900">
                                                                    {group.name} ({group.count} pages)
                                                                </span>
                                                                <svg
                                                                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Group URLs */}
                                                        {isExpanded && (
                                                            <div className="bg-white">
                                                                {groupUrls.map((url, urlIndex) => (
                                                                    <label
                                                                        key={urlIndex}
                                                                        className="flex items-center p-3 pl-10 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedUrls.has(url)}
                                                                            onChange={() => handleToggleUrl(url)}
                                                                            className="mr-3 w-4 h-4 text-indigo-600 rounded"
                                                                        />
                                                                        <span className="text-sm text-slate-700 truncate flex-1">{url}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setWebsiteStep(1)}
                                            className="text-sm text-slate-500 hover:text-slate-700"
                                        >
                                            ← Back to URL
                                        </button>
                                    </div>
                                )}

                                {websiteStep === 3 && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                                        <p className="text-slate-700 font-medium">Indexing {selectedUrls.size} pages...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Button */}
                        {!(mode === 'website' && websiteStep === 3) && (
                            <div className="mt-8">
                                <button
                                    onClick={() => {
                                        if (mode === 'website') {
                                            if (websiteStep === 1) handleScanWebsite();
                                            else if (websiteStep === 2) handleTrainWebsite();
                                        } else {
                                            handleUpload();
                                        }
                                    }}
                                    disabled={
                                        status === 'uploading' || status === 'training' || status === 'scanning' ||
                                        (mode === 'file' && !file) ||
                                        (mode === 'url' && !url) ||
                                        (mode === 'website' && websiteStep === 1 && !websiteUrl) ||
                                        (mode === 'website' && websiteStep === 2 && selectedUrls.size === 0)
                                    }
                                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.99]"
                                >
                                    {status === 'scanning' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : status === 'uploading' || status === 'training' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : mode === 'website' && websiteStep === 1 ? (
                                        <Search className="w-5 h-5" />
                                    ) : mode === 'website' && websiteStep === 2 ? (
                                        <Check className="w-5 h-5" />
                                    ) : mode === 'file' ? (
                                        <UploadIcon className="w-5 h-5" />
                                    ) : (
                                        <Globe className="w-5 h-5" />
                                    )}
                                    <span className="text-lg">
                                        {status === 'scanning' && 'Scanning...'}
                                        {status === 'idle' && mode === 'website' && websiteStep === 1 && 'Scan Website'}
                                        {status === 'idle' && mode === 'website' && websiteStep === 2 && `Import ${selectedUrls.size} Pages`}
                                        {status === 'idle' && mode === 'file' && 'Upload and Train'}
                                        {status === 'idle' && mode === 'url' && 'Import URL'}
                                        {(status === 'uploading' || status === 'training') && mode !== 'website' && (mode === 'file' ? 'Uploading...' : 'Importing...')}
                                        {status === 'success' && 'Success!'}
                                        {status === 'error' && 'Try Again'}
                                    </span>
                                </button>
                            </div>
                        )}

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