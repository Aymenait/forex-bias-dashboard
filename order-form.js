
/**
 * 3Ahub Order Form & Meta Pixel Optimization Logic
 */

(function () {
    // 1. Capture FBCLID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
        localStorage.setItem('fbclid', fbclid);
        console.log('✅ Captured FBCLID:', fbclid);
    }

    // Anti-Duplicate Tracker
    let lastEventTime = 0;
    function canTrack() {
        const now = Date.now();
        if (now - lastEventTime < 1000) return false; // Block if less than 1 second
        lastEventTime = now;
        return true;
    }

    // 2. Initialize Modal HTML
    document.addEventListener('DOMContentLoaded', () => {
        const modalHTML = `
            <div id="order-form-modal" class="custom-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-effect">
                    <button class="modal-close" id="close-order-form">&times;</button>
                    <div class="modal-header">
                        <div id="social-proof" class="social-proof-badge">
                            <span>🔥 12 people ordered today</span>
                        </div>
                        <h2 id="order-form-title">إتمام الطلب</h2>
                        <p id="order-form-subtitle">يرجى ملء البيانات للمتابعة إلى الواتساب</p>
                    </div>
                    <form id="order-info-form">
                        <div class="form-group">
                            <label for="customer-name" data-i18n="form.name">الاسم الكامل</label>
                            <input type="text" id="customer-name" name="name" required placeholder="مثال: محمد علي">
                        </div>
                        <div class="form-group">
                            <label for="customer-contact" data-i18n="form.contact">رقم الهاتف (أو الإيميل)</label>
                            <div class="phone-input-group">
                                <select id="country-code" class="country-select">
                                    <optgroup label="North Africa">
                                        <option value="+213">🇩🇿 +213 (Algeria)</option>
                                        <option value="+212">🇲🇦 +212 (Morocco)</option>
                                        <option value="+216">🇹🇳 +216 (Tunisia)</option>
                                        <option value="+218">🇱🇾 +218 (Libya)</option>
                                        <option value="+222">🇲🇷 +222 (Mauritania)</option>
                                    </optgroup>
                                    <optgroup label="Middle East">
                                        <option value="+966">🇸🇦 +966 (Saudi Arabia)</option>
                                        <option value="+971">🇦🇪 +971 (UAE)</option>
                                        <option value="+20">🇪🇬 +20 (Egypt)</option>
                                        <option value="+974">🇶🇦 +974 (Qatar)</option>
                                        <option value="+965">🇰🇼 +965 (Kuwait)</option>
                                        <option value="+968">🇴🇲 +968 (Oman)</option>
                                        <option value="+962">🇯🇴 +962 (Jordan)</option>
                                        <option value="+961">🇱🇧 +961 (Lebanon)</option>
                                        <option value="+964">🇮🇶 +964 (Iraq)</option>
                                    </optgroup>
                                    <optgroup label="Europe & World">
                                        <option value="+33">🇫🇷 +33 (France)</option>
                                        <option value="+34">🇪🇸 +34 (Spain)</option>
                                        <option value="+39">🇮🇹 +39 (Italy)</option>
                                        <option value="+49">🇩🇪 +49 (Germany)</option>
                                        <option value="+44">🇬🇧 +44 (UK)</option>
                                        <option value="+1">🇺🇸 +1 (USA / Canada)</option>
                                        <option value="+90">🇹🇷 +90 (Turkey)</option>
                                    </optgroup>
                                    <option value="">🌎 Other</option>
                                </select>
                                <input type="text" id="customer-contact" name="contact" required placeholder="770XXXXXX أو الإيميل">
                            </div>
                        </div>
                        <input type="hidden" id="order-product-name">
                        <input type="hidden" id="order-product-price">
                        <input type="hidden" id="order-product-currency">
                        <button type="submit" class="submit-order-btn">
                            <span data-i18n="form.submit">تأكيد ومتابعة للواتساب</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </form>
                    <p class="modal-footer-text" data-i18n="form.footer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-bottom: -2px;">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0110 0v4"></path>
                        </svg>
                        بياناتك آمنة ومحمية
                    </p>

                    <!-- Trust Badges -->
                    <div class="trust-badges">
                        <div class="trust-item">
                            <div class="trust-icon">🛡️</div>
                            <span id="trust-1">ضمان 100%</span>
                        </div>
                        <div class="trust-item">
                            <div class="trust-icon">⚡</div>
                            <span id="trust-2">تسليم فوري</span>
                        </div>
                        <div class="trust-item">
                            <div class="trust-icon">💬</div>
                            <span id="trust-3">دعم 24/7</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Event Listeners
        const modal = document.getElementById('order-form-modal');
        const closeBtn = document.getElementById('close-order-form');
        const form = document.getElementById('order-info-form');

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                modal.classList.remove('show');
            }
        });

        form.addEventListener('submit', handleOrderSubmit);

        // Setup Translation for the form
        if (window.i18n) {
            // If i18n is already initialized
            translateForm();
        }
    });

    function translateForm() {
        const translations = {
            ar: {
                title: 'إتمام الطلب',
                subtitle: 'يرجى ملء البيانات للمتابعة إلى الواتساب',
                name: 'الاسم الكامل',
                contact: 'رقم الهاتف (أو الإيميل)',
                placeholderContact: '770XXXXXX أو الإيميل',
                submit: 'تأكيد ومتابعة للواتساب',
                footer: 'بياناتك آمنة ومحمية',
                redirecting: 'جاري التحويل... ⏳',
                social: '🔥 طلب ${n} زبائن هذا المنتج اليوم',
                trust1: 'ضمان 100%',
                trust2: 'تسليم فوري',
                trust3: 'دعم 24/7'
            },
            en: {
                title: 'Complete Order',
                subtitle: 'Please fill in your details to continue to WhatsApp',
                name: 'Full Name',
                contact: 'Phone Number (or Email)',
                placeholderContact: '770XXXXXX or Email',
                submit: 'Confirm & Continue to WhatsApp',
                footer: 'Your data is safe and protected',
                redirecting: 'Redirecting... ⏳',
                social: '🔥 ${n} people ordered this today',
                trust1: '100% Guarantee',
                trust2: 'Instant Delivery',
                trust3: '24/7 Support'
            },
            fr: {
                title: 'Finaliser la commande',
                subtitle: 'Veuillez remplir vos coordonnées pour continuer vers WhatsApp',
                name: 'Nom complet',
                contact: 'Numéro de téléphone (ou Email)',
                placeholderContact: '770XXXXXX ou Email',
                submit: 'Confirmer et continuer sur WhatsApp',
                footer: 'Vos données sont sécurisées et protégées',
                redirecting: 'Redirection... ⏳',
                social: '🔥 ${n} personnes ont commandé aujourd\'hui',
                trust1: 'Garantie 100%',
                trust2: 'Livraison Instantanée',
                trust3: 'Support 24/7'
            }
        };

        const lang = window.currentLang || 'ar';
        const t = translations[lang] || translations.ar;

        // Random Social Proof Number between 8 and 25
        const randomNum = Math.floor(Math.random() * (25 - 8 + 1)) + 8;

        document.getElementById('order-form-title').innerText = t.title;
        document.getElementById('order-form-subtitle').innerText = t.subtitle;
        document.querySelector('label[for="customer-name"]').innerText = t.name;
        document.querySelector('label[for="customer-contact"]').innerText = t.contact;
        document.getElementById('customer-contact').placeholder = t.placeholderContact;
        document.querySelector('.submit-order-btn span').innerText = t.submit;
        document.querySelector('.modal-footer-text').innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-bottom: -2px;">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
            </svg>
            ${t.footer}
        `;

        document.getElementById('social-proof').innerText = t.social.replace('${n}', randomNum);
        document.getElementById('trust-1').innerText = t.trust1;
        document.getElementById('trust-2').innerText = t.trust2;
        document.getElementById('trust-3').innerText = t.trust3;
    }

    // Intercept original order functions
    const originalOrderProduct = window.orderProduct;
    const originalRedirectToWhatsApp = window.redirectToWhatsApp;

    window.orderProduct = function (arg1) {
        console.log('🚀 Intercepted orderProduct with:', arg1);

        let productName = '';
        let price = 0;
        let currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';

        // Check if we are on a landing page (which uses orderProduct(method))
        if (typeof PRODUCT_CONFIG !== 'undefined' && typeof currentDuration !== 'undefined') {
            const config = PRODUCT_CONFIG[currentDuration];

            // Determine product name based on page context
            if (window.location.pathname.includes('adobe')) productName = `Adobe Creative Cloud (${currentDuration})`;
            else if (window.location.pathname.includes('chatgpt')) productName = `ChatGPT Premium (${currentDuration})`;
            else if (window.location.pathname.includes('canva')) productName = `Canva Pro (${currentDuration})`;
            else if (window.location.pathname.includes('capcut')) productName = `CapCut Pro (${currentDuration})`;
            else if (window.location.pathname.includes('gamma')) productName = `Gamma AI (${currentDuration})`;
            else productName = document.title.split('-')[0].trim() + ` (${currentDuration})`;

            const isUSDPage = localStorage.getItem('currency') === 'USD' || window.location.search.includes('USD');
            price = isUSDPage ? config.usd : config.dzd;
            currency = isUSDPage ? 'USD' : 'DZD';
        } else {
            // Standard homepage/catalog orderProduct(productName)
            productName = arg1;

            if (typeof PRODUCTS !== 'undefined') {
                const product = Object.values(PRODUCTS).find(p => p.name === productName);
                if (product) {
                    price = currency === 'USD' ? product.price_usd : product.price_dzd;
                }
            }

            if (!price) {
                const buttons = document.querySelectorAll(`[onclick*="orderProduct('${productName}')"]`);
                buttons.forEach(btn => {
                    const card = btn.closest('.product-card');
                    if (card) {
                        const priceTag = card.querySelector('.price-tag');
                        if (priceTag) {
                            const attr = currency === 'USD' ? 'data-price-usd' : 'data-price-dzd';
                            const p = priceTag.getAttribute(attr);
                            if (p) price = p;
                        }
                    }
                });
            }
        }

        // 1. Track InitiateCheckout
        if (typeof fbq !== 'undefined' && canTrack()) {
            fbq('track', 'InitiateCheckout', {
                content_name: productName,
                value: parseFloat(price) || 0,
                currency: currency
            });
            console.log('🎯 Meta Pixel tracked: InitiateCheckout');
        }

        // 2. Populate and Show Modal
        document.getElementById('order-product-name').value = productName;
        document.getElementById('order-product-price').value = price;
        document.getElementById('order-product-currency').value = currency;

        translateForm(); // Refresh translation
        document.getElementById('order-form-modal').classList.add('show');
    };

    // 3. Global Interceptor for direct WhatsApp links
    document.addEventListener('click', function (e) {
        const target = e.target.closest('a');
        if (target && target.href && target.href.includes('wa.me')) {
            // Check if this link should be intercepted (ignore if it's already inside our modal)
            if (target.closest('.custom-modal')) return;

            e.preventDefault();
            console.log('🔗 Intercepted direct WhatsApp link:', target.href);

            // Try to guess product name from the page or link text
            let productName = target.innerText.replace(/🚀|اطلب الآن|اشترك الآن|Order Now/gi, '').trim();
            if (!productName || productName.length < 3) {
                productName = document.title.split('-')[0].trim();
            }

            // Trigger the intercepted orderProduct logic
            window.orderProduct(productName);
        }
    }, true);

    // Also intercept special product order functions
    const specialFunctions = [
        'orderAdobe', 'orderChatGPT', 'orderCapcut', 'orderGamma',
        'orderNetflix', 'orderCanva', 'orderGemini', 'orderYouTube', 'orderDuolingo',
        'orderHma', 'orderCursor', 'orderScispace', 'orderLovable'
    ];

    specialFunctions.forEach(funcName => {
        // Use an interval to catch functions even if they load slowly
        let attempts = 0;
        const interval = setInterval(() => {
            if (window[funcName]) {
                const original = window[funcName];
                window[funcName] = function () {
                    const originalRedirect = window.redirectToWhatsApp;
                    window.redirectToWhatsApp = function (name, price, currency) {
                        document.getElementById('order-product-name').value = name;
                        document.getElementById('order-product-price').value = price;
                        document.getElementById('order-product-currency').value = currency;

                        if (typeof fbq !== 'undefined' && canTrack()) {
                            fbq('track', 'InitiateCheckout', { content_name: name, value: parseFloat(price) || 0, currency: currency });
                            console.log('🎯 Meta Pixel tracked: InitiateCheckout (Special)');
                        }
                        translateForm();
                        document.getElementById('order-form-modal').classList.add('show');
                        window.redirectToWhatsApp = originalRedirect;
                    };
                    original();
                };
                clearInterval(interval);
            }
            if (++attempts > 20) clearInterval(interval);
        }, 500);
    });

    // Intercept window.open for WhatsApp links as a final fallback
    const originalOpen = window.open;
    window.open = function (url, target, features) {
        if (typeof url === 'string' && url.includes('wa.me')) {
            // Check if we are currently handling a form submission (don't intercept our own redirect)
            // We use a custom flag on the form to signal submission
            const form = document.getElementById('order-info-form');
            if (form && form.dataset.submitting === 'true') {
                return originalOpen.apply(window, arguments);
            }

            console.log('🌐 Intercepted window.open for WhatsApp:', url);
            window.orderProduct(document.title.split('-')[0].trim());
            return null;
        }
        return originalOpen.apply(window, arguments);
    };

    async function handleOrderSubmit(e) {
        e.preventDefault();
        const form = e.target;

        if (form.dataset.submitting === 'true') return;
        form.dataset.submitting = 'true';

        const submitBtn = form.querySelector('.submit-order-btn');
        const name = document.getElementById('customer-name').value.trim();
        const contactRaw = document.getElementById('customer-contact').value.trim();
        const countryCode = document.getElementById('country-code').value;

        // Build final contact string
        let contact = contactRaw;
        // If it looks like a phone number (no @), prepend country code
        if (!contactRaw.includes('@')) {
            // Remove leading zero if present in the rest of number
            let cleanNum = contactRaw.replace(/\D/g, '');
            if (cleanNum.startsWith('0')) cleanNum = cleanNum.slice(1);
            contact = countryCode + cleanNum;
        }

        // Simple Validation
        if (contactRaw.length < 5) {
            alert(window.currentLang === 'ar' ? 'يرجى إدخال بيانات صحيحة' : 'Please enter valid contact details');
            form.dataset.submitting = 'false';
            return;
        }

        // Set Loading State
        form.dataset.submitting = 'true';
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = window.currentLang === 'ar' ? 'جاري التحويل... ⏳' : 'Redirecting... ⏳';

        const productName = document.getElementById('order-product-name').value;
        const price = document.getElementById('order-product-price').value;
        const currency = document.getElementById('order-product-currency').value;
        const fbclid = localStorage.getItem('fbclid') || '';

        // 1. Send Lead Event to Meta Pixel with Advanced Matching
        if (typeof fbq !== 'undefined') {
            const isEmail = contact.includes('@');
            const userData = {};

            // Format data for Meta Pixel Advanced Matching
            if (isEmail) {
                userData.em = contact.toLowerCase().trim();
            } else {
                let cleanPh = contact.replace(/\D/g, '');
                if (cleanPh.startsWith('0')) cleanPh = '213' + cleanPh.slice(1);
                else if (!cleanPh.startsWith('213')) cleanPh = '213' + cleanPh;
                userData.ph = cleanPh;
            }

            userData.fn = name.split(' ')[0].toLowerCase().trim();
            userData.external_id = fbclid;

            // Set user data BEFORE tracking the lead
            fbq('set', 'user_data', userData);

            fbq('track', 'Lead', {
                content_name: productName,
                value: parseFloat(price) || 0,
                currency: currency,
                content_category: 'Prospect',
                page_location: window.location.href
            }, {
                eventID: 'lead_' + Date.now()
            });
            console.log('🎯 Meta Pixel Lead tracked with Enhanced Matching');
        }

        // 2. Save to Firebase
        if (window.db) {
            try {
                const { collection, addDoc, serverTimestamp } = window.firebaseFirestore || window.firebaseModules;
                await addDoc(collection(window.db, "leads"), {
                    name: name,
                    contact: contact,
                    product: productName,
                    price: price,
                    currency: currency,
                    fbclid: fbclid,
                    source: window.location.pathname,
                    timestamp: serverTimestamp(),
                    status: 'new'
                });
                console.log('📦 Lead saved to Firebase');
            } catch (err) {
                console.error('❌ Error saving to Firebase:', err);
            }
        }

        // 3. Final Redirect to WhatsApp
        const currencySym = currency === 'USD' ? '$' : 'DA';
        const messageAr = `مرحباً 👋\nلقد قمت بملء طلب في الموقع:\n\n👤 الاسم: ${name}\n📞 التواصل: ${contact}\n📦 الطلب: ${productName}\n💰 السعر: ${price} ${currencySym}\n\nشكراً 🙏`;
        const messageEn = `Hello 👋\nI just filled an order on the website:\n\n👤 Name: ${name}\n📞 Contact: ${contact}\n📦 Order: ${productName}\n💰 Price: ${price} ${currencySym}\n\nThank you 🙏`;

        const finalMessage = (window.currentLang === 'ar') ? messageAr : messageEn;

        // Hide modal
        document.getElementById('order-form-modal').classList.remove('show');

        // Open WhatsApp
        window.open(`https://wa.me/213782125821?text=${encodeURIComponent(finalMessage)}`, '_blank');

        // Reset flag after a delay
        setTimeout(() => { form.dataset.submitting = 'false'; }, 1000);
    }

})();
