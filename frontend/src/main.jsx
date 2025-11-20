import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import EmbedChat from './components/EmbedChat.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

// 从环境变量中读取 Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}

// Simple routing check
const isEmbed = window.location.pathname.startsWith('/embed/');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {isEmbed ? (
            <EmbedChat />
        ) : (
            /* 用 ClerkProvider 包裹 App，把 Key 传进去 */
            <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
                <App />
            </ClerkProvider>
        )}
    </React.StrictMode>,
)