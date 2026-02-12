/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sub-Offers UI Manager - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة إدارة عرض العروض الفرعية في الصفحة الرئيسية
 * تتضمن دوال عرض أزرار الاختيار وتحديث الأسعار
 * 
 * Requirements: 3.4, 3.5
 */

// ═══════════════════════════════════════════════════════════════════════════
// ثوابت حالة التوفر - Availability Status Constants
// ═══════════════════════════════════════════════════════════════════════════

const SUB_OFFER_AVAILABILITY = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    COMING_SOON: 'coming_soon'
};

// ═══════════════════════════════════════════════════════════════════════════
// نصوص حالة التوفر بجميع اللغات
// ═══════════════════════════════════════════════════════════════════════════

const SUB_OFFER_AVAILABILITY_TEXTS = {
    [SUB_OFFER_AVAILABILITY.AVAILABLE]: {
        ar: 'متوفر',
        en: 'Available',
        fr: 'Disponible'
    },
    [SUB_OFFER_AVAILABILITY.UNAVAILABLE]: {
        ar: 'غير متوفر',
        en: 'Unavailable',
        fr: 'Indisponible'
    },
    [SUB_OFFER_AVAILABILITY.COMING_SOON]: {
        ar: 'قريباً',
        en: 'Coming Soon',
        fr: 'Bientôt'
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// متغيرات الحالة - State Variables
// ═══════════════════════════════════════════════════════════════════════════

// تخزين العرض الفرعي المحدد لكل منتج
const selectedSubOffers = {};

// ═══════════════════════════════════════════════════════════════════════════
// دوال الحصول على النصوص - Text Getter Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على نص حالة التوفر بالغة المحددة
 * @param {string} status - حالة التوفر
 * @param {string} lang - اللغة (ar, en, fr)
 * @returns {string} النص بالغة المحددة
 */
function getSubOfferAvailabilityText(status, lang = 'ar') {
    const statusTexts = SUB_OFFER_AVAILABILITY_TEXTS[status];
    if (!statusTexts) return '';
    return statusTexts[lang] || statusTexts.ar;
}

/**
 * الحصول على اسم العرض الفرعي بالغة المحددة
 * @param {Object} subOffer - العرض الفرعي
 * @param {string} lang - اللغة (ar, en, fr)
 * @returns {string} الاسم بالغة المحددة
 */
function getSubOfferName(subOffer, lang = 'ar') {
    if (!subOffer || !subOffer.name) return '';
    
    // Try requested language first, then fallback to Arabic
    if (subOffer.name[lang] && subOffer.name[lang].trim()) {
        return subOffer.name[lang];
    }
    return subOffer.name.ar || '';
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إنشاء عناصر الواجهة - UI Element Creation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء حاوية أزرار العروض الفرعية
 * @param {Array} subOffers - قائمة العروض الفرعية
 * @param {string} productId - معرف المنتج
 * @param {string} lang - اللغة الحالية
 * @param {string} currency - العملة الحالية (DZD أو USD)
 * @returns {HTMLElement|null} حاوية الأزرار أو null إذا لم توجد عروض
 */
function createSubOffersContainer(subOffers, productId, lang = 'ar', currency = 'DZD') {
    // لا نعرض شيء إذا لم توجد عروض فرعية
    if (!Array.isArray(subOffers) || subOffers.length === 0) {
        return null;
    }
    
    const container = document.createElement('div');
    container.className = 'sub-offers-container';
    container.setAttribute('data-product-id', productId);
    
    // إنشاء أزرار العروض الفرعية
    subOffers.forEach((subOffer, index) => {
        const button = createSubOfferButton(subOffer, productId, index, lang, currency);
        container.appendChild(button);
    });
    
    return container;
}

/**
 * إنشاء زر عرض فرعي
 * @param {Object} subOffer - بيانات العرض الفرعي
 * @param {string} productId - معرف المنتج
 * @param {number} index - فهرس العرض الفرعي
 * @param {string} lang - اللغة الحالية
 * @param {string} currency - العملة الحالية
 * @returns {HTMLElement} زر العرض الفرعي
 */
function createSubOfferButton(subOffer, productId, index, lang = 'ar', currency = 'DZD') {
    const button = document.createElement('button');
    button.className = 'sub-offer-btn';
    button.setAttribute('data-sub-offer-id', subOffer.id);
    button.setAttribute('data-product-id', productId);
    button.setAttribute('data-index', index);
    button.setAttribute('data-price-dzd', subOffer.priceDZD || 0);
    button.setAttribute('data-price-usd', subOffer.priceUSD || 0);
    button.setAttribute('data-availability', subOffer.availability || 'available');
    
    const name = getSubOfferName(subOffer, lang);
    const price = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
    const currencySymbol = currency === 'USD' ? '$' : 'د.ج';
    
    button.innerHTML = `
        <span class="sub-offer-name">${escapeHtml(name)}</span>
        <span class="sub-offer-price">${price?.toLocaleString() || 0} ${currencySymbol}</span>
    `;
    
    // تعطيل الزر إذا كان العرض غير متوفر
    if (subOffer.availability === SUB_OFFER_AVAILABILITY.UNAVAILABLE || 
        subOffer.availability === SUB_OFFER_AVAILABILITY.COMING_SOON) {
        button.disabled = true;
        button.classList.add('disabled');
        
        // إضافة badge للحالة
        const badge = document.createElement('span');
        badge.className = 'sub-offer-badge';
        badge.textContent = getSubOfferAvailabilityText(subOffer.availability, lang);
        button.appendChild(badge);
    }
    
    // إضافة حدث النقر
    button.addEventListener('click', () => {
        if (!button.disabled) {
            selectSubOffer(productId, subOffer, button);
        }
    });
    
    return button;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال اختيار العرض الفرعي - Sub-Offer Selection Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * اختيار عرض فرعي وتحديث السعر
 * @param {string} productId - معرف المنتج
 * @param {Object} subOffer - العرض الفرعي المحدد
 * @param {HTMLElement} button - زر العرض الفرعي
 */
function selectSubOffer(productId, subOffer, button) {
    // تخزين العرض المحدد
    selectedSubOffers[productId] = subOffer;
    
    // إزالة التحديد من جميع الأزرار في نفس المنتج
    const container = button.closest('.sub-offers-container');
    if (container) {
        container.querySelectorAll('.sub-offer-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    // تحديد الزر الحالي
    button.classList.add('selected');
    
    // تحديث السعر المعروض
    updateDisplayedPrice(productId, subOffer);
    
    // تحديث زر الطلب وأزرار الدفع
    updateOrderButtons(productId, subOffer);
}

/**
 * تحديث السعر المعروض في بطاقة المنتج
 * @param {string} productId - معرف المنتج
 * @param {Object} subOffer - العرض الفرعي المحدد
 */
function updateDisplayedPrice(productId, subOffer) {
    // البحث عن بطاقة المنتج
    const productCard = document.querySelector(`[data-product-id="${productId}"]`)?.closest('.product-card');
    if (!productCard) return;
    
    // البحث عن عنصر السعر
    const priceTag = productCard.querySelector('.price-tag');
    if (!priceTag) return;
    
    // الحصول على العملة الحالية
    const currentCurrency = window.currentCurrency || 'DZD';
    const price = currentCurrency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
    const currencySymbol = currentCurrency === 'USD' ? '$' : 'د.ج';
    
    // تحديث السعر
    priceTag.textContent = `${price?.toLocaleString() || 0} ${currencySymbol}`;
    
    // تحديث data attributes
    priceTag.setAttribute('data-price-dzd', subOffer.priceDZD || 0);
    priceTag.setAttribute('data-price-usd', subOffer.priceUSD || 0);
}

/**
 * تحديث أزرار الطلب والدفع بناءً على العرض الفرعي المحدد
 * @param {string} productId - معرف المنتج
 * @param {Object} subOffer - العرض الفرعي المحدد
 */
function updateOrderButtons(productId, subOffer) {
    // البحث عن بطاقة المنتج
    const productCard = document.querySelector(`[data-product-id="${productId}"]`)?.closest('.product-card');
    if (!productCard) return;
    
    // تحديث أزرار الدفع
    const paymentBtns = productCard.querySelectorAll('.payment-btn-compact');
    paymentBtns.forEach(btn => {
        btn.setAttribute('data-price', subOffer.priceDZD || 0);
        btn.setAttribute('data-price-usd', subOffer.priceUSD || 0);
        btn.setAttribute('data-sub-offer-id', subOffer.id);
        btn.setAttribute('data-sub-offer-name', getSubOfferName(subOffer, 'ar'));
    });
    
    // تحديث زر الطلب
    const orderBtn = productCard.querySelector('.order-btn');
    if (orderBtn) {
        orderBtn.setAttribute('data-sub-offer-id', subOffer.id);
        orderBtn.setAttribute('data-sub-offer-name', getSubOfferName(subOffer, 'ar'));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث بطاقة المنتج - Product Card Update Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة العروض الفرعية لبطاقة المنتج
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {Array} subOffers - قائمة العروض الفرعية
 * @param {string} productId - معرف المنتج
 * @param {string} lang - اللغة الحالية
 * @param {string} currency - العملة الحالية
 */
function addSubOffersToProductCard(productCard, subOffers, productId, lang = 'ar', currency = 'DZD') {
    if (!productCard || !Array.isArray(subOffers) || subOffers.length === 0) {
        return;
    }
    
    // إزالة أي حاوية عروض فرعية سابقة
    const existingContainer = productCard.querySelector('.sub-offers-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // إنشاء حاوية العروض الفرعية
    const container = createSubOffersContainer(subOffers, productId, lang, currency);
    if (!container) return;
    
    // إضافة الحاوية قبل السعر
    const priceTag = productCard.querySelector('.price-tag');
    if (priceTag) {
        priceTag.parentNode.insertBefore(container, priceTag);
    } else {
        // إضافة بعد الوصف إذا لم يوجد عنصر السعر
        const description = productCard.querySelector('.description');
        if (description) {
            description.parentNode.insertBefore(container, description.nextSibling);
        }
    }
    
    // تحديد العرض الأول تلقائياً إذا كان متوفراً
    const firstAvailableOffer = subOffers.find(s => s.availability === SUB_OFFER_AVAILABILITY.AVAILABLE);
    if (firstAvailableOffer) {
        const firstBtn = container.querySelector(`[data-sub-offer-id="${firstAvailableOffer.id}"]`);
        if (firstBtn) {
            selectSubOffer(productId, firstAvailableOffer, firstBtn);
        }
    }
}

/**
 * تحديث جميع بطاقات المنتجات بالعروض الفرعية
 * @param {Array} products - قائمة المنتجات مع العروض الفرعية
 * @param {string} lang - اللغة الحالية
 * @param {string} currency - العملة الحالية
 */
function updateAllProductCardsWithSubOffers(products, lang = 'ar', currency = 'DZD') {
    if (!Array.isArray(products)) return;
    
    products.forEach(product => {
        if (!product.id || !Array.isArray(product.subOffers) || product.subOffers.length === 0) {
            return;
        }
        
        // البحث عن بطاقة المنتج
        const productCard = document.querySelector(
            `[data-product-id="${product.id}"]`
        )?.closest('.product-card');
        
        if (productCard) {
            addSubOffersToProductCard(productCard, product.subOffers, product.id, lang, currency);
        }
    });
}

/**
 * تحديث أسعار العروض الفرعية عند تغيير العملة
 * @param {string} currency - العملة الجديدة (DZD أو USD)
 */
function updateSubOfferPricesForCurrency(currency) {
    document.querySelectorAll('.sub-offers-container').forEach(container => {
        const productId = container.getAttribute('data-product-id');
        
        container.querySelectorAll('.sub-offer-btn').forEach(btn => {
            const priceDzd = parseFloat(btn.getAttribute('data-price-dzd')) || 0;
            const priceUsd = parseFloat(btn.getAttribute('data-price-usd')) || 0;
            const price = currency === 'USD' ? priceUsd : priceDzd;
            const currencySymbol = currency === 'USD' ? '$' : 'د.ج';
            
            const priceSpan = btn.querySelector('.sub-offer-price');
            if (priceSpan) {
                priceSpan.textContent = `${price.toLocaleString()} ${currencySymbol}`;
            }
        });
        
        // تحديث السعر المعروض للعرض المحدد
        const selectedOffer = selectedSubOffers[productId];
        if (selectedOffer) {
            updateDisplayedPrice(productId, selectedOffer);
        }
    });
}

/**
 * تحديث نصوص العروض الفرعية عند تغيير اللغة
 * @param {string} lang - اللغة الجديدة
 * @param {Array} products - قائمة المنتجات (للحصول على الأسماء)
 */
function updateSubOfferTextsForLanguage(lang, products = []) {
    // إنشاء خريطة للمنتجات للوصول السريع
    const productsMap = {};
    products.forEach(p => {
        if (p.id && Array.isArray(p.subOffers)) {
            productsMap[p.id] = p;
        }
    });
    
    document.querySelectorAll('.sub-offers-container').forEach(container => {
        const productId = container.getAttribute('data-product-id');
        const product = productsMap[productId];
        
        if (!product) return;
        
        container.querySelectorAll('.sub-offer-btn').forEach(btn => {
            const subOfferId = btn.getAttribute('data-sub-offer-id');
            const subOffer = product.subOffers.find(s => s.id === subOfferId);
            
            if (subOffer) {
                const nameSpan = btn.querySelector('.sub-offer-name');
                if (nameSpan) {
                    nameSpan.textContent = getSubOfferName(subOffer, lang);
                }
                
                const badge = btn.querySelector('.sub-offer-badge');
                if (badge && subOffer.availability !== SUB_OFFER_AVAILABILITY.AVAILABLE) {
                    badge.textContent = getSubOfferAvailabilityText(subOffer.availability, lang);
                }
            }
        });
    });
}

/**
 * الحصول على العرض الفرعي المحدد لمنتج معين
 * @param {string} productId - معرف المنتج
 * @returns {Object|null} العرض الفرعي المحدد أو null
 */
function getSelectedSubOffer(productId) {
    return selectedSubOffers[productId] || null;
}

/**
 * إعادة تعيين العرض الفرعي المحدد لمنتج معين
 * @param {string} productId - معرف المنتج
 */
function resetSelectedSubOffer(productId) {
    delete selectedSubOffers[productId];
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة - Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تهريب HTML لمنع XSS
 * @param {string} text - النص للتهريب
 * @returns {string} النص المهرب
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.SubOffersUI = {
        SUB_OFFER_AVAILABILITY,
        SUB_OFFER_AVAILABILITY_TEXTS,
        getSubOfferAvailabilityText,
        getSubOfferName,
        createSubOffersContainer,
        createSubOfferButton,
        selectSubOffer,
        updateDisplayedPrice,
        updateOrderButtons,
        addSubOffersToProductCard,
        updateAllProductCardsWithSubOffers,
        updateSubOfferPricesForCurrency,
        updateSubOfferTextsForLanguage,
        getSelectedSubOffer,
        resetSelectedSubOffer
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    SUB_OFFER_AVAILABILITY,
    SUB_OFFER_AVAILABILITY_TEXTS,
    getSubOfferAvailabilityText,
    getSubOfferName,
    createSubOffersContainer,
    createSubOfferButton,
    selectSubOffer,
    updateDisplayedPrice,
    updateOrderButtons,
    addSubOffersToProductCard,
    updateAllProductCardsWithSubOffers,
    updateSubOfferPricesForCurrency,
    updateSubOfferTextsForLanguage,
    getSelectedSubOffer,
    resetSelectedSubOffer
};
