import React, { useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import axios from 'axios';
import { Upload, Bot, Loader2, Code, Copy, Terminal } from 'lucide-react';

const WidgetGenerator = () => {
    const { user } = useUser();
    const [copiedEmbed, setCopiedEmbed] = useState(false);
    const [copiedIframe, setCopiedIframe] = useState(false);
    const [settings, setSettings] = useState({
        widget_color: '#4F46E5',
        header_logo: '',
        initial_message: 'Hello! How can I help you today?'
    });
    const [saving, setSaving] = useState(false);

    // [Temporary] Switch to localhost
    const API_BASE_URL = 'https://docmind0516-production.up.railway.app';

    // Construct the embed URL based on current location
    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/embed/${user.id}`;

    const iframeCode = `<iframe 
    src="${embedUrl}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
></iframe>`;

    const scriptCode = `<script>
  window.DocMindConfig = {
    botId: "${user.id}",
    host: "${baseUrl}"
  };
</script>
<script src="${baseUrl}/widget.js" async></script>`;

    const handleCopy = (text, setCopied) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setSaving(true); // Re-using saving state for upload indication
            const response = await axios.post(`${API_BASE_URL}/upload/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'user-id': user.id
                }
            });
            setSettings({ ...settings, header_logo: response.data.url });
        } catch (error) {
            console.error("Error uploading logo:", error);
            alert("Failed to upload logo");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            // We need to fetch current settings first to preserve bot_name and system_prompt
            // Or better, the backend should handle partial updates, but our simple store replaces.
            // Let's fetch first.
            const currentSettingsRes = await axios.get(`${API_BASE_URL}/user/settings`, {
                headers: { 'user-id': user.id }
            });

            const currentSettings = currentSettingsRes.data;

            await axios.post(`${API_BASE_URL}/user/settings`, {
                ...currentSettings,
                widget_color: settings.widget_color,
                header_logo: settings.header_logo,
                initial_message: settings.initial_message
            }, {
                headers: { 'user-id': user.id }
            });

            // Force iframe refresh by updating key or src query param
            const iframe = document.getElementById('preview-iframe');
            if (iframe) {
                iframe.src = iframe.src;
            }

            alert("Widget settings saved!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // Load initial settings
    React.useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/user/settings`, {
                    headers: { 'user-id': user.id }
                });
                setSettings(prev => ({
                    ...prev,
                    widget_color: response.data.widget_color || '#4F46E5',
                    header_logo: response.data.header_logo || '',
                    initial_message: response.data.initial_message || 'Hello! How can I help you today?'
                }));
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, [user]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Chat Widget</h2>
                    <p className="text-slate-500 mt-1">Customize and embed your AI assistant</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">Appearance</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Widget Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={settings.widget_color}
                                        onChange={(e) => setSettings({ ...settings, widget_color: e.target.value })}
                                        className="h-10 w-20 rounded border border-slate-200 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-500 font-mono">{settings.widget_color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Header Logo URL</label>
                                <input
                                    type="text"
                                    value={settings.header_logo}
                                    onChange={(e) => setSettings({ ...settings, header_logo: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">Leave empty to hide logo.</p>
                                <div className="mt-2">
                                    <label className="flex items-center justify-center w-full px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <Upload className="w-4 h-4 text-slate-500 mr-2" />
                                        <span className="text-sm text-slate-600">Upload Image</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Initial Message</label>
                                <textarea
                                    value={settings.initial_message}
                                    onChange={(e) => setSettings({ ...settings, initial_message: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview & Code Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Preview Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">Live Preview</h3>
                        </div>
                        <div className="p-8 bg-slate-50 flex justify-center">
                            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 h-[500px] relative">
                                <iframe
                                    id="preview-iframe"
                                    src={embedUrl}
                                    className="w-full h-full"
                                    title="Chat Widget Preview"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Embed Code Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-slate-900">Iframe Embed</h3>
                            </div>
                            <button
                                onClick={() => handleCopy(iframeCode, setCopiedIframe)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                            >
                                {copiedIframe ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedIframe ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <div className="p-6 bg-slate-900 overflow-x-auto">
                            <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap break-all">
                                {iframeCode}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Embed Options - Side by Side */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Code className="w-5 h-5 text-indigo-600" />
                        Embed Your Chat Widget
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Choose one of the methods below to add the chat widget to your website
                    </p>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Script Embed - Recommended */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" />
                                Script Embed (Recommended)
                            </h4>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Floating Widget
                            </span>
                        </div>

                        <div className="relative">
                            <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                                <code>{`<script 
  src="https://docmind-frontend-app.vercel.app/loader.js" 
  data-owner-id="${user.id}"
></script>`}</code>
                            </pre>
                            <button
                                onClick={() => {
                                    const code = `<script src="https://docmind-frontend-app.vercel.app/loader.js" data-owner-id="${user.id}"></script>`;
                                    navigator.clipboard.writeText(code);
                                    alert('✅ Script code copied!');
                                }}
                                className="absolute top-2 right-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <Copy className="w-3 h-3" />
                                Copy
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
                            <p className="font-semibold text-blue-900 flex items-center gap-2">
                                <span>📘</span> How to install:
                            </p>
                            <ol className="text-blue-800 space-y-1.5 ml-6 list-decimal">
                                <li>Copy the code above using the "Copy" button</li>
                                <li>Open your website's HTML file</li>
                                <li>Paste the code right before the <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                                <li>Save and reload your website</li>
                            </ol>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs text-blue-700">
                                    ✨ <strong>Result:</strong> A floating chat bubble will appear in the bottom-right corner of every page.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* iFrame Embed */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Code className="w-4 h-4 text-purple-600" />
                                iFrame Embed
                            </h4>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                Inline Widget
                            </span>
                        </div>

                        <div className="relative">
                            <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                                <code>{`<iframe 
  src="${baseUrl}/embed/${user.id}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 12px;"
></iframe>`}</code>
                            </pre>
                            <button
                                onClick={() => {
                                    const code = `<iframe src="${baseUrl}/embed/${user.id}" width="100%" height="600" frameborder="0" style="border-radius: 12px;"></iframe>`;
                                    navigator.clipboard.writeText(code);
                                    alert('✅ iFrame code copied!');
                                }}
                                className="absolute top-2 right-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <Copy className="w-3 h-3" />
                                Copy
                            </button>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm space-y-2">
                            <p className="font-semibold text-purple-900 flex items-center gap-2">
                                <span>📘</span> How to install:
                            </p>
                            <ol className="text-purple-800 space-y-1.5 ml-6 list-decimal">
                                <li>Copy the iframe code using the "Copy" button</li>
                                <li>Open the HTML page where you want the chat</li>
                                <li>Paste the code where you want the chat to appear</li>
                                <li>Adjust <code className="bg-purple-100 px-1 rounded">width</code> and <code className="bg-purple-100 px-1 rounded">height</code> as needed</li>
                            </ol>
                            <div className="mt-3 pt-3 border-t border-purple-200">
                                <p className="text-xs text-purple-700">
                                    ✨ <strong>Result:</strong> The chat widget will be embedded directly in your page content.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Info Section */}
                <div className="px-6 pb-6">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Your User ID</p>
                                <p className="font-mono text-slate-900 text-xs break-all">{user.id}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Widget URL</p>
                                <p className="font-mono text-slate-900 text-xs">https://docmind-frontend-app.vercel.app/widget</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Embed URL</p>
                                <p className="font-mono text-slate-900 text-xs break-all">{baseUrl}/embed/{user.id}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WidgetGenerator;
