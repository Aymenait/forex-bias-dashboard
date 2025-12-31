// Global variable for current product name
let currentProductName = '';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize International Expansion System
    // This integrates Currency Manager, Payment Manager, and all UI components
    let expansionSystem = null;
    
    try {
        // Initialize the complete international expansion system
        expansionSystem = await initInternationalExpansion();
        console.log('✅ International expansion system ready');
        
        // Setup payment button event listeners
        setupPaymentButtonListeners(expansionSystem.paymentManager);
        
    } catch (error) {
        console.error('❌ Failed to initialize international expansion:', error);
    }

    // 3D Tilt effect removed for better performance

    // Contact Choice Modal
    const contactChoiceModal = document.getElementById('contact-choice-modal');
    const contactChoiceCloseBtn = document.querySelector('.contact-choice-close');
    const orderBtns = document.querySelectorAll('.order-btn');

    console.log('Order buttons found:', orderBtns.length);
    
    // Add click event listeners to order buttons
    // This ensures the onclick handlers work properly on mobile
    orderBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
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
            const priceUSD = button.getAttribute('data-price-usd') || Math.ceil(priceDZD / 230); // استخدام السعر الصحيح من data-price-usd

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
                const priceUSD = button.getAttribute('data-price-usd') || Math.ceil(priceDZD / 230); // استخدام السعر الصحيح من data-price-usd

                document.getElementById('redotpay-product-name').textContent = productName;
                document.getElementById('redotpay-price-dzd').textContent = priceDZD;
                document.getElementById('redotpay-price-usd').textContent = priceUSD;

                console.log('Opening RedotPay Modal:', redotpayModal);
                redotpayModal.style.display = 'flex';
                redotpayModal.classList.remove('hidden');
                redotpayModal.classList.add('show');
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

    // Animated Text
    const animatedText = document.querySelector('.animated-text');
    if (animatedText) {
        const animatedTexts = {
            ar: [
                'خدمات رقمية',
                'حسابات تعليمية',
                'أدوات إبداعية',
                'حلول ذكاء اصطناعي',
                'منتجات احترافية',
                'تصميم وإبداع',
                'محتوى ترفيهي',
                'تحرير فيديو'
            ],
            en: [
                'Digital Services',
                'Educational Accounts',
                'Creative Tools',
                'AI Solutions',
                'Professional Products',
                'Design & Creativity',
                'Entertainment Content',
                'Video Editing'
            ],
            fr: [
                'Services Numériques',
                'Comptes Éducatifs',
                'Outils Créatifs',
                'Solutions IA',
                'Produits Professionnels',
                'Design & Créativité',
                'Contenu Divertissement',
                'Montage Vidéo'
            ]
        };

        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        function typeText() {
            const texts = animatedTexts[currentLang] || animatedTexts.ar;
            const currentText = texts[textIndex];

            if (isDeleting) {
                animatedText.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                animatedText.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }

            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                typingSpeed = 2000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typingSpeed = 500;
            }

            setTimeout(typeText, typingSpeed);
        }

        typeText();

        // Update animated text when language changes
        window.updateAnimatedText = function () {
            textIndex = 0;
            charIndex = 0;
            isDeleting = false;
        };
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

    // Track Purchase event with Meta Pixel (USD for Crypto payments)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
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

    // Track Purchase event with Meta Pixel (USD for RedotPay payments)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
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

    // Track Purchase event with Meta Pixel (DZD for BaridiMob/CCP payments)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
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
    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center text-gray-400 py-8">
                <p data-i18n="reviews.noReviews">كن أول من يضيف تقييم! ⭐</p>
            </div>
        `;
        showMoreContainer.style.display = 'none';
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
    if (reviews.length > REVIEWS_PER_PAGE) {
        showMoreContainer.style.display = 'block';
        showMoreBtn.textContent = showAllReviews ? 'عرض أقل' : `عرض المزيد (${reviews.length - REVIEWS_PER_PAGE}+)`;
        showMoreBtn.onclick = () => {
            showAllReviews = !showAllReviews;
            displayReviews();
            if (!showAllReviews) {
                document.getElementById('reviews-container').scrollIntoView({ behavior: 'smooth' });
            }
        };
    } else {
        showMoreContainer.style.display = 'none';
    }
}

function updateAverageRating() {
    const totalReviews = reviews.length;
    document.getElementById('total-reviews').textContent = totalReviews;

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
        .then(function(response) {
            console.log('Email sent successfully!', response.status, response.text);
        }, function(error) {
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
        'brand.tagline': 'حلول رقمية تعزز حضورك',
        'nav.products': 'منتجاتنا',
        'nav.reviews': '⭐ آراء العملاء',
        'nav.contact': 'واتساب',
        'nav.telegram': 'تيليجرام',
        'hero.title': 'منصتك المتكاملة لكل ما تحتاجه من',
        'hero.description': 'حسابات تعليمية، أدوات إبداعية، وحلول ذكاء اصطناعي مصممة لدعم أعمالك ومشاريعك بأفضل الأسعار وخدمة عملاء احترافية.',
        'hero.explore': 'استكشف المنتجات',
        'hero.learn': 'تعرف على خدماتنا',
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
        'product.adobe.shared.price1': 'شهر واحد: <strong>1500 د.ج</strong>',
        'product.adobe.shared.price2': '3 أشهر: <strong>3000 د.ج</strong>',
        'product.adobe.personal.price1': 'شهر واحد: <strong>3000 د.ج</strong>',
        'product.adobe.personal.price2': '3 أشهر: <strong>4500 د.ج</strong>',
        'product.gamma.selectType': 'اختر نوع الحساب:',
        'product.gamma.shared': 'حساب مشترك',
        'product.gamma.personal': 'حساب شخصي',
        'product.adobe.feature1': 'أكثر من 20 تطبيق احترافي',
        'product.adobe.feature2': 'تحديثات مجانية طوال فترة الاشتراك',
        'product.adobe.feature3': 'دعم فني كامل',
        'product.chatgpt.desc': 'حسابات ChatGPT Business فردية مع كل مزايا الذكاء الاصطناعي المتقدمة.',
        'product.chatgpt.feature1': 'وصول إلى GPT الأحدث',
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
        'product.capcut.feature1': 'تحرير فيديو بالذكاء الاصطناعي',
        'product.capcut.feature2': 'إزالة الخلفية والمؤثرات المتقدمة',
        'product.capcut.feature3': 'تصدير بجودة 4K بدون علامة مائية',
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
        'product.cursor.desc': 'محرر أكواد ذكي مدعوم بالذكاء الاصطناعي لمدة 7 أيام.',
        'product.cursor.feature1': 'إكمال تلقائي ذكي للكود',
        'product.cursor.feature2': 'دعم متعدد اللغات البرمجية',
        'product.cursor.feature3': 'تصحيح وتحسين الكود بالذكاء الاصطناعي',
        'product.cursor.selectType': 'اختر المدة:',
        'product.cursor.7days': 'تجربة 7 أيام',
        'product.cursor.30days': '30 يوم حساب مشترك برو',
        'product.cursor.notAvailable': 'غير متوفر بعد',
        'product.unavailable': '❌ غير متوفر حالياً',
        'product.unavailableBtn': '❌ غير متوفر',
        'product.unavailableAlert': 'عذراً، هذا المنتج غير متوفر حالياً. يرجى المحاولة لاحقاً.',
        'product.comingSoon': 'قريباً',
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
        'reviews.customer1.text': 'خدمة ممتازة وسريعة! حصلت على حساب ChatGPT Business في نفس اليوم. الدعم الفني متجاوب جداً.',
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
        'footer.telegram': 'تيليجرام',
        'contact.whatsapp': 'تواصل عبر واتساب',
        'contact.telegram': 'تواصل عبر تيليجرام',
        'contact.instagram': 'تابعنا على إنستغرام',
        'modal.chooseContact': 'اختر وسيلة التواصل',
        'modal.chooseContactDesc': 'اختر الطريقة المفضلة لديك لإتمام الطلب',
        'modal.whatsapp': 'واتساب',
        'modal.telegram': 'تيليجرام',
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
        'product.adobe.shared.price1': '1 Month: <strong>1500 DZD</strong>',
        'product.adobe.shared.price2': '3 Months: <strong>3000 DZD</strong>',
        'product.adobe.personal.price1': '1 Month: <strong>3000 DZD</strong>',
        'product.adobe.personal.price2': '3 Months: <strong>4500 DZD</strong>',
        'product.gamma.selectType': 'Select Account Type:',
        'product.gamma.shared': 'Shared Account',
        'product.gamma.personal': 'Personal Account',
        'product.adobe.feature1': 'More than 20 professional apps',
        'product.adobe.feature2': 'Free updates throughout subscription',
        'product.adobe.feature3': 'Full technical support',
        'product.chatgpt.desc': 'Individual ChatGPT Business accounts with all advanced AI features.',
        'product.chatgpt.feature1': 'Access to latest GPT',
        'product.chatgpt.feature2': 'Private and secure workspace',
        'product.chatgpt.feature3': 'Integration with your favorite tools',
        'product.gamma.desc': 'Advanced AI platform for creating professional presentations, documents and websites.',
        'product.gamma.price': 'Price Coming Soon',
        'product.gamma.feature1': 'Create professional presentations with AI',
        'product.gamma.feature2': 'Design interactive documents and websites',
        'product.gamma.feature3': 'Ready templates and full customization',
        'product.canva.desc': 'Full Canva Pro subscription with all professional design and creativity features.',
        'product.canva.price': 'Price Coming Soon',
        'product.canva.feature1': 'Access to all premium templates',
        'product.canva.feature2': 'Background removal with one click',
        'product.canva.feature3': '100GB cloud storage',
        'product.capcut.desc': 'Professional video editor with AI features and advanced editing tools.',
        'product.capcut.duration': '30 days',
        'product.capcut.feature1': 'AI-powered video editing',
        'product.capcut.feature2': 'Background removal and advanced effects',
        'product.capcut.feature3': '4K export without watermark',
        'product.netflix.desc': 'Netflix Premium account with 4 simultaneous screens in 4K Ultra HD quality.',
        'product.netflix.price': 'Price Coming Soon',
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
        'product.cursor.desc': 'AI-powered smart code editor for 7 days.',
        'product.cursor.feature1': 'Intelligent code auto-completion',
        'product.cursor.feature2': 'Multi-language programming support',
        'product.cursor.feature3': 'AI-powered code fixing and optimization',
        'product.cursor.selectType': 'Select Duration:',
        'product.cursor.7days': '7 DAYS TRIAL',
        'product.cursor.30days': '30 D PRO SHARED',
        'product.cursor.notAvailable': 'Not Available Yet',
        'product.unavailable': '❌ Currently Unavailable',
        'product.unavailableBtn': '❌ Unavailable',
        'product.unavailableAlert': 'Sorry, this product is currently unavailable. Please try again later.',
        'product.comingSoon': 'Coming Soon',
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
        'reviews.customer1.text': 'Excellent and fast service! Got my ChatGPT Business account the same day. Very responsive technical support.',
        'reviews.customer2.name': 'Sarah B.',
        'reviews.customer2.text': 'Adobe Creative Cloud at a great price! All applications work perfectly. Thank you Market Algeriaa.',
        'reviews.customer3.name': 'Mohamed K.',
        'reviews.customer3.text': 'The Real World is the best investment! Valuable content and excellent technical support. Highly recommend.',
        'reviews.viewAll': 'View All Reviews',
        'reviews.title': 'Customer Reviews',
        'reviews.subtitle': 'What our customers say about our services',
        'reviews.customer1.name': 'Ahmed M.',
        'reviews.customer1.text': 'Excellent and fast service! Got my ChatGPT Business account the same day. Very responsive technical support.',
        'reviews.customer2.name': 'Sarah B.',
        'reviews.customer2.text': 'Adobe Creative Cloud at a great price! All applications work perfectly. Thank you Market Algeriaa.',
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
        'footer.telegram': 'Telegram',
        'contact.whatsapp': 'Contact via WhatsApp',
        'contact.telegram': 'Contact via Telegram',
        'contact.instagram': 'Follow us on Instagram',
        'modal.chooseContact': 'Choose Contact Method',
        'modal.chooseContactDesc': 'Choose your preferred way to complete the order',
        'modal.whatsapp': 'WhatsApp',
        'modal.telegram': 'Telegram',
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
        'product.adobe.shared.price1': '1 Mois: <strong>1500 DZD</strong>',
        'product.adobe.shared.price2': '3 Mois: <strong>3000 DZD</strong>',
        'product.adobe.personal.price1': '1 Mois: <strong>3000 DZD</strong>',
        'product.adobe.personal.price2': '3 Mois: <strong>4500 DZD</strong>',
        'product.gamma.selectType': 'Sélectionnez le Type de Compte:',
        'product.gamma.shared': 'Compte Partagé',
        'product.gamma.personal': 'Compte Personnel',
        'product.adobe.feature1': 'Plus de 20 applications professionnelles',
        'product.adobe.feature2': 'Mises à jour gratuites pendant l\'abonnement',
        'product.adobe.feature3': 'Support technique complet',
        'product.chatgpt.desc': 'Comptes ChatGPT Business individuels avec toutes les fonctionnalités IA avancées.',
        'product.chatgpt.feature1': 'Accès au dernier GPT',
        'product.chatgpt.feature2': 'Espace de travail privé et sécurisé',
        'product.chatgpt.feature3': 'Intégration avec vos outils préférés',
        'product.gamma.desc': 'Plateforme IA avancée pour créer des présentations, documents et sites web professionnels.',
        'product.gamma.price': 'Prix Bientôt Disponible',
        'product.gamma.feature1': 'Créer des présentations professionnelles avec IA',
        'product.gamma.feature2': 'Concevoir des documents et sites interactifs',
        'product.gamma.feature3': 'Modèles prêts et personnalisation complète',
        'product.canva.desc': 'Abonnement Canva Pro complet avec toutes les fonctionnalités professionnelles de design et créativité.',
        'product.canva.price': 'Prix Bientôt Disponible',
        'product.canva.feature1': 'Accès à tous les modèles premium',
        'product.canva.feature2': 'Suppression d\'arrière-plan en un clic',
        'product.canva.feature3': '100GB de stockage cloud',
        'product.capcut.desc': 'Éditeur vidéo professionnel avec fonctionnalités IA et outils d\'édition avancés.',
        'product.capcut.duration': '30 jours',
        'product.capcut.feature1': 'Montage vidéo avec IA',
        'product.capcut.feature2': 'Suppression d\'arrière-plan et effets avancés',
        'product.capcut.feature3': 'Export 4K sans filigrane',
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
        'product.cursor.desc': 'Éditeur de code IA intelligent pour 7 jours.',
        'product.cursor.feature1': 'Auto-complétion de code intelligente',
        'product.cursor.feature2': 'Support multi-langages de programmation',
        'product.cursor.feature3': 'Correction et optimisation du code par IA',
        'product.cursor.selectType': 'Sélectionner la durée:',
        'product.cursor.7days': 'Essai 7 jours',
        'product.cursor.30days': '30 jours compte partagé pro',
        'product.cursor.notAvailable': 'Pas encore disponible',
        'product.unavailable': '❌ Actuellement Indisponible',
        'product.unavailableBtn': '❌ Indisponible',
        'product.unavailableAlert': 'Désolé, ce produit est actuellement indisponible. Veuillez réessayer plus tard.',
        'product.comingSoon': 'Bientôt',
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
        'footer.telegram': 'Telegram',
        'contact.whatsapp': 'Contactez via WhatsApp',
        'contact.telegram': 'Contactez via Telegram',
        'contact.instagram': 'Suivez-nous sur Instagram',
        'modal.chooseContact': 'Choisissez le Moyen de Contact',
        'modal.chooseContactDesc': 'Choisissez votre méthode préférée pour finaliser la commande',
        'modal.whatsapp': 'WhatsApp',
        'modal.telegram': 'Telegram',
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
        'campuses.title': 'Les Neuf Cours Inclus',
        'campuses.subtitle': 'Accès complet à chaque cours et compétence',
        'campus1.title': 'Cours E-commerce',
        'campus1.subtitle': 'Dropshipping et Boutiques en Ligne',
        'campus1.point1': '• Trouver des Produits Gagnants',
        'campus1.point2': '• Créer des Boutiques Shopify',
        'campus1.point3': '• Publicités TikTok et Facebook',
        'campus1.point4': '• Expédition sans Stock',
        'campus1.point5': '• Construire des Marques Durables',
        'campus2.title': 'Cours de Rédaction',
        'campus2.subtitle': 'Écriture Persuasive pour Profit',
        'campus2.point1': '• Déclencheurs Psychologiques',
        'campus2.point2': '• Campagnes de Marketing par Email',
        'campus2.point3': '• Acquisition de Clients et Offres',
        'campus2.point4': '• Croissance sur Réseaux Sociaux (Twitter/X)',
        'campus2.point5': '• Bases du Freelancing',
        'campus3.title': 'Cours Crypto & DeFi',
        'campus3.subtitle': 'Trading et Investissement Crypto',
        'campus3.point1': '• Construction de Portefeuille Long Terme',
        'campus3.point2': '• Analyse Technique et Graphiques',
        'campus3.point3': '• DeFi et Pools de Liquidité',
        'campus3.point4': '• Stratégies de Gestion des Risques',
        'campus3.point5': '• Focus sur Bitcoin et Ethereum',
        'campus4.title': 'Cours Création de Contenu',
        'campus4.subtitle': 'Vidéos Virales et UGC',
        'campus4.point1': '• Montage Vidéo (CapCut, Premiere Pro)',
        'campus4.point2': '• Maîtriser les Algorithmes (TikTok, IG, YT)',
        'campus4.point3': '• Contenu Généré par les Utilisateurs (UGC)',
        'campus4.point4': '• Construire sa Marque Personnelle',
        'campus4.point5': '• Gestion d\'Influenceurs',
        'campus5.title': 'Cours Automatisation IA',
        'campus5.subtitle': 'Utiliser l\'IA pour Gagner du Temps et de l\'Argent',
        'campus5.point1': '• Maîtrise de l\'Ingénierie des Prompts',
        'campus5.point2': '• Automatisation des Flux de Travail (Zapier)',
        'campus5.point3': '• Optimisation ChatGPT et Claude',
        'campus5.point4': '• Services d\'Agence IA',
        'campus5.point5': '• Solutions d\'Automatisation Business',
        'campus6.title': 'Cours Actions',
        'campus6.subtitle': 'Trading sur le Marché Boursier Traditionnel',
        'campus6.point1': '• Analyse Technique et Modèles',
        'campus6.point2': '• Stratégies de Trading d\'Options',
        'campus6.point3': '• Comprendre la Macroéconomie',
        'campus6.point4': '• Analyse de Nouvelles et Événements du Marché',
        'campus6.point5': '• Techniques de Levier de Capital',
        'campus7.title': 'Cours Maîtrise des Affaires',
        'campus7.subtitle': 'Développer et Gérer Votre Entreprise',
        'campus7.point1': '• Stratégies d\'Optimisation Fiscale',
        'campus7.point2': '• Recrutement et Gestion d\'Équipe',
        'campus7.point3': '• Configuration de Structure d\'Entreprise',
        'campus7.point4': '• LLC et Juridictions Favorables',
        'campus7.point5': '• Opérations Commerciales Avancées',
        'campus8.title': 'Cours Fitness',
        'campus8.subtitle': 'Santé Physique et Discipline',
        'campus8.point1': '• Routines d\'Entraînement Quotidiennes',
        'campus8.point2': '• Nutrition et Plans de Repas',
        'campus8.point3': '• Techniques de Biohacking',
        'campus8.point4': '• Suppléments et Mode de Vie',
        'campus8.point5': '• Augmentation de l\'Énergie et Testostérone',
        'campus9.title': 'Cours Acquisition de Clients',
        'campus9.subtitle': 'Ventes et Recrutement',
        'campus9.point1': '• Stratégies d\'Email à Froid',
        'campus9.point2': '• Techniques d\'Appel à Froid',
        'campus9.point3': '• Conclure des Affaires Efficacement',
        'campus9.point4': '• Méthodes de Prospection de Clients',
        'campus9.point5': '• Compétences de Vente Freelance',
        'recommend.title': '💡 Par Quel Cours Commencer?',
        'recommend.free.title': '🆓 Sans Argent ($0):',
        'recommend.free.desc': 'Commencer par la Rédaction ou la Création de Contenu',
        'recommend.free.note': 'Nécessite du temps, faible coût de démarrage',
        'recommend.paid.title': '💰 Avec de l\'Argent ($500+):',
        'recommend.paid.desc': 'Commencer par l\'E-commerce ou la Cryptomonnaie',
        'recommend.paid.note': 'Nécessite du capital pour gagner de l\'argent',
        'footer.title': 'Ne Manquez Pas l\'Opportunité',
        'footer.subtitle': 'Le prix va bientôt augmenter. Rejoignez l\'élite maintenant.',
        'footer.cta': 'Commencez Votre Voyage Maintenant',
        'footer.rights': 'Tous droits réservés.',
        'hero.price': 'Seulement 15 USDT',
        'hero.cta': 'Rejoignez Maintenant',
        'scarcity.title': 'Places Limitées!',
        'scarcity.description': 'Pour garantir un support de qualité, nous n\'acceptons que <span class="text-red-400 font-bold">10-15 clients par mois</span>',
        'scarcity.remaining': 'places restantes',
        'scarcity.total': 'total',
        'scarcity.warning': '⏰ Réservez votre place maintenant avant qu\'il ne soit trop tard!',
        'reviews.title': '⭐ Avis Clients',
        'reviews.reviews': 'avis',
        'reviews.addReview': 'Ajoutez Votre Avis',
        'reviews.yourName': 'Votre Nom:',
        'reviews.rating': 'Évaluation:',
        'reviews.platform': 'Comment nous avez-vous trouvé?',
        'reviews.comment': 'Votre Commentaire (optionnel):',
        'reviews.submit': 'Soumettre l\'Avis',
        'reviews.noReviews': 'Soyez le premier à ajouter un avis! ⭐',
        'reviews.showMore': 'Voir Plus',
        'reviews.showLess': 'Voir Moins',
        'reviews.image': 'Ajouter une Image (optionnel):',
        'reviews.chooseImage': 'Choisir une Image',
        'reviews.removeImage': 'Supprimer l\'Image',
        'reviews.imageNote': 'Max: 2MB (JPG, PNG, WEBP)',
        'reviews.clearAll': 'Supprimer Tous les Avis',
        'reviews.giveaway': 'Tirer 4 Gagnants',
        'reviews.namePlaceholder': 'Entrez votre nom',
        'reviews.selectPlatform': 'Sélectionner la plateforme',
        'reviews.friend': '👤 Ami',
        'reviews.other': '🌐 Autre',
        'reviews.commentPlaceholder': 'Partagez votre expérience...',
        'reviews.alreadyReviewed': 'Merci!',
        'reviews.alreadyReviewedMsg': 'Vous avez déjà soumis votre avis. Vous ne pouvez soumettre qu\'un seul avis.',
        'guide.title': '📚 Guide Complet du Contenu The Real World',
        'guide.subtitle': 'Que recevrez-vous lors de votre abonnement?',
        'guide.intro': 'Lorsque vous achetez un compte <span class="text-matrix-green font-bold">The Real World</span>, vous n\'achetez pas seulement un cours, mais vous entrez dans une plateforme éducative complète contenant <span class="text-matrix-green font-bold">19 méthodes modernes</span> pour générer de la richesse. La plateforme est divisée en "Campus", chaque campus se concentre sur une compétence spécifique pour gagner de l\'argent.',
        'campus.whatLearn': '📖 Que allez-vous apprendre?',
        'campus.forWho': '👤 Pour qui est ce parcours?',
        'campus.tip': '💡 Mon conseil:',
        'campus1.desc': 'Vous apprendrez à rechercher des "Produits Gagnants" qui ont une forte demande, et comment construire une boutique professionnelle pour attirer les clients. Le cours se concentre sur deux méthodes: le dropshipping (vendre sans posséder d\'inventaire) et la marque privée (Private Label).',
        'campus1.forWho': 'Pour les personnes prêtes à travailler dur pour construire un vrai "business". Ce domaine nécessite soit du capital pour les publicités, soit beaucoup de temps pour créer du contenu gratuit (Organic) sur TikTok.',
        'campus1.tip': 'Ce collège est le plus rentable mais le plus difficile au début. Si votre budget est inférieur à 500$, commencez par apprendre le "Trafic Organique" et ne payez pas pour les publicités jusqu\'à ce que vous réalisiez vos premières ventes.',
        'campus2.desc': 'L\'art de "vendre avec les mots". Vous apprendrez à écrire des textes publicitaires, des emails et des pages de destination qui forcent le lecteur à acheter. Plus important encore, ils vous enseignent comment contacter les entreprises pour vous embaucher contre des montants mensuels élevés (High Ticket Closer).',
        'campus2.forWho': 'Pour les débutants qui ont 0$ et veulent commencer immédiatement. La seule condition est que votre anglais soit fort.',
        'campus2.tip': 'C\'est le chemin le plus rapide pour gagner de l\'argent à partir de zéro. Ne vous contentez pas de regarder les leçons, commencez à contacter les clients (Outreach) immédiatement après avoir terminé le premier module.',
        'campus3.title': '3. Collège Automatisation IA',
        'campus3.desc': 'Comment utiliser les outils IA (comme ChatGPT et Zapier) pour construire des systèmes d\'automatisation pour les entreprises. Vous apprendrez à faire gagner du temps aux entreprises et à construire des "robots" pour le service client, et à vendre ce service en tant qu\'agence (AAA).',
        'campus3.forWho': 'Pour les personnes techniquement compétentes qui veulent profiter de la "tendance" actuelle. Les entreprises paient des sommes énormes pour ceux qui maîtrisent cette compétence maintenant.',
        'campus3.tip': 'Ce domaine est très nouveau et la concurrence est faible. Si vous apprenez cette compétence maintenant, vous pouvez monopoliser le marché dans votre région facilement.',
        'campus1.title': '1. Collège E-Commerce',
        'campus1.subtitle': 'Collège E-Commerce',
        'campus2.title': '2. Collège Rédaction',
        'campus2.subtitle': 'Collège Rédaction',
        'campus3.subtitle': 'Collège IA & Création de Contenu',
        'campus4.title': '4. Collège Création de Contenu',
        'campus4.subtitle': 'Collège Création de Contenu',
        'campus4.desc': 'Comment produire et éditer des vidéos courtes (Shorts/Reels) qui deviennent virales à la vitesse de l\'éclair. Vous apprendrez le montage, le design et comment capter l\'attention du spectateur dans les 3 premières secondes.',
        'campus4.forWho': 'Pour les créateurs, et ceux qui aiment travailler avec des logiciels de montage. Cette compétence est très demandée que ce soit pour votre propre travail ou pour travailler avec des influenceurs.',
        'campus4.tip': 'La demande pour les "Éditeurs Vidéo" est énorme. Vous pouvez combiner cette compétence avec l\'IA pour produire des vidéos de haute qualité en un temps record.',
        'campus5.title': '5. Collège Trading Crypto',
        'campus5.subtitle': 'Collège Trading Crypto',
        'campus5.desc': 'Le day trading rapide. Comment lire les graphiques (analyse technique), et comment profiter de la hausse et de la baisse des cryptomonnaies quotidiennement.',
        'campus5.forWho': 'Pour les personnes avec des nerfs d\'acier et de l\'argent excédentaire à risquer. Ce n\'est pas un travail, mais une compétence de saisir les opportunités.',
        'campus.warning': '⚠️ Avertissement:',
        'campus5.warning': 'Le day trading est à haut risque. N\'entrez pas ici avec de l\'argent dont vous avez besoin pour payer votre loyer. Commencez avec de très petits montants jusqu\'à ce que vous maîtrisiez la stratégie.',
        'campus6.title': '6. Collège Investissement Crypto',
        'campus6.subtitle': 'Collège Investissement Crypto',
        'campus6.desc': 'Comment découvrir les pièces et projets solides avant que leur prix n\'augmente (investissement à long terme). Vous apprendrez la différence entre les vrais projets et les arnaques (Scams).',
        'campus6.forWho': 'Pour ceux qui ont du capital et veulent le geler pour une période (6 mois - 1 an) pour obtenir d\'énormes rendements plus tard.',
        'campus6.tip': 'Ce collège vous apprend la patience. Acheter correctement et conserver (HODL) est le secret ici, loin du stress du day trading.',
        'campus7.title': '7. Collège DeFi',
        'campus7.subtitle': 'Collège DeFi',
        'campus7.desc': 'Le côté technique avancé de la crypto. Comment utiliser les échanges décentralisés (DEXs) pour générer un revenu passif de vos pièces, connu sous le nom de "Yield Farming".',
        'campus7.forWho': 'Pour les investisseurs crypto avancés. N\'entrez pas ici si vous êtes encore débutant dans la compréhension de la blockchain.',
        'campus7.tip': 'C\'est le niveau suivant après "l\'investissement". Vous pouvez obtenir des rendements annuels (APY) beaucoup plus élevés que les banques traditionnelles si vous apprenez les stratégies ici.',
        'campus8.title': '8. Collège Actions',
        'campus8.subtitle': 'Collège Actions',
        'campus8.desc': 'Trading d\'actions sur les marchés mondiaux et options. Ils se concentrent sur le "Swing Trading" qui ne nécessite pas de rester assis devant l\'écran toute la journée.',
        'campus8.forWho': 'Pour ceux qui préfèrent les marchés réglementés et plus stables par rapport à la crypto, et ont un capital initial à investir (2000$+).',
        'campus8.tip': 'Si vous avez un emploi, c\'est la meilleure option pour vous car la stratégie Swing Trading vous permet de trader sans affecter votre temps de travail.',
        'campus9.title': '9. Collège Freelancing',
        'campus9.subtitle': 'Collège Freelancing',
        'campus9.desc': 'Comment transformer n\'importe quelle compétence que vous avez (design, traduction, programmation) en "business". Il vous apprend à augmenter vos prix, à négocier et à trouver des clients en dehors des plateformes de freelancing bon marché.',
        'campus9.forWho': 'Pour quiconque veut obtenir ses premiers 1000$ en ligne rapidement en utilisant ses compétences actuelles.',
        'campus9.tip': 'Utilisez ce collège comme un "pont". Commencez ici pour collecter du capital rapidement, puis investissez-le plus tard dans l\'e-commerce ou les actions.',
        'campus10.title': '10. Collège Acquisition de Clients',
        'campus10.subtitle': 'Collège Acquisition de Clients',
        'campus10.desc': 'L\'art de la vente et du démarchage à froid. Comment trouver des clients (Leads), comment les contacter et comment les convaincre de vous payer pour vos services.',
        'campus10.forWho': 'C\'est une "compétence de soutien" nécessaire pour tous ceux qui travaillent dans le marketing ou le freelancing. Sans clients, il n\'y a pas d\'argent.',
        'campus10.tip': 'Étudiez ce collège en parallèle avec toute autre compétence. Peu importe votre talent en design ou programmation, vous ne gagnerez rien si vous ne savez pas comment vous "vendre".',
        'campus11.title': '11. Collège Marketing d\'Affiliation',
        'campus11.subtitle': 'Collège Marketing d\'Affiliation',
        'campus11.desc': 'Comment commercialiser les produits des autres (y compris l\'adhésion à The Real World) contre commission. Ils se concentrent fortement sur les stratégies de vidéos courtes (TikTok/Reels).',
        'campus11.forWho': 'Pour les créateurs de contenu viral qui n\'ont pas leur propre produit à vendre.',
        'campus11.tip': 'La concurrence ici est féroce. Pour réussir, vous devez être très créatif et produire de grandes quantités de contenu quotidiennement.',
        'campus12.title': '12. Collège Gestion d\'Entreprise',
        'campus12.subtitle': 'Collège Gestion d\'Entreprise',
        'campus12.desc': 'Comment gérer votre argent, les impôts, l\'embauche et comment développer votre entreprise. Ce sont des leçons avancées en gestion financière et structuration juridique.',
        'campus12.forWho': 'Pour le niveau avancé uniquement. Pour ceux qui ont déjà commencé à gagner de l\'argent et veulent passer de "freelancer" à "homme d\'affaires".',
        'campus12.tip': 'Ne perdez pas votre temps ici si vous n\'avez pas encore gagné votre premier dollar. Revenez-y plus tard quand vous aurez besoin d\'embaucher une équipe.',
        'campus13.title': '13. Collège Fitness',
        'campus13.subtitle': 'Collège Fitness',
        'campus13.desc': 'Un système d\'entraînement et de nutrition conçu spécifiquement pour les entrepreneurs. L\'idée est d\'obtenir un maximum d\'énergie physique et mentale avec un minimum de temps à la salle de sport.',
        'campus13.forWho': 'Pour chaque abonné. "Un esprit sain dans un corps sain".',
        'campus13.tip': 'N\'ignorez pas cette section. La discipline dans le corps se reflète directement sur votre discipline dans l\'argent et le travail.',
        'tips.title': '⭐ Conseils d\'Or pour les Nouveaux Abonnés',
        'tips.tip1.title': '🚫 Ne Soyez Pas un "Touriste"',
        'tips.tip1.desc': 'La plus grande erreur que font les abonnés est de sauter entre les collèges (une semaine e-commerce, une semaine crypto..). Cela garantit votre échec. Choisissez un seul domaine et tenez-vous-y pendant au moins 3 mois.',
        'tips.tip2.title': '⚖️ Déterminez Votre Position (Argent vs Temps)',
        'tips.tip2.option1.title': 'Vous avez du temps mais pas d\'argent?',
        'tips.tip2.option1.desc': 'Choisissez: Rédaction, Freelancing, ou Création de Contenu',
        'tips.tip2.option2.title': 'Vous avez de l\'argent mais pas de temps?',
        'tips.tip2.option2.desc': 'Choisissez: E-commerce ou Investissement Crypto/Actions',
        'tips.tip3.title': '💪 Passez le Premier Mois',
        'tips.tip3.desc': 'Le premier mois est le plus difficile, vous ressentirez une surcharge d\'informations. N\'abandonnez pas. Les vrais résultats apparaissent généralement au deuxième ou troisième mois de travail acharné.',
        'tips.final': 'Nous vous fournissons la "clé" pour entrer dans ce monde, mais "l\'effort" doit venir de vous. Bonne chance dans votre voyage vers la richesse! 🚀',
        'payment.title': 'Méthodes de Paiement Disponibles',
        'payment.redotpay': 'RedotPay',
        'payment.usdt': 'USDT',
        'payment.baridimob': 'BaridiMob',
        'nav.home': 'Accueil',
        'whatsapp.tooltip': 'Discutez avec nous maintenant!',
        'instagram.tooltip': 'Suivez-nous sur Instagram!',
        'modal.paymentInfo': 'Informations de Paiement',
        'modal.instructions': 'Instructions de Paiement:',
        'modal.copy': 'Copier',
        'modal.confirmButton': 'Paiement Effectué - Contactez-nous',
        'modal.stepContact': 'Cliquer sur "Paiement Effectué" pour nous contacter',
        'modal.baridimob.ripLabel': 'RIP BaridiMob:',
        'modal.baridimob.step1': 'Ouvrir l\'application BaridiMob',
        'modal.baridimob.step2': 'Choisir "Transfert d\'argent" ou "Virement"',
        'modal.baridimob.step3': 'Choisir "RIP" comme méthode de transfert',
        'modal.baridimob.step4': 'Entrer le RIP: <strong>00799999002787548473</strong>',
        'modal.baridimob.step5': 'Entrer le montant requis',
        'modal.baridimob.step6': 'Compléter le processus de paiement',
        'modal.baridimob.step7': 'Garder la preuve de paiement',
        'modal.baridimob.step8': 'Cliquer sur "Paiement Effectué" pour nous contacter',
        'modal.baridimob.warning': '⚠️ Assurez-vous d\'entrer correctement le RIP!',
        'modal.crypto.chooseNetwork': 'Sélectionner le Réseau:',
        'modal.crypto.lowFeesTRC': 'Frais réduits (~1 USDT)',
        'modal.crypto.lowFeesBEP': 'Frais réduits (~0.5 USDT)',
        'modal.crypto.walletAddress': 'Adresse du Portefeuille',
        'modal.crypto.qrNote': 'Scanner le code avec l\'application wallet',
        'modal.crypto.step1': 'Choisir la méthode de paiement (TRC20, BEP20, ou ID Binance)',
        'modal.crypto.step2': 'Copier l\'adresse du portefeuille ou ID Binance ou scanner le code QR',
        'modal.crypto.step3': 'Ouvrir l\'application Binance ou tout portefeuille USDT',
        'modal.crypto.step4': 'Assurez-vous de sélectionner la même méthode (<strong id="network-warning">TRC20</strong>)',
        'modal.crypto.step5': 'Envoyer le montant requis',
        'modal.crypto.step6': 'Garder l\'ID de transaction',
        'modal.crypto.binanceIdLabel': 'ID Binance',
        'modal.crypto.warning': '⚠️ Assurez-vous de sélectionner la bonne méthode ou vous perdrez vos fonds!',
        'modal.redotpay.idLabel': 'ID RedotPay:',
        'modal.redotpay.step1': 'Ouvrir l\'application RedotPay',
        'modal.redotpay.step2': 'Choisir "Send" ou "Envoyer"',
        'modal.redotpay.step3': 'Entrer l\'ID RedotPay: <strong>1117632168</strong>',
        'modal.redotpay.step4': 'Entrer le montant en dollars',
        'modal.redotpay.step5': 'Compléter le processus d\'envoi',
        'modal.redotpay.step6': 'Garder la preuve de transfert',
        'modal.redotpay.warning': '⚠️ Assurez-vous d\'entrer correctement l\'ID RedotPay!',
    }
};

let currentLang = 'ar';

function changeLanguage(lang) {
    currentLang = lang;
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
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== 'ar') {
        changeLanguage(savedLang);
    }
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


// Adobe Account Type Selection
function selectAdobeType(type) {
    const buttons = document.querySelectorAll('.adobe-type-btn');
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

    // Show/hide prices
    if (type === 'shared') {
        document.getElementById('adobe-prices-shared').style.display = 'block';
        document.getElementById('adobe-prices-personal').style.display = 'none';
    } else {
        document.getElementById('adobe-prices-shared').style.display = 'none';
        document.getElementById('adobe-prices-personal').style.display = 'block';
    }
}

// Gamma.AI Account Type Selection
function selectGammaType(type) {
    const buttons = document.querySelectorAll('.gamma-type-btn');
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

    // Show/hide prices
    if (type === 'shared') {
        document.getElementById('gamma-prices-shared').style.display = 'block';
        document.getElementById('gamma-prices-personal').style.display = 'none';
    } else {
        document.getElementById('gamma-prices-shared').style.display = 'none';
        document.getElementById('gamma-prices-personal').style.display = 'block';
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

    // Show/hide prices
    if (type === '7days') {
        document.getElementById('cursor-prices-7days').style.display = 'block';
        document.getElementById('cursor-prices-30days').style.display = 'none';
    } else {
        document.getElementById('cursor-prices-7days').style.display = 'none';
        document.getElementById('cursor-prices-30days').style.display = 'block';
    }
}

// Order Adobe with selected type
function orderAdobe() {
    const activeBtn = document.querySelector('.adobe-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : 'shared';
    const productName = type === 'shared' ? 'Adobe Creative Cloud - Shared' : 'Adobe Creative Cloud - Personal';
    
    // Store product name and open contact choice modal
    currentProductName = productName;
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

// Order Gamma with selected type
function orderGamma() {
    const activeBtn = document.querySelector('.gamma-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : 'shared';
    const productName = type === 'shared' ? 'Gamma.AI - Shared' : 'Gamma.AI - Personal';
    
    // Store product name and open contact choice modal
    currentProductName = productName;
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

// Generic order function for products without special options
function orderProduct(productName) {
    // Store product name and open contact choice modal
    currentProductName = productName;
    const modal = document.getElementById('contact-choice-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.classList.remove('hidden');
    }
}

// Contact via selected platform
function contactVia(platform) {
    // Multilingual messages
    const messages = {
        ar: `مرحباً 👋\nأريد طلب: ${currentProductName}\n\nشكراً 🙏`,
        en: `Hello 👋\nI would like to order: ${currentProductName}\n\nThank you 🙏`,
        fr: `Bonjour 👋\nJe voudrais commander: ${currentProductName}\n\nMerci 🙏`
    };
    
    const message = messages[currentLang] || messages.ar;
    
    // Open the selected platform
    if (platform === 'whatsapp') {
        window.open(`https://wa.me/213782125821?text=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'telegram') {
        window.open(`https://t.me/+213656165400?text=${encodeURIComponent(message)}`, '_blank');
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

// Make order functions globally available
window.orderAdobe = orderAdobe;
window.orderGamma = orderGamma;
window.contactVia = contactVia;
window.orderProduct = orderProduct;
window.selectAdobeType = selectAdobeType;
window.selectGammaType = selectGammaType;

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
