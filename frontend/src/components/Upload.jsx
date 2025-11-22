import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react";
import { Globe, Search, AlertCircle, Check, ChevronRight, ChevronDown, Folder, FileText, Loader2, Upload as UploadIcon, File, Link as LinkIcon } from 'lucide-react';
import KnowledgeList from './KnowledgeList';

// --- Recursive Tree Item Component ---
const TreeItem = ({ node, selectedUrls, onToggle, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(level < 1); // Open first level by default

    // Calculate selection state
    const getAllUrls = (n) => {
        let urls = n.urls.map(u => u.url);
        n.children.forEach(child => {
            urls = [...urls, ...getAllUrls(child)];
        });
        return urls;
    };

    const nodeUrls = getAllUrls(node);
    const selectedCount = nodeUrls.filter(url => selectedUrls.has(url)).length;
    const isAllSelected = selectedCount === nodeUrls.length && nodeUrls.length > 0;
    const isIndeterminate = selectedCount > 0 && selectedCount < nodeUrls.length;

    const handleCheckboxChange = () => {
        onToggle(nodeUrls, !isAllSelected);
    };

    if (nodeUrls.length === 0 && node.children.length === 0) return null;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors ${level === 0 ? 'bg-slate-50 mb-1' : ''}`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-0.5 rounded hover:bg-slate-200 text-slate-400 ${node.children.length === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={input => {
                            if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    {node.type === 'folder' || node.children.length > 0 ? (
                        <Folder className={`w-4 h-4 ${selectedCount > 0 ? 'text-indigo-500' : 'text-slate-400'}`} />
                    ) : (
                        <FileText className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-700 truncate">
                        <span className="font-medium">{node.name}</span>
                        {nodeUrls.length > 0 && <span className="font-semibold"> ({nodeUrls.length} {nodeUrls.length === 1 ? 'page' : 'pages'})</span>}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div>
                    {node.urls.map((urlObj) => (
                        <div
                            key={urlObj.url}
                            className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg group"
                            style={{ paddingLeft: `${(level + 1) * 20 + 28}px` }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedUrls.has(urlObj.url)}
                                onChange={() => onToggle([urlObj.url], !selectedUrls.has(urlObj.url))}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-600 truncate hover:text-indigo-600 transition-colors" title={urlObj.url}>
                                {urlObj.title || urlObj.url}
                            </span>
                            <a href={urlObj.url} target="_blank" rel="noopener noreferrer" className="ml-auto opacity-0 group-hover:opacity-100">
                                <Globe className="w-3 h-3 text-slate-300 hover:text-indigo-500" />
                            </a>
                        </div>
                    ))}
                    {node.children.map(child => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            selectedUrls={selectedUrls}
                            onToggle={onToggle}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Upload = () => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('website'); // Default to website based on context
    const [file, setFile] = useState(null);

    // Inputs
    const [singleUrl, setSingleUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    // State
    const [websiteStep, setWebsiteStep] = useState(1); // 1: Input, 2: Selection
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    // Tree Data
    const [urlTree, setUrlTree] = useState(null);
    const [selectedUrls, setSelectedUrls] = useState(new Set());
    const [totalFound, setTotalFound] = useState(0);

    // Refresh trigger for KnowledgeList
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleScanWebsite = async () => {
        if (!websiteUrl) return;
        setStatus('scanning');
        setMessage('Scanning website structure... This may take a minute.');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

            const response = await axios.post(`${API_BASE_URL}/scan/website`, {
                url: websiteUrl
            }, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle graceful error response from backend
            if (response.data.error) {
                setStatus('error');
                setMessage(`Scan failed: ${response.data.error}`);
                if (response.data.debug_logs) {
                    console.error("Backend Debug Logs:", response.data.debug_logs);
                }
                return;
            }

            if (response.data.total_count === 0) {
                setStatus('error');
                setMessage('No pages found. Please check the URL or try a different site.');
                if (response.data.debug_logs) {
                    console.error("Backend Debug Logs:", response.data.debug_logs);
                }
                return;
            }

            setUrlTree(response.data.tree);
            setTotalFound(response.data.total_count);

            // Auto-select all initially
            const allUrls = new Set();
            const collectUrls = (node) => {
                node.urls.forEach(u => allUrls.add(u.url));
                node.children.forEach(child => collectUrls(child));
            };
            if (response.data.tree) {
                collectUrls(response.data.tree);
            }
            setSelectedUrls(allUrls);

            setWebsiteStep(2);
            setStatus('idle');
            setMessage('');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage(error.message || 'Failed to scan website');
        }
    };

    const handleToggleWebsiteUrls = (urlsToToggle, shouldSelect) => {
        const newSelected = new Set(selectedUrls);
        urlsToToggle.forEach(url => {
            if (shouldSelect) {
                newSelected.add(url);
            } else {
                newSelected.delete(url);
            }
        });
        setSelectedUrls(newSelected);
    };

    const handleTrain = async () => {
        // Determine what we are training based on activeTab
        if (activeTab === 'file' && !file) return;
        if (activeTab === 'url' && !singleUrl) return;
        if (activeTab === 'website' && selectedUrls.size === 0) return;

        setStatus(activeTab === 'file' ? 'uploading' : 'training');

        try {
            if (activeTab === 'file') {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('user_id', user.id);
                await axios.post(`${API_BASE_URL}/train/file`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage('File uploaded and training started!');
            } else if (activeTab === 'url') {
                await axios.post(`${API_BASE_URL}/train/url`, {
                    url: singleUrl,
                    user_id: user.id
                });
                setMessage('URL submitted for training!');
            } else {
                // Website mode
                setMessage(`Indexing ${selectedUrls.size} pages...`);
                await axios.post(`${API_BASE_URL}/train/website`, {
                    urls: Array.from(selectedUrls),
                    user_id: user.id
                });
                setMessage('Website training started!');
            }

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
                // Reset forms
                setFile(null);
                setSingleUrl('');
                setWebsiteUrl('');
                setUrlTree(null);
                setTotalFound(0);
                setSelectedUrls(new Set());
                setWebsiteStep(1);
                // Trigger refresh of knowledge list
                setRefreshTrigger(prev => prev + 1);
            }, 3000);

        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Operation failed. Please try again.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
            {/* Left Column: Upload Interface */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 shrink-0">
                    <button
                        onClick={() => setActiveTab('file')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'file' ? 'text-indigo-600 bg-slate-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <File className="w-4 h-4" />
                            File Upload
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('url')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'url' ? 'text-indigo-600 bg-slate-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Single URL
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('website')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'website' ? 'text-indigo-600 bg-slate-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Globe className="w-4 h-4" />
                            Website
                        </div>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* File Tab */}
                    {activeTab === 'file' && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,.txt,.md,.docx"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <UploadIcon className="w-6 h-6" />
                                    </div>
                                    <p className="text-slate-900 font-medium mb-1">
                                        {file ? file.name : "Click to upload or drag and drop"}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        PDF, TXT, Markdown (max 10MB)
                                    </p>
                                </label>
                            </div>
                            <button
                                onClick={handleTrain}
                                disabled={status === 'uploading' || !file}
                                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {status === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Training"}
                            </button>
                        </div>
                    )}

                    {/* Single URL Tab */}
                    {activeTab === 'url' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Page URL</label>
                                <input
                                    type="url"
                                    value={singleUrl}
                                    onChange={(e) => setSingleUrl(e.target.value)}
                                    placeholder="https://example.com/article"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={handleTrain}
                                disabled={status === 'training' || !singleUrl}
                                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {status === 'training' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Import Page"}
                            </button>
                        </div>
                    )}

                    {/* Website Tab (The Main Feature) */}
                    {activeTab === 'website' && (
                        <div className="space-y-6">
                            {/* Step Indicator */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${websiteStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        1
                                    </div>
                                    <span className={`text-sm font-medium ${websiteStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>Scan Website</span>
                                </div>
                                <div className={`w-12 h-0.5 ${websiteStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${websiteStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        2
                                    </div>
                                    <span className={`text-sm font-medium ${websiteStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>Select Pages</span>
                                </div>
                                <div className={`w-12 h-0.5 ${websiteStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${websiteStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        3
                                    </div>
                                    <span className={`text-sm font-medium ${websiteStep === 3 ? 'text-slate-900' : 'text-slate-500'}`}>Settings</span>
                                </div>
                            </div>

                            {/* Step 1: Scan Website */}
                            {websiteStep === 1 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Website domain to scan</label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={websiteUrl}
                                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                                    placeholder="https://example.com"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleScanWebsite()}
                                                />
                                            </div>
                                            <button
                                                onClick={handleScanWebsite}
                                                disabled={status === 'scanning' || !websiteUrl}
                                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                                            >
                                                {status === 'scanning' ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Scanning...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="w-5 h-5" />
                                                        Scan
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Enter a website URL and we will scan the pages on the website. You can then select which pages or groups of pages to include in your bot.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Select Pages */}
                            {websiteStep === 2 && urlTree && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Select pages to index ({selectedUrls.size} selected)</h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Free plan includes 25 pages
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setWebsiteStep(1)}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                        >
                                            ← Back to Scan
                                        </button>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto p-3 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                        <TreeItem
                                            node={urlTree}
                                            selectedUrls={selectedUrls}
                                            onToggle={handleToggleWebsiteUrls}
                                        />
                                    </div>

                                    <button
                                        onClick={handleTrain}
                                        disabled={selectedUrls.size === 0 || status === 'training'}
                                        className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                    >
                                        {status === 'training' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Training...
                                            </>
                                        ) : (
                                            `Start Training (${selectedUrls.size} pages)`
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Messages */}
                    {status === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="whitespace-pre-wrap">{message}</div>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-3">
                            <Check className="w-5 h-5" />
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Knowledge List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
                <KnowledgeList
                    refreshTrigger={refreshTrigger}
                    filterType={activeTab === 'file' ? 'file' : 'url'}
                />
            </div>
        </div>
    );
};

export default Upload;