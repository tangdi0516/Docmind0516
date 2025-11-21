import React, { useEffect } from 'react';
import { MessageSquare, Zap, Shield, ArrowRight, FileText, Search, Brain, Globe, CheckCircle, Check, BarChart } from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
    // Load chat widget script on landing page
    useEffect(() => {
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://docmind-frontend-app.vercel.app/loader.js';
        script.setAttribute('data-owner-id', 'user_35jBoKJruGS7H9k2fMGLY54Dwrp');
        script.async = true;

        // Append to body
        document.body.appendChild(script);

        // Cleanup function to remove script when component unmounts
        return () => {
            document.body.removeChild(script);
            // Also remove the widget elements if they exist
            const bubble = document.getElementById('docmind-chat-bubble');
            const container = document.getElementById('docmind-chat-container');
            if (bubble) bubble.remove();
            if (container) container.remove();
        };
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">DocMind</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#use-cases" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Use Cases</a>
                        <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
                    </div>
                    <button
                        onClick={onLoginClick}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        New: Advanced Vector Search Available
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        Chat with your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Knowledge Base</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        DocMind transforms your static documents into an intelligent, interactive AI assistant. Upload PDFs, Docs, and more to get instant answers.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                        <button
                            onClick={onLoginClick}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                        >
                            Start for Free <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-lg font-semibold rounded-xl transition-all">
                            View Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to master your data</h2>
                        <p className="text-lg text-slate-600">Powerful features designed to help you extract insights from your documents in seconds.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Brain className="w-6 h-6 text-indigo-600" />,
                                title: "AI-Powered Analysis",
                                description: "Advanced LLMs understand context and nuance in your documents, providing accurate and relevant answers."
                            },
                            {
                                icon: <Zap className="w-6 h-6 text-indigo-600" />,
                                title: "Instant Retrieval",
                                description: "Vector database technology ensures milliseconds latency when searching through thousands of pages."
                            },
                            {
                                icon: <Shield className="w-6 h-6 text-indigo-600" />,
                                title: "Enterprise Security",
                                description: "Bank-grade encryption for your data at rest and in transit. Your knowledge stays yours."
                            },
                            {
                                icon: <FileText className="w-6 h-6 text-indigo-600" />,
                                title: "Multi-Format Support",
                                description: "Upload PDF, DOCX, TXT, MD and more. We handle the parsing and chunking automatically."
                            },
                            {
                                icon: <Search className="w-6 h-6 text-indigo-600" />,
                                title: "Semantic Search",
                                description: "Search by meaning, not just keywords. Find what you're looking for even if you don't know the exact terms."
                            },
                            {
                                icon: <BarChart className="w-6 h-6 text-indigo-600" />,
                                title: "Usage Analytics",
                                description: "Track popular queries and usage patterns to understand what your team or users care about most."
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section id="use-cases" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Built for every team</h2>
                            <div className="space-y-8">
                                {[
                                    {
                                        title: "Customer Support",
                                        desc: "Instantly answer customer queries by training the AI on your help center articles and manuals."
                                    },
                                    {
                                        title: "Legal & Compliance",
                                        desc: "Quickly find clauses and regulations across thousands of legal contracts and compliance documents."
                                    },
                                    {
                                        title: "Researchers & Students",
                                        desc: "Synthesize information from multiple academic papers and research reports in seconds."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                                            <Check className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-slate-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl transform rotate-3 opacity-10"></div>
                            <div className="relative bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800">
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="space-y-4 font-mono text-sm">
                                    <div className="flex gap-4">
                                        <span className="text-indigo-400 shrink-0">User:</span>
                                        <span className="text-slate-300">What is the refund policy for annual subscriptions?</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-emerald-400 shrink-0">AI:</span>
                                        <span className="text-slate-300">According to the Terms of Service (Section 4.2), annual subscriptions can be refunded within the first 30 days. After that, a pro-rated credit is applied to your account.</span>
                                    </div>
                                    <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-700 text-xs text-slate-400">
                                        Source: Terms_of_Service_2024.pdf (Page 12)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
                        <p className="text-lg text-slate-600">Choose the plan that fits your needs. No hidden fees.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all relative">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">$0</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-slate-600 mb-8 text-sm">Perfect for individuals exploring the power of AI.</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    "1 Chatbot",
                                    "50 Documents",
                                    "1,000 Queries/mo",
                                    "Standard Support"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLoginClick} className="w-full py-3 px-4 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                                Get Started Free
                            </button>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">$29</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-slate-600 mb-8 text-sm">For professionals and growing teams.</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    "5 Chatbots",
                                    "1,000 Documents",
                                    "10,000 Queries/mo",
                                    "Priority Support",
                                    "API Access",
                                    "Custom Branding"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLoginClick} className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
                                Start Pro Trial
                            </button>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">Custom</span>
                            </div>
                            <p className="text-slate-600 mb-8 text-sm">For large organizations with specific needs.</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    "Unlimited Chatbots",
                                    "Unlimited Documents",
                                    "Unlimited Queries",
                                    "Dedicated Success Manager",
                                    "SLA Agreement",
                                    "On-premise Deployment"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-indigo-600 p-2 rounded-lg">
                                    <MessageSquare className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">DocMind</span>
                            </div>
                            <p className="max-w-xs text-sm">
                                Empowering teams to make better decisions with AI-driven document intelligence.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p>© 2024 DocMind Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
