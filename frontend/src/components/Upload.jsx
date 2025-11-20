import React, { useState } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
// 1. 引入 Clerk Hook
import { useUser } from "@clerk/clerk-react";

const Upload = () => {
    // 2. 获取当前用户对象
    const { user } = useUser();

    const [mode, setMode] = useState('file'); // 'file' or 'url'
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle, uploading, training, success, error
    const [message, setMessage] = useState('');

    // [核弹级修复] 直接硬编码线上地址
    const API_BASE_URL = 'https://api.docmind.com.au';

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
            // 准备请求头，放入 user-id
            const authHeaders = {
                'user-id': user.id
            };

            if (mode === 'file') {
                const formData = new FormData();
                formData.append('file', file);

                // Upload 文件
                await axios.post(`${API_BASE_URL}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...authHeaders // [关键] 添加用户 ID
                    },
                });
            } else {
                // URL Ingestion (修正为后端定义的 /train/url 接口)
                await axios.post(`${API_BASE_URL}/train/url`, { url }, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders // [关键] 添加用户 ID
                    }
                });
            }

            // 触发训练 (如果是 Dummy 接口也带上 ID 以防万一)
            // 注意：URL 模式下 /train/url 其实已经处理了 ingestion，这里可以只在 file 模式调用，
            // 或者后端 /train 只是个空接口也没关系。
            setStatus('training');
            await axios.post(`${API_BASE_URL}/train`, {}, {
                headers: authHeaders
            });

            setStatus('success');
            setMessage(mode === 'file' ? 'Document uploaded and indexed successfully!' : 'URL content ingested successfully!');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('An error occurred during processing.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4 ring-8 ring-indigo-50/50">
                    <UploadIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add Knowledge</h2>
                <p className="text-slate-500 mt-3 text-lg">Upload files or import web pages to train your bot</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                    <button
                        onClick={() => setMode('file')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        File Upload
                    </button>
                    <button
                        onClick={() => setMode('url')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        URL Import
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {mode === 'file' ? (
                    <div className="group relative border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            accept=".pdf,.txt,.md"
                        />
                        <div className="flex flex-col items-center pointer-events-none transition-transform duration-300 group-hover:scale-105">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4 group-hover:shadow-md group-hover:border-indigo-200 transition-all">
                                {file ? (
                                    <File className="w-8 h-8 text-indigo-600" />
                                ) : (
                                    <UploadIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                )}
                            </div>
                            <p className="text-lg text-slate-700 font-semibold">
                                {file ? file.name : 'Click to select or drag and drop'}
                            </p>
                            <p className="text-sm text-slate-400 mt-2 font-medium">PDF, TXT, MD up to 10MB</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <label htmlFor="url-input" className="block text-sm font-medium text-slate-700">
                            Web Page URL
                        </label>
                        <input
                            id="url-input"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/article"
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                        />
                        <p className="text-sm text-slate-500">
                            Enter a URL to ingest content from a web page. The bot will read the text content.
                        </p>
                    </div>
                )}

                {(file || (mode === 'url' && url)) && (
                    <button
                        onClick={handleUpload}
                        disabled={status === 'uploading' || status === 'training'}
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin" />}
                        {status === 'training' && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span className="text-lg">
                            {status === 'idle' && (mode === 'file' ? 'Upload and Train' : 'Import URL')}
                            {status === 'uploading' && (mode === 'file' ? 'Uploading...' : 'Importing...')}
                            {status === 'training' && 'Indexing...'}
                            {status === 'success' && 'Done'}
                            {status === 'error' && 'Retry'}
                        </span>
                    </button>
                )}

                {status === 'success' && (
                    <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;