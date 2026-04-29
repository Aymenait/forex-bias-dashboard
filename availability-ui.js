/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Availability UI Manager - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة إدارة عرض حالة التوفر في الصفحة الرئيسية
 * تتضمن دوال إضافة badges وتعطيل أزرار الطلب
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

// ═══════════════════════════════════════════════════════════════════════════
// ثوابت حالة التوفر - Availability Status Constants
// ═══════════════════════════════════════════════════════════════════════════

const AVAILABILITY_STATUS = {
    AVAILABLE: 'available',      // متوفر
    UNAVAILABLE: 'unavailable',  // غير متوفر
    COMING_SOON: 'coming_soon'   // قريباً
};

// ═══════════════════════════════════════════════════════════════════════════
// نصوص حالة التوفر بجميع اللغات
// ═══════════════════════════════════════════════════════════════════════════

const AVAILABILITY_TEXTS = {
    [AVAILABILITY_STATUS.AVAILABLE]: {
        ar: 'متوفر',
        en: 'Available',
        fr: 'Disponible'
    },
    [AVAILABILITY_STATUS.UNAVAILABLE]: {
        ar: 'غير متوفر',
        en: 'Unavailable',
        fr: 'Indisponible'
    },
    [AVAILABILITY_STATUS.COMING_SOON]: {
        ar: 'قريباً',
        en: 'Coming Soon',
        fr: 'Bientôt'
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// دوال الحصول على النصوص - Text Getter Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على نص حالة التوفر بالغة المحددة
 * @param {string} status - حالة التوفر
 * @param {string} lang - اللغة (ar, en, fr)
 * @returns {string} النص بالغة المحددة
 */
function getAvailabilityText(status, lang = 'ar') {
    const statusTexts = AVAILABILITY_TEXTS[status];
    if (!statusTexts) return '';
    return statusTexts[lang] || statusTexts.ar;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إنشاء عناصر الواجهة - UI Element Creation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء badge حالة التوفر
 * @param {string} status - حالة التوفر
 * @param {string} lang - اللغة الحالية
 * @returns {HTMLElement|null} عنصر الـ badge أو null إذا كان المنتج متوفر
 */
function createAvailabilityBadge(status, lang = 'ar') {
    // لا نعرض badge للمنتجات المتوفرة
    if (status === AVAILABILITY_STATUS.AVAILABLE) {
        return null;
    }
    
    const badge = document.createElement('div');
    badge.className = 'availability-badge';
    badge.setAttribute('data-status', status);
    
    const text = getAvailabilityText(status, lang);
    badge.textContent = text;
    
    // تطبيق الأنماط حسب الحالة
    if (status === AVAILABILITY_STATUS.UNAVAILABLE) {
        badge.classList.add('unavailable-badge');
    } else if (status === AVAILABILITY_STATUS.COMING_SOON) {
        badge.classList.add('coming-soon-badge');
    }
    
    return badge;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث بطاقة المنتج - Product Card Update Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث بطاقة المنتج بناءً على حالة التوفر
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {string} status - حالة التوفر
 * @param {string} lang - اللغة الحالية
 */
function updateProductCardAvailability(productCard, status, lang = 'ar') {
    if (!productCard) return;
    
    // إزالة أي badges سابقة
    const existingBadge = productCard.querySelector('.availability-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // إزالة الـ classes السابقة
    productCard.classList.remove('unavailable-card', 'coming-soon-card');
    
    // الحصول على زر الطلب وأزرار الدفع
    const orderBtn = productCard.querySelector('.order-btn');
    const paymentBtns = productCard.querySelectorAll('.payment-btn-compact');
    
    if (status === AVAILABILITY_STATUS.AVAILABLE) {
        // المنتج متوفر - تفعيل الأزرار
        enableProductButtons(orderBtn, paymentBtns);
    } else {
        // المنتج غير متوفر أو قريباً - إضافة badge وتعطيل الأزرار
        const badge = createAvailabilityBadge(status, lang);
        if (badge) {
            // إضافة الـ badge في بداية البطاقة
            const productImage = productCard.querySelector('.product-image');
            if (productImage) {
                productImage.appendChild(badge);
            } else {
                productCard.insertBefore(badge, productCard.firstChild);
            }
        }
        
        // إضافة class للبطاقة
        if (status === AVAILABILITY_STATUS.UNAVAILABLE) {
            productCard.classList.add('unavailable-card');
        } else if (status === AVAILABILITY_STATUS.COMING_SOON) {
            productCard.classList.add('coming-soon-card');
        }
        
        // تعطيل الأزرار
        disableProductButtons(orderBtn, paymentBtns, status, lang);
    }
}

/**
 * تفعيل أزرار المنتج
 * @param {HTMLElement} orderBtn - زر الطلب
 * @param {NodeList} paymentBtns - أزرار الدفع
 */
function enableProductButtons(orderBtn, paymentBtns) {
    if (orderBtn) {
        orderBtn.disabled = false;
        orderBtn.removeAttribute('data-status');
        orderBtn.style.opacity = '';
        orderBtn.style.cursor = '';
        orderBtn.style.background = '';
        orderBtn.style.borderColor = '';
        orderBtn.style.boxShadow = '';
        
        // استعادة النص الأصلي
        const originalText = orderBtn.getAttribute('data-original-text');
        if (originalText) {
            orderBtn.innerHTML = originalText;
        }
    }
    
    paymentBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
        btn.style.pointerEvents = '';
    });
}

/**
 * تعطيل أزرار المنتج
 * @param {HTMLElement} orderBtn - زر الطلب
 * @param {NodeList} paymentBtns - أزرار الدفع
 * @param {string} status - حالة التوفر
 * @param {string} lang - اللغة الحالية
 */
function disableProductButtons(orderBtn, paymentBtns, status, lang = 'ar') {
    if (orderBtn) {
        // حفظ النص الأصلي
        if (!orderBtn.getAttribute('data-original-text')) {
            orderBtn.setAttribute('data-original-text', orderBtn.innerHTML);
        }
        
        orderBtn.disabled = true;
        orderBtn.setAttribute('data-status', status);
        orderBtn.style.opacity = '0.5';
        orderBtn.style.cursor = 'not-allowed';
        orderBtn.style.background = 'rgba(100, 100, 100, 0.3)';
        orderBtn.style.borderColor = 'rgba(150, 150, 150, 0.5)';
        orderBtn.style.boxShadow = 'none';
        
        // تغيير نص الزر
        const buttonText = getAvailabilityText(status, lang);
        orderBtn.innerHTML = `<span>${buttonText}</span>`;
    }
    
    paymentBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.pointerEvents = 'none';
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث جميع المنتجات - Batch Update Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث جميع بطاقات المنتجات بناءً على بيانات التوفر
 * @param {Array} products - قائمة المنتجات مع حالات التوفر
 * @param {string} lang - اللغة الحالية
 */
function updateAllProductCardsAvailability(products, lang = 'ar') {
    if (!Array.isArray(products)) return;
    
    products.forEach(product => {
        if (!product.id || !product.availability) return;
        
        // البحث عن بطاقة المنتج بواسطة data-product-id أو اسم المنتج
        const productCard = document.querySelector(
            `[data-product-id="${product.id}"], [data-product="${product.name?.ar || product.name}"]`
        )?.closest('.product-card');
        
        if (productCard) {
            updateProductCardAvailability(productCard, product.availability, lang);
        }
    });
}

/**
 * تحديث نصوص حالة التوفر عند تغيير اللغة
 * @param {string} lang - اللغة الجديدة
 */
function updateAvailabilityTextsForLanguage(lang) {
    // تحديث جميع الـ badges
    document.querySelectorAll('.availability-badge').forEach(badge => {
        const status = badge.getAttribute('data-status');
        if (status) {
            badge.textContent = getAvailabilityText(status, lang);
        }
    });
    
    // تحديث نصوص أزرار الطلب المعطلة
    document.querySelectorAll('.order-btn[disabled]').forEach(btn => {
        const status = btn.getAttribute('data-status');
        if (status && status !== AVAILABILITY_STATUS.AVAILABLE) {
            const buttonText = getAvailabilityText(status, lang);
            btn.innerHTML = `<span>${buttonText}</span>`;
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة للاختبار - Helper Functions for Testing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على حالة UI المتوقعة بناءً على حالة التوفر
 * @param {string} status - حالة التوفر
 * @returns {Object} حالة UI المتوقعة
 */
function getExpectedUIState(status) {
    switch (status) {
        case AVAILABILITY_STATUS.AVAILABLE:
            return {
                hasBadge: false,
                badgeText: null,
                orderButtonDisabled: false,
                paymentButtonsDisabled: false,
                cardClass: null
            };
        case AVAILABILITY_STATUS.UNAVAILABLE:
            return {
                hasBadge: true,
                badgeText: AVAILABILITY_TEXTS[AVAILABILITY_STATUS.UNAVAILABLE],
                orderButtonDisabled: true,
                paymentButtonsDisabled: true,
                cardClass: 'unavailable-card'
            };
        case AVAILABILITY_STATUS.COMING_SOON:
            return {
                hasBadge: true,
                badgeText: AVAILABILITY_TEXTS[AVAILABILITY_STATUS.COMING_SOON],
                orderButtonDisabled: true,
                paymentButtonsDisabled: true,
                cardClass: 'coming-soon-card'
            };
        default:
            return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.AvailabilityUI = {
        AVAILABILITY_STATUS,
        AVAILABILITY_TEXTS,
        getAvailabilityText,
        createAvailabilityBadge,
        updateProductCardAvailability,
        enableProductButtons,
        disableProductButtons,
        updateAllProductCardsAvailability,
        updateAvailabilityTextsForLanguage,
        getExpectedUIState
    };

    // Diagnostic logs
    console.log('✅ AvailabilityUI loaded successfully');
    console.log('📦 Product cards found:', document.querySelectorAll('.product-card').length);
    console.log('🔍 Device info:', {
        userAgent: navigator.userAgent,
        width: window.innerWidth,
        height: window.innerHeight
    });
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    AVAILABILITY_STATUS,
    AVAILABILITY_TEXTS,
    getAvailabilityText,
    createAvailabilityBadge,
    updateProductCardAvailability,
    enableProductButtons,
    disableProductButtons,
    updateAllProductCardsAvailability,
    updateAvailabilityTextsForLanguage,
    getExpectedUIState
};
