(function () {
    'use strict';

    // Get configuration from script tag
    const script = document.currentScript;
    const ownerId = script.getAttribute('data-owner-id');
    const widgetUrl = script.getAttribute('data-widget-url') || 'https://docmind-frontend-app.vercel.app/standalone-widget';

    if (!ownerId) {
        console.error('[DocMind Widget] Error: data-owner-id attribute is required');
        return;
    }

    // State
    let isOpen = false;
    let bubble, container, iframe;

    // Create chat bubble button
    function createChatBubble() {
        bubble = document.createElement('div');
        bubble.id = 'docmind-chat-bubble';
        bubble.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        `;

        // Styles
        Object.assign(bubble.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#4F46E5',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            zIndex: '9998'
        });

        bubble.addEventListener('mouseenter', () => {
            bubble.style.transform = 'scale(1.1)';
            bubble.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        });

        bubble.addEventListener('mouseleave', () => {
            bubble.style.transform = 'scale(1)';
            bubble.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        bubble.addEventListener('click', toggleChat);
        document.body.appendChild(bubble);
    }

    // Create chat container
    function createChatContainer() {
        container = document.createElement('div');
        container.id = 'docmind-chat-container';

        Object.assign(container.style, {
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '600px',
            maxHeight: 'calc(100vh - 120px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            display: 'none',
            zIndex: '9999',
            backgroundColor: 'white',
            transition: 'all 0.3s ease'
        });

        // Create iframe
        iframe = document.createElement('iframe');
        iframe.src = `${widgetUrl}?ownerId=${ownerId}`;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.allow = 'clipboard-read; clipboard-write';

        container.appendChild(iframe);
        document.body.appendChild(container);

        // Listen for messages from iframe
        window.addEventListener('message', handleMessage);
    }

    // Handle messages from iframe
    function handleMessage(event) {
        if (event.data && event.data.type === 'CLOSE_WIDGET') {
            closeChat();
        }
        if (event.data && event.data.type === 'UPDATE_WIDGET_COLOR') {
            if (bubble) {
                bubble.style.backgroundColor = event.data.color;
            }
        }
    }

    // Toggle chat window
    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    // Open chat
    function openChat() {
        container.style.display = 'block';
        // Trigger reflow for animation
        container.offsetHeight;
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
        isOpen = true;

        // Change bubble icon to X
        bubble.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    }

    // Close chat
    function closeChat() {
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        setTimeout(() => {
            container.style.display = 'none';
        }, 300);
        isOpen = false;

        // Change bubble icon back to chat
        bubble.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        `;
    }

    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        createChatBubble();
        createChatContainer();
    }

    // Expose global API
    window.DocMindWidget = {
        open: openChat,
        close: closeChat,
        toggle: toggleChat
    };
})();
