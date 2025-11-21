import React, { useEffect, useState } from 'react';
import {
    MessageSquare,
    Zap,
    Shield,
    ArrowRight,
    FileText,
    Search,
    Brain,
    Globe,
    CheckCircle,
    Check,
    BarChart,
    Code,
    Terminal,
    ChevronDown,
    ChevronUp,
    Menu,
    X
} from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);

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

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">DocMind</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#integration" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Integration</a>
                        <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
                        <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">FAQ</a>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={onLoginClick} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                            Log in
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-4 shadow-xl">
                        <a href="#features" className="block text-sm font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Features</a>
                        <a href="#integration" className="block text-sm font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Integration</a>
                        <a href="#pricing" className="block text-sm font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                        <button onClick={onLoginClick} className="block w-full text-left text-sm font-medium text-indigo-600 font-bold">
                            Log in / Sign up
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                AI Customer Support Agent
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                                Customer Support <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">on Autopilot</span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                                Train a custom AI agent on your website content, PDFs, and docs in minutes.
                                Provide instant, 24/7 support without hiring a single human agent.
                            </p>
                            <div className="flex flex-col sm:flex-row items-start gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                                <button
                                    onClick={onLoginClick}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
                                >
                                    Start for Free <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-lg font-semibold rounded-2xl transition-all flex items-center gap-2 hover:border-slate-300">
                                    View Live Demo
                                </button>
                            </div>
                            <p className="mt-6 text-sm text-slate-500 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" /> No credit card required
                                <span className="mx-2">•</span>
                                <CheckCircle className="w-4 h-4 text-green-500" /> Setup in 2 minutes
                            </p>
                        </div>

                        {/* Hero Visual/Chat Demo */}
                        <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] opacity-20 blur-2xl animate-pulse"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="flex-1 text-center text-xs font-medium text-slate-400">docmind-agent.js</div>
                                </div>
                                <div className="p-6 space-y-6 bg-slate-50/50 h-[400px] flex flex-col">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-indigo-600">U</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm text-slate-700">
                                            Do you offer a free trial for the Pro plan?
                                        </div>
                                    </div>
                                    <div className="flex gap-4 flex-row-reverse">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                                            <BotIcon />
                                        </div>
                                        <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-md text-sm text-white">
                                            Yes! We offer a 14-day free trial for all our paid plans. You can cancel anytime during the trial period without being charged.
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-indigo-600">U</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm text-slate-700">
                                            How do I integrate this into my React app?
                                        </div>
                                    </div>
                                    <div className="flex gap-4 flex-row-reverse">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                                            <BotIcon />
                                        </div>
                                        <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-md text-sm text-white">
                                            It's very simple. Just add our script tag to your index.html or use our React component wrapper. Check out the Integration section below for the code!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-10 border-y border-slate-100 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted by forward-thinking companies</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos - using text for now but styled like logos */}
                        <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><Globe className="w-6 h-6" /> Acme Corp</span>
                        <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><Zap className="w-6 h-6" /> BoltShift</span>
                        <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><Shield className="w-6 h-6" /> SecureNet</span>
                        <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><Brain className="w-6 h-6" /> NeuralLab</span>
                        <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><Code className="w-6 h-6" /> DevFlow</span>
                    </div>
                </div>
            </section>

            {/* Features Bento Grid */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to automate support</h2>
                        <p className="text-lg text-slate-600">Powerful features designed to help you extract insights from your documents and serve your customers better.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Large Card 1 */}
                        <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-all group overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                    <Brain className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Train on your own data</h3>
                                <p className="text-slate-600 max-w-md">Upload PDF, DOCX, TXT files or simply paste your website URL. Our AI scrapes, processes, and learns everything about your business in seconds.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 w-1/3 h-full bg-gradient-to-l from-indigo-100/50 to-transparent"></div>
                            <FileText className="absolute -right-6 -bottom-6 w-48 h-48 text-indigo-100 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        </div>

                        {/* Tall Card */}
                        <div className="md:row-span-2 bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:shadow-xl transition-all group text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/10">
                                    <Zap className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Instant Answers</h3>
                                <p className="text-slate-400 mb-8">Reduce support ticket volume by up to 80%. Your AI agent answers instantly, 24/7, in 95+ languages.</p>

                                <div className="mt-auto bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-mono text-slate-400">Live Response</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                                        <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                                        <div className="h-2 bg-slate-700 rounded w-5/6"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Code className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Easy Integration</h3>
                            <p className="text-slate-600">Add a single line of code to your website and your widget is live. Works with React, Vue, WordPress, and more.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Private</h3>
                            <p className="text-slate-600">Your data is encrypted at rest and in transit. We never use your data to train our base models.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section id="integration" className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Integrates with any website in seconds</h2>
                            <p className="text-lg text-slate-400 mb-8">
                                Drop in a lightweight script—no backend changes required. Customize the look and feel to match your brand perfectly.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    "Works with any CMS (WordPress, Shopify, Webflow)",
                                    "React, Vue, Angular compatible",
                                    "Customizable colors and branding",
                                    "Lightweight (< 10kb)"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLoginClick} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                                Get Integration Code
                            </button>
                        </div>

                        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">index.html</div>
                            </div>
                            <div className="p-6 overflow-x-auto">
                                <pre className="font-mono text-sm leading-relaxed">
                                    <code className="text-slate-300">
                                        <span className="text-purple-400">&lt;body&gt;</span>{'\n'}
                                        {'  '}...{'\n'}
                                        {'  '}<span className="text-slate-500">{`<!-- DocMind Widget -->`}</span>{'\n'}
                                        {'  '}<span className="text-blue-400">&lt;script</span>{'\n'}
                                        {'    '}<span className="text-sky-300">src</span>=<span className="text-orange-300">"https://docmind.com/widget.js"</span>{'\n'}
                                        {'    '}<span className="text-sky-300">data-id</span>=<span className="text-orange-300">"YOUR_ORG_ID"</span>{'\n'}
                                        {'    '}<span className="text-sky-300">defer</span>{'\n'}
                                        {'  '}<span className="text-blue-400">&gt;&lt;/script&gt;</span>{'\n'}
                                        <span className="text-purple-400">&lt;/body&gt;</span>
                                    </code>
                                </pre>
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
                        <p className="text-lg text-slate-600">Start for free, scale as you grow. No hidden fees.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                        {/* Free Plan */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">$0</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <p className="text-slate-600 mb-8 text-sm">Perfect for testing and personal projects.</p>
                            <button onClick={onLoginClick} className="w-full py-3 px-4 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors mb-8">
                                Get Started Free
                            </button>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> 1 Chatbot</li>
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> 50 Documents</li>
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> 1,000 Queries/mo</li>
                            </ul>
                        </div>

                        {/* Pro Plan - Highlighted */}
                        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-indigo-600/40">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-bold text-white">$29</span>
                                <span className="text-slate-400">/mo</span>
                            </div>
                            <p className="text-slate-400 mb-8 text-sm">For growing businesses and teams.</p>
                            <button onClick={onLoginClick} className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25 mb-8">
                                Start 14-Day Free Trial
                            </button>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-400" /> 5 Chatbots</li>
                                <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-400" /> 1,000 Documents</li>
                                <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-400" /> Unlimited Queries</li>
                                <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-400" /> Remove Branding</li>
                                <li className="flex items-center gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-indigo-400" /> Priority Support</li>
                            </ul>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">Custom</span>
                            </div>
                            <p className="text-slate-600 mb-8 text-sm">For large organizations with specific needs.</p>
                            <button className="w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors mb-8">
                                Contact Sales
                            </button>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> Unlimited Chatbots</li>
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> Unlimited Documents</li>
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> SSO & SAML</li>
                                <li className="flex items-center gap-3 text-sm text-slate-600"><Check className="w-4 h-4 text-indigo-600" /> Dedicated Success Manager</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "How does DocMind train on my data?",
                                a: "DocMind scans your provided website URLs or uploaded documents (PDF, DOCX, TXT). It breaks down the text into semantic chunks and stores them in a vector database, allowing the AI to retrieve relevant context when answering questions."
                            },
                            {
                                q: "Can I customize the chatbot's appearance?",
                                a: "Yes! You can customize the color, logo, welcome message, and even the system prompt to match your brand's voice and style."
                            },
                            {
                                q: "What happens if the AI doesn't know the answer?",
                                a: "You can configure the AI to say 'I don't know' or provide a contact email for human support. We minimize hallucinations by strictly instructing the AI to only use your provided data."
                            },
                            {
                                q: "Is my data secure?",
                                a: "Absolutely. We use bank-grade encryption for data at rest and in transit. Your data is isolated and never used to train our base foundation models."
                            }
                        ].map((item, index) => (
                            <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-900">{item.q}</span>
                                    {activeFaq === index ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                </button>
                                {activeFaq === index && (
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-indigo-600 p-2 rounded-lg">
                                    <MessageSquare className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">DocMind</span>
                            </div>
                            <p className="max-w-xs text-sm leading-relaxed">
                                Empowering businesses with AI-driven customer support. Build your custom agent in minutes, not months.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#integration" className="hover:text-white transition-colors">Integration</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
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

function BotIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" fill="white" fillOpacity="0.2" />
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" fill="white" />
        </svg>
    );
}
