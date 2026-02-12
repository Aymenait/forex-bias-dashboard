/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Translation Manager Module - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة إدارة الترجمات للمنتجات
 * تتضمن دوال الحصول على الترجمات مع دعم الـ Fallback للعربية
 * 
 * Requirements: 4.3, 4.5
 */

// ═══════════════════════════════════════════════════════════════════════════
// اللغات المدعومة - Supported Languages
// ═══════════════════════════════════════════════════════════════════════════

/**
 * اللغات المدعومة في النظام
 * @type {Object}
 */
const SUPPORTED_LANGUAGES = {
    AR: 'ar',  // العربية (الافتراضية)
    EN: 'en',  // الإنجليزية
    FR: 'fr'   // الفرنسية
};

/**
 * اللغة الافتراضية (العربية)
 * @type {string}
 */
const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.AR;

// ═══════════════════════════════════════════════════════════════════════════
// دوال الـ Fallback للترجمات - Translation Fallback Functions
// Requirements: 4.3
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على الترجمة مع Fallback للعربية
 * إذا كانت الترجمة المطلوبة غير موجودة، يتم إرجاع المحتوى العربي
 * 
 * @param {Object} translations - كائن الترجمات {ar, en, fr}
 * @param {string} lang - اللغة المطلوبة ('ar', 'en', 'fr')
 * @returns {string} الترجمة المطلوبة أو العربية كبديل أو سلسلة فارغة
 * 
 * @example
 * getFallback({ar: 'مرحبا', en: 'Hello'}, 'en')  // 'Hello'
 * getFallback({ar: 'مرحبا'}, 'en')               // 'مرحبا' (fallback to Arabic)
 * getFallback({ar: 'مرحبا', en: ''}, 'en')       // 'مرحبا' (empty string fallback)
 * getFallback(null, 'ar')                         // ''
 */
function getFallback(translations, lang) {
    // التحقق من وجود كائن الترجمات
    if (!translations || typeof translations !== 'object') {
        return '';
    }
    
    // التحقق من صحة اللغة المطلوبة
    const requestedLang = lang && typeof lang === 'string' ? lang.toLowerCase() : DEFAULT_LANGUAGE;
    
    // محاولة الحصول على الترجمة المطلوبة
    const requestedTranslation = translations[requestedLang];
    
    // إذا كانت الترجمة موجودة وليست فارغة، إرجاعها
    if (requestedTranslation && typeof requestedTranslation === 'string' && requestedTranslation.trim() !== '') {
        return requestedTranslation;
    }
    
    // Fallback للعربية إذا كانت اللغة المطلوبة ليست العربية
    if (requestedLang !== DEFAULT_LANGUAGE) {
        const arabicTranslation = translations[DEFAULT_LANGUAGE];
        if (arabicTranslation && typeof arabicTranslation === 'string' && arabicTranslation.trim() !== '') {
            return arabicTranslation;
        }
    }
    
    // إرجاع سلسلة فارغة إذا لم تتوفر أي ترجمة
    return '';
}

/**
 * الحصول على جميع الترجمات المتاحة لنص معين
 * @param {Object} translations - كائن الترجمات
 * @returns {Object} كائن يحتوي على الترجمات المتاحة فقط
 */
function getAvailableTranslations(translations) {
    if (!translations || typeof translations !== 'object') {
        return {};
    }
    
    const available = {};
    
    Object.values(SUPPORTED_LANGUAGES).forEach(lang => {
        const translation = translations[lang];
        if (translation && typeof translation === 'string' && translation.trim() !== '') {
            available[lang] = translation;
        }
    });
    
    return available;
}

/**
 * التحقق من وجود ترجمة للغة معينة
 * @param {Object} translations - كائن الترجمات
 * @param {string} lang - اللغة للتحقق منها
 * @returns {boolean} true إذا كانت الترجمة موجودة
 */
function hasTranslation(translations, lang) {
    if (!translations || typeof translations !== 'object') {
        return false;
    }
    
    const translation = translations[lang];
    return Boolean(translation && typeof translation === 'string' && translation.trim() !== '');
}

/**
 * التحقق من اكتمال الترجمات (جميع اللغات)
 * @param {Object} translations - كائن الترجمات
 * @returns {Object} {complete: boolean, missing: string[]}
 */
function checkTranslationCompleteness(translations) {
    const missing = [];
    
    if (!translations || typeof translations !== 'object') {
        return {
            complete: false,
            missing: Object.values(SUPPORTED_LANGUAGES)
        };
    }
    
    Object.values(SUPPORTED_LANGUAGES).forEach(lang => {
        if (!hasTranslation(translations, lang)) {
            missing.push(lang);
        }
    });
    
    return {
        complete: missing.length === 0,
        missing: missing
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إنشاء وتحديث الترجمات - Create/Update Translation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء كائن ترجمات جديد
 * @param {string} ar - النص العربي (مطلوب)
 * @param {string} [en] - النص الإنجليزي (اختياري)
 * @param {string} [fr] - النص الفرنسي (اختياري)
 * @returns {Object} كائن الترجمات
 */
function createTranslations(ar, en = '', fr = '') {
    return {
        ar: ar || '',
        en: en || '',
        fr: fr || ''
    };
}

/**
 * تحديث ترجمة معينة في كائن الترجمات
 * @param {Object} translations - كائن الترجمات الحالي
 * @param {string} lang - اللغة للتحديث
 * @param {string} text - النص الجديد
 * @returns {Object} كائن الترجمات المحدث
 */
function updateTranslation(translations, lang, text) {
    const updated = { ...translations };
    
    if (Object.values(SUPPORTED_LANGUAGES).includes(lang)) {
        updated[lang] = text || '';
    }
    
    return updated;
}

/**
 * دمج ترجمات جديدة مع ترجمات موجودة
 * @param {Object} existing - الترجمات الموجودة
 * @param {Object} updates - الترجمات الجديدة
 * @returns {Object} الترجمات المدمجة
 */
function mergeTranslations(existing, updates) {
    const merged = {
        ar: '',
        en: '',
        fr: ''
    };
    
    // نسخ الترجمات الموجودة
    if (existing && typeof existing === 'object') {
        Object.values(SUPPORTED_LANGUAGES).forEach(lang => {
            if (existing[lang]) {
                merged[lang] = existing[lang];
            }
        });
    }
    
    // تطبيق التحديثات
    if (updates && typeof updates === 'object') {
        Object.values(SUPPORTED_LANGUAGES).forEach(lang => {
            if (updates[lang] !== undefined) {
                merged[lang] = updates[lang] || '';
            }
        });
    }
    
    return merged;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال ترجمة المنتجات - Product Translation Functions
// Requirements: 4.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على اسم المنتج بالغة المحددة مع Fallback
 * @param {Object} product - كائن المنتج
 * @param {string} lang - اللغة المطلوبة
 * @returns {string} اسم المنتج
 */
function getProductName(product, lang) {
    if (!product || !product.name) {
        return '';
    }
    return getFallback(product.name, lang);
}

/**
 * الحصول على وصف المنتج بالغة المحددة مع Fallback
 * @param {Object} product - كائن المنتج
 * @param {string} lang - اللغة المطلوبة
 * @returns {string} وصف المنتج
 */
function getProductDescription(product, lang) {
    if (!product || !product.description) {
        return '';
    }
    return getFallback(product.description, lang);
}

/**
 * الحصول على مميزات المنتج بالغة المحددة مع Fallback
 * @param {Object} product - كائن المنتج
 * @param {string} lang - اللغة المطلوبة
 * @returns {string[]} قائمة المميزات
 */
function getProductFeatures(product, lang) {
    if (!product || !Array.isArray(product.features)) {
        return [];
    }
    
    return product.features.map(feature => {
        if (feature && feature.text) {
            return getFallback(feature.text, lang);
        }
        return '';
    }).filter(text => text !== '');
}

/**
 * الحصول على اسم العرض الفرعي بالغة المحددة مع Fallback
 * @param {Object} subOffer - كائن العرض الفرعي
 * @param {string} lang - اللغة المطلوبة
 * @returns {string} اسم العرض الفرعي
 */
function getSubOfferName(subOffer, lang) {
    if (!subOffer || !subOffer.name) {
        return '';
    }
    return getFallback(subOffer.name, lang);
}

/**
 * الحصول على جميع بيانات المنتج المترجمة
 * @param {Object} product - كائن المنتج
 * @param {string} lang - اللغة المطلوبة
 * @returns {Object} بيانات المنتج المترجمة
 */
function getTranslatedProduct(product, lang) {
    if (!product) {
        return null;
    }
    
    return {
        ...product,
        translatedName: getProductName(product, lang),
        translatedDescription: getProductDescription(product, lang),
        translatedFeatures: getProductFeatures(product, lang),
        translatedSubOffers: Array.isArray(product.subOffers) 
            ? product.subOffers.map(subOffer => ({
                ...subOffer,
                translatedName: getSubOfferName(subOffer, lang)
            }))
            : []
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.TranslationManager = {
        // Constants
        SUPPORTED_LANGUAGES,
        DEFAULT_LANGUAGE,
        
        // Core functions
        getFallback,
        getAvailableTranslations,
        hasTranslation,
        checkTranslationCompleteness,
        
        // Create/Update functions
        createTranslations,
        updateTranslation,
        mergeTranslations,
        
        // Product translation functions
        getProductName,
        getProductDescription,
        getProductFeatures,
        getSubOfferName,
        getTranslatedProduct
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    getFallback,
    getAvailableTranslations,
    hasTranslation,
    checkTranslationCompleteness,
    createTranslations,
    updateTranslation,
    mergeTranslations,
    getProductName,
    getProductDescription,
    getProductFeatures,
    getSubOfferName,
    getTranslatedProduct
};
