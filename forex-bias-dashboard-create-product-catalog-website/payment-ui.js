/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Payment UI Manager - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة إدارة عرض أزرار الدفع في الصفحة الرئيسية
 * تتضمن دوال إخفاء/إظهار أزرار الدفع بناءً على إعدادات المنتج
 * 
 * Requirements: 8.2, 8.4
 */

// ═══════════════════════════════════════════════════════════════════════════
// ثوابت طرق الدفع - Payment Method Constants
// ═══════════════════════════════════════════════════════════════════════════

const PAYMENT_METHODS = {
    USDT: 'usdt',
    REDOTPAY: 'redotpay',
    BARIDIMOB: 'baridimob'
};

// ربط أسماء طرق الدفع بـ CSS classes
const PAYMENT_BUTTON_CLASSES = {
    [PAYMENT_METHODS.USDT]: 'crypto-pay-btn',
    [PAYMENT_METHODS.REDOTPAY]: 'redotpay-btn',
    [PAYMENT_METHODS.BARIDIMOB]: 'baridimob-btn'
};

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة أزرار الدفع - Payment Button Management Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على أزرار الدفع لمنتج معين
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @returns {Object} كائن يحتوي على أزرار الدفع
 */
function getPaymentButtons(productCard) {
    if (!productCard) return {};
    
    return {
        usdt: productCard.querySelector(`.${PAYMENT_BUTTON_CLASSES[PAYMENT_METHODS.USDT]}`),
        redotpay: productCard.querySelector(`.${PAYMENT_BUTTON_CLASSES[PAYMENT_METHODS.REDOTPAY]}`),
        baridimob: productCard.querySelector(`.${PAYMENT_BUTTON_CLASSES[PAYMENT_METHODS.BARIDIMOB]}`)
    };
}

/**
 * تحديث ظهور أزرار الدفع بناءً على الإعدادات
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {Object} paymentMethods - إعدادات طرق الدفع {usdt: boolean, redotpay: boolean, baridimob: boolean}
 */
function updatePaymentButtonsVisibility(productCard, paymentMethods) {
    if (!productCard || !paymentMethods) return;
    
    const buttons = getPaymentButtons(productCard);
    
    // تحديث كل زر بناءً على الإعدادات
    Object.keys(PAYMENT_METHODS).forEach(key => {
        const methodId = PAYMENT_METHODS[key];
        const button = buttons[methodId];
        const isEnabled = paymentMethods[methodId] !== false;
        
        if (button) {
            setPaymentButtonVisibility(button, isEnabled);
        }
    });
}

/**
 * تعيين ظهور زر دفع معين
 * @param {HTMLElement} button - عنصر الزر
 * @param {boolean} visible - هل يجب إظهار الزر
 */
function setPaymentButtonVisibility(button, visible) {
    if (!button) return;
    
    if (visible) {
        button.style.display = '';
        button.classList.remove('payment-hidden');
    } else {
        button.style.display = 'none';
        button.classList.add('payment-hidden');
    }
}

/**
 * الحصول على حالة ظهور أزرار الدفع
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @returns {Object} حالة ظهور كل زر
 */
function getPaymentButtonsVisibilityState(productCard) {
    if (!productCard) return {};
    
    const buttons = getPaymentButtons(productCard);
    const state = {};
    
    Object.keys(PAYMENT_METHODS).forEach(key => {
        const methodId = PAYMENT_METHODS[key];
        const button = buttons[methodId];
        state[methodId] = button ? isPaymentButtonVisible(button) : false;
    });
    
    return state;
}

/**
 * التحقق من ظهور زر دفع
 * @param {HTMLElement} button - عنصر الزر
 * @returns {boolean} هل الزر مرئي
 */
function isPaymentButtonVisible(button) {
    if (!button) return false;
    return button.style.display !== 'none' && !button.classList.contains('payment-hidden');
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث جميع المنتجات - Batch Update Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث أزرار الدفع لجميع المنتجات
 * @param {Array} products - قائمة المنتجات مع إعدادات طرق الدفع
 */
function updateAllProductsPaymentButtons(products) {
    if (!Array.isArray(products)) return;
    
    products.forEach(product => {
        if (!product.id || !product.paymentMethods) return;
        
        // البحث عن بطاقة المنتج
        const productCard = findProductCard(product);
        
        if (productCard) {
            updatePaymentButtonsVisibility(productCard, product.paymentMethods);
        }
    });
}

/**
 * البحث عن بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 * @returns {HTMLElement|null} عنصر بطاقة المنتج
 */
function findProductCard(product) {
    // البحث بواسطة data-product-id
    let card = document.querySelector(`[data-product-id="${product.id}"]`);
    if (card) return card.closest('.product-card') || card;
    
    // البحث بواسطة اسم المنتج
    const productName = product.name?.ar || product.name;
    if (productName) {
        const orderBtn = document.querySelector(`[data-product="${productName}"]`);
        if (orderBtn) return orderBtn.closest('.product-card');
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة للاختبار - Helper Functions for Testing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على حالة UI المتوقعة بناءً على إعدادات طرق الدفع
 * @param {Object} paymentMethods - إعدادات طرق الدفع
 * @returns {Object} حالة UI المتوقعة
 */
function getExpectedPaymentUIState(paymentMethods) {
    if (!paymentMethods) {
        return {
            usdt: true,
            redotpay: true,
            baridimob: true
        };
    }
    
    return {
        usdt: paymentMethods.usdt !== false,
        redotpay: paymentMethods.redotpay !== false,
        baridimob: paymentMethods.baridimob !== false
    };
}

/**
 * التحقق من تطابق حالة UI مع الإعدادات
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {Object} paymentMethods - إعدادات طرق الدفع
 * @returns {boolean} هل الحالة متطابقة
 */
function verifyPaymentUIState(productCard, paymentMethods) {
    const expectedState = getExpectedPaymentUIState(paymentMethods);
    const actualState = getPaymentButtonsVisibilityState(productCard);
    
    return Object.keys(expectedState).every(method => 
        expectedState[method] === actualState[method]
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.PaymentUI = {
        PAYMENT_METHODS,
        PAYMENT_BUTTON_CLASSES,
        getPaymentButtons,
        updatePaymentButtonsVisibility,
        setPaymentButtonVisibility,
        getPaymentButtonsVisibilityState,
        isPaymentButtonVisible,
        updateAllProductsPaymentButtons,
        findProductCard,
        getExpectedPaymentUIState,
        verifyPaymentUIState
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    PAYMENT_METHODS,
    PAYMENT_BUTTON_CLASSES,
    getPaymentButtons,
    updatePaymentButtonsVisibility,
    setPaymentButtonVisibility,
    getPaymentButtonsVisibilityState,
    isPaymentButtonVisible,
    updateAllProductsPaymentButtons,
    findProductCard,
    getExpectedPaymentUIState,
    verifyPaymentUIState
};
