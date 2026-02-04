// Global variable for current product name
let currentProductName = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Immediate UI Logic (Synchronous)
    // Add i18n-ready class immediately
    document.body.classList.add('i18n-ready');

    // --- Animated Text Logic Start ---
    const animatedText = document.querySelector('.animated-text');
    if (animatedText) {
        const animatedTexts = {
            ar: ['الخدمات الرقمية الاحترافية', 'حسابات النخبة التعليمية', 'الإبداع بلا حدود', 'مستقبل الذكاء الاصطناعي', 'عروض حصرية واستثنائية', 'عالم من الإبهار', 'تجربة ترفيهية مميزة', 'احترافية تتجاوز التوقعات'],
            en: ['Premium Digital Services', 'Elite Educational Accounts', 'Creativity Without Limits', 'The Future of AI', 'Exclusive & Exceptional Offers', 'A World of Wonder', 'Unique Entertainment Experience', 'Professionalism Beyond Expectations'],
            fr: ['Services Numériques Premium', 'Comptes Éducatifs d\'Élite', 'Créativité Sans Limites', 'L\'Avenir de l\'IA', 'Offres Exclusives & Exceptionnelles', 'Un Monde d\'Émerveillement', 'Expérience de Divertissement Unique', 'Professionnalisme au-delà des Attentes']
        };

        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;
        let typingTimeout = null;

        function typeText() {
            if (typingTimeout) clearTimeout(typingTimeout);
            const texts = animatedTexts[window.currentLang] || animatedTexts.ar;
            if (!texts[textIndex]) textIndex = 0;
            const currentText = texts[textIndex];

            if (isDeleting) {
                animatedText.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 40;
            } else {
                animatedText.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 80;
            }

            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                typingSpeed = 1500;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typingSpeed = 200;
            }
            typingTimeout = setTimeout(typeText, typingSpeed);
        }

        typeText();

        window.updateAnimatedText = function () {
            if (typingTimeout) clearTimeout(typingTimeout);
            textIndex = 0;
            charIndex = 0;
            isDeleting = false;
            typeText();
        };
    }
    // --- Animated Text Logic End ---

    // 2. Async Initialization (Separate)
    (async () => {
        try {
            const expansionSystem = await initInternationalExpansion();
            console.log('✅ International expansion system ready');
            setupPaymentButtonListeners(expansionSystem.paymentManager);
        } catch (error) {
            console.error('❌ Failed to initialize international expansion:', error);
        }
    })();


    // 3D Tilt effect removed for better performance

    // Contact Choice Modal
    const contactChoiceModal = document.getElementById('contact-choice-modal');
    const contactChoiceCloseBtn = document.querySelector('.contact-choice-close');
    const orderBtns = document.querySelectorAll('.order-btn');

    console.log('Order buttons found:', orderBtns.length);

    // Add click event listeners to order buttons
    // This ensures the onclick handlers work properly on mobile
    orderBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const onclickAttr = this.getAttribute('onclick');
            if (onclickAttr) {
                // Execute the onclick attribute
                try {
                    eval(onclickAttr);
                } catch (err) {
                    console.error('Error executing onclick:', err);
                }
            } else {
                // Fallback: get product name from data attribute
                const productName = this.getAttribute('data-product');
                if (productName && typeof orderProduct === 'function') {
                    orderProduct(productName);
                }
            }
        });
    });

    const hideContactChoiceModal = () => {
        if (contactChoiceModal) {
            contactChoiceModal.style.opacity = '0';
            setTimeout(() => {
                contactChoiceModal.style.display = 'none';
                contactChoiceModal.classList.add('hidden');
                currentProductName = '';
            }, 300);
        }
    };

    if (contactChoiceCloseBtn) {
        contactChoiceCloseBtn.addEventListener('click', hideContactChoiceModal);
    }

    window.addEventListener('click', (event) => {
        if (contactChoiceModal && event.target === contactChoiceModal) {
            hideContactChoiceModal();
        }
    });

    // Crypto Payment Modal - Only run if elements exist
    const cryptoModal = document.getElementById('crypto-modal');
    const cryptoCloseBtn = document.querySelector('.crypto-close');
    const cryptoPayBtns = document.querySelectorAll('.crypto-pay-btn');
    const networkBtns = document.querySelectorAll('.network-btn');

    console.log('Crypto buttons found:', cryptoPayBtns.length);

    // Only setup payment modals if they exist on this page
    if (cryptoModal && cryptoPayBtns.length > 0 && networkBtns.length > 0) {
        console.log('Setting up crypto payment modal...');

        let currentCryptoProduct = '';
        let currentCryptoPriceDZD = 0;
        let selectedNetwork = 'TRC20';
        let selectedAddress = 'TWTgY41LNFqZcgBiRCZYsSq6ooeCx8gus9';

        cryptoPayBtns.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Crypto button clicked!');

                currentCryptoProduct = button.getAttribute('data-product');
                const priceDZD = button.getAttribute('data-price');
                const priceUSD = button.getAttribute('data-price-usd') || Math.ceil(priceDZD / 250); // استخدام السعر الصحيح من data-price-usd

                document.getElementById('crypto-product-name').textContent = currentCryptoProduct;
                document.getElementById('crypto-price-dzd').textContent = priceDZD;
                document.getElementById('crypto-price-usd').textContent = priceUSD;

                selectedNetwork = 'TRC20';
                selectedAddress = 'TWTgY41LNFqZcgBiRCZYsSq6ooeCx8gus9';
                updateWalletDisplay();

                console.log('Opening Crypto Modal:', cryptoModal);
                cryptoModal.style.display = 'flex';
                cryptoModal.classList.remove('hidden');
                cryptoModal.classList.add('show');

                // Track AddPaymentInfo when modal opens
                // Prevent double tracking if PaymentManager is also tracking this
                if (typeof fbq !== 'undefined' && !window.paymentManager) {
                    fbq('track', 'AddPaymentInfo', {
                        content_name: currentCryptoProduct,
                        value: parseFloat(priceDZD),
                        currency: 'DZD',
                        content_category: 'Crypto'
                    });
                }
            });
        });

        networkBtns.forEach(button => {
            button.addEventListener('click', () => {
                networkBtns.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                selectedNetwork = button.getAttribute('data-network');
                selectedAddress = button.getAttribute('data-address');
                updateWalletDisplay();
            });
        });

        function updateWalletDisplay() {
            document.getElementById('selected-network').textContent = selectedNetwork;
            document.getElementById('wallet-address').textContent = selectedAddress;
            document.getElementById('network-warning').textContent = selectedNetwork;

            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedAddress}`;
            document.getElementById('qr-code').src = qrCodeUrl;
        }

        if (cryptoCloseBtn) {
            cryptoCloseBtn.addEventListener('click', () => {
                cryptoModal.style.display = 'none';
                cryptoModal.classList.remove('show');
                cryptoModal.classList.add('hidden');
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === cryptoModal) {
                cryptoModal.style.display = 'none';
                cryptoModal.classList.remove('show');
                cryptoModal.classList.add('hidden');
            }
        });

        // RedotPay Modal - Only run if elements exist
        const redotpayModal = document.getElementById('redotpay-modal');
        const redotpayCloseBtn = document.querySelector('.redotpay-close');
        const redotpayBtns = document.querySelectorAll('.redotpay-btn');

        console.log('RedotPay buttons found:', redotpayBtns.length);

        if (redotpayModal && redotpayBtns.length > 0) {
            redotpayBtns.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('RedotPay button clicked!');
                    const productName = button.getAttribute('data-product');
                    const priceDZD = button.getAttribute('data-price');
                    const priceUSD = button.getAttribute('data-price-usd') || Math.ceil(priceDZD / 250); // استخدام السعر الصحيح من data-price-usd

                    document.getElementById('redotpay-product-name').textContent = productName;
                    document.getElementById('redotpay-price-dzd').textContent = priceDZD;
                    document.getElementById('redotpay-price-usd').textContent = priceUSD;

                    console.log('Opening RedotPay Modal:', redotpayModal);
                    redotpayModal.style.display = 'flex';
                    redotpayModal.classList.remove('hidden');
                    redotpayModal.classList.add('show');

                    // Track AddPaymentInfo when modal opens
                    // Prevent double tracking if PaymentManager is also tracking this
                    if (typeof fbq !== 'undefined' && !window.paymentManager) {
                        fbq('track', 'AddPaymentInfo', {
                            content_name: productName,
                            value: parseFloat(priceDZD),
                            currency: 'DZD',
                            content_category: 'RedotPay'
                        });
                    }
                });
            });

            if (redotpayCloseBtn) {
                redotpayCloseBtn.addEventListener('click', () => {
                    redotpayModal.style.display = 'none';
                    redotpayModal.classList.remove('show');
                    redotpayModal.classList.add('hidden');
                });
            }

            window.addEventListener('click', (event) => {
                if (event.target === redotpayModal) {
                    redotpayModal.style.display = 'none';
                    redotpayModal.classList.remove('show');
                    redotpayModal.classList.add('hidden');
                }
            });
        } // End of redotpay modal check
    } // End of crypto modal check

    // BaridiMob Modal - Only run if elements exist
    const baridimobModal = document.getElementById('baridimob-modal');
    const baridimobCloseBtn = document.querySelector('.baridimob-close');
    const baridimobBtns = document.querySelectorAll('.baridimob-btn');

    console.log('BaridiMob buttons found:', baridimobBtns.length);

    if (baridimobModal && baridimobBtns.length > 0) {

        baridimobBtns.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('BaridiMob button clicked!');

                const productName = button.getAttribute('data-product');
                const priceDZD = button.getAttribute('data-price');

                document.getElementById('baridimob-product-name').textContent = productName;
                document.getElementById('baridimob-price-dzd').textContent = priceDZD;

                console.log('Opening BaridiMob Modal:', baridimobModal);
                baridimobModal.style.display = 'flex';
                baridimobModal.classList.remove('hidden');
                baridimobModal.classList.add('show');

                // Track AddPaymentInfo when modal opens
                // Prevent double tracking if PaymentManager is also tracking this
                if (typeof fbq !== 'undefined' && !window.paymentManager) {
                    fbq('track', 'AddPaymentInfo', {
                        content_name: productName,
                        value: parseFloat(priceDZD),
                        currency: 'DZD',
                        content_category: 'BaridiMob'
                    });
                }
            });
        });

        if (baridimobCloseBtn) {
            baridimobCloseBtn.addEventListener('click', () => {
                baridimobModal.style.display = 'none';
                baridimobModal.classList.remove('show');
                baridimobModal.classList.add('hidden');
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === baridimobModal) {
                baridimobModal.style.display = 'none';
                baridimobModal.classList.remove('show');
                baridimobModal.classList.add('hidden');
            }
        });
    } // End of baridimob modal check

    // Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing after it becomes visible
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Particles.js Configuration
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 150,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#ffffff'
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 0.8,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.4,
                        sync: false
                    }
                },
                size: {
                    value: 4,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 3,
                        size_min: 0.3,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffffff',
                    opacity: 0.6,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1.5,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    repulse: {
                        distance: 150,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
    }

    // Hero Slider
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        if (index >= slides.length) currentSlide = 0;
        if (index < 0) currentSlide = slides.length - 1;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        currentSlide++;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide--;
        showSlide(currentSlide);
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', prevSlide);
        prevBtn.addEventListener('click', nextSlide);

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });

        setInterval(nextSlide, 5000);
    }
});

// Copy wallet address function
function copyWalletAddress() {
    const walletAddress = document.getElementById('wallet-address').textContent;
    navigator.clipboard.writeText(walletAddress).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;
        const copiedTexts = {
            ar: 'تم النسخ',
            en: 'Copied',
            fr: 'Copié'
        };
        const copiedText = copiedTexts[currentLang] || copiedTexts.ar;
        copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${copiedText}`;
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Confirm payment and redirect to WhatsApp
function confirmCryptoPayment() {
    const productName = document.getElementById('crypto-product-name').textContent;
    const priceUSD = document.getElementById('crypto-price-usd').textContent;
    const network = document.getElementById('selected-network').textContent;

    // Track Lead event with Meta Pixel (USD for Crypto payments)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            value: parseFloat(priceUSD),
            currency: 'USD',
            content_name: productName,
            content_type: 'product'
        });
    }

    const messages = {
        ar: `مرحباً 👋
قمت بالدفع بالكريبتو:

📦 المنتج: ${productName}
💰 المبلغ: ${priceUSD} USDT
🔗 الشبكة: ${network}

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك! 🙏`,
        en: `Hello 👋
I have paid with crypto:

📦 Product: ${productName}
💰 Amount: ${priceUSD} USDT
🔗 Network: ${network}

Please verify the payment and send the account to:
📧 Email: [Enter your email here]

Thank you! 🙏`,
        fr: `Bonjour 👋
J'ai payé avec crypto:

📦 Produit: ${productName}
💰 Montant: ${priceUSD} USDT
🔗 Réseau: ${network}

Veuillez vérifier le paiement et envoyer le compte à:
📧 Email: [Entrez votre email ici]

Merci! 🙏`
    };

    const message = messages[currentLang] || messages.ar;
    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    document.getElementById('crypto-modal').style.display = 'none';
}

// Copy RedotPay ID
function copyRedotPayID() {
    const redotpayID = document.getElementById('redotpay-id').textContent;
    navigator.clipboard.writeText(redotpayID).then(() => {
        const copyBtn = document.querySelectorAll('.copy-btn')[1];
        const originalText = copyBtn.innerHTML;
        const copiedTexts = {
            ar: 'تم النسخ',
            en: 'Copied',
            fr: 'Copié'
        };
        const copiedText = copiedTexts[currentLang] || copiedTexts.ar;
        copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${copiedText}`;
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Confirm RedotPay payment
function confirmRedotPayPayment() {
    const productName = document.getElementById('redotpay-product-name').textContent;
    const priceUSD = document.getElementById('redotpay-price-usd').textContent;

    // Track Lead event with Meta Pixel (USD for RedotPay payments)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            value: parseFloat(priceUSD),
            currency: 'USD',
            content_name: productName,
            content_type: 'product'
        });
    }

    const messages = {
        ar: `مرحباً 👋
قمت بالدفع عبر RedotPay:

📦 المنتج: ${productName}
💰 المبلغ: ${priceUSD} USD
💳 RedotPay ID: 1117632168

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك! 🙏`,
        en: `Hello 👋
I have paid via RedotPay:

📦 Product: ${productName}
💰 Amount: ${priceUSD} USD
💳 RedotPay ID: 1117632168

Please verify the payment and send the account to:
📧 Email: [Enter your email here]

Thank you! 🙏`,
        fr: `Bonjour 👋
J'ai payé via RedotPay:

📦 Produit: ${productName}
💰 Montant: ${priceUSD} USD
💳 RedotPay ID: 1117632168

Veuillez vérifier le paiement et envoyer le compte à:
📧 Email: [Entrez votre email ici]

Merci! 🙏`
    };

    const message = messages[currentLang] || messages.ar;
    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    document.getElementById('redotpay-modal').style.display = 'none';
}

// Copy BaridiMob RIP
function copyBaridiMobRIP() {
    const baridimobRIP = document.getElementById('baridimob-rip').textContent;
    navigator.clipboard.writeText(baridimobRIP).then(() => {
        const copyBtns = document.querySelectorAll('.copy-btn');
        const copyBtn = copyBtns[copyBtns.length - 1];
        const originalText = copyBtn.innerHTML;
        const copiedTexts = {
            ar: 'تم النسخ',
            en: 'Copied',
            fr: 'Copié'
        };
        const copiedText = copiedTexts[currentLang] || copiedTexts.ar;
        copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${copiedText}`;
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Confirm BaridiMob payment
function confirmBaridiMobPayment() {
    const productName = document.getElementById('baridimob-product-name').textContent;
    const priceDZD = document.getElementById('baridimob-price-dzd').textContent;

    // Track Lead event with Meta Pixel (DZD for BaridiMob/CCP payments)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            value: parseFloat(priceDZD),
            currency: 'DZD',
            content_name: productName,
            content_type: 'product'
        });
    }

    const messages = {
        ar: `مرحباً 👋
قمت بالدفع عبر BaridiMob:

📦 المنتج: ${productName}
💰 المبلغ: ${priceDZD} DZD
💳 RIP: 00799999002787548473

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك! 🙏`,
        en: `Hello 👋
I have paid via BaridiMob:

📦 Product: ${productName}
💰 Amount: ${priceDZD} DZD
💳 RIP: 00799999002787548473

Please verify the payment and send the account to:
📧 Email: [Enter your email here]

Thank you! 🙏`,
        fr: `Bonjour 👋
J'ai payé via BaridiMob:

📦 Produit: ${productName}
💰 Montant: ${priceDZD} DZD
💳 RIP: 00799999002787548473

Veuillez vérifier le paiement et envoyer le compte à:
📧 Email: [Entrez votre email ici]

Merci! 🙏`
    };

    const message = messages[currentLang] || messages.ar;
    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    document.getElementById('baridimob-modal').style.display = 'none';
}


// Reviews Management
let reviews = [];
let selectedRating = 0;
let selectedImage = null;
let firebaseReady = false;

// Wait for Firebase to be ready
window.addEventListener('firebaseReady', () => {
    firebaseReady = true;
    loadReviewsFromFirebase();
});

// Star Rating Selection
document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('#star-rating .star');
    const ratingValue = document.getElementById('rating-value');
    const imageInput = document.getElementById('review-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageName = document.getElementById('image-name');
    const removeImageBtn = document.getElementById('remove-image');

    const ratingTexts = {
        1: '⭐ سيء',
        2: '⭐⭐ مقبول',
        3: '⭐⭐⭐ جيد',
        4: '⭐⭐⭐⭐ ممتاز',
        5: '⭐⭐⭐⭐⭐ رائع!'
    };

    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            ratingValue.value = selectedRating;
            updateStarDisplay(selectedRating);

            // Show rating text
            const ratingText = document.getElementById('rating-text');
            if (ratingText) {
                ratingText.textContent = ratingTexts[selectedRating];
            }
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            updateStarDisplay(rating);
            star.style.transform = 'scale(1.2)';
        });

        star.addEventListener('mouseleave', () => {
            star.style.transform = 'scale(1)';
        });
    });

    document.getElementById('star-rating').addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
    });

    // Image Upload Handler
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('حجم الصورة كبير جداً! الحد الأقصى 2MB');
                imageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                selectedImage = event.target.result;
                previewImg.src = selectedImage;
                imagePreview.classList.remove('hidden');
                imageName.textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    });

    // Remove Image
    removeImageBtn.addEventListener('click', () => {
        selectedImage = null;
        imageInput.value = '';
        imagePreview.classList.add('hidden');
        imageName.textContent = '';
    });

    // Review Form Submit
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!firebaseReady) {
                alert('جاري التحميل... الرجاء المحاولة مرة أخرى');
                return;
            }

            // Check if user already reviewed
            if (hasUserReviewed()) {
                const messages = {
                    ar: '⚠️ لقد قمت بإضافة تقييم مسبقاً!\n\nيمكنك إضافة تقييم واحد فقط.\nشكراً لك! 🙏',
                    en: '⚠️ You have already submitted a review!\n\nYou can only submit one review.\nThank you! 🙏',
                    fr: '⚠️ Vous avez déjà soumis un avis!\n\nVous ne pouvez soumettre qu\'un seul avis.\nMerci! 🙏'
                };
                alert(messages[currentLang] || messages.ar);
                return;
            }

            const name = document.getElementById('reviewer-name').value.trim();
            const rating = parseInt(document.getElementById('rating-value').value);
            const platform = document.getElementById('platform').value;
            const comment = document.getElementById('review-comment').value.trim();

            if (!name || !rating || !platform) {
                alert('الرجاء ملء جميع الحقول المطلوبة');
                return;
            }

            const review = {
                name: name,
                rating: rating,
                platform: platform,
                comment: comment,
                image: selectedImage,
                date: new Date().toLocaleDateString('ar-DZ'),
                timestamp: Date.now()
            };

            try {
                // Add to Firebase
                const { collection, addDoc } = window.firebaseModules;
                await addDoc(collection(window.db, 'reviews'), review);

                // Send email notification
                sendEmailNotification(review);

                // Reset form
                document.getElementById('review-form').reset();
                selectedRating = 0;
                selectedImage = null;
                updateStarDisplay(0);
                imagePreview.classList.add('hidden');
                imageName.textContent = '';

                // Refresh reviews display
                await loadReviewsFromFirebase();

                // Mark user as reviewed
                markUserAsReviewed();

                alert('شكراً لك! تم إضافة تقييمك بنجاح ✅');
            } catch (error) {
                console.error('Error adding review:', error);
                alert('حدث خطأ أثناء إضافة التقييم. الرجاء المحاولة مرة أخرى.');
            }
        });

        // Check review status on page load
        updateReviewFormStatus();
    }
});

function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('#star-rating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#fbbf24'; // Yellow/Gold
        } else {
            star.style.color = '#4b5563'; // Gray
        }
    });
}

let showAllReviews = false;
const REVIEWS_PER_PAGE = 6;

function displayReviews() {
    const container = document.getElementById('reviews-container');
    const showMoreContainer = document.getElementById('show-more-container');
    const showMoreBtn = document.getElementById('show-more-btn');

    // Safety check: if container doesn't exist, exit function
    if (!container) return;

    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center text-gray-400 py-8">
                <p data-i18n="reviews.noReviews">كن أول من يضيف تقييم! ⭐</p>
            </div>
        `;
        if (showMoreContainer) showMoreContainer.style.display = 'none';
        return;
    }

    // Determine how many reviews to show
    const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, REVIEWS_PER_PAGE);

    reviewsToShow.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'bg-[#111]/80 rounded-lg border border-matrix-green/30 p-3 hover:border-matrix-green transition-all relative';

        const starsHTML = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

        // Check if admin mode is active
        const isAdminMode = sessionStorage.getItem('adminMode') === 'true';

        reviewCard.innerHTML = `
            ${isAdminMode ? `
                <button onclick="deleteReview(${review.id})" 
                        class="delete-btn absolute top-2 left-2 text-red-400 hover:text-red-300 transition-colors bg-black/50 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        title="حذف التقييم">
                    ✕
                </button>
            ` : ''}
            <div class="flex items-start justify-between mb-1.5 ${isAdminMode ? 'pr-6' : ''}">
                <div>
                    <h4 class="text-white font-bold text-sm">${escapeHtml(review.name)}</h4>
                    <p class="text-gray-400 text-xs">${review.date}</p>
                </div>
                <span class="text-xs px-2 py-0.5 bg-matrix-green/20 text-matrix-green rounded-full">${review.platform}</span>
            </div>
            <div class="flex gap-0.5 mb-1.5">
                ${starsHTML.split('').map(star =>
            `<span class="${star === '★' ? 'text-yellow-400' : 'text-gray-600'} text-base">${star}</span>`
        ).join('')}
            </div>
            ${review.comment ? `<p class="text-gray-300 text-xs leading-relaxed mb-2">"${escapeHtml(review.comment)}"</p>` : ''}
            ${review.image ? `
                <div class="mt-2">
                    <img src="${review.image}" 
                         class="w-full h-32 object-cover rounded-lg border border-matrix-green/30 cursor-pointer hover:border-matrix-green transition-all"
                         onclick="openImageModal('${review.image}')"
                         alt="Review Image">
                </div>
            ` : ''}
        `;

        container.appendChild(reviewCard);
    });

    // Show/Hide "Show More" button
    if (showMoreContainer && showMoreBtn) {
        if (reviews.length > REVIEWS_PER_PAGE) {
            showMoreContainer.style.display = 'block';
            showMoreBtn.textContent = showAllReviews ? 'عرض أقل' : `عرض المزيد (${reviews.length - REVIEWS_PER_PAGE}+)`;
            showMoreBtn.onclick = () => {
                showAllReviews = !showAllReviews;
                displayReviews();
                if (!showAllReviews) {
                    const reviewsContainer = document.getElementById('reviews-container');
                    if (reviewsContainer) reviewsContainer.scrollIntoView({ behavior: 'smooth' });
                }
            };
        } else {
            showMoreContainer.style.display = 'none';
        }
    }
}

function updateAverageRating() {
    const totalReviews = reviews.length;
    const totalReviewsEl = document.getElementById('total-reviews');
    if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;

    if (totalReviews === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const roundedRating = Math.round(averageRating);

    const averageStarsContainer = document.getElementById('average-stars');
    averageStarsContainer.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = i <= roundedRating ? 'text-yellow-400 text-2xl' : 'text-gray-600 text-2xl';
        star.textContent = i <= roundedRating ? '★' : '☆';
        averageStarsContainer.appendChild(star);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Image Modal Functions
function openImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imageSrc;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Close modal when clicking outside the image
document.addEventListener('DOMContentLoaded', () => {
    const imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }
});

// Generate unique browser fingerprint
function getBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);

    const fingerprint = canvas.toDataURL();
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;

    const combined = fingerprint + userAgent + language + platform + screenResolution;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return 'fp_' + Math.abs(hash).toString(36);
}

// Check if user has already reviewed
function hasUserReviewed() {
    const fingerprint = getBrowserFingerprint();
    const reviewData = localStorage.getItem('trw_user_review');

    if (!reviewData) return false;

    try {
        const data = JSON.parse(reviewData);
        return data.fingerprint === fingerprint;
    } catch (e) {
        return false;
    }
}

// Mark user as reviewed
function markUserAsReviewed() {
    const fingerprint = getBrowserFingerprint();
    const reviewData = {
        fingerprint: fingerprint,
        timestamp: Date.now(),
        date: new Date().toISOString()
    };

    localStorage.setItem('trw_user_review', JSON.stringify(reviewData));
}

// Update review form status
function updateReviewFormStatus() {
    if (hasUserReviewed()) {
        const form = document.getElementById('review-form');
        const formContainer = form.parentElement;

        // Add "already reviewed" message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-matrix-green/10 border border-matrix-green/30 rounded-xl p-4 text-center';
        messageDiv.innerHTML = `
            <div class="text-matrix-green text-lg font-bold mb-2">✅ <span data-i18n="reviews.alreadyReviewed">شكراً لك!</span></div>
            <p class="text-gray-300 text-sm" data-i18n="reviews.alreadyReviewedMsg">لقد قمت بإضافة تقييمك مسبقاً. يمكنك إضافة تقييم واحد فقط.</p>
        `;

        // Hide form and show message
        form.style.display = 'none';
        formContainer.insertBefore(messageDiv, form);
    }
}

// Send Email Notification
function sendEmailNotification(review) {
    // Prepare email parameters
    const templateParams = {
        name: review.name,
        rating: review.rating,
        platform: review.platform,
        date: review.date,
        comment: review.comment || 'لا يوجد تعليق'
    };

    // Send email using EmailJS
    emailjs.send('service_lz55dze', 'template_xvt5j6a', templateParams)
        .then(function (response) {
            console.log('Email sent successfully!', response.status, response.text);
        }, function (error) {
            console.error('Failed to send email:', error);
        });
}

// Load Reviews from Firebase
async function loadReviewsFromFirebase() {
    try {
        if (!window.firebaseModules || !window.db) {
            console.log('Firebase not ready yet');
            return;
        }

        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'reviews'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        reviews = [];
        querySnapshot.forEach((doc) => {
            reviews.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayReviews();
        updateAverageRating();
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Delete Review Function
async function deleteReview(reviewId) {
    const confirmMessages = {
        ar: 'هل أنت متأكد من حذف هذا التقييم؟',
        en: 'Are you sure you want to delete this review?',
        fr: 'Êtes-vous sûr de vouloir supprimer cet avis?'
    };

    const message = confirmMessages[currentLang] || confirmMessages.ar;

    if (confirm(message)) {
        try {
            // Delete from Firebase
            const { doc, deleteDoc } = window.firebaseModules;
            await deleteDoc(doc(window.db, 'reviews', reviewId));

            // Refresh display
            await loadReviewsFromFirebase();

            // Show success message
            const successMessages = {
                ar: 'تم حذف التقييم بنجاح ✓',
                en: 'Review deleted successfully ✓',
                fr: 'Avis supprimé avec succès ✓'
            };
            alert(successMessages[currentLang] || successMessages.ar);
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('حدث خطأ أثناء حذف التقييم');
        }
    }
}

// ============================================
// ADMIN MODE - PASSWORD PROTECTED
// ============================================
// To activate: Triple-click on "⭐ تقييمات العملاء" title
// Current password: AYMEN2004
// Change the password in the code below for security
// ============================================

// Toggle Admin Mode (Triple click on title to activate)
let clickCount = 0;
let clickTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    const reviewsTitle = document.querySelector('[data-i18n="reviews.title"]');
    if (reviewsTitle) {
        reviewsTitle.addEventListener('click', () => {
            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            } else if (clickCount === 3) {
                clearTimeout(clickTimer);
                clickCount = 0;

                // Toggle admin mode
                const isAdminMode = sessionStorage.getItem('adminMode') === 'true';

                if (!isAdminMode) {
                    // Ask for password
                    const passwordMessages = {
                        ar: '🔐 أدخل كلمة المرور للوصول إلى وضع الإدارة:',
                        en: '🔐 Enter password to access admin mode:',
                        fr: '🔐 Entrez le mot de passe pour accéder au mode admin:'
                    };

                    const password = prompt(passwordMessages[currentLang] || passwordMessages.ar);

                    // Simple password check (you can change this password)
                    if (password === 'AYMEN2004') {
                        sessionStorage.setItem('adminMode', 'true');
                        document.getElementById('admin-controls').style.display = 'block';
                        displayReviews(); // Refresh to show delete buttons

                        const successMessages = {
                            ar: '✓ وضع الإدارة مفعّل! يمكنك الآن حذف التقييمات',
                            en: '✓ Admin mode activated! You can now delete reviews',
                            fr: '✓ Mode admin activé! Vous pouvez maintenant supprimer les avis'
                        };
                        alert(successMessages[currentLang] || successMessages.ar);
                    } else if (password !== null) {
                        const errorMessages = {
                            ar: '✕ كلمة المرور خاطئة!',
                            en: '✕ Incorrect password!',
                            fr: '✕ Mot de passe incorrect!'
                        };
                        alert(errorMessages[currentLang] || errorMessages.ar);
                    }
                } else {
                    // Deactivate admin mode
                    sessionStorage.removeItem('adminMode');
                    document.getElementById('admin-controls').style.display = 'none';
                    displayReviews(); // Refresh to hide delete buttons

                    const deactivateMessages = {
                        ar: 'تم إلغاء وضع الإدارة',
                        en: 'Admin mode deactivated',
                        fr: 'Mode admin désactivé'
                    };
                    alert(deactivateMessages[currentLang] || deactivateMessages.ar);
                }
            }
        });
    }

    // Check if admin mode is active on page load
    if (sessionStorage.getItem('adminMode') === 'true') {
        document.getElementById('admin-controls').style.display = 'block';
    }
});

// Clear All Reviews
async function toggleAdminMode() {
    const confirmMessages = {
        ar: '⚠️ تحذير!\n\nهل أنت متأكد من حذف جميع التقييمات؟\nهذا الإجراء لا يمكن التراجع عنه!',
        en: '⚠️ Warning!\n\nAre you sure you want to delete all reviews?\nThis action cannot be undone!',
        fr: '⚠️ Attention!\n\nÊtes-vous sûr de vouloir supprimer tous les avis?\nCette action est irréversible!'
    };

    const message = confirmMessages[currentLang] || confirmMessages.ar;

    if (confirm(message)) {
        // Double confirmation
        const doubleConfirmMessages = {
            ar: 'تأكيد نهائي: اكتب "حذف" للمتابعة',
            en: 'Final confirmation: Type "DELETE" to continue',
            fr: 'Confirmation finale: Tapez "SUPPRIMER" pour continuer'
        };

        const confirmWords = {
            ar: 'حذف',
            en: 'DELETE',
            fr: 'SUPPRIMER'
        };

        const userInput = prompt(doubleConfirmMessages[currentLang] || doubleConfirmMessages.ar);

        if (userInput === confirmWords[currentLang]) {
            try {
                // Delete all reviews from Firebase
                const { collection, getDocs, deleteDoc, doc } = window.firebaseModules;
                const querySnapshot = await getDocs(collection(window.db, 'reviews'));

                const deletePromises = [];
                querySnapshot.forEach((document) => {
                    deletePromises.push(deleteDoc(doc(window.db, 'reviews', document.id)));
                });

                await Promise.all(deletePromises);

                // Refresh display
                await loadReviewsFromFirebase();

                const successMessages = {
                    ar: 'تم حذف جميع التقييمات بنجاح ✓',
                    en: 'All reviews deleted successfully ✓',
                    fr: 'Tous les avis supprimés avec succès ✓'
                };
                alert(successMessages[currentLang] || successMessages.ar);

                // Hide admin controls
                document.getElementById('admin-controls').style.display = 'none';
            } catch (error) {
                console.error('Error deleting all reviews:', error);
                alert('حدث خطأ أثناء حذف التقييمات');
            }
        }
    }
}

// Scarcity Counter Management
function updateSeatsCounter() {
    const seatsRemainingEl = document.getElementById('seats-remaining');
    const progressBar = document.getElementById('seats-progress');

    // Check if elements exist (they might not be on all pages)
    if (!seatsRemainingEl || !progressBar) {
        return;
    }

    const seatsRemaining = 12; // قم بتحديث هذا الرقم يدوياً حسب المبيعات
    const totalSeats = 15;
    const seatsTaken = totalSeats - seatsRemaining;
    const progressPercentage = (seatsTaken / totalSeats) * 100;

    seatsRemainingEl.textContent = seatsRemaining;
    progressBar.style.width = progressPercentage + '%';

    // تغيير لون البار حسب الكمية المتبقية
    if (seatsRemaining <= 3) {
        progressBar.className = 'bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-500';
    } else if (seatsRemaining <= 7) {
        progressBar.className = 'bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500';
    } else {
        progressBar.className = 'bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500';
    }
}

// تحديث العداد عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateSeatsCounter);

// Multi-language support
const translations = {
    ar: {
        'brand.tagline': 'التميز الرقمي.. بين يديك',
        'nav.products': 'منتجاتنا المختارة',
        'nav.reviews': '⭐ آراء النخبة',
        'nav.contact': 'واتساب',
        'nav.telegram': 'تيليجرام',
        'hero.title': 'منصتك المتكاملة لكل ما تحتاجه من',
        'hero.description': 'حسابات تعليمية، أدوات إبداعية، وحلول ذكاء اصطناعي مصممة لدعم أعمالك ومشاريعك بأفضل الأسعار وخدمة عملاء احترافية.',
        'hero.explore': 'استكشف المنتجات',
        'hero.learn': 'اكتشف خدماتنا',
        'badge.clients': 'عميل سعيد',
        'badge.support': 'دعم فني',
        'badge.experience': 'سنوات خبرة',
        'card1.title': 'حلول تعليمية متكاملة',
        'card1.desc': 'وصول فوري لأفضل الكورسات والمنصات العالمية مع ضمان التفعيل.',
        'card2.title': 'دعم مخصص لكل مشروع',
        'card2.desc': 'نتابع طلبك خطوة بخطوة لضمان تجربة سلسة ونتائج مذهلة.',
        'products.badge': 'عروض مميزة',
        'products.title': 'اختر الباقة الأنسب لاحتياجاتك',
        'products.subtitle': 'منتجات رقمية مختارة بعناية لمساعدتك على التعلم، التصميم، وتنمية عملك بمرونة واحترافية.',
        'product.trw.desc': 'حساب مشترك للكورسات ومنصة The Real World، مع دعم فني وضمان كامل.',
        'product.trw.feature1': 'دخول لجميع الكورسات الحالية',
        'product.trw.feature2': 'تحديثات دورية ومحتوى جديد',
        'product.trw.feature3': 'دعم فني عربي سريع',
        'product.adobe.desc': 'اشتراك Adobe Creative Cloud يشمل أكثر من 20 تطبيقًا احترافيًا.',
        'product.adobe.selectType': 'اختر نوع الحساب:',
        'product.adobe.shared': 'حساب مشترك',
        'product.adobe.personal': 'حساب شخصي (Keys)',
        'product.adobe.oneMonth': 'شهر واحد',
        'product.adobe.twoMonths': 'شهرين',
        'product.adobe.threeMonths': '3 أشهر',
        'product.adobe.sixMonths': '6 أشهر',
        'product.adobe.selectDuration': 'اختر المدة:',
        'product.adobe.shared.price1': 'شهر واحد: <strong>1500 د.ج</strong>',
        'product.adobe.shared.price2': '3 أشهر: <strong>3000 د.ج</strong>',
        'product.adobe.personal.price1': 'شهر واحد: <strong>3000 د.ج</strong>',
        'product.adobe.personal.price2': '3 أشهر: <strong>4500 د.ج</strong>',
        'product.gamma.selectType': 'اختر نوع الحساب:',
        'product.gamma.shared': 'حساب مشترك',
        'product.gamma.personal': 'حساب شخصي',
        'product.adobe.feature1': 'أكثر من 20 تطبيق احترافي (الكل)',
        'product.adobe.feature2': '4000 نقطة ذكاء اصطناعي (Firefly Credits)',
        'product.adobe.feature3': 'حساب خاص (Private) مع تحكم كامل بالبيانات',
        'product.chatgpt.desc': 'حسابات ChatGPT و Teachers فردية بمساحة عمل خاصة وأمان تام.',
        'product.chatgpt.selectType': 'اختر نوع الاشتراك:',
        'product.chatgpt.business': 'Plus',
        'product.chatgpt.teachers': 'Teachers',
        'product.chatgpt.go': 'حساب GO (سنة)',
        'product.chatgpt.wholesale': 'جملة (Reseller)',
        'product.chatgpt.oneMonth': 'شهر واحد',
        'product.chatgpt.threeMonths': '3 أشهر',
        'product.chatgpt.sixMonths': '6 أشهر',
        'product.chatgpt.twelveMonths': '12 شهر',
        'product.chatgpt.resellerPack': 'حساب (1+5)',
        'product.chatgpt.feature1': 'وصول لأحدث نماذج GPT',
        'product.chatgpt.feature2': 'مساحة عمل خاصة وآمنة',
        'product.chatgpt.feature3': 'تكامل مع أدواتك المفضلة',
        'product.gamma.desc': 'منصة ذكاء اصطناعي متقدمة لإنشاء العروض التقديمية والمستندات والمواقع بشكل احترافي.',
        'product.gamma.price': 'السعر قريباً',
        'product.gamma.feature1': 'إنشاء عروض تقديمية احترافية بالذكاء الاصطناعي',
        'product.gamma.feature2': 'تصميم مستندات ومواقع تفاعلية',
        'product.gamma.feature3': 'قوالب جاهزة وتخصيص كامل',
        'product.canva.desc': 'اشتراك Canva Pro الكامل مع جميع المميزات الاحترافية للتصميم والإبداع.',
        'product.canva.price': 'السعر قريباً',
        'product.canva.feature1': 'الوصول لجميع القوالب المميزة',
        'product.canva.feature2': 'إزالة الخلفية بنقرة واحدة',
        'product.canva.feature3': '100GB تخزين سحابي',
        'product.capcut.desc': 'محرر فيديو احترافي مع مميزات الذكاء الاصطناعي وأدوات التحرير المتقدمة.',
        'product.capcut.duration': '30 يوم',
        'product.capcut.feature1': 'خصوصية تامة لمحتواك (لا يراه غيرك)',
        'product.capcut.feature2': 'تصدير بجودة 4K بدون علامة مائية',
        'product.capcut.feature3': 'ضمان كامل طوال فترة الاشتراك',
        'product.capcut.selectDuration': 'اختر المدة:',
        'product.capcut.oneMonth': '30 يوم',
        'product.capcut.threeMonths': '3 أشهر',
        'product.capcut.sixMonths': '6 أشهر',
        'product.capcut.oneYear': 'سنة كاملة',
        'product.netflix.desc': 'حساب Netflix Premium مع إمكانية المشاهدة على 4 أجهزة بجودة 4K Ultra HD.',
        'product.netflix.price': 'السعر قريباً',
        'product.netflix.feature1': 'مشاهدة على 4 أجهزة في نفس الوقت',
        'product.netflix.feature2': 'جودة 4K Ultra HD + HDR',
        'product.netflix.feature3': 'تحميل المحتوى للمشاهدة بدون إنترنت',
        'product.perplexity.desc': 'محرك بحث ذكي مدعوم بالذكاء الاصطناعي مع إجابات دقيقة ومصادر موثوقة.',
        'product.perplexity.price': 'السعر قريباً',
        'product.perplexity.feature1': 'بحث ذكي بالذكاء الاصطناعي',
        'product.perplexity.feature2': 'إجابات مع مصادر موثوقة',
        'product.perplexity.feature3': 'استخدام غير محدود للنماذج المتقدمة',
        'product.tradingview.desc': 'منصة تحليل فني احترافية للمتداولين مع مؤشرات متقدمة وبيانات في الوقت الفعلي.',
        'product.tradingview.feature1': 'مؤشرات متقدمة غير محدودة',
        'product.tradingview.feature2': 'بيانات في الوقت الفعلي',
        'product.tradingview.feature3': 'تنبيهات مخصصة وأدوات رسم احترافية',
        'product.primevideo.desc': 'اشتراك Amazon Prime Video مع مكتبة ضخمة من الأفلام والمسلسلات الحصرية.',
        'product.primevideo.duration': '3 أشهر',
        'product.primevideo.feature1': 'مكتبة ضخمة من الأفلام والمسلسلات',
        'product.primevideo.feature2': 'محتوى حصري من Amazon Studios',
        'product.primevideo.feature3': 'جودة عالية حتى 4K Ultra HD',
        'product.crunchyroll.desc': 'اشتراك Crunchyroll Premium مع أكبر مكتبة أنمي في العالم بدون إعلانات.',
        'product.crunchyroll.duration': 'شهر واحد',
        'product.crunchyroll.feature1': 'أكبر مكتبة أنمي في العالم',
        'product.crunchyroll.feature2': 'مشاهدة بدون إعلانات',
        'product.crunchyroll.feature3': 'حلقات جديدة بعد ساعة من البث في اليابان',
        'product.cursor.desc': 'محرر أكواد ذكي مدعوم بالذكاء الاصطناعي (اشتراك 7 أيام) مع ضمان كامل.',
        'product.cursor.feature1': 'إكمال تلقائي ذكي للكود',
        'product.cursor.feature2': 'دعم متعدد اللغات البرمجية',
        'product.cursor.feature3': 'تصحيح وتحسين الكود بالذكاء الاصطناعي',
        'product.cursor.7daysDuration': '7 أيام (ضمان كامل)',
        'product.cursor.30days': '30 D - غير متوفر',
        'product.cursor.selectType': 'اختر المدة:',
        'product.cursor.7days': 'اشتراك 7 أيام (ضمان كامل)',
        'product.cursor.30days': '30 يوم حساب مشترك برو',
        'product.cursor.notAvailable': 'غير متوفر بعد',
        'product.unavailable': '❌ غير متوفر حالياً',
        'product.unavailableBtn': '❌ غير متوفر',
        'product.unavailableAlert': 'عذراً، هذا المنتج غير متوفر حالياً. يرجى المحاولة لاحقاً.',
        'product.comingSoon': 'قريباً',
        'product.contactForPrice': 'تواصل معنا لمعرفة السعر',
        'product.orderNow': 'اطلب الآن',
        'product.discoverMore': 'اكتشف المزيد',
        'product.payCrypto': 'ادفع بالكريبتو (USDT)',
        'product.payRedotPay': 'ادفع بـ RedotPay',
        'product.payBaridiMob': 'ادفع بـ BaridiMob',
        'product.soldOut': 'نفذت الكمية',
        'currency': 'د.ج',
        'slider.from': 'من',
        'slider.month': 'شهر',
        'perMonth': 'للشهر',
        'perYear': 'للسنة',
        'contact.title': 'جاهزون لبدء مشروعك القادم',
        'contact.description': 'تواصل معنا الآن عبر القنوات المتاحة للحصول على استشارة مجانية وتحديد الباقة الأنسب لك.',
        'contact.whatsapp': 'تواصل عبر واتساب',
        'contact.instagram': 'تابعنا على إنستغرام',
        'contact.email': 'البريد الإلكتروني',
        'reviews.title': 'آراء عملائنا',
        'reviews.subtitle': 'ماذا يقول عملاؤنا عن خدماتنا',
        'reviews.customer1.name': 'أحمد م.',
        'reviews.customer1.text': 'خدمة ممتازة وسريعة! حصلت على حساب ChatGPT في نفس اليوم. الدعم الفني متجاوب جداً.',
        'reviews.customer2.name': 'سارة ب.',
        'reviews.customer2.text': 'Adobe Creative Cloud بسعر ممتاز! كل التطبيقات تعمل بشكل مثالي. شكراً Market Algeriaa.',
        'reviews.customer3.name': 'محمد ك.',
        'reviews.customer3.text': 'The Real World أفضل استثمار! المحتوى قيم والدعم الفني ممتاز. أنصح بشدة.',
        'reviews.title': 'آراء عملائنا',
        'reviews.subtitle': 'ماذا يقول عملاؤنا عن خدماتنا',
        'reviews.reviewsCount': 'تقييم',
        'reviews.viewAll': 'عرض جميع التقييمات',
        'reviews.addReview': 'أضف تقييمك',
        'reviews.modal.title': 'أضف تقييمك',
        'reviews.modal.name': 'الاسم:',
        'reviews.modal.product': 'المنتج:',
        'reviews.modal.source': 'من أين عرفت عنا؟',
        'reviews.modal.selectSource': 'اختر المصدر',
        'reviews.modal.friend': 'صديق',
        'reviews.modal.other': 'أخرى',
        'reviews.modal.rating': 'التقييم:',
        'reviews.modal.comment': 'التعليق:',
        'reviews.modal.image': 'أضف صورة (اختياري):',
        'reviews.modal.chooseImage': 'اختر صورة',
        'reviews.modal.removeImage': 'إزالة الصورة',
        'reviews.modal.imageNote': 'يمكنك إضافة صورة للمنتج أو لقطة شاشة (اختياري)',
        'reviews.modal.submit': 'إرسال التقييم',
        'reviews.modal.success': 'شكراً! تم إرسال تقييمك بنجاح.',
        'reviews.modal.error': 'حدث خطأ. الرجاء المحاولة مرة أخرى.',
        'contact.hours': 'أوقات العمل',
        'contact.hoursText': 'طوال أيام الأسبوع - 24/7',
        'contact.social': 'وسائل التواصل',
        'contact.socialText': 'واتساب، إنستغرام، بريد إلكتروني',
        'footer.rights': 'جميع الحقوق محفوظة',
        'footer.instagram': 'إنستغرام',
        'footer.whatsapp': 'واتساب',
        'contact.whatsapp': 'تواصل عبر واتساب',
        'contact.instagram': 'تابعنا على إنستغرام',
        'modal.chooseContact': 'اختر وسيلة التواصل',
        'modal.chooseContactDesc': 'اختر الطريقة المفضلة لديك لإتمام الطلب',
        'modal.whatsapp': 'واتساب',
        'modal.instagram': 'إنستغرام',
        'modal.product': 'المنتج:',
        'modal.price': 'السعر:',
        'modal.amountUSD': 'المبلغ بالدولار:',
        'modal.copy': 'نسخ',
        'modal.instructions': 'تعليمات الدفع:',
        'modal.confirmPayment': 'تم الدفع - تواصل معنا',
        'modal.crypto.title': 'الدفع بالعملات الرقمية',
        'modal.crypto.selectNetwork': 'اختر الشبكة:',
        'modal.crypto.lowFees1': 'رسوم منخفضة (~1 USDT)',
        'modal.crypto.lowFees2': 'رسوم منخفضة (~0.5 USDT)',
        'modal.crypto.walletAddress': 'عنوان المحفظة',
        'modal.crypto.scanQR': 'امسح الكود بتطبيق المحفظة',
        'modal.crypto.step1': 'اختر الشبكة المناسبة (TRC20 أو BEP20)',
        'modal.crypto.step2': 'انسخ عنوان المحفظة أو امسح QR Code',
        'modal.crypto.step3': 'افتح تطبيق Binance أو أي محفظة USDT',
        'modal.crypto.step4': 'تأكد من اختيار نفس الشبكة',
        'modal.crypto.step5': 'أرسل المبلغ المطلوب',
        'modal.crypto.step6': 'احتفظ بـ Transaction ID',
        'modal.crypto.step7': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.crypto.warning': '⚠️ تأكد من اختيار الشبكة الصحيحة وإلا ستفقد أموالك!',
        'modal.baridimob.title': 'الدفع عبر BaridiMob',
        'modal.baridimob.paymentInfo': 'معلومات الدفع',
        'modal.baridimob.ripLabel': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'افتح تطبيق BaridiMob',
        'modal.baridimob.step2': 'اختر "تحويل الأموال" أو "Virement"',
        'modal.baridimob.step3': 'اختر "RIP" كطريقة التحويل',
        'modal.baridimob.step4': 'أدخل الـ RIP: 00799999002787548473',
        'modal.baridimob.step5': 'أدخل المبلغ المطلوب',
        'modal.baridimob.step6': 'أكمل عملية الدفع',
        'modal.baridimob.step7': 'احتفظ بإثبات الدفع',
        'modal.baridimob.step8': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.baridimob.warning': '⚠️ تأكد من إدخال الـ RIP بشكل صحيح!',
        'modal.redotpay.title': 'الدفع عبر RedotPay',
        'modal.redotpay.paymentInfo': 'معلومات الدفع',
        'modal.redotpay.idLabel': 'RedotPay ID:',
        'modal.redotpay.step1': 'افتح تطبيق RedotPay',
        'modal.redotpay.step2': 'اختر "إرسال" أو "Transfer"',
        'modal.redotpay.step3': 'أدخل الـ ID: 1117632168',
        'modal.redotpay.step4': 'أدخل المبلغ المطلوب بالدولار',
        'modal.redotpay.step5': 'أكمل عملية الدفع',
        'modal.redotpay.step6': 'احتفظ بإثبات الدفع',
        'modal.redotpay.step7': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.redotpay.warning': '💳 تأكد من إدخال الـ ID بشكل صحيح!',
        'modal.copy': 'نسخ',
        'modal.confirmPayment': 'تم الدفع - تواصل معنا',
        'modal.crypto.title': 'الدفع بالعملات الرقمية',
        'modal.crypto.selectNetwork': 'اختر الشبكة:',
        'modal.crypto.walletAddress': 'عنوان المحفظة',
        'modal.crypto.scanQR': 'امسح الكود بتطبيق المحفظة',
        'modal.crypto.step1': 'اختر الشبكة المناسبة (TRC20 أو BEP20)',
        'modal.crypto.step2': 'انسخ عنوان المحفظة أو امسح QR Code',
        'modal.crypto.step3': 'افتح تطبيق Binance أو أي محفظة USDT',
        'modal.crypto.step4': 'تأكد من اختيار نفس الشبكة',
        'modal.crypto.step5': 'أرسل المبلغ المطلوب',
        'modal.crypto.step6': 'احتفظ بـ Transaction ID',
        'modal.crypto.step7': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.crypto.warning': '⚠️ تأكد من اختيار الشبكة الصحيحة وإلا ستفقد أموالك !',
        'modal.redotpay.title': 'الدفع عبر RedotPay',
        'modal.redotpay.step1': 'افتح تطبيق RedotPay',
        'modal.redotpay.step2': 'اختر "Send" أو "إرسال"',
        'modal.redotpay.step3': 'أدخل RedotPay ID:',
        'modal.redotpay.step4': 'أدخل المبلغ بالدولار',
        'modal.redotpay.step5': 'أكمل عملية الإرسال',
        'modal.redotpay.step6': 'احتفظ بإثبات التحويل',
        'modal.redotpay.step7': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.redotpay.warning': '⚠️ تأكد من إدخال RedotPay ID بشكل صحيح !',
        'modal.baridimob.title': 'الدفع عبر BaridiMob',
        'modal.baridimob.rip': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'افتح تطبيق BaridiMob',
        'modal.baridimob.step2': 'اختر "تحويل الأموال" أو "Virement"',
        'modal.baridimob.step3': 'اختر "RIP" كطريقة التحويل',
        'modal.baridimob.step4': 'أدخل الـ RIP:',
        'modal.baridimob.step5': 'أدخل المبلغ المطلوب',
        'modal.baridimob.step6': 'أكمل عملية الدفع',
        'modal.baridimob.step7': 'احتفظ بإثبات الدفع',
        'modal.baridimob.step8': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.baridimob.warning': '⚠️ تأكد من إدخال الـ RIP بشكل صحيح !',
        'currency.selector.title': 'اختر العملة',
        'currency.dzd': 'دينار جزائري',
        'currency.usd': 'دولار أمريكي',
        'currency.error.geolocation': 'تعذر تحديد موقعك. تم اختيار الدولار الأمريكي كعملة افتراضية.',
        'currency.error.storage': 'تعذر حفظ تفضيلات العملة. سيتم استخدام الإعدادات الافتراضية.',
        'currency.success.changed': 'تم تغيير العملة بنجاح',
        'service.international': 'خدماتنا متاحة دولياً',
        'service.instant.delivery': 'تسليم فوري للمنتجات الرقمية',
        'campuses.title': 'جميع الدورات التسعة متضمنة',
        'campuses.subtitle': 'وصول كامل لكل دورة ومهارة',
        'campus1.title': 'دورة التجارة الإلكترونية',
        'campus1.subtitle': 'الدروبشيبينغ والمتاجر الإلكترونية',
        'campus1.point1': '• البحث عن المنتجات الرابحة',
        'campus1.point2': '• بناء متاجر Shopify',
        'campus1.point3': '• إعلانات TikTok وFacebook',
        'campus1.point4': '• التوصيل بدون مخزون',
        'campus1.point5': '• بناء علامة تجارية طويلة الأمد',
        'campus2.title': 'دورة كتابة الإعلانات',
        'campus2.subtitle': 'الكتابة الإقناعية للربح',
        'campus2.point1': '• المحفزات النفسية',
        'campus2.point2': '• حملات التسويق بالبريد الإلكتروني',
        'campus2.point3': '• اكتساب العملاء والعروض',
        'campus2.point4': '• نمو وسائل التواصل (Twitter/X)',
        'campus2.point5': '• أساسيات العمل الحر',
        'campus3.title': 'دورة العملات الرقمية والـ DeFi',
        'campus3.subtitle': 'تداول واستثمار العملات الرقمية',
        'campus3.point1': '• بناء محفظة طويلة الأجل',
        'campus3.point2': '• التحليل الفني والرسوم البيانية',
        'campus3.point3': '• DeFi ومجمعات السيولة',
        'campus3.point4': '• استراتيجيات إدارة المخاطر',
        'campus3.point5': '• التركيز على Bitcoin وEthereum',
        'campus4.title': 'دورة إنشاء المحتوى',
        'campus4.subtitle': 'الفيديوهات الفيروسية وUGC',
        'campus4.point1': '• تحرير الفيديو (CapCut, Premiere Pro)',
        'campus4.point2': '• إتقان الخوارزميات (TikTok, IG, YT)',
        'campus4.point3': '• المحتوى المولّد من المستخدمين (UGC)',
        'campus4.point4': '• بناء العلامة الشخصية',
        'campus4.point5': '• إدارة المؤثرين',
        'campus5.title': 'دورة أتمتة الذكاء الاصطناعي',
        'campus5.subtitle': 'استخدام الذكاء الاصطناعي لتوفير الوقت وكسب المال',
        'campus5.point1': '• إتقان هندسة الأوامر',
        'campus5.point2': '• أتمتة سير العمل (Zapier)',
        'campus5.point3': '• تحسين ChatGPT وClaude',
        'campus5.point4': '• خدمات وكالة الذكاء الاصطناعي',
        'campus5.point5': '• حلول أتمتة الأعمال',
        'campus6.title': 'دورة الأسهم',
        'campus6.subtitle': 'تداول سوق الأسهم التقليدي',
        'campus6.point1': '• التحليل الفني والأنماط',
        'campus6.point2': '• استراتيجيات تداول الخيارات',
        'campus6.point3': '• فهم الاقتصاد الكلي',
        'campus6.point4': '• تحليل الأخبار وأحداث السوق',
        'campus6.point5': '• تقنيات الاستفادة من رأس المال',
        'campus7.title': 'دورة إتقان الأعمال',
        'campus7.subtitle': 'توسيع وإدارة عملك',
        'campus7.point1': '• استراتيجيات تحسين الضرائب',
        'campus7.point2': '• التوظيف وإدارة الفريق',
        'campus7.point3': '• إعداد الهيكل المؤسسي',
        'campus7.point4': '• LLC والولايات القضائية المواتية',
        'campus7.point5': '• عمليات الأعمال المتقدمة',
        'campus8.title': 'دورة اللياقة البدنية',
        'campus8.subtitle': 'الصحة الجسدية والانضباط',
        'campus8.point1': '• روتينات التدريب اليومية',
        'campus8.point2': '• التغذية وخطط الوجبات',
        'campus8.point3': '• تقنيات القرصنة البيولوجية',
        'campus8.point4': '• المكملات وأسلوب الحياة',
        'campus8.point5': '• تعزيز الطاقة والتستوستيرون',
        'campus9.title': 'دورة اكتساب العملاء',
        'campus9.subtitle': 'المبيعات والتوظيف',
        'campus9.point1': '• استراتيجيات البريد الإلكتروني البارد',
        'campus9.point2': '• تقنيات المكالمات الباردة',
        'campus9.point3': '• إتمام الصفقات بفعالية',
        'campus9.point4': '• طرق البحث عن العملاء',
        'campus9.point5': '• مهارات مبيعات العمل الحر',
        'recommend.title': '💡 بأي دورة يجب أن تبدأ؟',
        'recommend.free.title': '🆓 بدون مال ($0):',
        'recommend.free.desc': 'ابدأ بـ كتابة الإعلانات أو إنشاء المحتوى',
        'recommend.free.note': 'يتطلب وقتاً، تكلفة بدء منخفضة',
        'recommend.paid.title': '💰 بعض المال ($500+):',
        'recommend.paid.desc': 'ابدأ بـ التجارة الإلكترونية أو العملات الرقمية',
        'recommend.paid.note': 'يتطلب رأس مال لكسب المال',
        'footer.title': 'لا تضيع الفرصة',
        'footer.subtitle': 'السعر سيرتفع قريباً. انضم للنخبة الآن.',
        'footer.cta': 'ابدأ رحلتك الآن',
        'footer.rights': 'جميع الحقوق محفوظة.',
        'hero.price': 'فقط بـ 15 USDT',
        'hero.cta': 'انضم الآن',
        'scarcity.title': 'مقاعد محدودة!',
        'scarcity.description': 'لضمان جودة الدعم، نقبل فقط <span class="text-red-400 font-bold">10-15 عميل شهرياً</span>',
        'scarcity.remaining': 'مقعد متبقي',
        'scarcity.total': 'إجمالي',
        'scarcity.warning': '⏰ احجز مقعدك الآن قبل نفاد الكمية!',
        'reviews.title': '⭐ تقييمات العملاء',
        'reviews.reviews': 'تقييم',
        'reviews.addReview': 'أضف تقييمك',
        'reviews.yourName': 'اسمك:',
        'reviews.rating': 'التقييم:',
        'reviews.platform': 'من أين عرفت عنا؟',
        'reviews.comment': 'تعليقك (اختياري):',
        'reviews.submit': 'إرسال التقييم',
        'reviews.noReviews': 'كن أول من يضيف تقييم! ⭐',
        'reviews.showMore': 'عرض المزيد',
        'reviews.showLess': 'عرض أقل',
        'reviews.image': 'أضف صورة (اختياري):',
        'reviews.chooseImage': 'اختر صورة',
        'reviews.removeImage': 'إزالة الصورة',
        'reviews.imageNote': 'الحد الأقصى: 2MB (JPG, PNG, WEBP)',
        'reviews.clearAll': 'حذف جميع التقييمات',
        'reviews.giveaway': 'سحب على 4 فائزين',
        'reviews.namePlaceholder': 'أدخل اسمك',
        'reviews.selectPlatform': 'اختر المنصة',
        'reviews.friend': '👤 صديق',
        'reviews.other': '🌐 أخرى',
        'reviews.commentPlaceholder': 'شارك تجربتك معنا...',
        'reviews.alreadyReviewed': 'شكراً لك!',
        'reviews.alreadyReviewedMsg': 'لقد قمت بإضافة تقييمك مسبقاً. يمكنك إضافة تقييم واحد فقط.',
        'guide.title': '📚 دليل شامل لمحتويات The Real World',
        'guide.subtitle': 'ماذا ستحصل عليه عند الاشتراك؟',
        'guide.intro': 'عندما تشتري حساب <span class="text-matrix-green font-bold">The Real World</span>، فأنت لا تشتري مجرد كورس واحد، بل تدخل إلى منصة تعليمية متكاملة تحتوي على <span class="text-matrix-green font-bold">19 أسلوباً حديثاً</span> لتوليد الثروة. المنصة مقسمة إلى "كليات" (Campuses)، كل كلية تركز على مهارة معينة تدر الأموال.',
        'campus.whatLearn': '📖 ماذا ستتعلم؟',
        'campus.forWho': '👤 لمن هذا المسار؟',
        'campus.tip': '💡 نصيحتي:',
        'campus1.desc': 'ستتعلم كيفية البحث عن "المنتجات الرابحة" (Winning Products) التي عليها طلب عالٍ، وكيفية بناء متجر احترافي لجذب الزبائن. يركز الكورس على أسلوبين: الدروبشيبينغ (البيع دون امتلاك مخزون) والعلامة التجارية الخاصة (Private Label).',
        'campus1.forWho': 'للأشخاص المستعدين للعمل الجاد في بناء "بزنس" حقيقي. يتطلب هذا المجال إما رأس مال للإعلانات أو وقتاً طويلاً لصناعة محتوى مجاني (Organic) على تيك توك.',
        'campus1.tip': 'هذه الكلية هي الأكثر ربحية ولكنها الأصعب في البداية. إذا كانت ميزانيتك أقل من $500، ابدأ بتعلم "الزيارات المجانية" (Organic Traffic) ولا تدفع للإعلانات حتى تحقق أول مبيعاتك.',
        'campus2.desc': 'فن "بيع الكلام". ستتعلم كيف تكتب نصوصاً إعلانية، رسائل بريد إلكتروني، وصفحات هبوط تجبر القارئ على الشراء. الأهم من ذلك، يعلمونك كيفية مراسلة الشركات لتوظيفك مقابل مبالغ شهرية عالية (High Ticket Closer).',
        'campus2.forWho': 'للمبتدئين الذين يملكون 0 دولار ويريدون البدء فوراً. الشرط الوحيد هو أن تكون لغتك الإنجليزية قوية.',
        'campus2.tip': 'هذا هو المسار الأسرع لجني المال من الصفر. لا تكتفِ بمشاهدة الدروس، ابدأ في مراسلة العملاء (Outreach) فوراً بعد إنهاء الوحدة الأولى.',
        'campus1.title': '1. كلية التجارة الإلكترونية',
        'campus1.subtitle': 'كلية التجارة الإلكترونية',
        'campus2.title': '2. كلية الكتابة الإعلانية',
        'campus2.subtitle': 'كلية الكتابة الإعلانية',
        'campus3.title': '3. كلية الذكاء الاصطناعي',
        'campus3.subtitle': 'كلية الذكاء الاصطناعي وصناعة المحتوى',
        'campus3.desc': 'كيفية استخدام أدوات الذكاء الاصطناعي (مثل ChatGPT و Zapier) لبناء أنظمة أتمتة للشركات. ستتعلم كيف توفر وقت الشركات وتبني لهم "روبوتات" لخدمة العملاء، وتبيع هذه الخدمة كوكالة (AAA).',
        'campus3.forWho': 'للأشخاص الأذكياء تقنياً والذين يريدون استغلال "الترند" الحالي. الشركات تدفع مبالغ ضخمة لمن يتقن هذه المهارة الآن.',
        'campus3.tip': 'هذا المجال جديد جداً والمنافسة فيه قليلة. إذا تعلمت هذه المهارة الآن، يمكنك احتكار السوق في منطقتك بسهولة.',
        'campus4.title': '4. كلية صناعة المحتوى',
        'campus4.subtitle': 'كلية صناعة المحتوى',
        'campus4.desc': 'كيفية إنتاج وتحرير فيديوهات قصيرة (Shorts/Reels) تنتشر بسرعة البرق (Viral). ستتعلم المونتاج، التصميم، وكيفية خطف انتباه المشاهد في أول 3 ثوانٍ.',
        'campus4.forWho': 'للمبدعين، ولمن يحبون العمل على برامج المونتاج. هذه المهارة مطلوبة جداً سواء لعملك الخاص أو للعمل مع مشاهير السوشيال ميديا.',
        'campus4.tip': 'الطلب على "محرري الفيديو" (Video Editors) هائل. يمكنك دمج هذه المهارة مع الذكاء الاصطناعي لإنتاج فيديوهات بجودة عالية في وقت قياسي.',
        'campus5.title': '5. كلية تداول الكريبتو',
        'campus5.subtitle': 'كلية تداول الكريبتو',
        'campus5.desc': 'المضاربة اليومية السريعة. كيف تقرأ الرسوم البيانية (التحليل الفني)، وكيف تربح من صعود وهبوط العملات الرقمية بشكل يومي.',
        'campus5.forWho': 'للأشخاص الذين يملكون أعصاباً حديدية ومالاً فائضاً للمخاطرة. هذا ليس عملاً، بل هو مهارة قنص الفرص.',
        'campus.warning': '⚠️ تحذير:',
        'campus5.warning': 'التداول اليومي عالي المخاطرة. لا تدخل هنا بمال تحتاجه لدفع إيجارك. ابدأ بمبالغ صغيرة جداً حتى تتقن الاستراتيجية.',
        'campus6.title': '6. كلية الاستثمار في الكريبتو',
        'campus6.subtitle': 'كلية الاستثمار في الكريبتو',
        'campus6.desc': 'كيف تكتشف العملات والمشاريع القوية قبل أن يرتفع سعرها (الاستثمار طويل الأمد). ستتعلم الفرق بين المشاريع الحقيقية والمشاريع الوهمية (Scams).',
        'campus6.forWho': 'لمن لديه رأس مال ويريد تجميده لفترة (6 أشهر - سنة) ليحصل على عوائد ضخمة لاحقاً.',
        'campus6.tip': 'هذه الكلية تعلمك الصبر. الشراء الصحيح والاحتفاظ (HODL) هو السر هنا، بعيداً عن توتر المضاربة اليومية.',
        'campus7.title': '7. كلية التمويل اللامركزي',
        'campus7.subtitle': 'كلية التمويل اللامركزي',
        'campus7.desc': 'الجانب التقني المتقدم للكريبتو. كيف تستخدم منصات التبادل اللامركزي (DEXs) لتحقيق دخل سلبي من عملاتك، وما يعرف بـ "زراعة العائد" (Yield Farming).',
        'campus7.forWho': 'للمستثمرين المتقدمين في الكريبتو. لا تدخل هنا إذا كنت لا تزال مبتدئاً في فهم البلوكتشين.',
        'campus7.tip': 'هذا هو المستوى التالي بعد "الاستثمار". يمكنك تحقيق عوائد سنوية (APY) أعلى بكثير من البنوك التقليدية إذا تعلمت الاستراتيجيات هنا.',
        'campus8.title': '8. كلية الأسهم',
        'campus8.subtitle': 'كلية الأسهم',
        'campus8.desc': 'تداول الأسهم في الأسواق العالمية والخيارات (Options). يركزون على "التداول المتأرجح" (Swing Trading) الذي لا يتطلب الجلوس أمام الشاشة طوال اليوم.',
        'campus8.forWho': 'لمن يفضل الأسواق المنظمة والأكثر استقراراً مقارنة بالكريبتو، ولديه رأس مال مبدئي للاستثمار ($2000+).',
        'campus8.tip': 'إذا كان لديك وظيفة، فهذا أفضل خيار لك لأن استراتيجية Swing Trading تتيح لك التداول دون التأثير على وقت عملك.',
        'campus9.title': '9. كلية العمل الحر',
        'campus9.subtitle': 'كلية العمل الحر',
        'campus9.desc': 'كيف تحول أي مهارة تمتلكها (تصميم، ترجمة، برمجة) إلى "بيزنس". يعلمك كيف ترفع أسعارك، وكيف تتفاوض، وكيف تجد عملاء خارج منصات العمل الحر الرخيصة.',
        'campus9.forWho': 'لأي شخص يريد الحصول على أول 1000$ له عبر الإنترنت بسرعة باستخدام مهاراته الحالية.',
        'campus9.tip': 'استخدم هذه الكلية كـ "جسر". ابدأ هنا لتجمع رأس المال بسرعة، ثم استثمره لاحقاً في التجارة الإلكترونية أو الأسهم.',
        'campus10.title': '10. كلية اكتساب العملاء',
        'campus10.subtitle': 'كلية اكتساب العملاء',
        'campus10.desc': 'فن البيع والمراسلة الباردة. كيف تجد عملاء (Leads)، كيف تراسلهم، وكيف تقنعهم بدفع المال لك مقابل خدماتك.',
        'campus10.forWho': 'هذه "مهارة مساندة" ضرورية لكل من يعمل في التسويق أو العمل الحر. بدون عملاء، لا يوجد مال.',
        'campus10.tip': 'ادرس هذه الكلية بالتوازي مع أي مهارة أخرى. فمهما كنت بارعاً في التصميم أو البرمجة، لن تربح شيئاً إذا لم تكن تعرف كيف "تبيع" نفسك.',
        'campus11.title': '11. كلية التسويق بالعمولة',
        'campus11.subtitle': 'كلية التسويق بالعمولة',
        'campus11.desc': 'كيفية تسويق منتجات الآخرين (بما في ذلك عضوية The Real World) مقابل عمولة. يركزون بقوة على استراتيجيات الفيديوهات القصيرة (TikTok/Reels).',
        'campus11.forWho': 'للمبدعين في صناعة المحتوى الفيروسي (Viral Content) والذين لا يملكون منتجاً خاصاً بهم لبيعه.',
        'campus11.tip': 'المنافسة هنا شرسة. لكي تنجح، يجب أن تكون مبدعاً جداً وتنتج كميات كبيرة من المحتوى يومياً.',
        'campus12.title': '12. كلية إدارة الأعمال',
        'campus12.subtitle': 'كلية إدارة الأعمال',
        'campus12.desc': 'كيف تدير أموالك، الضرائب، التوظيف، وكيف توسع شركتك. هذه دروس متقدمة في الإدارة المالية والهيكلة القانونية.',
        'campus12.forWho': 'للمستوى المتقدم فقط. لمن بدأ بالفعل في جني المال ويريد الانتقال من "مستقل" إلى "رجل أعمال".',
        'campus12.tip': 'لا تضيع وقتك هنا إذا لم تكن قد كسبت أول دولار لك بعد. عد إليها لاحقاً عندما تحتاج لتوظيف فريق عمل.',
        'campus13.title': '13. كلية اللياقة البدنية',
        'campus13.subtitle': 'كلية اللياقة البدنية',
        'campus13.desc': 'نظام تدريب وتغذية مصمم خصيصاً لرواد الأعمال. الفكرة هي الحصول على أقصى طاقة جسدية وذهنية بأقل وقت ممكن في الجيم.',
        'campus13.forWho': 'لكل مشترك. "العقل السليم في الجسم السليم".',
        'campus13.tip': 'لا تتجاهل هذا القسم. الانضباط في الجسد ينعكس مباشرة على انضباطك في المال والعمل.',
        'tips.title': '⭐ نصائح ذهبية للمشترك الجديد',
        'tips.tip1.title': '🚫 لا تكن "سائحاً"',
        'tips.tip1.desc': 'أكبر خطأ يقع فيه المشتركون هو التنقل بين الكليات (أسبوع تجارة إلكترونية، وأسبوع كريبتو..). هذا يضمن فشلك. اختر مجالاً واحداً فقط والتزم به لمدة 3 أشهر على الأقل.',
        'tips.tip2.title': '⚖️ حدد موقفك (المال مقابل الوقت)',
        'tips.tip2.option1.title': 'لديك وقت ولا تملك مالاً؟',
        'tips.tip2.option1.desc': 'اختر: الكتابة الإعلانية، العمل الحر، أو صناعة المحتوى',
        'tips.tip2.option2.title': 'لديك مال ولا تملك وقتاً؟',
        'tips.tip2.option2.desc': 'اختر: التجارة الإلكترونية أو الاستثمار في الكريبتو/الأسهم',
        'tips.tip3.title': '💪 تجاوز الشهر الأول',
        'tips.tip3.desc': 'الشهر الأول هو الأصعب، ستشعر بضغط المعلومات. لا تستسلم. النتائج الحقيقية تظهر غالباً في الشهر الثاني أو الثالث من العمل الجاد.',
        'tips.final': 'نحن نوفر لك "المفتاح" للدخول إلى هذا العالم، لكن "الجهد" يجب أن يأتي من طرفك. بالتوفيق في رحلتك نحو الثراء! 🚀',
        'payment.title': 'طرق الدفع المتاحة',
        'payment.redotpay': 'RedotPay',
        'payment.usdt': 'USDT',
        'payment.baridimob': 'BaridiMob',
        'nav.home': 'الرئيسية',
        'whatsapp.tooltip': 'تحدث معنا الآن!',
        'instagram.tooltip': 'تابعنا على Instagram!',
        'modal.paymentInfo': 'معلومات الدفع',
        'modal.instructions': 'تعليمات الدفع:',
        'modal.copy': 'نسخ',
        'modal.confirmButton': 'تم الدفع - تواصل معنا',
        'modal.stepContact': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.baridimob.ripLabel': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'افتح تطبيق BaridiMob',
        'modal.baridimob.step2': 'اختر "تحويل الأموال" أو "Virement"',
        'modal.baridimob.step3': 'اختر "RIP" كطريقة التحويل',
        'modal.baridimob.step4': 'أدخل الـ RIP: <strong>00799999002787548473</strong>',
        'modal.baridimob.step5': 'أدخل المبلغ المطلوب',
        'modal.baridimob.step6': 'أكمل عملية الدفع',
        'modal.baridimob.step7': 'احتفظ بإثبات الدفع',
        'modal.baridimob.step8': 'اضغط "تم الدفع" للتواصل معنا',
        'modal.baridimob.warning': '⚠️ تأكد من إدخال الـ RIP بشكل صحيح !',
        'modal.crypto.chooseNetwork': 'اختر الشبكة:',
        'modal.crypto.lowFeesTRC': 'رسوم منخفضة (~1 USDT)',
        'modal.crypto.lowFeesBEP': 'رسوم منخفضة (~0.5 USDT)',
        'modal.crypto.walletAddress': 'عنوان المحفظة',
        'modal.crypto.qrNote': 'امسح الكود بتطبيق المحفظة',
        'modal.crypto.step1': 'اختر طريقة الدفع (TRC20، BEP20، أو Binance ID)',
        'modal.crypto.step2': 'انسخ عنوان المحفظة أو Binance ID أو امسح QR Code',
        'modal.crypto.step3': 'افتح تطبيق Binance أو أي محفظة USDT',
        'modal.crypto.step4': 'تأكد من اختيار نفس الطريقة (<strong id="network-warning">TRC20</strong>)',
        'modal.crypto.step5': 'أرسل المبلغ المطلوب',
        'modal.crypto.step6': 'احتفظ بـ Transaction ID',
        'modal.crypto.binanceIdLabel': 'معرف Binance',
        'modal.crypto.warning': '⚠️ تأكد من اختيار الطريقة الصحيحة وإلا ستفقد أموالك !',
        'modal.redotpay.idLabel': 'RedotPay ID:',
        'modal.redotpay.step1': 'افتح تطبيق RedotPay',
        'modal.redotpay.step2': 'اختر "Send" أو "إرسال"',
        'modal.redotpay.step3': 'أدخل RedotPay ID: <strong>1117632168</strong>',
        'modal.redotpay.step4': 'أدخل المبلغ بالدولار',
        'modal.redotpay.step5': 'أكمل عملية الإرسال',
        'modal.redotpay.step6': 'احتفظ بإثبات التحويل',
        'modal.redotpay.warning': '⚠️ تأكد من إدخال RedotPay ID بشكل صحيح !',
        'product.lovable.desc': 'أداة متقدمة لبناء تطبيقات الويب بالذكاء الاصطناعي بسهولة وسرعة.',
        'product.lovable.feature1': 'بناء تطبيقات كاملة من خلال الدردشة',
        'product.lovable.feature2': 'تصدير الكود وتعديله بحرية',
        'product.lovable.feature3': 'تكامل مع أفضل أدوات التطوير',
        'product.gemini.desc': 'أقوى نماذج الذكاء الاصطناعي من Google لتوليد النصوص والأكواد والتحليل المتقدم.',
        'product.gemini.feature1': 'وصول إلى Gemini 1.5 Pro المتقدم',
        'product.gemini.feature2': 'القدرة على تحليل الملفات والبيانات الضخمة',
        'product.gemini.feature3': 'تكامل عميق مع Google Workspace',
        'product.gemini.selectDuration': 'اختر المدة:',
        'product.gemini.oneMonth': 'شهر واحد',
        'product.gemini.oneYear': 'سنة واحدة',
        'product.gemini.oneYearUnavailable': 'سنة واحدة - غير متوفر',
        'product.veo.desc': 'أقوى اشتراك من جوجل يشمل Gemini Ultra و Veo 3 مع 45,000 نقطة لتوليد الفيديوهات.',
        'product.veo.feature1': 'توليد 2,500 فيديو عبر Veo 3',
        'product.veo.feature2': 'وصول لـ Gemini Ultra و Deep Research 2',
        'product.veo.feature3': 'حساب خاص Google Workspace بالكامل',
        'veo.delivery.title': 'تفاصيل تسليم الحساب',
        'veo.delivery.item1': 'حساب خاص (Email + Password)',
        'veo.delivery.item2': 'إمكانية تغيير كلمة السر ومعلومات الاسترداد',
        'veo.delivery.item3': 'رابط دخول مباشر عند الحاجة',
        'veo.delivery.item4': 'ضمان طيلة فترة الاشتراك',
        'veo.delivery.item5': 'تسليم فوري (تلقائي)',
        'veo.delivery.limited': 'عرض لفترة محدودة',
        'veo.delivery.wa': 'اطلب عبر واتساب الآن',
        'veo.delivery.payment': 'متوفر عبر BaridiMob / CCP / USDT',
        'veo.disclaimer': '⚠️ لا يدعم Google Antigravity أو Gemini CLI - مخصص للمبدعين فقط.',
        'veo.nav.back': 'العودة للمتجر',
        'veo.stats.videos_desc': 'توليد فيديو',
        'product.canva.selectType': 'اختر نوع الاشتراك:',
        'product.canva.standard': 'PRO (سنة)',
        'product.canva.reseller': 'عرض الموزعين (500 مستخدم)',
        'product.canva.reseller.desc': 'اشتراك Canva Pro للموزعين والوكالات - أضف حتى 500 مستخدم مع تحكم إداري كامل وحسابات مستقلة.',
        'product.canva.reseller.feature1': 'تحكم كامل - تغيير البريد وكلمة السر في أي وقت',
        'product.canva.reseller.feature2': 'يصل إلى 500 مستخدم - مثالي للفرق أو الموزعين',
        'product.canva.reseller.feature3': 'رفع الخطوط والرسومات الشخصية',
        'product.canva.reseller.feature4': 'إعداد عالي الجودة - تكوين مستقر',
        'product.hma.desc': 'اشتراك HMA VPN بجودة عالية وخدمة مستقرة تضم آلاف الخوادم.',
        'product.hma.feature1': 'وصول لأكثر من 290 موقع خادم',
        'product.hma.feature2': 'تفعيل على 5 أجهزة في نفس الوقت',
        'product.hma.feature3': 'سرعة فائقة وحماية كاملة للخصوصية',
        'product.hma.oneYear': 'عام واحد',
        'product.hma.twoYears': 'عامين',
        'product.cursor.desc': 'محرر أكواد ذكي بالذكاء الاصطناعي (حساب خاص متوفر)',
        'product.cursor.7days': '7 أيام (تجريبي)',
        'product.cursor.30days': 'شهر (حساب خاص)',
        'product.cursor.7daysDuration': '7 أيام (ضمان كامل)',
        'product.cursor.30daysDuration': '30 يوم (حساب خاص)',
        'product.alight.desc': 'اشتراك Alight Motion Pro لمدة سنة كاملة لتصميم الفيديو باحترافية.',
        'product.alight.feature1': 'حساب خاص بالكامل (Private Account)',
        'product.alight.feature2': 'تحكم كامل (تغيير الإيميل والباسوورد)',
        'product.alight.feature3': 'وصول لكافة ميزات Pro بدون علامة مائية',
        'product.scispace.desc': 'مساعد بحث علمي مدعوم بالذكاء الاصطناعي لتسهيل القراءة والكتابة والنشر.',
        'product.scispace.feature1': 'مساعد قراءة ذكي (Copilot)',
        'product.scispace.feature2': 'أدوات كشف السرقة الأدبية والتلخيص',
        'product.scispace.feature3': 'صادرات بصيغ متنوعة ودعم فني',
        'product.soldOut': 'نفذت الكمية',
    },
    en: {
        'brand.tagline': 'Digital Solutions That Boost Your Presence',
        'nav.products': 'Our Products',
        'nav.reviews': '⭐ Customer Reviews',
        'nav.contact': 'WhatsApp',
        'nav.telegram': 'Telegram',
        'hero.title': 'Your Platform for Everything You Need',
        'hero.description': 'Educational accounts, creative tools, and AI solutions designed to support your business and projects at the best prices with professional customer service.',
        'hero.explore': 'Explore Products',
        'hero.learn': 'Learn About Our Services',
        'badge.clients': 'Happy Clients',
        'badge.support': 'Support',
        'badge.experience': 'Years Experience',
        'card1.title': 'Complete Educational Solutions',
        'card1.desc': 'Instant access to the best courses and global platforms with activation guarantee.',
        'card2.title': 'Dedicated Support for Every Project',
        'card2.desc': 'We follow your order step by step to ensure a smooth experience and amazing results.',
        'products.badge': 'Featured Offers',
        'products.title': 'Choose the Right Package for Your Needs',
        'products.subtitle': 'Carefully selected digital products to help you learn, design, and grow your business with flexibility and professionalism.',
        'product.trw.desc': 'Shared account for courses and The Real World platform, with technical support and full guarantee.',
        'product.trw.feature1': 'Access to all current courses',
        'product.trw.feature2': 'Regular updates and new content',
        'product.trw.feature3': 'Fast Arabic technical support',
        'product.adobe.desc': 'Adobe Creative Cloud subscription includes more than 20 professional applications.',
        'product.adobe.selectType': 'Select Account Type:',
        'product.adobe.shared': 'Shared Account',
        'product.adobe.personal': 'Personal Account (Keys)',
        'product.adobe.oneMonth': '1 Month',
        'product.adobe.twoMonths': '2 Months',
        'product.adobe.threeMonths': '3 Months',
        'product.adobe.sixMonths': '6 Months',
        'product.adobe.selectDuration': 'Select Duration:',
        'product.adobe.shared.price1': '1 Month',
        'product.adobe.shared.price2': '3 Months',
        'product.adobe.personal.price1': '1 Month (Keys)',
        'product.adobe.personal.price2': '3 Months (Keys)',
        'product.gamma.selectType': 'Select Account Type:',
        'product.gamma.shared': 'Shared Account',
        'product.gamma.personal': 'Personal Account',
        'product.adobe.feature1': '20+ Professional Applications (All Apps)',
        'product.adobe.feature2': '4000 AI Credits (Firefly Credits)',
        'product.adobe.feature3': 'Private Account - Full Data Control',
        'product.chatgpt.desc': 'Individual ChatGPT and Teachers accounts with private workspace and full security.',
        'product.chatgpt.selectType': 'Select Subscription Type:',
        'product.chatgpt.business': 'Plus',
        'product.chatgpt.teachers': 'Teachers',
        'product.chatgpt.go': 'GO Account (1 Year)',
        'product.chatgpt.wholesale': 'Wholesale (Reseller)',
        'product.chatgpt.oneMonth': '1 Month',
        'product.chatgpt.threeMonths': '3 Months',
        'product.chatgpt.sixMonths': '6 Months',
        'product.chatgpt.twelveMonths': '12 Months',
        'product.chatgpt.resellerPack': 'Account (1+5)',
        'product.chatgpt.feature1': 'Access to latest GPT',
        'product.chatgpt.feature2': 'Private and secure workspace',
        'product.chatgpt.feature3': 'Integration with your favorite tools',
        'product.gamma.desc': 'Advanced AI platform for creating professional presentations, documents and websites.',
        'product.gamma.price': 'Price Coming Soon',
        'product.gamma.feature1': 'Create professional presentations with AI',
        'product.gamma.feature2': 'Design interactive documents and websites',
        'product.gamma.feature3': 'Ready templates and full customization',
        'product.canva.desc': 'Full Canva Pro subscription with all professional design and creativity features.',
        'product.canva.selectType': 'Select Subscription Type:',
        'product.canva.standard': 'PRO (Year)',
        'product.canva.reseller': 'Reseller Offer (500 Users)',
        'product.canva.reseller.desc': 'Canva Pro Reseller & Agency Offer - Add up to 500 users with full administrative control and independent accounts.',
        'product.canva.reseller.feature1': 'Full control — change email & password anytime',
        'product.canva.reseller.feature2': 'Up to 500 users — perfect for teams or resellers',
        'product.canva.reseller.feature3': 'Upload personal fonts & graphics',
        'product.canva.reseller.feature4': 'Premium quality setup — stable configuration',
        'product.canva.price': 'Price Coming Soon',
        'product.canva.feature1': 'Access to all premium templates',
        'product.canva.feature2': 'Background removal with one click',
        'product.canva.feature3': '100GB cloud storage',
        'product.capcut.desc': 'Professional video editor with AI features and advanced editing tools.',
        'product.capcut.duration': '30 days',
        'product.capcut.feature1': 'Full Content Privacy (Private Workspace)',
        'product.capcut.feature2': '4K Export without watermark',
        'product.capcut.feature3': 'Full Guarantee for the entire period',
        'product.capcut.selectDuration': 'Select Duration:',
        'product.capcut.oneMonth': '30 Days',
        'product.capcut.threeMonths': '3 Months',
        'product.capcut.sixMonths': '6 Months',
        'product.capcut.oneYear': '1 Year Full',
        'product.netflix.desc': 'Netflix Premium account with 4 simultaneous screens in 4K Ultra HD quality.',
        'product.netflix.price': 'Price Coming Soon',
        'product.scispace.desc': 'AI-powered scientific research assistant for easier reading, writing, and publishing.',
        'product.scispace.feature1': 'Smart Reading Assistant (Copilot)',
        'product.scispace.feature2': 'Plagiarism Detection & Summerization tools',
        'product.scispace.feature3': 'Multiple export formats & tech support',
        'product.netflix.feature1': 'Watch on 4 devices simultaneously',
        'product.netflix.feature2': '4K Ultra HD + HDR quality',
        'product.netflix.feature3': 'Download content for offline viewing',
        'product.perplexity.desc': 'AI-powered smart search engine with accurate answers and reliable sources.',
        'product.perplexity.price': 'Price Coming Soon',
        'product.perplexity.feature1': 'AI-powered smart search',
        'product.perplexity.feature2': 'Answers with reliable sources',
        'product.perplexity.feature3': 'Unlimited access to advanced models',
        'product.tradingview.desc': 'Professional technical analysis platform for traders with advanced indicators and real-time data.',
        'product.tradingview.feature1': 'Unlimited advanced indicators',
        'product.tradingview.feature2': 'Real-time market data',
        'product.tradingview.feature3': 'Custom alerts and professional drawing tools',
        'product.primevideo.desc': 'Amazon Prime Video subscription with a huge library of exclusive movies and series.',
        'product.primevideo.duration': '3 months',
        'product.primevideo.feature1': 'Huge library of movies and series',
        'product.primevideo.feature2': 'Exclusive content from Amazon Studios',
        'product.primevideo.feature3': 'High quality up to 4K Ultra HD',
        'product.crunchyroll.desc': 'Crunchyroll Premium subscription with the world\'s largest anime library ad-free.',
        'product.crunchyroll.duration': '1 month',
        'product.crunchyroll.feature1': 'World\'s largest anime library',
        'product.crunchyroll.feature2': 'Ad-free viewing experience',
        'product.crunchyroll.feature3': 'New episodes 1 hour after Japan broadcast',
        'product.cursor.desc': 'AI-powered smart code editor (Private account available)',
        'product.cursor.feature1': 'Intelligent code completion',
        'product.cursor.feature2': 'Multi-programming language support',
        'product.cursor.feature3': 'AI code correction and optimization',
        'product.cursor.7days': '7 DAYS TRIAL',
        'product.cursor.30days': 'Month - PRIVATE',
        'product.cursor.7daysDuration': '7 Days (Full Guarantee)',
        'product.cursor.30daysDuration': '30 Days (PRIVATE ACCOUNT)',
        'product.cursor.selectType': 'Select Duration:',
        'product.cursor.notAvailable': 'Not available yet',
        'product.unavailable': '❌ Currently Unavailable',
        'product.unavailableBtn': '❌ Unavailable',
        'product.unavailableAlert': 'Sorry, this product is currently unavailable. Please try again later.',
        'product.comingSoon': 'Coming Soon',
        'product.contactForPrice': 'Contact us for price',
        'product.orderNow': 'Order Now',
        'product.discoverMore': 'Discover More',
        'product.payCrypto': 'Pay with Crypto (USDT)',
        'product.payRedotPay': 'Pay with RedotPay',
        'product.payBaridiMob': 'Pay with BaridiMob',
        'product.soldOut': 'Sold Out',
        'currency': 'DA',
        'slider.from': 'from',
        'slider.month': 'month',
        'perMonth': 'per month',
        'perYear': 'per year',
        'modal.product': 'Product:',
        'modal.price': 'Price:',
        'modal.amountUSD': 'Amount in USD:',
        'modal.copy': 'Copy',
        'modal.instructions': 'Payment Instructions:',
        'modal.confirmPayment': 'Payment Done - Contact Us',
        'modal.crypto.title': 'Cryptocurrency Payment',
        'modal.crypto.selectNetwork': 'Select Network:',
        'modal.crypto.lowFees1': 'Low fees (~1 USDT)',
        'modal.crypto.lowFees2': 'Low fees (~0.5 USDT)',
        'modal.crypto.walletAddress': 'Wallet Address',
        'modal.crypto.scanQR': 'Scan the code with wallet app',
        'modal.crypto.step1': 'Choose the appropriate network (TRC20 or BEP20)',
        'modal.crypto.step2': 'Copy wallet address or scan QR Code',
        'modal.crypto.step3': 'Open Binance app or any USDT wallet',
        'modal.crypto.step4': 'Make sure to select the same network',
        'modal.crypto.step5': 'Send the required amount',
        'modal.crypto.step6': 'Keep the Transaction ID',
        'modal.crypto.step7': 'Click "Payment Done" to contact us',
        'modal.crypto.warning': '⚠️ Make sure to select the correct network or you will lose your funds!',
        'modal.baridimob.title': 'Payment via BaridiMob',
        'modal.baridimob.paymentInfo': 'Payment Information',
        'modal.baridimob.ripLabel': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'Open BaridiMob app',
        'modal.baridimob.step2': 'Choose "Money Transfer" or "Virement"',
        'modal.baridimob.step3': 'Select "RIP" as transfer method',
        'modal.baridimob.step4': 'Enter the RIP: 00799999002787548473',
        'modal.baridimob.step5': 'Enter the required amount',
        'modal.baridimob.step6': 'Complete the payment process',
        'modal.baridimob.step7': 'Keep proof of payment',
        'modal.baridimob.step8': 'Click "Payment Done" to contact us',
        'modal.baridimob.warning': '⚠️ Make sure to enter the RIP correctly!',
        'modal.redotpay.title': 'Payment via RedotPay',
        'modal.redotpay.paymentInfo': 'Payment Information',
        'modal.redotpay.idLabel': 'RedotPay ID:',
        'modal.redotpay.step1': 'Open RedotPay app',
        'modal.redotpay.step2': 'Choose "Send" or "Transfer"',
        'modal.redotpay.step3': 'Enter the ID: 1117632168',
        'modal.redotpay.step4': 'Enter the required amount in dollars',
        'modal.redotpay.step5': 'Complete the payment process',
        'modal.redotpay.step6': 'Keep proof of payment',
        'modal.redotpay.step7': 'Click "Payment Done" to contact us',
        'modal.redotpay.warning': '💳 Make sure to enter the ID correctly!',
        'contact.title': 'Ready to Start Your Next Project',
        'contact.description': 'Contact us now through available channels for a free consultation and to determine the best package for you.',
        'contact.whatsapp': 'Contact via WhatsApp',
        'contact.instagram': 'Follow us on Instagram',
        'contact.email': 'Email',
        'reviews.title': 'Customer Reviews',
        'reviews.subtitle': 'What our customers say about our services',
        'reviews.customer1.name': 'Ahmed M.',
        'reviews.customer1.text': 'Excellent and fast service! Got my ChatGPT account the same day. Very responsive technical support.',
        'reviews.customer2.name': 'Sarah B.',
        'reviews.customer2.text': 'Adobe Creative Cloud at a great price! All applications work perfectly. Thank you Market Algeriaa.',
        'reviews.customer3.name': 'Mohamed K.',
        'reviews.customer3.text': 'The Real World is the best investment! Valuable content and excellent technical support. Highly recommend.',
        'reviews.viewAll': 'View All Reviews',
        'reviews.title': 'Customer Reviews',
        'reviews.subtitle': 'What our customers say about our services',
        'reviews.customer1.name': 'Ahmed M.',
        'reviews.customer1.text': 'Excellent and fast service! Got my ChatGPT account the same day. Very responsive technical support.',
        'reviews.customer2.name': 'Sarah B.',
        'reviews.customer2.text': 'Adobe Creative Cloud at a great price! All applications work perfectly. Thank you Market Algeriaa.',
        'veo.hero.title_prefix': 'Unleash',
        'veo.period.monthly': 'Full Month Subscription',
        'reviews.customer3.name': 'Mohamed K.',
        'reviews.customer3.text': 'The Real World is the best investment! Valuable content and excellent technical support. Highly recommend.',
        'reviews.title': 'Customer Reviews',
        'reviews.subtitle': 'What our customers say about our services',
        'reviews.reviewsCount': 'reviews',
        'reviews.viewAll': 'View All Reviews',
        'reviews.addReview': 'Add Your Review',
        'reviews.modal.title': 'Add Your Review',
        'reviews.modal.name': 'Name:',
        'reviews.modal.product': 'Product:',
        'reviews.modal.source': 'How did you find us?',
        'reviews.modal.selectSource': 'Select Source',
        'reviews.modal.friend': 'Friend',
        'reviews.modal.other': 'Other',
        'reviews.modal.rating': 'Rating:',
        'reviews.modal.comment': 'Comment:',
        'reviews.modal.image': 'Add Image (Optional):',
        'reviews.modal.chooseImage': 'Choose Image',
        'reviews.modal.removeImage': 'Remove Image',
        'reviews.modal.imageNote': 'You can add a product image or screenshot (optional)',
        'reviews.modal.submit': 'Submit Review',
        'reviews.modal.success': 'Thank you! Your review has been submitted successfully.',
        'reviews.modal.error': 'An error occurred. Please try again.',
        'contact.hours': 'Working Hours',
        'contact.hoursText': 'All week - 24/7',
        'contact.social': 'Social Media',
        'contact.socialText': 'WhatsApp, Instagram, Email',
        'footer.rights': 'All rights reserved',
        'footer.instagram': 'Instagram',
        'footer.whatsapp': 'WhatsApp',
        'contact.whatsapp': 'Contact via WhatsApp',
        'contact.instagram': 'Follow us on Instagram',
        'modal.chooseContact': 'Choose Contact Method',
        'modal.chooseContactDesc': 'Choose your preferred way to complete the order',
        'modal.whatsapp': 'WhatsApp',
        'modal.instagram': 'Instagram',
        'modal.product': 'Product:',
        'modal.price': 'Price:',
        'modal.priceInUSD': 'Amount in USD:',
        'modal.paymentInfo': 'Payment Information',
        'modal.instructions': 'Payment Instructions:',
        'modal.copy': 'Copy',
        'modal.confirmPayment': 'Payment Completed - Contact Us',
        'modal.crypto.title': 'Cryptocurrency Payment',
        'modal.crypto.selectNetwork': 'Select Network:',
        'modal.crypto.walletAddress': 'Wallet Address',
        'modal.crypto.scanQR': 'Scan code with wallet app',
        'modal.crypto.step1': 'Choose the appropriate network (TRC20 or BEP20)',
        'modal.crypto.step2': 'Copy wallet address or scan QR Code',
        'modal.crypto.step3': 'Open Binance app or any USDT wallet',
        'modal.crypto.step4': 'Make sure to select the same network',
        'modal.crypto.step5': 'Send the required amount',
        'modal.crypto.step6': 'Keep the Transaction ID',
        'modal.crypto.step7': 'Click "Payment Completed" to contact us',
        'modal.crypto.warning': '⚠️ Make sure to select the correct network or you will lose your funds!',
        'modal.redotpay.title': 'RedotPay Payment',
        'modal.redotpay.step1': 'Open RedotPay app',
        'modal.redotpay.step2': 'Choose "Send"',
        'modal.redotpay.step3': 'Enter RedotPay ID:',
        'modal.redotpay.step4': 'Enter the amount in dollars',
        'modal.redotpay.step5': 'Complete the sending process',
        'modal.redotpay.step6': 'Keep proof of transfer',
        'modal.redotpay.step7': 'Click "Payment Completed" to contact us',
        'modal.redotpay.warning': '⚠️ Make sure to enter RedotPay ID correctly!',
        'modal.baridimob.title': 'BaridiMob Payment',
        'modal.baridimob.rip': 'BaridiMob RIP:',
        'modal.baridimob.step1': 'Open BaridiMob app',
        'modal.baridimob.step2': 'Choose "Money Transfer" or "Virement"',
        'modal.baridimob.step3': 'Choose "RIP" as transfer method',
        'modal.baridimob.step4': 'Enter the RIP:',
        'modal.baridimob.step5': 'Enter the required amount',
        'modal.baridimob.step6': 'Complete the payment process',
        'modal.baridimob.step7': 'Keep proof of payment',
        'modal.baridimob.step8': 'Click "Payment Completed" to contact us',
        'modal.baridimob.warning': '⚠️ Make sure to enter the RIP correctly!',
        'campuses.title': 'All Nine Courses Included',
        'campuses.subtitle': 'Full access to every course and skill',
        'campus1.title': 'E-commerce Course',
        'campus1.subtitle': 'Dropshipping and Online Stores',
        'campus1.point1': '• Finding Winning Products',
        'campus1.point2': '• Building Shopify Stores',
        'campus1.point3': '• TikTok and Facebook Ads',
        'campus1.point4': '• No-Inventory Shipping',
        'campus1.point5': '• Building Long-term Brands',
        'campus2.title': 'Copywriting Course',
        'campus2.subtitle': 'Persuasive Writing for Profit',
        'campus2.point1': '• Psychological Triggers',
        'campus2.point2': '• Email Marketing Campaigns',
        'campus2.point3': '• Client Acquisition and Offers',
        'campus2.point4': '• Social Media Growth (Twitter/X)',
        'campus2.point5': '• Freelancing Basics',
        'campus3.title': 'Crypto & DeFi Course',
        'campus3.subtitle': 'Cryptocurrency Trading and Investment',
        'campus3.point1': '• Building Long-term Portfolio',
        'campus3.point2': '• Technical Analysis and Charts',
        'campus3.point3': '• DeFi and Liquidity Pools',
        'campus3.point4': '• Risk Management Strategies',
        'campus3.point5': '• Focus on Bitcoin and Ethereum',
        'campus4.title': 'Content Creation Course',
        'campus4.subtitle': 'Viral Videos and UGC',
        'campus4.point1': '• Video Editing (CapCut, Premiere Pro)',
        'campus4.point2': '• Mastering Algorithms (TikTok, IG, YT)',
        'campus4.point3': '• User Generated Content (UGC)',
        'campus4.point4': '• Building Personal Brand',
        'campus4.point5': '• Influencer Management',
        'campus5.title': 'AI Automation Course',
        'campus5.subtitle': 'Using AI to Save Time and Make Money',
        'campus5.point1': '• Prompt Engineering Mastery',
        'campus5.point2': '• Workflow Automation (Zapier)',
        'campus5.point3': '• ChatGPT and Claude Optimization',
        'campus5.point4': '• AI Agency Services',
        'campus5.point5': '• Business Automation Solutions',
        'campus6.title': 'Stocks Course',
        'campus6.subtitle': 'Traditional Stock Market Trading',
        'campus6.point1': '• Technical Analysis and Patterns',
        'campus6.point2': '• Options Trading Strategies',
        'campus6.point3': '• Understanding Macroeconomics',
        'campus6.point4': '• News Analysis and Market Events',
        'campus6.point5': '• Capital Leverage Techniques',
        'campus7.title': 'Business Mastery Course',
        'campus7.subtitle': 'Scaling and Managing Your Business',
        'campus7.point1': '• Tax Optimization Strategies',
        'campus7.point2': '• Hiring and Team Management',
        'campus7.point3': '• Corporate Structure Setup',
        'campus7.point4': '• LLC and Favorable Jurisdictions',
        'campus7.point5': '• Advanced Business Operations',
        'campus8.title': 'Fitness Course',
        'campus8.subtitle': 'Physical Health and Discipline',
        'campus8.point1': '• Daily Training Routines',
        'campus8.point2': '• Nutrition and Meal Plans',
        'campus8.point3': '• Biohacking Techniques',
        'campus8.point4': '• Supplements and Lifestyle',
        'campus8.point5': '• Energy and Testosterone Boosting',
        'campus9.title': 'Client Acquisition Course',
        'campus9.subtitle': 'Sales and Recruitment',
        'campus9.point1': '• Cold Email Strategies',
        'campus9.point2': '• Cold Calling Techniques',
        'campus9.point3': '• Closing Deals Effectively',
        'campus9.point4': '• Client Prospecting Methods',
        'campus9.point5': '• Freelance Sales Skills',
        'recommend.title': '💡 Which Course Should You Start With?',
        'recommend.free.title': '🆓 No Money ($0):',
        'recommend.free.desc': 'Start with Copywriting or Content Creation',
        'recommend.free.note': 'Requires time, low startup cost',
        'recommend.paid.title': '💰 Some Money ($500+):',
        'recommend.paid.desc': 'Start with E-commerce or Cryptocurrency',
        'recommend.paid.note': 'Requires capital to make money',
        'footer.title': 'Don\'t Miss the Opportunity',
        'footer.subtitle': 'Price will increase soon. Join the elite now.',
        'footer.cta': 'Start Your Journey Now',
        'footer.rights': 'All rights reserved.',
        'hero.price': 'Only 15 USDT',
        'hero.cta': 'Join Now',
        'scarcity.title': 'Limited Seats!',
        'scarcity.description': 'To ensure quality support, we only accept <span class="text-red-400 font-bold">10-15 clients monthly</span>',
        'scarcity.remaining': 'seats left',
        'scarcity.total': 'total',
        'scarcity.warning': '⏰ Book your seat now before it\'s too late!',
        'reviews.title': '⭐ Customer Reviews',
        'reviews.reviews': 'reviews',
        'reviews.addReview': 'Add Your Review',
        'reviews.yourName': 'Your Name:',
        'reviews.rating': 'Rating:',
        'reviews.platform': 'How did you find us?',
        'reviews.comment': 'Your Comment (optional):',
        'reviews.submit': 'Submit Review',
        'reviews.noReviews': 'Be the first to add a review! ⭐',
        'reviews.showMore': 'Show More',
        'reviews.showLess': 'Show Less',
        'reviews.image': 'Add Image (optional):',
        'reviews.chooseImage': 'Choose Image',
        'reviews.removeImage': 'Remove Image',
        'reviews.imageNote': 'Max: 2MB (JPG, PNG, WEBP)',
        'reviews.clearAll': 'Delete All Reviews',
        'reviews.giveaway': 'Draw 4 Winners',
        'reviews.namePlaceholder': 'Enter your name',
        'reviews.selectPlatform': 'Select platform',
        'reviews.friend': '👤 Friend',
        'reviews.other': '🌐 Other',
        'reviews.commentPlaceholder': 'Share your experience...',
        'reviews.alreadyReviewed': 'Thank you!',
        'reviews.alreadyReviewedMsg': 'You have already submitted your review. You can only submit one review.',
        'guide.title': '📚 Complete Guide to The Real World Content',
        'guide.subtitle': 'What will you get when you subscribe?',
        'guide.intro': 'When you buy <span class="text-matrix-green font-bold">The Real World</span> account, you\'re not just buying one course, but entering a complete educational platform containing <span class="text-matrix-green font-bold">19 modern methods</span> to generate wealth. The platform is divided into "Campuses", each campus focuses on a specific money-making skill.',
        'campus.whatLearn': '📖 What will you learn?',
        'campus.forWho': '👤 Who is this path for?',
        'campus.tip': '💡 My advice:',
        'campus1.desc': 'You will learn how to search for "Winning Products" that have high demand, and how to build a professional store to attract customers. The course focuses on two methods: dropshipping (selling without owning inventory) and private label.',
        'campus1.forWho': 'For people ready to work hard building a real "business". This field requires either capital for ads or a long time creating free (Organic) content on TikTok.',
        'campus1.tip': 'This college is the most profitable but the hardest at the beginning. If your budget is less than $500, start learning "Organic Traffic" and don\'t pay for ads until you make your first sales.',
        'campus2.desc': 'The art of "selling words". You will learn how to write advertising copy, emails, and landing pages that force the reader to buy. Most importantly, they teach you how to contact companies to hire you for high monthly amounts (High Ticket Closer).',
        'campus2.forWho': 'For beginners who have $0 and want to start immediately. The only condition is that your English is strong.',
        'campus2.tip': 'This is the fastest path to making money from scratch. Don\'t just watch lessons, start reaching out to clients (Outreach) immediately after finishing the first module.',
        'campus3.title': '3. AI Automation College',
        'campus3.desc': 'How to use AI tools (like ChatGPT and Zapier) to build automation systems for companies. You\'ll learn how to save companies time and build "robots" for customer service, and sell this service as an agency (AAA).',
        'campus3.forWho': 'For tech-savvy people who want to take advantage of the current "trend". Companies pay huge amounts for those who master this skill now.',
        'campus3.tip': 'This field is very new and competition is low. If you learn this skill now, you can monopolize the market in your area easily.',
        'campus1.title': '1. E-Commerce College',
        'campus1.subtitle': 'E-Commerce Campus',
        'campus2.title': '2. Copywriting College',
        'campus2.subtitle': 'Copywriting Campus',
        'campus3.subtitle': 'AI & Content Creation Campus',
        'campus4.title': '4. Content Creation College',
        'campus4.subtitle': 'Content Creation Campus',
        'campus4.desc': 'How to produce and edit short videos (Shorts/Reels) that go viral lightning fast. You\'ll learn editing, design, and how to grab the viewer\'s attention in the first 3 seconds.',
        'campus4.forWho': 'For creators, and those who love working with editing software. This skill is highly demanded whether for your own work or working with social media influencers.',
        'campus4.tip': 'The demand for "Video Editors" is huge. You can combine this skill with AI to produce high-quality videos in record time.',
        'campus5.title': '5. Crypto Trading College',
        'campus5.subtitle': 'Crypto Trading Campus',
        'campus5.desc': 'Fast day trading. How to read charts (technical analysis), and how to profit from the rise and fall of cryptocurrencies daily.',
        'campus5.forWho': 'For people with iron nerves and surplus money to risk. This is not a job, but a skill of seizing opportunities.',
        'campus.warning': '⚠️ Warning:',
        'campus5.warning': 'Day trading is high risk. Don\'t enter here with money you need to pay your rent. Start with very small amounts until you master the strategy.',
        'campus6.title': '6. Crypto Investing College',
        'campus6.subtitle': 'Crypto Investing Campus',
        'campus6.desc': 'How to discover strong coins and projects before their price rises (long-term investment). You\'ll learn the difference between real projects and scams.',
        'campus6.forWho': 'For those who have capital and want to freeze it for a period (6 months - 1 year) to get huge returns later.',
        'campus6.tip': 'This college teaches you patience. Buying right and holding (HODL) is the secret here, away from the stress of day trading.',
        'campus7.title': '7. DeFi College',
        'campus7.subtitle': 'DeFi Campus',
        'campus7.desc': 'The advanced technical side of crypto. How to use decentralized exchanges (DEXs) to generate passive income from your coins, known as "Yield Farming".',
        'campus7.forWho': 'For advanced crypto investors. Don\'t enter here if you\'re still a beginner in understanding blockchain.',
        'campus7.tip': 'This is the next level after "investing". You can achieve annual returns (APY) much higher than traditional banks if you learn the strategies here.',
        'campus8.title': '8. Stocks College',
        'campus8.subtitle': 'Stocks Campus',
        'campus8.desc': 'Trading stocks in global markets and options. They focus on "Swing Trading" which doesn\'t require sitting in front of the screen all day.',
        'campus8.forWho': 'For those who prefer regulated and more stable markets compared to crypto, and have initial capital to invest ($2000+).',
        'campus8.tip': 'If you have a job, this is the best option for you because Swing Trading strategy allows you to trade without affecting your work time.',
        'campus9.title': '9. Freelancing College',
        'campus9.subtitle': 'Freelancing Campus',
        'campus9.desc': 'How to turn any skill you have (design, translation, programming) into a "business". It teaches you how to raise your prices, how to negotiate, and how to find clients outside cheap freelancing platforms.',
        'campus9.forWho': 'For anyone who wants to get their first $1000 online quickly using their current skills.',
        'campus9.tip': 'Use this college as a "bridge". Start here to collect capital quickly, then invest it later in e-commerce or stocks.',
        'campus10.title': '10. Client Acquisition College',
        'campus10.subtitle': 'Client Acquisition Campus',
        'campus10.desc': 'The art of sales and cold outreach. How to find clients (Leads), how to contact them, and how to convince them to pay you for your services.',
        'campus10.forWho': 'This is a "supporting skill" necessary for everyone working in marketing or freelancing. Without clients, there is no money.',
        'campus10.tip': 'Study this college in parallel with any other skill. No matter how skilled you are in design or programming, you won\'t earn anything if you don\'t know how to "sell" yourself.',
        'campus11.title': '11. Affiliate Marketing College',
        'campus11.subtitle': 'Affiliate Marketing Campus',
        'campus11.desc': 'How to market other people\'s products (including The Real World membership) for commission. They focus heavily on short video strategies (TikTok/Reels).',
        'campus11.forWho': 'For creators in viral content creation who don\'t have their own product to sell.',
        'campus11.tip': 'Competition here is fierce. To succeed, you must be very creative and produce large amounts of content daily.',
        'campus12.title': '12. Business Management College',
        'campus12.subtitle': 'Business Management Campus',
        'campus12.desc': 'How to manage your money, taxes, hiring, and how to expand your company. These are advanced lessons in financial management and legal structuring.',
        'campus12.forWho': 'For advanced level only. For those who have already started making money and want to transition from "freelancer" to "businessman".',
        'campus12.tip': 'Don\'t waste your time here if you haven\'t earned your first dollar yet. Come back to it later when you need to hire a team.',
        'campus13.title': '13. Fitness College',
        'campus13.subtitle': 'Fitness Campus',
        'campus13.desc': 'A training and nutrition system designed specifically for entrepreneurs. The idea is to get maximum physical and mental energy with minimum time in the gym.',
        'campus13.forWho': 'For every subscriber. "A sound mind in a sound body".',
        'campus13.tip': 'Don\'t ignore this section. Discipline in the body directly reflects on your discipline in money and work.',
        'tips.title': '⭐ Golden Tips for New Subscribers',
        'tips.tip1.title': '🚫 Don\'t Be a "Tourist"',
        'tips.tip1.desc': 'The biggest mistake subscribers make is jumping between colleges (one week e-commerce, one week crypto..). This guarantees your failure. Choose only one field and stick to it for at least 3 months.',
        'tips.tip2.title': '⚖️ Determine Your Position (Money vs Time)',
        'tips.tip2.option1.title': 'Have time but no money?',
        'tips.tip2.option1.desc': 'Choose: Copywriting, Freelancing, or Content Creation',
        'tips.tip2.option2.title': 'Have money but no time?',
        'tips.tip2.option2.desc': 'Choose: E-commerce or Crypto/Stocks Investment',
        'tips.tip3.title': '💪 Get Through the First Month',
        'tips.tip3.desc': 'The first month is the hardest, you\'ll feel information overload. Don\'t give up. Real results usually appear in the second or third month of hard work.',
        'tips.final': 'We provide you with the "key" to enter this world, but the "effort" must come from you. Good luck on your journey to wealth! 🚀',
        'payment.title': 'Available Payment Methods',
        'payment.redotpay': 'RedotPay',
        'payment.usdt': 'USDT',
        'payment.baridimob': 'BaridiMob',
        'nav.home': 'Home',
        'whatsapp.tooltip': 'Chat with us now!',
        'instagram.tooltip': 'Follow us on Instagram!',
        'modal.paymentInfo': 'Payment Information',
        'modal.instructions': 'Payment Instructions:',
        'modal.copy': 'Copy',
        'modal.confirmButton': 'Payment Completed - Contact Us',
        'modal.stepContact': 'Click "Payment Completed" to contact us',
        'modal.baridimob.ripLabel': 'BaridiMob RIP:',
        'modal.baridimob.step1': 'Open BaridiMob app',
        'modal.baridimob.step2': 'Choose "Money Transfer" or "Virement"',
        'modal.baridimob.step3': 'Choose "RIP" as transfer method',
        'modal.baridimob.step4': 'Enter the RIP: <strong>00799999002787548473</strong>',
        'modal.baridimob.step5': 'Enter the required amount',
        'modal.baridimob.step6': 'Complete the payment process',
        'modal.baridimob.step7': 'Keep proof of payment',
        'modal.baridimob.step8': 'Click "Payment Completed" to contact us',
        'modal.baridimob.warning': '⚠️ Make sure to enter the RIP correctly!',
        'modal.crypto.chooseNetwork': 'Select Network:',
        'modal.crypto.lowFeesTRC': 'Low fees (~1 USDT)',
        'modal.crypto.lowFeesBEP': 'Low fees (~0.5 USDT)',
        'modal.crypto.walletAddress': 'Wallet Address',
        'modal.crypto.qrNote': 'Scan code with wallet app',
        'modal.crypto.step1': 'Choose payment method (TRC20, BEP20, or Binance ID)',
        'modal.crypto.step2': 'Copy wallet address or Binance ID or scan QR Code',
        'modal.crypto.step3': 'Open Binance app or any USDT wallet',
        'modal.crypto.step4': 'Make sure to select the same method (<strong id="network-warning">TRC20</strong>)',
        'modal.crypto.step5': 'Send the required amount',
        'modal.crypto.step6': 'Keep the Transaction ID',
        'modal.crypto.binanceIdLabel': 'Binance ID',
        'modal.crypto.warning': '⚠️ Make sure to select the correct method or you will lose your funds!',
        'modal.redotpay.idLabel': 'RedotPay ID:',
        'modal.redotpay.step1': 'Open RedotPay app',
        'modal.redotpay.step2': 'Choose "Send"',
        'modal.redotpay.step3': 'Enter RedotPay ID: <strong>1117632168</strong>',
        'modal.redotpay.step4': 'Enter the amount in dollars',
        'modal.redotpay.step5': 'Complete the sending process',
        'modal.redotpay.step6': 'Keep proof of transfer',
        'modal.redotpay.warning': '⚠️ Make sure to enter RedotPay ID correctly!',
        'currency.selector.title': 'Select Currency',
        'currency.dzd': 'Algerian Dinar',
        'currency.usd': 'US Dollar',
        'currency.error.geolocation': 'Unable to detect your location. US Dollar selected as default currency.',
        'currency.error.storage': 'Unable to save currency preferences. Default settings will be used.',
        'currency.success.changed': 'Currency changed successfully',
        'service.international': 'Our services are available internationally',
        'service.instant.delivery': 'Instant delivery for digital products',
        'product.lovable.desc': 'Advanced AI tool for building web applications easily and quickly.',
        'product.lovable.feature1': 'Build full apps through chat',
        'product.lovable.feature2': 'Export and modify code freely',
        'product.lovable.feature3': 'Integration with top development tools',
        'product.gemini.desc': 'Google\'s most powerful AI models for generating text, code, and advanced analysis.',
        'product.gemini.feature1': 'Access to advanced Gemini 1.5 Pro',
        'product.gemini.feature2': 'Ability to analyze files and big data',
        'product.gemini.feature3': 'Deep integration with Google Workspace',
        'product.gemini.selectDuration': 'Select Duration:',
        'product.gemini.oneMonth': '1 Month',
        'product.gemini.oneYear': '1 Year',
        'product.gemini.oneYearUnavailable': '1 Year - Unavailable',
        'product.veo.desc': 'Google\'s most powerful subscription including Gemini Ultra and Veo 3 with 45,000 credits for video generation.',
        'product.veo.feature1': 'Generate 2,500 videos via Veo 3',
        'product.veo.feature2': 'Access to Gemini Ultra & Deep Research 2',
        'product.veo.feature3': 'Full Private Google Workspace Account',
        'veo.hero.title_prefix': 'Unleash',
        'veo.hero.title': 'Unleash Google AI Ultra',
        'veo.period.monthly': 'Full Month Subscription',
        'veo.hero.subtitle': 'Elevate your content creation to Hollywood levels with Veo 3 technology. The ultimate all-in-one account for designers, developers, and researchers.',
        'veo.hero.price': '1,800 DZD / Month',
        'veo.cta': 'Start Your Ultra Experience Now',
        'veo.badge.offer': 'Most Powerful Subscription Available',
        'veo.stats.credits': 'Credit Points',
        'veo.stats.model': 'Smartest Model Available',
        'veo.stats.video': '4K Quality Videos',
        'veo.stats.private': 'Secure Private Account',
        'veo.section.what': 'What will you do with this account?',
        'veo.section.tools': 'Google\'s most advanced tools in one place',
        'veo.tool1.title': 'Filmmaking (Veo 3)',
        'veo.tool1.desc': 'Turn your texts into magical scenes. Experience the power of Veo 3 Neural Network to build professional promotional videos in seconds.',
        'veo.tool2.title': 'Deep Research 2',
        'veo.tool2.desc': 'The most in-depth research tool. Search thousands of papers, summarize info, and get complex answers with extreme accuracy.',
        'veo.tool3.title': 'Agent Mode',
        'veo.tool3.desc': 'Make AI work as a complete team. Program and build complex apps and tasks with NotebookLM Plus tools.',
        'veo.delivery.title': 'Account Delivery Details',
        'veo.delivery.item1': 'Personal Workspace Account (Email + Password)',
        'veo.delivery.item2': 'Ability to change password and recovery info',
        'veo.delivery.item3': 'Direct Login Link when needed',
        'veo.delivery.item4': 'Full term guarantee',
        'veo.delivery.item5': 'Instant delivery (Auto Delivery)',
        'veo.delivery.limited': 'Limited Time Offer',
        'veo.delivery.wa': 'Order via WhatsApp Now',
        'veo.delivery.payment': 'Available via BaridiMob / CCP / USDT',
        'veo.disclaimer': '⚠️ Does not support Google Antigravity or Gemini CLI - Dedicated for creators only.',
        'veo.nav.back': 'Back to Store',
        'veo.stats.videos_desc': 'Generate video',
        'product.hma.desc': 'Premium HMA VPN subscription with stable service across thousands of servers.',
        'product.hma.feature1': 'Access to 290+ server locations',
        'product.hma.feature2': 'Active on 5 devices simultaneously',
        'product.hma.feature3': 'Ultra-fast speed and total privacy protection',
        'product.hma.oneYear': '1 Year',
        'product.hma.twoYears': '2 Years',
        'product.cursor.desc': 'AI-powered smart code editor (Private account available)',
        'product.cursor.30days': 'Month - PRIVATE',
        'product.cursor.30daysDuration': '30 Days (PRIVATE ACCOUNT)',
        'product.alight.desc': 'Alight Motion Pro 1-year subscription for professional video design.',
        'product.alight.feature1': 'Full Private Account (Personal)',
        'product.alight.feature2': 'Full Control (Change Email & Password)',
        'product.alight.feature3': 'Access to all Pro features - No watermark',
    },
    fr: {
        'brand.tagline': 'Solutions Numériques Qui Renforcent Votre Présence',
        'nav.products': 'Nos Produits',
        'nav.reviews': '⭐ Avis Clients',
        'nav.contact': 'WhatsApp',
        'nav.telegram': 'Telegram',
        'hero.title': 'Votre Plateforme pour Tout ce Dont Vous Avez Besoin',
        'hero.description': 'Comptes éducatifs, outils créatifs et solutions IA conçus pour soutenir votre entreprise et vos projets aux meilleurs prix avec un service client professionnel.',
        'hero.explore': 'Explorer les Produits',
        'hero.learn': 'En Savoir Plus',
        'badge.clients': 'Clients Satisfaits',
        'badge.support': 'Support',
        'badge.experience': 'Ans d\'Expérience',
        'card1.title': 'Solutions Éducatives Complètes',
        'card1.desc': 'Accès instantané aux meilleurs cours et plateformes mondiales avec garantie d\'activation.',
        'card2.title': 'Support Dédié pour Chaque Projet',
        'card2.desc': 'Nous suivons votre commande étape par étape pour garantir une expérience fluide et des résultats incroyables.',
        'products.badge': 'Offres Spéciales',
        'products.title': 'Choisissez le Forfait Adapté à Vos Besoins',
        'products.subtitle': 'Produits numériques soigneusement sélectionnés pour vous aider à apprendre, concevoir et développer votre entreprise avec flexibilité et professionnalisme.',
        'product.trw.desc': 'Compte partagé pour les cours et la plateforme The Real World, avec support technique et garantie complète.',
        'product.trw.feature1': 'Accès à tous les cours actuels',
        'product.trw.feature2': 'Mises à jour régulières et nouveau contenu',
        'product.trw.feature3': 'Support technique arabe rapide',
        'product.adobe.desc': 'Abonnement Adobe Creative Cloud comprend plus de 20 applications professionnelles.',
        'product.adobe.selectType': 'Sélectionnez le Type de Compte:',
        'product.adobe.shared': 'Compte Partagé',
        'product.adobe.personal': 'Compte Personnel (Keys)',
        'product.adobe.oneMonth': '1 Mois',
        'product.adobe.twoMonths': '2 Mois',
        'product.adobe.threeMonths': '3 Mois',
        'product.adobe.sixMonths': '6 Mois',
        'product.adobe.selectDuration': 'Choisir la Durée:',
        'product.adobe.shared.price1': '1 Mois',
        'product.adobe.shared.price2': '3 Mois',
        'product.adobe.personal.price1': '1 Mois (Keys)',
        'product.adobe.personal.price2': '3 Mois (Keys)',
        'product.gamma.selectType': 'Sélectionnez le Type de Compte:',
        'product.gamma.shared': 'Compte Partagé',
        'product.gamma.personal': 'Compte Personnel',
        'product.adobe.feature1': 'Plus de 20 applications (Toutes les apps)',
        'product.adobe.feature2': '4000 Crédits IA (Firefly Credits)',
        'product.adobe.feature3': 'Compte Privé - Contrôle Total des Données',
        'product.chatgpt.desc': 'Comptes ChatGPT et Teachers individuels avec espace de travail privé et sécurité totale.',
        'product.chatgpt.selectType': 'Sélectionnez le type d\'abonnement :',
        'product.chatgpt.business': 'Plus',
        'product.chatgpt.teachers': 'Teachers',
        'product.chatgpt.go': 'GO',
        'product.chatgpt.wholesale': 'Gros (Revendeur)',
        'product.chatgpt.oneMonth': '1 Mois',
        'product.chatgpt.threeMonths': '3 Mois',
        'product.chatgpt.sixMonths': '6 Mois',
        'product.chatgpt.twelveMonths': '12 Mois',
        'product.chatgpt.resellerPack': 'Compte (1+5)',
        'product.chatgpt.feature1': 'Accès au dernier GPT',
        'product.chatgpt.feature2': 'Espace de travail privé et sécurisé',
        'product.chatgpt.feature3': 'Intégration avec vos outils préférés',
        'product.gamma.desc': 'Plateforme IA avancée pour créer des présentations, documents et sites web professionnels.',
        'product.gamma.price': 'Prix Bientôt Disponible',
        'product.gamma.feature1': 'Créer des présentations professionnelles avec IA',
        'product.gamma.feature2': 'Concevoir des documents et sites interactifs',
        'product.gamma.feature3': 'Modèles prêts et personnalisation complète',
        'product.canva.desc': 'Abonnement Canva Pro complet avec toutes les fonctionnalités professionnelles de design et créativité.',
        'product.canva.selectType': 'Sélectionnez le type d\'abonnement :',
        'product.canva.standard': 'PRO (An)',
        'product.canva.reseller': 'Offre Revendeur (500 Utilisateurs)',
        'product.canva.reseller.desc': 'Offre Canva Pro Revendeur & Agence - Ajoutez jusqu\'à 500 utilisateurs avec contrôle administratif complet et comptes indépendants.',
        'product.canva.reseller.feature1': 'Contrôle total — changez l\'e-mail et le mot de passe à tout moment',
        'product.canva.reseller.feature2': 'Jusqu\'à 500 utilisateurs — idéal pour les équipes ou revendeurs',
        'product.canva.reseller.feature3': 'Téléchargez vos propres polices et graphiques',
        'product.canva.reseller.feature4': 'Configuration de qualité premium — stable et sans blocages',
        'product.canva.price': 'Prix Bientôt Disponible',
        'product.canva.feature1': 'Accès à tous les modèles premium',
        'product.canva.feature2': 'Suppression d\'arrière-plan en un clic',
        'product.canva.feature3': '100GB de stockage cloud',
        'product.capcut.desc': 'Éditeur vidéo professionnel avec fonctionnalités IA et outils d\'édition avancés.',
        'product.capcut.duration': '30 jours',
        'product.capcut.feature1': 'Confidentialité totale du contenu',
        'product.capcut.feature2': 'Export 4K sans filigrane',
        'product.capcut.feature3': 'Garantie complète pour toute la période',
        'product.capcut.selectDuration': 'Choisir la Durée:',
        'product.capcut.oneMonth': '30 Jours',
        'product.capcut.threeMonths': '3 Mois',
        'product.capcut.sixMonths': '6 Mois',
        'product.capcut.oneYear': '1 An Complet',
        'product.netflix.desc': 'Compte Netflix Premium avec 4 écrans simultanés en qualité 4K Ultra HD.',
        'product.netflix.price': 'Prix Bientôt Disponible',
        'product.netflix.feature1': 'Regarder sur 4 appareils simultanément',
        'product.netflix.feature2': 'Qualité 4K Ultra HD + HDR',
        'product.netflix.feature3': 'Télécharger le contenu pour visionnage hors ligne',
        'product.perplexity.desc': 'Moteur de recherche intelligent alimenté par IA avec réponses précises et sources fiables.',
        'product.perplexity.price': 'Prix Bientôt Disponible',
        'product.perplexity.feature1': 'Recherche intelligente par IA',
        'product.perplexity.feature2': 'Réponses avec sources fiables',
        'product.perplexity.feature3': 'Accès illimité aux modèles avancés',
        'product.tradingview.desc': 'Plateforme d\'analyse technique professionnelle pour traders avec indicateurs avancés et données en temps réel.',
        'product.tradingview.feature1': 'Indicateurs avancés illimités',
        'product.tradingview.feature2': 'Données de marché en temps réel',
        'product.tradingview.feature3': 'Alertes personnalisées et outils de dessin professionnels',
        'product.primevideo.desc': 'Abonnement Amazon Prime Video avec une énorme bibliothèque de films et séries exclusifs.',
        'product.primevideo.duration': '3 mois',
        'product.primevideo.feature1': 'Énorme bibliothèque de films et séries',
        'product.primevideo.feature2': 'Contenu exclusif d\'Amazon Studios',
        'product.primevideo.feature3': 'Haute qualité jusqu\'à 4K Ultra HD',
        'product.crunchyroll.desc': 'Abonnement Crunchyroll Premium avec la plus grande bibliothèque d\'anime au monde sans publicités.',
        'product.crunchyroll.duration': '1 mois',
        'product.crunchyroll.feature1': 'Plus grande bibliothèque d\'anime au monde',
        'product.crunchyroll.feature2': 'Visionnage sans publicités',
        'product.crunchyroll.feature3': 'Nouveaux épisodes 1h après la diffusion au Japon',
        'product.cursor.desc': 'Éditeur de code IA intelligent (Compte privé disponible)',
        'product.cursor.feature1': 'Auto-complétion de code intelligente',
        'product.cursor.feature2': 'Support multi-langages de programmation',
        'product.cursor.feature3': 'Correction et optimisation du code par IA',
        'product.cursor.7daysDuration': '7 Jours (Garantie Totale)',
        'product.cursor.30days': 'Mois - PRIVÉ',
        'product.cursor.30daysDuration': '30 Jours (COMPTE PRIVÉ)',
        'product.cursor.selectType': 'Sélectionner la durée:',
        'product.cursor.7days': 'Compte 7 Jours (Garantie Totale)',
        'product.cursor.notAvailable': 'Pas encore disponible',
        'product.unavailable': '❌ Actuellement Indisponible',
        'product.unavailableBtn': '❌ Indisponible',
        'product.unavailableAlert': 'Désolé, ce produit est actuellement indisponible. Veuillez réessayer plus tard.',
        'product.comingSoon': 'Bientôt',
        'product.contactForPrice': 'Contactez-nous pour le prix',
        'product.orderNow': 'Commander',
        'product.discoverMore': 'Découvrir Plus',
        'product.payCrypto': 'Payer avec Crypto (USDT)',
        'product.payRedotPay': 'Payer avec RedotPay',
        'product.payBaridiMob': 'Payer avec BaridiMob',
        'product.soldOut': 'Épuisé',
        'currency': 'DA',
        'slider.from': 'à partir de',
        'slider.month': 'mois',
        'perMonth': 'par mois',
        'perYear': 'par an',
        'modal.product': 'Produit:',
        'modal.price': 'Prix:',
        'modal.amountUSD': 'Montant en USD:',
        'modal.copy': 'Copier',
        'modal.instructions': 'Instructions de Paiement:',
        'modal.confirmPayment': 'Paiement Effectué - Contactez-nous',
        'modal.crypto.title': 'Paiement en Cryptomonnaie',
        'modal.crypto.selectNetwork': 'Sélectionner le Réseau:',
        'modal.crypto.lowFees1': 'Frais bas (~1 USDT)',
        'modal.crypto.lowFees2': 'Frais bas (~0.5 USDT)',
        'modal.crypto.walletAddress': 'Adresse du Portefeuille',
        'modal.crypto.scanQR': 'Scanner le code avec l\'application portefeuille',
        'modal.crypto.step1': 'Choisissez le réseau approprié (TRC20 ou BEP20)',
        'modal.crypto.step2': 'Copiez l\'adresse du portefeuille ou scannez le QR Code',
        'modal.crypto.step3': 'Ouvrez l\'application Binance ou tout portefeuille USDT',
        'modal.crypto.step4': 'Assurez-vous de sélectionner le même réseau',
        'modal.crypto.step5': 'Envoyez le montant requis',
        'modal.crypto.step6': 'Conservez l\'ID de transaction',
        'modal.crypto.step7': 'Cliquez sur "Paiement Effectué" pour nous contacter',
        'modal.crypto.warning': '⚠️ Assurez-vous de sélectionner le bon réseau sinon vous perdrez vos fonds!',
        'modal.baridimob.title': 'Paiement via BaridiMob',
        'modal.baridimob.paymentInfo': 'Informations de Paiement',
        'modal.baridimob.ripLabel': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'Ouvrez l\'application BaridiMob',
        'modal.baridimob.step2': 'Choisissez "Transfert d\'argent" ou "Virement"',
        'modal.baridimob.step3': 'Sélectionnez "RIP" comme méthode de transfert',
        'modal.baridimob.step4': 'Entrez le RIP: 00799999002787548473',
        'modal.baridimob.step5': 'Entrez le montant requis',
        'modal.baridimob.step6': 'Complétez le processus de paiement',
        'modal.baridimob.step7': 'Conservez la preuve de paiement',
        'modal.baridimob.step8': 'Cliquez sur "Paiement Effectué" pour nous contacter',
        'modal.baridimob.warning': '⚠️ Assurez-vous d\'entrer le RIP correctement!',
        'modal.redotpay.title': 'Paiement via RedotPay',
        'modal.redotpay.paymentInfo': 'Informations de Paiement',
        'modal.redotpay.idLabel': 'RedotPay ID:',
        'modal.redotpay.step1': 'Ouvrez l\'application RedotPay',
        'modal.redotpay.step2': 'Choisissez "Envoyer" ou "Transfer"',
        'modal.redotpay.step3': 'Entrez l\'ID: 1117632168',
        'modal.redotpay.step4': 'Entrez le montant requis en dollars',
        'modal.redotpay.step5': 'Complétez le processus de paiement',
        'modal.redotpay.step6': 'Conservez la preuve de paiement',
        'modal.redotpay.step7': 'Cliquez sur "Paiement Effectué" pour nous contacter',
        'modal.redotpay.warning': '💳 Assurez-vous d\'entrer l\'ID correctement!',
        'product.payBaridiMob': 'Payer avec BaridiMob',
        'product.soldOut': 'Épuisé',
        'currency': 'DA',
        'perMonth': 'par mois',
        'contact.title': 'Prêt à Démarrer Votre Prochain Projet',
        'contact.description': 'Contactez-nous maintenant via les canaux disponibles pour une consultation gratuite et déterminer le meilleur forfait pour vous.',
        'contact.whatsapp': 'Contacter via WhatsApp',
        'contact.instagram': 'Suivez-nous sur Instagram',
        'contact.email': 'Email',
        'reviews.title': 'Avis de nos Clients',
        'reviews.subtitle': 'Ce que nos clients disent de nos services',
        'reviews.customer1.name': 'Ahmed M.',
        'reviews.customer1.text': 'Service excellent et rapide ! J\'ai reçu mon compte ChatGPT Business le même jour. Support technique très réactif.',
        'reviews.customer2.name': 'Sarah B.',
        'reviews.customer2.text': 'Adobe Creative Cloud à un excellent prix ! Toutes les applications fonctionnent parfaitement. Merci Market Algeriaa.',
        'reviews.customer3.name': 'Mohamed K.',
        'reviews.customer3.text': 'The Real World est le meilleur investissement ! Contenu précieux et excellent support technique. Je recommande vivement.',
        'reviews.title': 'Avis Clients',
        'reviews.subtitle': 'Ce que nos clients disent de nos services',
        'reviews.reviewsCount': 'avis',
        'reviews.viewAll': 'Voir Tous les Avis',
        'reviews.addReview': 'Ajouter Votre Avis',
        'reviews.modal.title': 'Ajouter Votre Avis',
        'reviews.modal.name': 'Nom:',
        'reviews.modal.product': 'Produit:',
        'reviews.modal.source': 'Comment nous avez-vous trouvé?',
        'reviews.modal.selectSource': 'Sélectionner la Source',
        'reviews.modal.friend': 'Ami',
        'reviews.modal.other': 'Autre',
        'reviews.modal.rating': 'Évaluation:',
        'reviews.modal.comment': 'Commentaire:',
        'reviews.modal.image': 'Ajouter une Image (Optionnel):',
        'reviews.modal.chooseImage': 'Choisir une Image',
        'reviews.modal.removeImage': 'Supprimer l\'Image',
        'reviews.modal.imageNote': 'Vous pouvez ajouter une image du produit ou une capture d\'écran (optionnel)',
        'reviews.modal.submit': 'Soumettre l\'Avis',
        'reviews.modal.success': 'Merci! Votre avis a été soumis avec succès.',
        'reviews.modal.error': 'Une erreur s\'est produite. Veuillez réessayer.',
        'contact.hours': 'Horaires de Travail',
        'contact.hoursText': 'Toute la semaine - 24/7',
        'contact.social': 'Réseaux Sociaux',
        'contact.socialText': 'WhatsApp, Instagram, Email',
        'footer.rights': 'Tous droits réservés',
        'footer.instagram': 'Instagram',
        'footer.whatsapp': 'WhatsApp',
        'contact.whatsapp': 'Contactez via WhatsApp',
        'contact.instagram': 'Suivez-nous sur Instagram',
        'modal.chooseContact': 'Choisissez le Moyen de Contact',
        'modal.chooseContactDesc': 'Choisissez votre méthode préférée pour finaliser la commande',
        'modal.whatsapp': 'WhatsApp',
        'modal.instagram': 'Instagram',
        'modal.product': 'Produit:',
        'modal.price': 'Prix:',
        'modal.priceInUSD': 'Montant en USD:',
        'modal.paymentInfo': 'Informations de Paiement',
        'modal.instructions': 'Instructions de Paiement:',
        'modal.copy': 'Copier',
        'modal.confirmPayment': 'Paiement Effectué - Contactez-nous',
        'modal.crypto.title': 'Paiement en Cryptomonnaie',
        'modal.crypto.selectNetwork': 'Sélectionner le Réseau:',
        'modal.crypto.walletAddress': 'Adresse du Portefeuille',
        'modal.crypto.scanQR': 'Scanner le code avec l\'application wallet',
        'modal.crypto.step1': 'Choisir le réseau approprié (TRC20 ou BEP20)',
        'modal.crypto.step2': 'Copier l\'adresse du portefeuille ou scanner le code QR',
        'modal.crypto.step3': 'Ouvrir l\'application Binance ou tout portefeuille USDT',
        'modal.crypto.step4': 'Assurez-vous de sélectionner le même réseau',
        'modal.crypto.step5': 'Envoyer le montant requis',
        'modal.crypto.step6': 'Garder l\'ID de transaction',
        'modal.crypto.step7': 'Cliquer sur "Paiement Effectué" pour nous contacter',
        'modal.crypto.warning': '⚠️ Assurez-vous de sélectionner le bon réseau ou vous perdrez vos fonds!',
        'modal.redotpay.title': 'Paiement RedotPay',
        'modal.redotpay.step1': 'Ouvrir l\'application RedotPay',
        'modal.redotpay.step2': 'Choisir "Send" ou "Envoyer"',
        'modal.redotpay.step3': 'Entrer l\'ID RedotPay:',
        'modal.redotpay.step4': 'Entrer le montant en dollars',
        'modal.redotpay.step5': 'Compléter le processus d\'envoi',
        'modal.redotpay.step6': 'Garder la preuve de transfert',
        'modal.redotpay.step7': 'Cliquer sur "Paiement Effectué" pour nous contacter',
        'modal.redotpay.warning': '⚠️ Assurez-vous d\'entrer correctement l\'ID RedotPay!',
        'modal.baridimob.title': 'Paiement BaridiMob',
        'modal.baridimob.rip': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'Ouvrir l\'application BaridiMob',
        'modal.baridimob.step2': 'Choisir "Transfert d\'argent" ou "Virement"',
        'modal.baridimob.step3': 'Choisir "RIP" comme méthode de transfert',
        'modal.baridimob.step4': 'Entrer le RIP:',
        'modal.baridimob.step5': 'Entrer le montant requis',
        'modal.baridimob.step6': 'Compléter le processus de paiement',
        'modal.baridimob.step7': 'Garder la preuve de paiement',
        'modal.baridimob.step8': 'Cliquer sur "Paiement Effectué" pour nous contacter',
        'modal.baridimob.warning': '⚠️ Assurez-vous d\'entrer correctement le RIP!',
        'currency.selector.title': 'Sélectionner la Devise',
        'currency.dzd': 'Dinar Algérien',
        'currency.usd': 'Dollar Américain',
        'currency.error.geolocation': 'Impossible de détecter votre emplacement. Dollar américain sélectionné par défaut.',
        'currency.error.storage': 'Impossible de sauvegarder les préférences de devise. Les paramètres par défaut seront utilisés.',
        'currency.success.changed': 'Devise changée avec succès',
        'service.international': 'Nos services sont disponibles internationalement',
        'service.instant.delivery': 'Livraison instantanée pour les produits numériques',
        'product.lovable.desc': 'Outil IA avancé pour créer des applications web facilement et rapidement.',
        'product.lovable.feature1': 'Créez des applications complètes via chat',
        'product.lovable.feature2': 'Exportez et modifiez le code librement',
        'product.lovable.feature3': 'Intégration avec les meilleurs outils de dév',
        'product.gemini.desc': 'Les modèles d\'IA les plus puissants de Google pour la génération de texte, de code et l\'analyse avancée.',
        'product.gemini.feature1': 'Accès à Gemini 1.5 Pro avancé',
        'product.gemini.feature2': 'Capacité à analyser des fichiers et des données massives',
        'product.gemini.feature3': 'Intégration profonde avec Google Workspace',
        'product.gemini.selectDuration': 'Choisir la durée :',
        'product.gemini.oneMonth': '1 Mois',
        'product.gemini.oneYear': '1 An',
        'product.gemini.oneYearUnavailable': '1 An - Indisponible',
        'product.veo.desc': 'L\'abonnement le plus puissant de Google incluant Gemini Ultra et Veo 3 avec 45 000 crédits pour la génération vidéo.',
        'product.veo.feature1': 'Générez 2 500 vidéos via Veo 3',
        'product.veo.feature2': 'Accès à Gemini Ultra & Deep Research 2',
        'product.veo.feature2': 'Accès à Gemini Ultra & Deep Research 2',
        'product.veo.feature3': 'Compte Google Workspace Privé Complet',
        'veo.hero.title_prefix': 'Libérez',
        'veo.hero.title': 'Libérez Google AI Ultra',
        'veo.period.monthly': 'Abonnement Mensuel Complet',
        'veo.hero.subtitle': 'Élevez votre création de contenu au niveau Hollywood avec la technologie Veo 3. Le compte tout-en-un ultime pour designers, développeurs et chercheurs.',
        'veo.hero.price': '1 800 DA / Mois',
        'veo.cta': 'Commencez Votre Expérience Ultra Maintenant',
        'veo.badge.offer': 'Abonnement le Plus Puissant Disponible',
        'veo.stats.credits': 'Points de Crédit',
        'veo.stats.model': 'Modèle le Plus Intelligent',
        'veo.stats.video': 'Vidéos de Qualité 4K',
        'veo.stats.private': 'Compte Privé Sécurisé',
        'veo.section.what': 'Que ferez-vous avec ce compte ?',
        'veo.section.tools': 'Les outils Google les plus avancés au même endroit',
        'veo.tool1.title': 'Cinéma (Veo 3)',
        'veo.tool1.desc': 'Transformez vos textes en scènes magiques. Découvrez la puissance du réseau neuronal Veo 3 pour créer des vidéos professionnelles en quelques secondes.',
        'veo.tool2.title': 'Recherche Profonde 2',
        'veo.tool2.desc': 'L\'outil de recherche le plus approfondi. Parcourez des milliers de documents, résumez les infos et obtenez des réponses complexes avec précision.',
        'veo.tool3.title': 'Mode Agent',
        'veo.tool3.desc': 'Faites travailler l\'IA comme une équipe complète. Programmez et créez des apps et tâches complexes avec les outils NotebookLM Plus.',
        'veo.delivery.title': 'Détails de Livraison du Compte',
        'veo.delivery.item1': 'Compte Workspace Personnel (Email + Mot de passe)',
        'veo.delivery.item2': 'Possibilité de changer le mot de passe et les infos de récupération',
        'veo.delivery.item3': 'Lien de connexion direct si nécessaire',
        'veo.delivery.item4': 'Garantie pendant toute la durée de l\'abonnement',
        'veo.delivery.item5': 'Livraison instantanée (Auto Delivery)',
        'veo.delivery.limited': 'Offre à Durée Limitée',
        'veo.delivery.wa': 'Commander via WhatsApp Maintenant',
        'veo.delivery.payment': 'Disponible via BaridiMob / CCP / USDT',
        'veo.disclaimer': '⚠️ Ne supporte pas Google Antigravity ou Gemini CLI - Dédié aux créateurs uniquement.',
        'veo.nav.back': 'Retour à la Boutique',
        'veo.stats.videos_desc': 'Génération vidéo',
        'product.hma.desc': 'Abonnement HMA VPN premium avec un service stable sur des milliers de serveurs.',
        'product.hma.feature1': 'Accès à plus de 290 emplacements de serveurs',
        'product.hma.feature2': 'Activation sur 5 appareils en même temps',
        'product.hma.feature3': 'Vitesse ultra-rapide et protection totale de la vie privée',
        'product.hma.oneYear': '1 An',
        'product.hma.twoYears': '2 Ans',
        'product.cursor.desc': 'Éditeur de code IA intelligent (Compte privé disponible)',
        'product.cursor.7days': '7 Jours (Essai)',
        'product.cursor.30days': 'Mois - PRIVÉ',
        'product.cursor.7daysDuration': '7 Jours (Garantie Totale)',
        'product.cursor.30daysDuration': '30 Jours (COMPTE PRIVÉ)',
        'product.alight.desc': 'Abonnement Alight Motion Pro d\'un an pour la conception vidéo professionnelle.',
        'product.alight.feature1': 'Accès à toutes les fonctionnalités Pro',
        'product.alight.feature2': 'Sans filigrane',
        'product.alight.feature3': 'Prend en charge tous les formats et hautes qualités',
        'product.scispace.desc': 'Assistant de recherche scientifique IA pour faciliter la lecture, l\'écriture et la publication.',
        'product.scispace.feature1': 'Assistant de lecture intelligent (Copilot)',
        'product.scispace.feature2': 'Détection du plagiat et outils de résumé',
        'product.scispace.feature3': 'Formats d\'exportation multiples et support technique',
    }
};

let currentLang = localStorage.getItem('preferredLanguage') || 'ar';

// Make translations and language state globally available
window.translations = translations;
window.currentLang = currentLang;
window.changeLanguage = changeLanguage;

function changeLanguage(lang) {
    currentLang = lang;
    window.currentLang = lang; // Update global state
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });

    // Update animated text
    if (window.updateAnimatedText) {
        window.updateAnimatedText();
    }

    // Update price displays with correct currency symbol
    updatePriceDisplays(lang);

    // Update product translations from Firebase (Requirements: 4.5)
    if (window.ProductTranslationsUI) {
        window.ProductTranslationsUI.onLanguageChange(lang);
    }

    // Update availability texts for the new language
    if (window.AvailabilityUI) {
        window.AvailabilityUI.updateAvailabilityTextsForLanguage(lang);
    }

    // Save preference
    localStorage.setItem('preferredLanguage', lang);
}

// Update all price displays with correct currency symbol
function updatePriceDisplays(lang) {
    const currencySymbols = {
        ar: 'د.ج',
        en: 'DA',
        fr: 'DA'
    };
    const symbol = currencySymbols[lang] || currencySymbols.ar;

    // Update price-tag elements
    document.querySelectorAll('.price-tag[data-price-dzd]').forEach(element => {
        const priceDZD = element.getAttribute('data-price-dzd');
        if (priceDZD) {
            const formattedPrice = Number(priceDZD).toLocaleString();
            element.textContent = `${formattedPrice} ${symbol}`;
        }
    });

    // Update status badges (Coming Soon, Unavailable)
    updateStatusBadges(lang);
}

// Update status badges based on current language
function updateStatusBadges(lang) {
    const statusTexts = {
        unavailable: {
            ar: { badge: '❌ غير متوفر حالياً', btn: '❌ غير متوفر' },
            en: { badge: '❌ Currently Unavailable', btn: '❌ Unavailable' },
            fr: { badge: '❌ Actuellement Indisponible', btn: '❌ Indisponible' }
        },
        coming_soon: {
            ar: { badge: '🔜 قريباً', btn: '🔜 قريباً' },
            en: { badge: '🔜 Coming Soon', btn: '🔜 Coming Soon' },
            fr: { badge: '🔜 Bientôt', btn: '🔜 Bientôt' }
        }
    };

    // Helper to detect status from text content
    function detectStatusFromText(text) {
        if (!text) return null;
        const lowerText = text.toLowerCase();
        if (lowerText.includes('غير متوفر') || lowerText.includes('unavailable') || lowerText.includes('indisponible')) {
            return 'unavailable';
        }
        if (lowerText.includes('قريب') || lowerText.includes('coming') || lowerText.includes('bientôt') || lowerText.includes('bientot')) {
            return 'coming_soon';
        }
        return null;
    }

    // Update dynamic status badges (created by Firebase)
    document.querySelectorAll('.status-badge').forEach(badge => {
        let status = badge.getAttribute('data-status');
        if (!status) {
            status = detectStatusFromText(badge.textContent);
        }
        if (status) {
            const texts = statusTexts[status]?.[lang] || statusTexts[status]?.ar;
            if (texts) {
                badge.textContent = texts.badge;
                badge.setAttribute('data-status', status);
            }
        }
    });

    // Update disabled order buttons with data-status
    document.querySelectorAll('.order-btn[disabled]').forEach(btn => {
        let status = btn.getAttribute('data-status');
        if (!status) {
            status = detectStatusFromText(btn.textContent);
        }
        if (status) {
            const texts = statusTexts[status]?.[lang] || statusTexts[status]?.ar;
            if (texts) {
                btn.textContent = texts.btn;
                btn.setAttribute('data-status', status);
            }
        }
    });
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for saved preference
    let savedLang = localStorage.getItem('preferredLanguage');

    // 2. If no saved preference, detect from browser
    if (!savedLang) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('en')) {
            savedLang = 'en';
        } else if (browserLang.startsWith('fr')) {
            savedLang = 'fr';
        } else {
            savedLang = 'ar'; // Default to Arabic for others
        }
    }

    // 3. Apply the language
    if (savedLang !== 'ar') {
        changeLanguage(savedLang);

        // 4. If language is English, and no currency preference yet, set to USD
        const savedCurrency = localStorage.getItem('marketalgeriaa_currency');
        if (savedLang === 'en' && !savedCurrency && window.currencyManager) {
            window.currencyManager.setCurrency('USD');
            window.currencyManager.updateAllPrices('USD');
            if (window.paymentManager) {
                window.paymentManager.setCurrency('USD');
                window.paymentManager.updateAllPaymentButtons('USD');
            }
        }
    }

    // Always mark as ready
    document.body.classList.add('i18n-ready');
});

// Giveaway Functions
let selectedWinners = [];

function startGiveaway() {
    if (reviews.length < 4) {
        alert('عدد التقييمات غير كافٍ! يجب أن يكون هناك 4 تقييمات على الأقل.');
        return;
    }

    // Select 4 random winners
    const shuffled = [...reviews].sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, 4);

    // Create message
    let message = '🎉 الفائزون في Giveaway:\n\n';
    winners.forEach((winner, i) => {
        message += `${i + 1}. ${winner.name} - ${'⭐'.repeat(winner.rating)} (${winner.platform})\n`;
    });
    message += '\nمبروك للفائزين! 🎁';

    // Show winners
    alert(message);

    // Copy to clipboard
    if (confirm('هل تريد نسخ أسماء الفائزين؟')) {
        navigator.clipboard.writeText(message).then(() => {
            alert('✅ تم نسخ أسماء الفائزين!');
        });
    }
}

function closeGiveawayModal() {
    document.getElementById('giveaway-modal').style.display = 'none';
}

function runGiveaway() {
    if (reviews.length < 4) {
        alert('عدد التقييمات غير كافٍ! يجب أن يكون هناك 4 تقييمات على الأقل.');
        return;
    }

    // Hide start button
    document.getElementById('start-button-container').style.display = 'none';

    // Show spinning animation
    document.getElementById('spinning-wheel').style.display = 'block';

    // Wait 3 seconds then show winners
    setTimeout(() => {
        selectRandomWinners();
        document.getElementById('spinning-wheel').style.display = 'none';
        displayWinners();
    }, 3000);
}

function selectRandomWinners() {
    const shuffled = [...reviews].sort(() => 0.5 - Math.random());
    selectedWinners = shuffled.slice(0, 4);
}

function displayWinners() {
    const container = document.getElementById('winners-container');
    container.innerHTML = '';

    selectedWinners.forEach((winner, index) => {
        const card = document.createElement('div');
        card.className = 'winner-card';
        card.style.animationDelay = `${index * 0.2}s`;

        const stars = '⭐'.repeat(winner.rating);

        card.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="winner-number">${index + 1}</span>
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">
                            ${escapeHtml(winner.name)}
                        </div>
                        <div style="color: #39ff14; font-size: 0.9rem;">
                            ${stars} • ${winner.platform}
                        </div>
                    </div>
                </div>
                <div style="font-size: 2rem;">🎁</div>
            </div>
            ${winner.comment ? `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(57, 255, 20, 0.2);">
                    <p style="color: #ccc; font-size: 0.9rem; font-style: italic;">
                        "${escapeHtml(winner.comment)}"
                    </p>
                </div>
            ` : ''}
        `;

        container.appendChild(card);
    });

    document.getElementById('winners-list').style.display = 'block';
}

function copyWinners() {
    const winnerNames = selectedWinners.map((w, i) => `${i + 1}. ${w.name}`).join('\n');
    const text = `🎉 الفائزون في Giveaway:\n\n${winnerNames}\n\nمبروك للفائزين! 🎁`;

    navigator.clipboard.writeText(text).then(() => {
        alert('✅ تم نسخ أسماء الفائزين!');
    });
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('giveaway-modal');
    if (event.target === modal) {
        closeGiveawayModal();
    }
});

// Initialize language switcher
document.addEventListener('DOMContentLoaded', () => {
    // Auto-detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    let detectedLang = 'ar'; // default

    if (browserLang.startsWith('en')) {
        detectedLang = 'en';
    } else if (browserLang.startsWith('fr')) {
        detectedLang = 'fr';
    } else if (browserLang.startsWith('ar')) {
        detectedLang = 'ar';
    }

    // Use saved preference if exists, otherwise use detected language
    const savedLang = localStorage.getItem('preferredLanguage') || detectedLang;
    changeLanguage(savedLang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });
});

// ==================== REVIEWS SYSTEM ====================

// Real reviews data from The Real World and other products
const realReviews = [
    // The Real World Reviews - Real customer testimonials
    { name: "أحمد محمد", product: "The Real World", rating: 5, comment: "أفضل استثمار قمت به! المحتوى التعليمي قيم جداً وتعلمت الكثير عن التجارة الإلكترونية والتسويق. المجتمع داعم والدعم الفني سريع.", date: "2024-11-15" },
    { name: "Karim B.", product: "The Real World", rating: 5, comment: "Life-changing platform! The courses are practical and the community is incredibly supportive. Already seeing results in my business.", date: "2024-11-22" },
    { name: "عبد الرحمن", product: "The Real World", rating: 5, comment: "منصة رائعة! تعلمت مهارات حقيقية في Copywriting و E-commerce. البروفيسورات محترفون والمحتوى يتحدث باستمرار.", date: "2024-11-30" },
    { name: "Yassine M.", product: "The Real World", rating: 5, comment: "Meilleure décision de ma vie! J'ai appris le freelancing et je gagne maintenant plus que mon ancien salaire. Merci Market Algeriaa!", date: "2024-11-28" },
    { name: "خالد أحمد", product: "The Real World", rating: 5, comment: "المحتوى عملي 100%! تعلمت AI و Automation وبدأت أطبق مباشرة. الدعم الفني يرد في نفس اليوم.", date: "2024-12-01" },
    { name: "Omar Z.", product: "The Real World", rating: 5, comment: "The Real World changed my mindset completely. Learning from successful entrepreneurs is priceless. Worth every penny!", date: "2024-11-25" },
    { name: "ليلى بن علي", product: "The Real World", rating: 5, comment: "كنت متردد في البداية لكن الآن أنا ممتن! تعلمت Social Media Marketing وبدأت أشتغل مع عملاء. شكراً!", date: "2024-11-20" },
    { name: "Mehdi K.", product: "The Real World", rating: 5, comment: "Excellent! Les cours sont mis à jour régulièrement et la communauté est très active. J'ai appris le trading et le copywriting.", date: "2024-11-18" },
    { name: "سارة محمود", product: "The Real World", rating: 5, comment: "منصة تعليمية متكاملة! المحتوى منظم بشكل ممتاز والكورسات متنوعة. أنصح بها بشدة لكل من يريد تطوير نفسه.", date: "2024-11-27" },
    { name: "Rayan A.", product: "The Real World", rating: 5, comment: "Best investment for self-improvement! Learned crypto trading, AI tools, and business strategies. The professors are real experts.", date: "2024-11-23" },

    // ChatGPT Business Reviews
    { name: "Sarah K.", product: "ChatGPT Business", rating: 5, comment: "Excellent service! Got my account instantly and support is very responsive. ChatGPT helps me daily with work tasks.", date: "2024-11-20" },
    { name: "فاطمة الزهراء", product: "ChatGPT Business", rating: 5, comment: "خدمة احترافية وسريعة! الحساب يعمل بشكل ممتاز وأستخدمه يومياً في عملي. الدعم متجاوب جداً.", date: "2024-11-25" },
    { name: "Amina L.", product: "ChatGPT Business", rating: 5, comment: "Service impeccable! Le compte fonctionne parfaitement et le support est très réactif. Je l'utilise pour mon travail quotidien.", date: "2024-12-01" },
    { name: "محمد حسن", product: "ChatGPT Business", rating: 5, comment: "أداة رائعة! تساعدني في كتابة المحتوى والبرمجة. الحساب يعمل بدون مشاكل والسعر ممتاز.", date: "2024-11-29" },
    { name: "Emma W.", product: "ChatGPT Business", rating: 5, comment: "Amazing AI tool! Helps me with content creation, coding, and research. Fast delivery and great support!", date: "2024-11-26" },

    // Adobe Creative Cloud Reviews
    { name: "محمد علي", product: "Adobe Creative Cloud", rating: 5, comment: "حساب شخصي يعمل بشكل مثالي! جميع التطبيقات تعمل بدون مشاكل. Photoshop و Illustrator يشتغلوا ممتاز.", date: "2024-11-18" },
    { name: "Youcef M.", product: "Adobe Creative Cloud", rating: 5, comment: "Parfait! Toutes les applications Adobe fonctionnent parfaitement. Service rapide et professionnel. Je recommande!", date: "2024-11-28" },
    { name: "ياسمين أحمد", product: "Adobe Creative Cloud", rating: 5, comment: "ممتاز للمصممين! استخدم Premiere Pro و After Effects بدون مشاكل. السعر أفضل من الاشتراك الرسمي.", date: "2024-11-24" },
    { name: "Alex M.", product: "Adobe Creative Cloud", rating: 5, comment: "Great service! All Adobe apps working perfectly. Fast activation and excellent customer support. Highly recommended!", date: "2024-11-21" },
    { name: "نور الدين", product: "Adobe Creative Cloud", rating: 5, comment: "خدمة ممتازة! الحساب شخصي وكل البرامج تشتغل. استخدمه في مشاريعي اليومية بدون مشاكل.", date: "2024-11-19" }
];

// Load reviews from Firebase or use real reviews as fallback
async function loadAllReviews() {
    try {
        // Wait for Firebase to be ready
        if (!window.db) {
            await new Promise(resolve => {
                const timeout = setTimeout(() => {
                    console.log('Firebase timeout, using local reviews');
                    resolve();
                }, 3000);

                window.addEventListener('firebaseReady', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
        }

        let allReviews = [];

        // Try to load from Firebase
        if (window.db && window.firebaseModules) {
            const { collection, getDocs } = window.firebaseModules;

            // Load from all collections
            const collections = [
                'reviews',
                'chatgpt-reviews',
                'adobe-reviews',
                'gamma-reviews',
                'canva-reviews',
                'capcut-reviews',
                'netflix-reviews',
                'perplexity-reviews',
                'tradingview-reviews',
                'cursor-reviews'
            ];

            for (const collectionName of collections) {
                try {
                    const querySnapshot = await getDocs(collection(window.db, collectionName));
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        // Only add approved reviews or reviews with rating
                        if (data.rating && data.name) {
                            allReviews.push({
                                name: data.name,
                                product: data.platform || data.product || (collectionName === 'reviews' ? 'The Real World' : collectionName === 'chatgpt-reviews' ? 'ChatGPT Business' : 'Adobe Creative Cloud'),
                                rating: data.rating,
                                comment: data.comment || '',
                                date: data.timestamp?.toDate?.()?.toISOString() || data.date || new Date().toISOString()
                            });
                        }
                    });
                    console.log(`Loaded ${querySnapshot.size} reviews from ${collectionName}`);
                } catch (err) {
                    console.log(`Collection ${collectionName} not found or empty:`, err.message);
                }
            }
        }

        // If no reviews from Firebase, use local reviews
        if (allReviews.length === 0) {
            console.log('No Firebase reviews found, using local reviews');
            allReviews = [...realReviews];
        } else {
            console.log(`Loaded ${allReviews.length} reviews from Firebase`);
        }

        // Sort by date (newest first)
        allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

        return allReviews;
    } catch (error) {
        console.error('Error loading reviews:', error);
        return realReviews; // Fallback to real reviews
    }
}

// Display reviews on homepage
async function displayHomepageReviews() {
    try {
        const reviews = await loadAllReviews();
        const reviewsGrid = document.getElementById('reviews-grid');

        if (!reviewsGrid) {
            console.warn('reviews-grid element not found');
            return;
        }

        if (!reviews || reviews.length === 0) {
            console.warn('No reviews to display');
            return;
        }

        // Calculate average rating
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const totalReviews = reviews.length;

        // Update average rating display
        const avgRatingElement = document.getElementById('average-rating-number');
        const totalReviewsElement = document.getElementById('total-reviews-count');

        if (avgRatingElement) avgRatingElement.textContent = avgRating.toFixed(1);
        if (totalReviewsElement) totalReviewsElement.textContent = totalReviews;
        updateStars('average-stars', avgRating);

        // Display first 6 reviews
        const displayReviews = reviews.slice(0, 6);
        reviewsGrid.innerHTML = '';

        displayReviews.forEach(review => {
            const reviewCard = createReviewCard(review);
            reviewsGrid.appendChild(reviewCard);
        });

        console.log(`✅ Displayed ${displayReviews.length} reviews`);
    } catch (error) {
        console.error('Error displaying reviews:', error);
    }
}

// Create review card element
function createReviewCard(review) {
    const card = document.createElement('div');
    card.style.cssText = 'background: rgba(20, 24, 42, 0.8); padding: 30px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); transition: transform 0.3s;';
    card.onmouseenter = () => card.style.transform = 'translateY(-5px)';
    card.onmouseleave = () => card.style.transform = 'translateY(0)';

    const stars = '⭐'.repeat(review.rating);
    const productEmoji = getProductEmoji(review.product);

    card.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-left: 15px;">
                ${productEmoji}
            </div>
            <div style="flex: 1;">
                <h4 style="margin-bottom: 5px; color: var(--text-primary);">${escapeHtml(review.name)}</h4>
                <div style="color: #ffd56f; font-size: 0.9rem;">${stars}</div>
                <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 3px;">${escapeHtml(review.product)}</div>
            </div>
        </div>
        <p style="color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem;">${escapeHtml(review.comment)}</p>
    `;

    return card;
}

// Get emoji for product
function getProductEmoji(product) {
    if (product.includes('Real World')) return '🎓';
    if (product.includes('ChatGPT')) return '🤖';
    if (product.includes('Adobe')) return '🎨';
    if (product.includes('Gamma')) return '📊';
    if (product.includes('Canva')) return '🎨';
    if (product.includes('CapCut')) return '🎬';
    if (product.includes('Netflix')) return '🎬';
    if (product.includes('Perplexity')) return '🔍';
    if (product.includes('TradingView')) return '📈';
    if (product.includes('Cursor')) return '💻';
    return '👤';
}

// Update stars display
function updateStars(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stars = container.querySelectorAll('span');
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    stars.forEach((star, index) => {
        if (index < fullStars) {
            star.textContent = '★';
            star.style.color = '#ffd56f';
        } else if (index === fullStars && hasHalfStar) {
            star.textContent = '⯨';
            star.style.color = '#ffd56f';
        } else {
            star.textContent = '☆';
            star.style.color = '#666';
        }
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open add review modal
function openAddReviewModal() {
    const modal = document.getElementById('add-review-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.style.display = 'flex';

        // Reset form
        const form = document.getElementById('add-review-form');
        if (form) form.reset();

        const ratingInput = document.getElementById('review-rating');
        if (ratingInput) ratingInput.value = '';

        document.querySelectorAll('.star-input').forEach(star => {
            star.textContent = '☆';
            star.style.color = '#666';
        });
    } else {
        console.error('Modal not found!');
    }
}

// Close add review modal
function closeAddReviewModal() {
    const modal = document.getElementById('add-review-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Initialize star rating input
document.addEventListener('DOMContentLoaded', () => {
    const starInputs = document.querySelectorAll('.star-input');

    starInputs.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            document.getElementById('review-rating').value = rating;

            // Update star display
            starInputs.forEach((s, index) => {
                if (index < rating) {
                    s.textContent = '★';
                    s.style.color = '#ffd56f';
                } else {
                    s.textContent = '☆';
                    s.style.color = '#666';
                }
            });
        });

        // Hover effect
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            starInputs.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#ffd56f';
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('review-rating').value) || 0;
            starInputs.forEach((s, index) => {
                if (index >= currentRating) {
                    s.style.color = '#666';
                }
            });
        });
    });

    // Handle image upload
    const imageInput = document.getElementById('review-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageName = document.getElementById('image-name');
    const removeImageBtn = document.getElementById('remove-image');

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert(currentLang === 'ar' ? 'حجم الصورة كبير جداً! الحد الأقصى 5MB' :
                        currentLang === 'fr' ? 'Image trop grande! Maximum 5MB' :
                            'Image too large! Maximum 5MB');
                    imageInput.value = '';
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                    imageName.textContent = file.name;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            imagePreview.style.display = 'none';
            imageName.textContent = '';
            previewImg.src = '';
        });
    }

    // Handle form submission
    const form = document.getElementById('add-review-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Check if user already submitted a review in the last 24 hours
            const lastReviewTime = localStorage.getItem('lastReviewTime');
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            if (lastReviewTime && (now - parseInt(lastReviewTime)) < twentyFourHours) {
                const hoursLeft = Math.ceil((twentyFourHours - (now - parseInt(lastReviewTime))) / (60 * 60 * 1000));
                const message = currentLang === 'ar'
                    ? `يمكنك إضافة تقييم واحد فقط كل 24 ساعة. الرجاء المحاولة بعد ${hoursLeft} ساعة.`
                    : currentLang === 'fr'
                        ? `Vous ne pouvez ajouter qu'un avis toutes les 24 heures. Veuillez réessayer dans ${hoursLeft} heures.`
                        : `You can only add one review every 24 hours. Please try again in ${hoursLeft} hours.`;
                alert(message);
                return;
            }

            const name = document.getElementById('review-name').value;
            const product = document.getElementById('review-product').value;
            const source = document.getElementById('review-source').value;
            const rating = parseInt(document.getElementById('review-rating').value);
            const comment = document.getElementById('review-comment').value;
            const imageFile = document.getElementById('review-image').files[0];

            if (!rating) {
                alert(currentLang === 'ar' ? 'الرجاء اختيار التقييم' : currentLang === 'fr' ? 'Veuillez sélectionner une note' : 'Please select a rating');
                return;
            }

            if (!source) {
                alert(currentLang === 'ar' ? 'الرجاء اختيار من أين عرفت عنا' : currentLang === 'fr' ? 'Veuillez sélectionner comment vous nous avez trouvé' : 'Please select how you found us');
                return;
            }

            // Show loading message
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : currentLang === 'fr' ? 'Envoi en cours...' : 'Submitting...';

            try {
                let imageUrl = null;

                // Upload image if provided
                if (imageFile && window.storage && window.firebaseModules) {
                    try {
                        console.log('Attempting to upload image...');
                        const { ref, uploadBytes, getDownloadURL } = window.firebaseModules;
                        const storageRef = ref(window.storage, `reviews/${Date.now()}_${imageFile.name}`);
                        const snapshot = await uploadBytes(storageRef, imageFile);
                        imageUrl = await getDownloadURL(snapshot.ref);
                        console.log('Image uploaded successfully:', imageUrl);
                    } catch (imgError) {
                        console.error('Error uploading image:', imgError);
                        console.log('Continuing without image...');
                        // Show warning but continue
                        const warningMsg = currentLang === 'ar'
                            ? 'تعذر رفع الصورة، سيتم إرسال التقييم بدون صورة.'
                            : currentLang === 'fr'
                                ? 'Impossible de télécharger l\'image, l\'avis sera envoyé sans image.'
                                : 'Failed to upload image, review will be submitted without image.';
                        console.warn(warningMsg);
                    }
                }

                // Send to Firebase
                if (window.db && window.firebaseModules) {
                    console.log('Sending review to Firebase...');
                    const { collection, addDoc, serverTimestamp } = window.firebaseModules;

                    let collectionName = 'reviews';
                    if (product.includes('ChatGPT')) collectionName = 'chatgpt-reviews';
                    else if (product.includes('Adobe')) collectionName = 'adobe-reviews';
                    else if (product.includes('Gamma')) collectionName = 'gamma-reviews';
                    else if (product.includes('Canva')) collectionName = 'canva-reviews';
                    else if (product.includes('CapCut')) collectionName = 'capcut-reviews';
                    else if (product.includes('Netflix')) collectionName = 'netflix-reviews';
                    else if (product.includes('Perplexity')) collectionName = 'perplexity-reviews';
                    else if (product.includes('TradingView')) collectionName = 'tradingview-reviews';

                    const reviewData = {
                        name: name,
                        platform: source, // Store source as platform
                        product: product,
                        rating: rating,
                        comment: comment,
                        source: source, // Also store separately
                        timestamp: serverTimestamp(),
                        approved: false // Requires admin approval
                    };

                    // Add image URL if available
                    if (imageUrl) {
                        reviewData.image = imageUrl;
                    }

                    await addDoc(collection(window.db, collectionName), reviewData);
                }

                // Save timestamp to prevent multiple reviews in 24 hours
                localStorage.setItem('lastReviewTime', Date.now().toString());

                console.log('Review submitted successfully!');

                // Show success message
                const successMsg = currentLang === 'ar' ? 'شكراً! تم إرسال تقييمك بنجاح. سيتم مراجعته قريباً.' :
                    currentLang === 'fr' ? 'Merci! Votre avis a été soumis avec succès. Il sera examiné bientôt.' :
                        'Thank you! Your review has been submitted successfully. It will be reviewed soon.';
                alert(successMsg);

                closeAddReviewModal();

                // Reload reviews
                setTimeout(() => {
                    displayHomepageReviews();
                }, 1000);

            } catch (error) {
                console.error('Error submitting review:', error);
                const errorMsg = currentLang === 'ar' ? 'حدث خطأ. الرجاء المحاولة مرة أخرى.' :
                    currentLang === 'fr' ? 'Une erreur s\'est produite. Veuillez réessayer.' :
                        'An error occurred. Please try again.';
                alert(errorMsg);
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // Load reviews on page load
    displayHomepageReviews();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('add-review-modal');
    if (event.target === modal) {
        closeAddReviewModal();
    }
});

// Make functions globally available
window.openAddReviewModal = openAddReviewModal;
window.closeAddReviewModal = closeAddReviewModal;


// Adobe Duration Selection
function selectAdobeDuration(duration) {
    document.querySelectorAll('.adobe-duration-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.adobe-duration-btn[data-duration="${duration}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['adobe'];
    const priceObj = config.durations[duration];
    const productNames = {
        '1month': 'Adobe Creative Cloud - 1 Month',
        '2months': 'Adobe Creative Cloud - 2 Months',
        '3months': 'Adobe Creative Cloud - 3 Months'
    };
    const name = productNames[duration];

    // Show/hide prices
    document.querySelectorAll('.adobe-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`adobe-prices-${duration}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('adobe-order-btn');
    if (orderBtn) {
        orderBtn.setAttribute('data-product', name);
    }

    // Update payment buttons
    const paymentButtons = ['adobe-usdt-btn', 'adobe-redotpay-btn', 'adobe-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Adobe Creative Cloud',
            variant: duration,
            currency: currency
        });
    }
}

// Gamma.AI Duration Selection
function selectGammaDuration(duration) {
    document.querySelectorAll('.gamma-duration-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.gamma-duration-btn[data-duration="${duration}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['gamma'];
    const priceObj = config.durations[duration];
    const productNames = {
        '1month': 'Gamma.AI - 1 Month',
        '3months': 'Gamma.AI - 3 Months'
    };
    const name = productNames[duration];

    // Show/hide prices
    document.querySelectorAll('.gamma-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`gamma-prices-${duration}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('gamma-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['gamma-usdt-btn', 'gamma-redotpay-btn', 'gamma-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Gamma.AI',
            variant: duration,
            currency: currency
        });
    }
}

// Cursor AI Duration Selection
function selectCursorType(type) {
    const buttons = document.querySelectorAll('.cursor-type-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
            btn.style.border = '2px solid var(--accent)';
            btn.style.background = 'rgba(255, 213, 111, 0.15)';
            btn.style.color = 'var(--text-primary)';
        } else {
            btn.classList.remove('active');
            btn.style.border = '2px solid var(--border-color)';
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary)';
        }
    });

    // Show/hide prices and update button data
    const cursorConfig = PRODUCTS['cursor'];
    const priceObj = cursorConfig.durations[type];
    const name = type === '7days' ? 'Cursor AI - 7 Days' : 'Cursor AI - 30 Days (Private)';

    document.querySelectorAll('.cursor-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`cursor-prices-${type}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('cursor-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['cursor-usdt-btn', 'cursor-redotpay-btn', 'cursor-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Cursor AI',
            variant: type,
            currency: currency
        });
    }
}

function orderCursor() {
    const activeBtn = document.querySelector('.cursor-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : '7days';
    const name = type === '7days' ? 'Cursor AI - 7 Days' : 'Cursor AI - 30 Days (Private)';

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const cursorConfig = PRODUCTS['cursor'];
    const priceObj = cursorConfig.durations[type];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    window.currentProductName = name;
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

// HMA VPN Selection Functions
function selectHmaDuration(duration) {
    document.querySelectorAll('.hma-duration-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.hma-duration-btn[data-duration="${duration}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const hmaConfig = PRODUCTS['hma-vpn'];
    const priceObj = hmaConfig.durations[duration];
    const name = duration === '1year' ? 'HMA VPN - 1 Year' : 'HMA VPN - 2 Years';

    // Show/hide prices
    document.querySelectorAll('.hma-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`hma-prices-${duration}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('hma-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['hma-usdt-btn', 'hma-redotpay-btn', 'hma-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'HMA VPN',
            variant: duration,
            currency: currency
        });
    }
}

function orderHma() {
    const activeBtn = document.querySelector('.hma-duration-btn.active');
    const duration = activeBtn ? activeBtn.getAttribute('data-duration') : '1year';
    const name = duration === '1year' ? 'HMA VPN - 1 Year' : 'HMA VPN - 2 Years';

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const hmaConfig = PRODUCTS['hma-vpn'];
    const priceObj = hmaConfig.durations[duration];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    window.currentProductName = name;
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

// SciSpace Selection Functions
function selectScispaceDuration(duration) {
    document.querySelectorAll('.scispace-duration-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.scispace-duration-btn[data-duration="${duration}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['scispace'];
    const priceObj = config.durations[duration];
    const name = duration === '1month' ? 'SciSpace Premium - 1 Month' : 'SciSpace Premium - 3 Months';

    // Show/hide prices
    document.querySelectorAll('.scispace-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`scispace-prices-${duration}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('scispace-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['scispace-usdt-btn', 'scispace-redotpay-btn', 'scispace-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'SciSpace Premium',
            variant: duration,
            currency: currency
        });
    }
}

function orderScispace() {
    const activeBtn = document.querySelector('.scispace-duration-btn.active');
    const duration = activeBtn ? activeBtn.getAttribute('data-duration') : '1month';
    const name = duration === '1month' ? 'SciSpace Premium - 1 Month' : 'SciSpace Premium - 3 Months';

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['scispace'];
    const priceObj = config.durations[duration];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    window.currentProductName = name;
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

// Order Adobe
function orderAdobe() {
    const activeBtn = document.querySelector('.adobe-duration-btn.active');
    const duration = activeBtn ? activeBtn.getAttribute('data-duration') : '1month';
    const productNames = {
        '1month': 'Adobe Creative Cloud - 1 Month',
        '2months': 'Adobe Creative Cloud - 2 Months',
        '3months': 'Adobe Creative Cloud - 3 Months'
    };
    const name = productNames[duration];

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['adobe'];
    const priceObj = config.durations[duration];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// Order Gamma
function orderGamma() {
    const activeBtn = document.querySelector('.gamma-duration-btn.active');
    const duration = activeBtn ? activeBtn.getAttribute('data-duration') : '1month';
    const productNames = {
        '1month': 'Gamma.AI - 1 Month',
        '3months': 'Gamma.AI - 3 Months'
    };
    const name = productNames[duration];

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['gamma'];
    const priceObj = config.durations[duration];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// ChatGPT Selection Functions
function selectChatGPTType(type) {
    document.querySelectorAll('.chatgpt-type-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.chatgpt-type-btn[data-type="${type}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['chatgpt'];
    const priceObj = config.durations[type];
    const names = {
        'plus': 'ChatGPT 5.2 Plus - 1 Month',
        'business': 'ChatGPT 5.2 Business - 1 Month',
        'reseller': 'ChatGPT 5.2 Reseller Pack (1+5)'
    };
    const name = names[type];

    // Show/hide prices
    document.querySelectorAll('.chatgpt-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`chatgpt-prices-${type}`);
    if (priceEl) priceEl.style.display = 'block';

    // Show/hide features
    document.querySelectorAll('.chatgpt-features').forEach(feat => feat.style.display = 'none');
    const featEl = document.getElementById(`chatgpt-features-${type}`);
    if (featEl) featEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('chatgpt-order-btn');
    if (orderBtn) {
        orderBtn.setAttribute('data-product', name);
    }

    // Update payment buttons
    const paymentButtons = ['chatgpt-crypto-btn', 'chatgpt-redotpay-btn', 'chatgpt-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'ChatGPT 5.2',
            variant: type,
            currency: currency
        });
    }
}

function orderChatGPT() {
    const activeBtn = document.querySelector('.chatgpt-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : 'plus';
    const names = {
        'plus': 'ChatGPT Plus - 1 Month',
        'go': 'ChatGPT GO - 12 Months',
        'business': 'ChatGPT Business - 1 Month',
        'reseller': 'ChatGPT Business Wholesale (Reseller)'
    };
    const name = names[type];

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['chatgpt'];
    const priceObj = config.durations[type];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// CapCut Selection Functions
function selectCapcutDuration(duration) {
    document.querySelectorAll('.capcut-duration-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.capcut-duration-btn[data-duration="${duration}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['capcut'];
    const priceObj = config.durations[duration];
    const names = {
        '1month': 'CapCut Pro - 30 Days',
        '3months': 'CapCut Pro - 3 Months',
        '6months': 'CapCut Pro - 6 Months',
        '1year': 'CapCut Pro - 1 Year'
    };
    const name = names[duration];

    // Show/hide prices
    document.querySelectorAll('.capcut-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`capcut-prices-${duration}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('capcut-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['capcut-usdt-btn', 'capcut-redotpay-btn', 'capcut-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'CapCut Pro',
            variant: duration,
            currency: currency
        });
    }
}

function orderCapcut() {
    const activeBtn = document.querySelector('.capcut-duration-btn.active');
    const duration = activeBtn ? activeBtn.getAttribute('data-duration') : '1month';
    const names = {
        '1month': 'CapCut Pro - 30 Days',
        '3months': 'CapCut Pro - 3 Months',
        '6months': 'CapCut Pro - 6 Months',
        '1year': 'CapCut Pro - 1 Year'
    };
    const name = names[duration];

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['capcut'];
    const priceObj = config.durations[duration];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// Lovable Selection Functions
function selectLovableType(type) {
    const buttons = document.querySelectorAll('.lovable-type-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        // Reset inline styles
        btn.style.border = '2px solid var(--border-color)';
        btn.style.background = 'rgba(100, 100, 100, 0.1)';
        btn.style.color = 'var(--text-secondary)';
    });

    const selectedBtn = document.querySelector(`.lovable-type-btn[data-type="${type}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        // Apply active inline styles
        selectedBtn.style.border = '2px solid var(--accent)';
        selectedBtn.style.background = 'rgba(255, 213, 111, 0.15)';
        selectedBtn.style.color = 'var(--text-primary)';
    }

    const config = PRODUCTS['lovable'];
    const priceObj = config.durations[type];
    const names = {
        '1month': 'Lovable AI - 1 Month',
        '2months': 'Lovable AI - 2 Months',
        '3months': 'Lovable AI - 3 Months'
    };
    const name = names[type];

    // Show/hide prices
    document.querySelectorAll('.lovable-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`lovable-prices-${type}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('lovable-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['lovable-usdt-btn', 'lovable-redotpay-btn', 'lovable-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Lovable AI',
            variant: type,
            currency: currency
        });
    }
}

function orderLovable() {
    const activeBtn = document.querySelector('.lovable-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : '1month';
    const names = {
        '1month': 'Lovable AI - 1 Month',
        '2months': 'Lovable AI - 2 Months',
        '3months': 'Lovable AI - 3 Months'
    };
    const name = names[type];

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['lovable'];
    const priceObj = config.durations[type];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// Netflix Selection Functions
function selectNetflixType(type) {
    const buttons = document.querySelectorAll('.netflix-type-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        // Reset inline styles
        btn.style.border = '2px solid var(--border-color)';
        btn.style.background = 'rgba(100, 100, 100, 0.1)';
        btn.style.color = 'var(--text-secondary)';
    });

    const selectedBtn = document.querySelector(`.netflix-type-btn[data-type="${type}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        // Apply active inline styles (Netflix Red)
        selectedBtn.style.border = '2px solid #E50914';
        selectedBtn.style.background = 'rgba(229, 9, 20, 0.15)';
        selectedBtn.style.color = 'var(--text-primary)';
    }

    const config = PRODUCTS['netflix'];
    const priceObj = config.durations[type];
    const names = {
        '1month': 'Netflix Premium - 1 Month',
        '3months': 'Netflix Premium - 3 Months',
        '12months': 'Netflix Premium - 1 Year'
    };
    const name = names[type];

    // Show/hide prices
    document.querySelectorAll('.netflix-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`netflix-prices-${type}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('netflix-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['netflix-usdt-btn', 'netflix-redotpay-btn', 'netflix-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Netflix Premium',
            variant: type,
            currency: currency
        });
    }
}

function orderNetflix() {
    const activeBtn = document.querySelector('.netflix-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : '1month';
    const names = {
        '1month': 'Netflix Premium - 1 Month',
        '3months': 'Netflix Premium - 3 Months',
        '12months': 'Netflix Premium - 1 Year'
    };
    const name = names[type];

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['netflix'];
    const priceObj = config.durations[type];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// Canva Selection Functions
function selectCanvaType(type) {
    document.querySelectorAll('.canva-type-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.canva-type-btn[data-type="${type}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['canva'];
    const priceObj = config.durations[type];
    const name = type === 'standard' ? 'Canva Pro' : 'Canva Reseller Offer';

    // Show/hide prices
    document.querySelectorAll('.canva-prices').forEach(price => price.style.display = 'none');
    const priceId = type === 'standard' ? 'canva-prices-standard' : 'canva-prices-reseller';
    const priceEl = document.getElementById(priceId);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('canva-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Update payment buttons
    const paymentButtons = ['canva-usdt-btn', 'canva-redotpay-btn', 'canva-baridimob-btn'];
    paymentButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && priceObj) {
            btn.setAttribute('data-product', name);
            btn.setAttribute('data-price', priceObj.dzd);
            btn.setAttribute('data-price-usd', priceObj.usd);
        }
    });

    // Sync prices text content
    if (window.currencyManager) {
        window.currencyManager.updateAllPrices();
    }

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Canva Pro',
            variant: type,
            currency: currency
        });
    }
}

function orderCanva() {
    const activeBtn = document.querySelector('.canva-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : 'standard';
    const name = type === 'standard' ? 'Canva Pro' : 'Canva Reseller Offer';

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['canva'];
    const priceObj = config.durations[type];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// Gemini Selection Functions
function selectGeminiDuration(duration) {
    document.querySelectorAll('.gemini-duration-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`.gemini-duration-btn[data-duration="${duration}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const config = PRODUCTS['google-ai'];
    const priceObj = config.durations[duration];
    const name = duration === '1month' ? 'Gemini Pro - 1 Month' : 'Gemini Pro - 1 Year';

    // Show/hide prices
    document.querySelectorAll('.gemini-prices').forEach(price => price.style.display = 'none');
    const priceEl = document.getElementById(`gemini-prices-${duration}`);
    if (priceEl) priceEl.style.display = 'block';

    // Update order button
    const orderBtn = document.getElementById('gemini-order-btn');
    if (orderBtn) orderBtn.setAttribute('data-product', name);

    // Track CustomizeProduct
    if (typeof fbq !== 'undefined') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        fbq('track', 'CustomizeProduct', {
            content_name: 'Gemini Pro',
            variant: duration,
            currency: currency
        });
    }
}

function orderGemini() {
    const activeBtn = document.querySelector('.gemini-duration-btn.active');
    const duration = activeBtn ? activeBtn.getAttribute('data-duration') : '1month';
    const name = duration === '1month' ? 'Gemini Pro - 1 Month' : 'Gemini Pro - 1 Year';

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const config = PRODUCTS['google-ai'];
    const priceObj = config.durations[duration];
    const price = currency === 'USD' ? priceObj.usd : priceObj.dzd;

    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
        fbq('track', 'InitiateCheckout', {
            content_name: name,
            value: parseFloat(price),
            currency: currency
        });
    }

    redirectToWhatsApp(name, price, currency);
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Central WhatsApp Redirection Function
// ═══════════════════════════════════════════════════════════════════════════

function redirectToWhatsApp(productName, price, currency) {
    const currencySym = currency === 'USD' ? '$' : 'DA';
    const messageAr = `مرحباً 👋\nأريد طلب: ${productName}\nالسعر: ${price} ${currencySym}\n\nشكراً 🙏`;
    const messageEn = `Hello 👋\nI would like to order: ${productName}\nPrice: ${price} ${currencySym}\n\nThank you 🙏`;

    const message = (window.currentLang === 'ar') ? messageAr : messageEn;

    // Track Facebook Contact event
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Contact', {
            content_name: productName,
            content_category: 'whatsapp',
            value: parseFloat(price),
            currency: currency
        });
    }

    // Direct redirection
    window.open(`https://wa.me/213782125821?text=${encodeURIComponent(message)}`, '_blank');
}

// Generic order function for products without special options
function orderProduct(productName) {
    // Detect current currency
    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';

    // Dynamically find price
    let price = 0;

    // First attempt: Try to find in PRODUCTS config
    if (typeof PRODUCTS !== 'undefined') {
        const product = Object.values(PRODUCTS).find(p => p.name === productName);
        if (product) {
            price = currency === 'USD' ? product.price_usd : product.price_dzd;
        }
    }

    // Second attempt: Scrape from DOM if still not found (legacy/dynamic products)
    if (!price) {
        // Find the button that was likely clicked to get context
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

    // Track Facebook Events
    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_name: productName,
            value: parseFloat(price) || 0,
            currency: currency
        });
        fbq('track', 'Lead', {
            content_name: productName,
            value: parseFloat(price) || 0,
            currency: currency
        });
    }

    redirectToWhatsApp(productName, price, currency);
}

// Contact via selected platform (Legacy support for modals if still lingering)
function contactVia(platform) {
    if (platform === 'whatsapp') {
        const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
        // Try to estimate price or just send product name
        redirectToWhatsApp(window.currentProductName || 'Product', '', currency);
    } else if (platform === 'instagram') {
        window.open('https://www.instagram.com/market_algeriaa', '_blank');
    }

    // Close the modal
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }, 300);
    }
}

// Make selection and order functions globally available
window.selectAdobeDuration = selectAdobeDuration;
window.orderAdobe = orderAdobe;
window.selectGammaDuration = selectGammaDuration;
window.orderGamma = orderGamma;
window.selectChatGPTType = selectChatGPTType;
window.orderChatGPT = orderChatGPT;
window.selectCapcutDuration = selectCapcutDuration;
window.orderCapcut = orderCapcut;
window.selectLovableType = selectLovableType;
window.orderLovable = orderLovable;
window.selectNetflixType = selectNetflixType;
window.orderNetflix = orderNetflix;
window.selectCanvaType = selectCanvaType;
window.orderCanva = orderCanva;
window.selectGeminiDuration = selectGeminiDuration;
window.orderGemini = orderGemini;
window.selectHmaDuration = selectHmaDuration;
window.orderHma = orderHma;
window.selectCursorType = selectCursorType;
window.orderCursor = orderCursor;
window.selectScispaceDuration = selectScispaceDuration;
window.orderScispace = orderScispace;
window.contactVia = contactVia;
window.orderProduct = orderProduct;

// ═══════════════════════════════════════════════════════════════════════════
// Scroll Reveal Animation (Parallax removed for better performance)
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // ═══════════════════════════════════════════════════════════════
    // مؤشر التمرير الأفقي لبطاقات المنتجات - Product Cards Scroll Indicator
    // ═══════════════════════════════════════════════════════════════
    function initProductScrollIndicator() {
        const productGrid = document.querySelector('.product-grid');
        const scrollDotsContainer = document.getElementById('scroll-dots');
        const scrollIndicator = document.getElementById('scroll-indicator');

        if (!productGrid || !scrollDotsContainer || !scrollIndicator) return;

        // Get all product cards
        const productCards = productGrid.querySelectorAll('.product-card');
        if (productCards.length === 0) return;

        // Create dots for each product card
        scrollDotsContainer.innerHTML = '';
        productCards.forEach((card, index) => {
            const dot = document.createElement('div');
            dot.className = 'scroll-indicator-dot' + (index === 0 ? ' active' : '');
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                // Scroll to the clicked card
                const cardWidth = card.offsetWidth + 16; // card width + gap
                productGrid.scrollTo({
                    left: cardWidth * index,
                    behavior: 'smooth'
                });
            });
            scrollDotsContainer.appendChild(dot);
        });

        // Update active dot on scroll
        let scrollTimeout;
        productGrid.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPosition = productGrid.scrollLeft;
                const cardWidth = productCards[0].offsetWidth + 16;
                const activeIndex = Math.round(scrollPosition / cardWidth);

                // Update dots
                const dots = scrollDotsContainer.querySelectorAll('.scroll-indicator-dot');
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === activeIndex);
                });
            }, 50);
        });

        // Hide indicator on desktop
        function checkScreenSize() {
            if (window.innerWidth > 768) {
                scrollIndicator.style.display = 'none';
            } else {
                scrollIndicator.style.display = 'flex';
            }
        }

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
    }

    // Initialize scroll indicator
    initProductScrollIndicator();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const targetPosition = target.offsetTop - 20;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

// Scroll Tracking (DeepScroll)
// Tracks when a user scrolls past 50% and 90% of the page
document.addEventListener('DOMContentLoaded', function () {
    let tracked50 = false;
    let tracked90 = false;

    window.addEventListener('scroll', function () {
        if (typeof fbq === 'undefined') return;

        // Calculate scroll percentage
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollPercent = (scrollTop + winHeight) / docHeight;

        // Track 50% scroll
        if (scrollPercent >= 0.5 && !tracked50) {
            tracked50 = true;
            // Get page name from title or URL
            const pageName = document.title || window.location.pathname;
            fbq('trackCustom', 'DeepScroll', {
                depth: '50%',
                page: pageName
            });
        }

        // Track 90% scroll (Bottom of page usually)
        if (scrollPercent >= 0.9 && !tracked90) {
            tracked90 = true;
            const pageName = document.title || window.location.pathname;
            fbq('trackCustom', 'DeepScroll', {
                depth: '90%',
                page: pageName
            });
        }
    });
});
