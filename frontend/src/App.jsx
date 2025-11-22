import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import EmbedChat from './components/EmbedChat';
import WidgetChat from './components/WidgetChat';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import { MessageSquare } from 'lucide-react';

function App() {
    // Domain-based routing logic
    const hostname = window.location.hostname;
    const isLandingDomain = hostname === 'docmind.com.au' || hostname === 'www.docmind.com.au';

    // Helper to determine where to redirect login
    const getAppUrl = () => {
        if (hostname.includes('localhost')) return '/';
        return 'https://app.docmind.com.au';
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public embed routes - always accessible */}
                <Route path="/embed/:userId" element={<EmbedChat />} />
                <Route path="/standalone-widget" element={<WidgetChat />} />

                {/* Route for development/preview of Landing Page on any domain */}
                <Route path="/landing" element={<LandingPage onLoginClick={() => window.location.href = getAppUrl()} />} />

                {/* Root Route Logic */}
                <Route
                    path="/"
                    element={
                        isLandingDomain ? (
                            // Production Landing Page Domain
                            <LandingPage onLoginClick={() => window.location.href = 'https://app.docmind.com.au'} />
                        ) : (
                            // App Domain (app.docmind.com.au, localhost, vercel preview)
                            <>
                                <SignedOut>
                                    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
                                        <div className="mb-8 text-center">
                                            <div className="inline-flex items-center gap-3 mb-4">
                                                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-600/20">
                                                    <MessageSquare className="w-8 h-8 text-white" />
                                                </div>
                                                <h1 className="text-3xl font-bold text-slate-900">DocMind</h1>
                                            </div>
                                            <p className="text-slate-500 text-lg">Sign in to access your AI knowledge base</p>
                                        </div>
                                        <SignIn />
                                        {/* Link back to landing page for convenience */}
                                        <a href="https://docmind.com.au" className="mt-8 text-sm text-slate-400 hover:text-indigo-600 transition-colors">
                                            ← Back to Home
                                        </a>
                                    </div>
                                </SignedOut>
                                <SignedIn>
                                    <Navigate to="/dashboard" replace />
                                </SignedIn>
                            </>
                        )
                    }
                />

                {/* Protected Dashboard Routes - More semantic URLs */}
                <Route
                    path="/dashboard"
                    element={
                        <SignedIn>
                            <DashboardLayout />
                        </SignedIn>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <SignedIn>
                            <DashboardLayout />
                        </SignedIn>
                    }
                />
                <Route
                    path="/knowledge/*"
                    element={
                        <SignedIn>
                            <DashboardLayout />
                        </SignedIn>
                    }
                />
                <Route
                    path="/widget"
                    element={
                        <SignedIn>
                            <DashboardLayout />
                        </SignedIn>
                    }
                />
                <Route
                    path="/analytics"
                    element={
                        <SignedIn>
                            <DashboardLayout />
                        </SignedIn>
                    }
                />
                <Route
                    path="/settings/team"
                    element={
                        <SignedIn>
                            <DashboardLayout />
                        </SignedIn>
                    }
                />

                {/* Legacy redirects for backwards compatibility */}
                <Route path="/train" element={<Navigate to="/knowledge" replace />} />
                <Route path="/upload" element={<Navigate to="/knowledge" replace />} />
                <Route path="/logs" element={<Navigate to="/analytics" replace />} />
                <Route path="/team" element={<Navigate to="/settings/team" replace />} />
                <Route path="/widget-config" element={<Navigate to="/widget" replace />} />

                {/* Catch-all - redirect to root */}
                <Route path="/*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;