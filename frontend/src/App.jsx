import React, { useState } from 'react';
import Upload from './components/Upload';
import Chat from './components/Chat';
import { MessageSquare, FileText } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState('chat');

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">DocsBot Clone</h1>
                    </div>
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chat'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Upload & Train
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'chat' ? <Chat /> : <Upload />}
            </main>
        </div>
    );
}

export default App;
