document.addEventListener('DOMContentLoaded', () => {
    // 🆔 Device ID Management
    function getDeviceId() {
        let deviceId = localStorage.getItem('chat_device_id');
        if (!deviceId) {
            deviceId = 'usr_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('chat_device_id', deviceId);
        }
        return deviceId;
    }

    const deviceId = getDeviceId();

    // 📊 Track Visit
    async function trackVisit() {
        try {
            await fetch('https://motionless-appolonia-3a-5a61944b.koyeb.app/api/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, userAgent: navigator.userAgent })
            });
            console.log('📊 Visit tracked');
        } catch (e) { console.error('Tracking Error:', e); }
    }
    trackVisit();

    // ... (rest of code) ...

    submitFeedback.addEventListener('click', async () => {
        // ...
        try {
            await fetch('https://motionless-appolonia-3a-5a61944b.koyeb.app/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    rating: currentRating,
                    comment: comment
                })
            });

            // ...
        } catch (error) {
            // ...
        }
    });

    // ...

    // Send Message
    async function sendMessage() {
        // ...
        try {
            // Send to Backend
            const response = await fetch('https://motionless-appolonia-3a-5a61944b.koyeb.app/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: history,
                    language: selectedLang // Pass language
                })
            });

            // ...
        } catch (error) {
            // ...
        }
    }

    // Inject HTML for the chat widget
    const chatWidgetHTML = `
        <div class="chat-widget-fab" id="chatFab">
            <!-- Modern AI Spark Icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                <path d="M12 7v.01"></path>
                <path d="M16 11v.01"></path>
                <path d="M8 11v.01"></path>
            </svg>
        </div>

        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <h3>3Ahub AI</h3>
                <div style="display:flex; gap:10px;">
                    <button class="chat-header-btn" id="openFeedback" title="Rate Us">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </button>
                    <button class="chat-header-btn chat-close-btn" id="chatClose">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <!-- Initial: Language Selection -->
                <div class="language-selection" id="languageSelection">
                    <div class="lang-header">
                        <p>Select Language / اختر لغة</p>
                    </div>
                    
                    <button class="lang-btn" data-lang="ar" dir="rtl">
                        <span class="lang-flag">🇩🇿</span>
                        <span class="lang-text">العربية</span>
                        <span class="lang-arrow">←</span>
                    </button>
                    
                    <button class="lang-btn" data-lang="fr">
                        <span class="lang-flag">🇫🇷</span>
                        <span class="lang-text">Français</span>
                        <span class="lang-arrow">→</span>
                    </button>
                    
                    <button class="lang-btn" data-lang="en">
                        <span class="lang-flag">🇺🇸</span>
                        <span class="lang-text">English</span>
                        <span class="lang-arrow">→</span>
                    </button>
                </div>
            </div>

            <!-- Feedback Modal (Overlay) -->
            <div class="feedback-modal" id="feedbackModal" style="display:none;">
                <h4>Rate your experience</h4>
                <div class="stars" id="starContainer">
                    <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
                </div>
                <textarea id="feedbackComment" placeholder="Any advice for us? (Optional)" rows="3"></textarea>
                <button id="submitFeedback">Submit Feedback</button>
                <button id="closeFeedback" style="background:transparent; color:#64748b; margin-top:5px;">Cancel</button>
            </div>

            <div class="chat-input-area" id="chatInputArea" style="display:none;">
                <input type="text" id="chatInput" placeholder="" dir="auto" />
                <button class="chat-send-btn" id="chatSend">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>

        <style>
            /* --- Main Chat Widget Styles (Restored) --- */
            .chat-widget-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #2563eb, #1e40af);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 9999;
            }
            .chat-widget-fab:hover {
                transform: scale(1.1);
            }
            .chat-widget-fab svg {
                width: 30px;
                height: 30px;
            }

            .chat-window {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 350px;
                height: 500px;
                background: #ffffff;
                border-radius: 20px;
                box-shadow: 0 5px 30px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transform: translateY(20px);
                transition: all 0.3s ease;
                overflow: hidden;
            }
            .chat-window.open {
                opacity: 1;
                pointer-events: all;
                transform: translateY(0);
            }

            .chat-header {
                background: linear-gradient(135deg, #0f172a, #334155);
                color: white;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-radius: 20px 20px 0 0;
            }
            .chat-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #f8fafc;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .message {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 15px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            .message.user {
                align-self: flex-end;
                background: #2563eb;
                color: white;
                border-bottom-right-radius: 2px;
            }
            .message.bot {
                align-self: flex-start;
                background: #e2e8f0;
                color: #1e293b;
                border-bottom-left-radius: 2px;
            }

            .chat-input-area {
                padding: 15px;
                border-top: 1px solid #e2e8f0;
                background: white;
                display: flex;
                gap: 10px;
            }
            .chat-input-area input {
                flex: 1;
                border: 1px solid #cbd5e1;
                border-radius: 25px;
                padding: 10px 15px;
                outline: none;
                transition: border-color 0.2s;
            }
            .chat-input-area input:focus {
                border-color: #2563eb;
            }
            .chat-send-btn {
                background: #2563eb;
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s;
            }
            .chat-send-btn:hover {
                background: #1d4ed8;
            }

            /* Typing Indicator */
            .typing-indicator {
                display: flex;
                gap: 5px;
                padding: 10px;
                background: #e2e8f0;
                border-radius: 15px;
                align-self: flex-start;
                width: fit-content;
            }
            .typing-dot {
                width: 8px;
                height: 8px;
                background: #94a3b8;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }
            .typing-dot:nth-child(1) { animation-delay: 0s; }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.2); opacity: 1; }
            }

            /* --- Language & Feedback Styles (Preserved) --- */

            /* Language Header */
            .lang-header p {
                text-align: center;
                font-weight: 800;
                margin-bottom: 20px;
                color: #334155;
                font-size: 16px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }

            /* Premium Language Buttons */
            .lang-btn {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                padding: 16px 20px;
                border-radius: 16px;
                width: 100%;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                position: relative;
                overflow: hidden;
            }

            .lang-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: #e2e8f0;
                transition: background 0.3s;
            }

            .lang-btn:hover {
                border-color: #fbbf24;
                transform: translateY(-3px);
                box-shadow: 0 12px 20px -5px rgba(251, 191, 36, 0.15);
                background: #fffcf5; /* Subtle yellow tint */
            }

            .lang-btn:hover::before {
                background: #fbbf24; /* Gold bar on hover */
            }

            .lang-flag {
                font-size: 28px;
                margin-right: 15px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            }

            .lang-text {
                font-weight: 700;
                color: #1e293b;
                font-size: 17px;
                flex-grow: 1;
                text-align: left;
            }
            
            /* RTL specific adjust for Arabic */
            .lang-btn[dir="rtl"] .lang-text {
                text-align: right;
                margin-right: 15px;
            }
            .lang-btn[dir="rtl"] .lang-flag {
                margin-right: 0;
                margin-left: 15px;
            }
            .lang-btn[dir="rtl"] .lang-arrow {
                transform: rotate(180deg);
            }

            .lang-arrow {
                color: #cbd5e1;
                font-weight: bold;
                transition: color 0.3s, transform 0.3s;
            }

            .lang-btn:hover .lang-arrow {
                color: #fbbf24;
                transform: translateX(3px);
            }

            /* Reuse other styles */
            .chat-header-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 5px;
            }
            .chat-header-btn svg {
                width: 20px;
                height: 20px;
            }
            .chat-header-btn:hover {
                opacity: 0.8;
            }

            /* ... Feedback Modal Styles (Kept same) ... */
            .feedback-modal {
                position: absolute;
                top: 60px;
                left: 10px;
                right: 10px;
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 100;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            .feedback-modal h4 {
                margin: 0 0 15px 0;
                color: #1e293b;
            }
            .stars {
                font-size: 32px;
                color: #cbd5e1;
                cursor: pointer;
                margin-bottom: 15px;
            }
            .stars span.active {
                color: #fbbf24;
            }
            .stars span:hover {
                color: #fbbf24; 
            }
            .feedback-modal textarea {
                width: 100%;
                padding: 10px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                margin-bottom: 15px;
                font-family: inherit;
                resize: none;
            }
            .feedback-modal button#submitFeedback {
                background: linear-gradient(135deg, #FFB400, #F59E0B);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                width: 100%;
                font-weight: bold;
            }

        </style>
    `;

    // Append to body
    const div = document.createElement('div');
    div.innerHTML = chatWidgetHTML;
    document.body.appendChild(div);

    // Elements
    const chatFab = document.getElementById('chatFab');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    const chatInputArea = document.getElementById('chatInputArea');
    const languageSelection = document.getElementById('languageSelection');
    const langBtns = document.querySelectorAll('.lang-btn');

    // Feedback Elements
    const openFeedbackBtn = document.getElementById('openFeedback');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedback = document.getElementById('closeFeedback');
    const submitFeedback = document.getElementById('submitFeedback');
    const starContainer = document.getElementById('starContainer');
    const stars = starContainer.querySelectorAll('span');
    const feedbackComment = document.getElementById('feedbackComment');

    // State
    let isOpen = false;
    let history = [];
    let selectedLang = null;
    let currentRating = 0;

    // Toggle Chat
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('open');
            if (selectedLang) chatInput.focus();
        } else {
            chatWindow.classList.remove('open');
        }
    }

    chatFab.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);

    // Feedback Logic
    openFeedbackBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'flex';
    });

    closeFeedback.addEventListener('click', () => {
        feedbackModal.style.display = 'none';
    });

    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-val'));
            updateStars(currentRating);
        });
    });

    function updateStars(rating) {
        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-val')) <= rating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    }

    submitFeedback.addEventListener('click', async () => {
        if (currentRating === 0) {
            alert('Please select a star rating first!');
            return;
        }

        const comment = feedbackComment.value;
        const submitBtn = document.getElementById('submitFeedback');
        submitBtn.innerText = 'Sending...';

        try {
            await fetch('http://localhost:8000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    rating: currentRating,
                    comment: comment
                })
            });

            feedbackModal.innerHTML = `<h4>🎉 Thank You!</h4><p>Your feedback helps us improve.</p>`;
            setTimeout(() => {
                feedbackModal.style.display = 'none';
                // Reset form (optional, simplified here)
            }, 2000);

        } catch (error) {
            console.error('Feedback Error:', error);
            submitBtn.innerText = 'Error. Try again.';
        }
    });

    // Helper: Detect proper direction
    function getDirection(text) {
        // Simple check: if starts with arabic char, RTL. Else LTR.
        // But dir="auto" is usually better. 
        // We will force auto.
        return 'auto';
    }

    // Handle Language Selection
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    function setLanguage(lang) {
        selectedLang = lang;
        languageSelection.style.display = 'none';
        chatInputArea.style.display = 'flex';

        // Initial Greeting based on Language
        let greeting = "";
        let placeholder = "";

        if (lang === 'ar') {
            greeting = "سلام عليكم! 👋 <br> أنا الذكاء الاصطناعي الخاص بـ 3Ahub.<br>كيفاش نقدر نعاونك اليوم؟";
            placeholder = "اكتب سؤالك هنا...";
        } else if (lang === 'fr') {
            greeting = "Bonjour! 👋 <br> Je suis l'Assistant IA de 3Ahub.<br>Comment puis-je vous aider aujourd'hui ?";
            placeholder = "Écrivez votre message ici...";
        } else {
            greeting = "Hello! 👋 <br> I am the 3Ahub AI Assistant.<br>How can I help you today?";
            placeholder = "Type your message here...";
        }

        chatInput.placeholder = placeholder;
        addMessage(greeting, 'bot');
    }

    // Send Message
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add User Message
        addMessage(text, 'user');
        chatInput.value = '';

        // Add Typing Indicator
        const typingId = addTypingIndicator();

        try {
            // Send to Backend
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    history: history,
                    language: selectedLang // Pass language
                })
            });

            const data = await response.json();

            // Remove Typing Indicator
            removeMessage(typingId);

            if (data.success) {
                addMessage(data.reply, 'bot');
                // Update History
                history.push({ role: 'user', text: text });
                history.push({ role: 'bot', text: data.reply });
                // Limit history
                if (history.length > 20) history = history.slice(-20);
            } else {
                addMessage("عذراً، حدث خطأ في النظام. حاول مرة أخرى.", 'bot');
            }

        } catch (error) {
            removeMessage(typingId);
            addMessage("⚠️ عذراً، البوت غير متصل حالياً.\nيرجى التأكد من تشغيل السيرفر.", 'bot');
            console.error('Chat Error:', error);
        }
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Helper: Add Message
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);

        // Critical: Set text direction automatically
        msgDiv.setAttribute('dir', 'auto');

        // Convert newlines to breaks
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');

        chatMessages.appendChild(msgDiv);
        scrollToBottom();
        return msgDiv;
    }

    // Helper: Add Typing Indicator
    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = id;
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return id;
    }

    // Helper: Remove Message (for typing indicator)
    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Helper: Scroll to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
