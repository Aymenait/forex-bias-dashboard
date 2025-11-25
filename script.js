document.addEventListener('DOMContentLoaded', () => {
    // Initialize VanillaTilt for 3D effect
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".product-card"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
            scale: 1.05
        });
    }

    const modal = document.getElementById('order-modal');
    const closeBtn = document.querySelector('.close-btn');
    const orderBtns = document.querySelectorAll('.order-btn');
    const productNameInput = document.getElementById('product-name');
    const orderForm = document.getElementById('order-form');

    if (orderBtns.length > 0) {
        orderBtns.forEach(button => {
            button.addEventListener('click', () => {
                const productName = button.getAttribute('data-product');
                productNameInput.value = productName;
                modal.style.display = 'flex';
            });
        });
    }

    const hideModal = () => {
        if (modal) {
            modal.style.display = 'none';
            if (productNameInput) productNameInput.value = '';
        }
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }

    window.addEventListener('click', (event) => {
        if (modal && event.target === modal) {
            hideModal();
        }
    });

    if (orderForm) {
        orderForm.addEventListener('submit', () => {
            setTimeout(() => {
                hideModal();
            }, 1000);
        });
    }

    // Crypto Payment Modal
    const cryptoModal = document.getElementById('crypto-modal');
    const cryptoCloseBtn = document.querySelector('.crypto-close');
    const cryptoPayBtns = document.querySelectorAll('.crypto-pay-btn');
    const networkBtns = document.querySelectorAll('.network-btn');

    let currentCryptoProduct = '';
    let currentCryptoPriceDZD = 0;
    let selectedNetwork = 'TRC20';
    let selectedAddress = 'TWTgY41LNFqZcgBiRCZYsSq6ooeCx8gus9';

    cryptoPayBtns.forEach(button => {
        button.addEventListener('click', () => {
            currentCryptoProduct = button.getAttribute('data-product');
            currentCryptoPriceDZD = button.getAttribute('data-price');

            // تحويل من دينار جزائري إلى دولار (سعر السوق السوداء: 1 USD = 250 DZD)
            const priceUSD = (currentCryptoPriceDZD / 250).toFixed(2);

            document.getElementById('crypto-product-name').textContent = currentCryptoProduct;
            document.getElementById('crypto-price-dzd').textContent = currentCryptoPriceDZD;
            document.getElementById('crypto-price-usd').textContent = priceUSD;

            selectedNetwork = 'TRC20';
            selectedAddress = 'TWTgY41LNFqZcgBiRCZYsSq6ooeCx8gus9';
            updateWalletDisplay();

            updateWalletDisplay();
            console.log('Opening Crypto Modal:', cryptoModal);
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

    cryptoCloseBtn.addEventListener('click', () => {
        cryptoModal.classList.remove('show');
        cryptoModal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === cryptoModal) {
            cryptoModal.classList.remove('show');
            cryptoModal.classList.add('hidden');
        }
    });

    // RedotPay Modal
    const redotpayModal = document.getElementById('redotpay-modal');
    const redotpayCloseBtn = document.querySelector('.redotpay-close');
    const redotpayBtns = document.querySelectorAll('.redotpay-btn');

    console.log('RedotPay buttons found:', redotpayBtns.length);

    if (redotpayBtns.length > 0) {
        redotpayBtns.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('RedotPay button clicked!');
                const productName = button.getAttribute('data-product');
                const priceDZD = button.getAttribute('data-price');
                const priceUSD = (priceDZD / 250).toFixed(2);

                document.getElementById('redotpay-product-name').textContent = productName;
                document.getElementById('redotpay-price-dzd').textContent = priceDZD;
                document.getElementById('redotpay-price-usd').textContent = priceUSD;

                document.getElementById('redotpay-price-usd').textContent = priceUSD;

                console.log('Opening RedotPay Modal:', redotpayModal);
                redotpayModal.classList.remove('hidden');
                redotpayModal.classList.add('show');
            });
        });
    }

    if (redotpayCloseBtn) {
        redotpayCloseBtn.addEventListener('click', () => {
            redotpayModal.classList.remove('show');
            redotpayModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === redotpayModal) {
            redotpayModal.classList.remove('show');
            redotpayModal.classList.add('hidden');
        }
    });

    // BaridiMob Modal
    const baridimobModal = document.getElementById('baridimob-modal');
    const baridimobCloseBtn = document.querySelector('.baridimob-close');
    const baridimobBtns = document.querySelectorAll('.baridimob-btn');

    baridimobBtns.forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.getAttribute('data-product');
            const priceDZD = button.getAttribute('data-price');
            const priceUSD = (priceDZD / 250).toFixed(2);

            document.getElementById('baridimob-product-name').textContent = productName;
            document.getElementById('baridimob-price-dzd').textContent = priceDZD;
            document.getElementById('baridimob-price-usd').textContent = priceUSD;

            document.getElementById('baridimob-price-usd').textContent = priceUSD;

            console.log('Opening BaridiMob Modal:', baridimobModal);
            baridimobModal.classList.remove('hidden');
            baridimobModal.classList.add('show');
        });
    });

    baridimobCloseBtn.addEventListener('click', () => {
        baridimobModal.classList.remove('show');
        baridimobModal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === baridimobModal) {
            baridimobModal.classList.remove('show');
            baridimobModal.classList.add('hidden');
        }
    });

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
                    value: 0.4,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.1,
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
                    opacity: 0.3,
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
                'منتجات احترافية'
            ],
            en: [
                'Digital Services',
                'Educational Accounts',
                'Creative Tools',
                'AI Solutions',
                'Professional Products'
            ],
            fr: [
                'Services Numériques',
                'Comptes Éducatifs',
                'Outils Créatifs',
                'Solutions IA',
                'Produits Professionnels'
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
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> تم النسخ';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Confirm payment and redirect to WhatsApp
function confirmCryptoPayment() {
    const productName = document.getElementById('crypto-product-name').textContent;
    const priceDZD = document.getElementById('crypto-price-dzd').textContent;
    const priceUSD = document.getElementById('crypto-price-usd').textContent;
    const network = document.getElementById('selected-network').textContent;

    const message = `مرحباً، قمت بالدفع بالكريبتو:

📦 المنتج: ${productName}
💰 المبلغ: ${priceDZD} د.ج (${priceUSD} USDT)
🔗 الشبكة: ${network}

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك!`;

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
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> تم النسخ';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Confirm RedotPay payment
function confirmRedotPayPayment() {
    const productName = document.getElementById('redotpay-product-name').textContent;
    const priceDZD = document.getElementById('redotpay-price-dzd').textContent;
    const priceUSD = document.getElementById('redotpay-price-usd').textContent;

    const message = `مرحباً، قمت بالدفع عبر RedotPay:

📦 المنتج: ${productName}
💰 المبلغ: ${priceDZD} د.ج (${priceUSD} USD)
💳 RedotPay ID: 1117632168

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك!`;

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
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> تم النسخ';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

// Confirm BaridiMob payment
function confirmBaridiMobPayment() {
    const productName = document.getElementById('baridimob-product-name').textContent;
    const priceDZD = document.getElementById('baridimob-price-dzd').textContent;

    const message = `مرحباً، قمت بالدفع عبر BaridiMob:

📦 المنتج: ${productName}
💰 المبلغ: ${priceDZD} د.ج
💳 RIP: 00799999002787548473

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك!`;

    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    document.getElementById('baridimob-modal').style.display = 'none';
}


// Multi-language support
const translations = {
    ar: {
        'nav.products': 'منتجاتنا',
        'nav.contact': 'تواصل الآن',
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
        'products.title': 'اختر الباقة الأنسب لاحتياجاتك',
        'products.subtitle': 'منتجات رقمية مختارة بعناية لمساعدتك على التعلم، التصميم، وتنمية عملك بمرونة واحترافية.',
        'product.trw.desc': 'حساب مشترك للكورسات ومنصة The Real World، مع دعم فني وضمان كامل.',
        'product.trw.feature1': 'دخول لجميع الكورسات الحالية',
        'product.trw.feature2': 'تحديثات دورية ومحتوى جديد',
        'product.trw.feature3': 'دعم فني عربي سريع',
        'product.adobe.desc': 'اشتراك رسمي على حسابك الشخصي، يشمل أكثر من 20 تطبيقًا احترافيًا من Adobe.',
        'product.adobe.price1': 'شهر واحد: 3200 د.ج',
        'product.adobe.price2': '3 أشهر: 7500 د.ج',
        'product.adobe.price3': '12 شهرًا: 17800 د.ج',
        'product.adobe.feature1': 'تفعيل على بريدك الخاص',
        'product.adobe.feature2': 'تحديثات مجانية طوال فترة الاشتراك',
        'product.adobe.feature3': 'إرشادات تثبيت مفصلة',
        'product.chatgpt.desc': 'حسابات ChatGPT Business فردية مع كل مزايا الذكاء الاصطناعي المتقدمة.',
        'product.chatgpt.feature1': 'وصول إلى GPT الأحدث',
        'product.chatgpt.feature2': 'مساحة عمل خاصة وآمنة',
        'product.chatgpt.feature3': 'تكامل مع أدواتك المفضلة',
        'product.orderNow': 'اطلب الآن',
        'product.payCrypto': 'ادفع بالكريبتو (USDT)',
        'product.payRedotPay': 'ادفع بـ RedotPay',
        'product.payBaridiMob': 'ادفع بـ BaridiMob',
        'product.soldOut': 'نفذت الكمية',
        'currency': 'د.ج',
        'perMonth': 'للشهر',
        'contact.title': 'جاهزون لبدء مشروعك القادم',
        'contact.description': 'تواصل معنا الآن عبر القنوات المتاحة للحصول على استشارة مجانية وتحديد الباقة الأنسب لك.',
        'contact.whatsapp': 'تواصل عبر واتساب',
        'contact.instagram': 'تابعنا على إنستغرام',
        'modal.product': 'المنتج:',
        'modal.price': 'السعر:',
        'modal.priceInUSD': 'المبلغ بالدولار:',
        'modal.paymentInfo': 'معلومات الدفع',
        'modal.instructions': 'تعليمات الدفع:',
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
        'payment.title': 'طرق الدفع المتاحة',
        'payment.redotpay': 'RedotPay',
        'payment.usdt': 'USDT',
        'payment.baridimob': 'BaridiMob',
        'nav.home': 'الرئيسية',
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
        'modal.crypto.step1': 'اختر الشبكة المناسبة (TRC20 أو BEP20)',
        'modal.crypto.step2': 'انسخ عنوان المحفظة أو امسح QR Code',
        'modal.crypto.step3': 'افتح تطبيق Binance أو أي محفظة USDT',
        'modal.crypto.step4': 'تأكد من اختيار نفس الشبكة (<strong id="network-warning">TRC20</strong>)',
        'modal.crypto.step5': 'أرسل المبلغ المطلوب',
        'modal.crypto.step6': 'احتفظ بـ Transaction ID',
        'modal.crypto.warning': '⚠️ تأكد من اختيار الشبكة الصحيحة وإلا ستفقد أموالك !',
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
        'nav.products': 'Our Products',
        'nav.contact': 'Contact Now',
        'hero.title': 'Your Complete Platform for Everything You Need',
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
        'products.title': 'Choose the Right Package for Your Needs',
        'products.subtitle': 'Carefully selected digital products to help you learn, design, and grow your business with flexibility and professionalism.',
        'product.trw.desc': 'Shared account for courses and The Real World platform, with technical support and full guarantee.',
        'product.trw.feature1': 'Access to all current courses',
        'product.trw.feature2': 'Regular updates and new content',
        'product.trw.feature3': 'Fast Arabic technical support',
        'product.adobe.desc': 'Official subscription on your personal account, includes more than 20 professional Adobe applications.',
        'product.adobe.price1': '1 Month: 3200 DZD',
        'product.adobe.price2': '3 Months: 7500 DZD',
        'product.adobe.price3': '12 Months: 17800 DZD',
        'product.adobe.feature1': 'Activation on your own email',
        'product.adobe.feature2': 'Free updates throughout subscription',
        'product.adobe.feature3': 'Detailed installation instructions',
        'product.chatgpt.desc': 'Individual ChatGPT Business accounts with all advanced AI features.',
        'product.chatgpt.feature1': 'Access to latest GPT',
        'product.chatgpt.feature2': 'Private and secure workspace',
        'product.chatgpt.feature3': 'Integration with your favorite tools',
        'product.orderNow': 'Order Now',
        'product.payCrypto': 'Pay with Crypto (USDT)',
        'product.payRedotPay': 'Pay with RedotPay',
        'product.payBaridiMob': 'Pay with BaridiMob',
        'product.soldOut': 'Sold Out',
        'currency': 'DZD',
        'perMonth': 'per month',
        'contact.title': 'Ready to Start Your Next Project',
        'contact.description': 'Contact us now through available channels for a free consultation and to determine the best package for you.',
        'contact.whatsapp': 'Contact via WhatsApp',
        'contact.instagram': 'Follow us on Instagram',
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
        'payment.title': 'Available Payment Methods',
        'payment.redotpay': 'RedotPay',
        'payment.usdt': 'USDT',
        'payment.baridimob': 'BaridiMob',
        'nav.home': 'Home',
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
        'modal.crypto.step1': 'Choose the appropriate network (TRC20 or BEP20)',
        'modal.crypto.step2': 'Copy wallet address or scan QR Code',
        'modal.crypto.step3': 'Open Binance app or any USDT wallet',
        'modal.crypto.step4': 'Make sure to select the same network (<strong id="network-warning">TRC20</strong>)',
        'modal.crypto.step5': 'Send the required amount',
        'modal.crypto.step6': 'Keep the Transaction ID',
        'modal.crypto.warning': '⚠️ Make sure to select the correct network or you will lose your funds!',
        'modal.redotpay.idLabel': 'RedotPay ID:',
        'modal.redotpay.step1': 'Open RedotPay app',
        'modal.redotpay.step2': 'Choose "Send"',
        'modal.redotpay.step3': 'Enter RedotPay ID: <strong>1117632168</strong>',
        'modal.redotpay.step4': 'Enter the amount in dollars',
        'modal.redotpay.step5': 'Complete the sending process',
        'modal.redotpay.step6': 'Keep proof of transfer',
        'modal.redotpay.warning': '⚠️ Make sure to enter RedotPay ID correctly!',
    },
    fr: {
        'nav.products': 'Nos Produits',
        'nav.contact': 'Contactez-nous',
        'hero.title': 'Votre Plateforme Complète pour Tout ce Dont Vous Avez Besoin',
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
        'products.title': 'Choisissez le Forfait Adapté à Vos Besoins',
        'products.subtitle': 'Produits numériques soigneusement sélectionnés pour vous aider à apprendre, concevoir et développer votre entreprise avec flexibilité et professionnalisme.',
        'product.trw.desc': 'Compte partagé pour les cours et la plateforme The Real World, avec support technique et garantie complète.',
        'product.trw.feature1': 'Accès à tous les cours actuels',
        'product.trw.feature2': 'Mises à jour régulières et nouveau contenu',
        'product.trw.feature3': 'Support technique arabe rapide',
        'product.adobe.desc': 'Abonnement officiel sur votre compte personnel, comprend plus de 20 applications professionnelles Adobe.',
        'product.adobe.price1': '1 Mois: 3200 DZD',
        'product.adobe.price2': '3 Mois: 7500 DZD',
        'product.adobe.price3': '12 Mois: 17800 DZD',
        'product.adobe.feature1': 'Activation sur votre propre email',
        'product.adobe.feature2': 'Mises à jour gratuites pendant l\'abonnement',
        'product.adobe.feature3': 'Instructions d\'installation détaillées',
        'product.chatgpt.desc': 'Comptes ChatGPT Business individuels avec toutes les fonctionnalités IA avancées.',
        'product.chatgpt.feature1': 'Accès au dernier GPT',
        'product.chatgpt.feature2': 'Espace de travail privé et sécurisé',
        'product.chatgpt.feature3': 'Intégration avec vos outils préférés',
        'product.orderNow': 'Commander',
        'product.payCrypto': 'Payer avec Crypto (USDT)',
        'product.payRedotPay': 'Payer avec RedotPay',
        'product.payBaridiMob': 'Payer avec BaridiMob',
        'product.soldOut': 'Épuisé',
        'currency': 'DZD',
        'perMonth': 'par mois',
        'contact.title': 'Prêt à Démarrer Votre Prochain Projet',
        'contact.description': 'Contactez-nous maintenant via les canaux disponibles pour une consultation gratuite et déterminer le meilleur forfait pour vous.',
        'contact.whatsapp': 'Contacter via WhatsApp',
        'contact.instagram': 'Suivez-nous sur Instagram',
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
        'payment.title': 'Méthodes de Paiement Disponibles',
        'payment.redotpay': 'RedotPay',
        'payment.usdt': 'USDT',
        'payment.baridimob': 'BaridiMob',
        'nav.home': 'Accueil',
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
        'modal.crypto.step1': 'Choisir le réseau approprié (TRC20 ou BEP20)',
        'modal.crypto.step2': 'Copier l\'adresse du portefeuille ou scanner le code QR',
        'modal.crypto.step3': 'Ouvrir l\'application Binance ou tout portefeuille USDT',
        'modal.crypto.step4': 'Assurez-vous de sélectionner le même réseau (<strong id="network-warning">TRC20</strong>)',
        'modal.crypto.step5': 'Envoyer le montant requis',
        'modal.crypto.step6': 'Garder l\'ID de transaction',
        'modal.crypto.warning': '⚠️ Assurez-vous de sélectionner le bon réseau ou vous perdrez vos fonds!',
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

    // Save preference
    localStorage.setItem('preferredLanguage', lang);
}

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
