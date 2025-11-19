import React, { useState } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, training, success, error
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload
            await axios.post('http://localhost:8000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Train
            setStatus('training');
            await axios.post('http://localhost:8000/train');

            setStatus('success');
            setMessage('Document uploaded and indexed successfully!');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('An error occurred during upload or training.');
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900">Upload Document</h2>
                <p className="text-gray-500 mt-2">Upload a PDF or text file to train your bot</p>
            </div>

            <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.txt,.md"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                        <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 font-medium">
                            {file ? file.name : 'Click to select or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, TXT, MD up to 10MB</p>
                    </div>
                </div>

                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={status === 'uploading' || status === 'training'}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {status === 'training' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {status === 'idle' && 'Upload and Train'}
                        {status === 'uploading' && 'Uploading...'}
                        {status === 'training' && 'Indexing...'}
                        {status === 'success' && 'Done'}
                        {status === 'error' && 'Retry'}
                    </button>
                )}

                {status === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                        <CheckCircle className="w-4 h-4" />
                        {message}
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;
