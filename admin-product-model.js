/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Product Model - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * نموذج بيانات المنتج للـ collection الجديد products_v2
 * يتضمن جميع الحقول المطلوبة حسب التصميم
 * 
 * Requirements: 9.3
 */

// ═══════════════════════════════════════════════════════════════════════════
// ثوابت حالة التوفر - Availability Status Constants
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حالات توفر المنتج
 * @type {Object}
 */
const AVAILABILITY_STATUS = {
    AVAILABLE: 'available',      // متوفر
    UNAVAILABLE: 'unavailable',  // غير متوفر
    COMING_SOON: 'coming_soon'   // قريباً
};

/**
 * أنواع الوسائط المدعومة
 * @type {Object}
 */
const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video'
};

/**
 * طرق الدفع الافتراضية
 * @type {Object}
 */
const DEFAULT_PAYMENT_METHODS = {
    usdt: true,
    redotpay: true,
    baridimob: true
};

// ═══════════════════════════════════════════════════════════════════════════
// نموذج الترجمات - Translations Model
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

// ═══════════════════════════════════════════════════════════════════════════
// نموذج الميزة - Feature Model
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء ميزة جديدة
 * @param {Object} params - معاملات الميزة
 * @param {string} params.id - معرف الميزة
 * @param {Object} params.text - نص الميزة بجميع اللغات
 * @param {number} params.order - ترتيب الميزة
 * @returns {Object} كائن الميزة
 */
function createFeature({ id, text, order }) {
    return {
        id: id || generateId(),
        text: createTranslations(text?.ar, text?.en, text?.fr),
        order: typeof order === 'number' ? order : 0
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// نموذج العرض الفرعي - Sub-Offer Model
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء عرض فرعي جديد
 * @param {Object} params - معاملات العرض الفرعي
 * @returns {Object} كائن العرض الفرعي
 */
function createSubOffer({
    id,
    name,
    priceDZD,
    priceUSD,
    availability = AVAILABILITY_STATUS.AVAILABLE,
    order = 0
}) {
    return {
        id: id || generateId(),
        name: createTranslations(name?.ar, name?.en, name?.fr),
        priceDZD: typeof priceDZD === 'number' ? priceDZD : 0,
        priceUSD: typeof priceUSD === 'number' ? priceUSD : 0,
        availability: availability,
        order: order
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// نموذج المنتج الرئيسي - Product Model
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء منتج جديد مع جميع الحقول المطلوبة
 * @param {Object} params - معاملات المنتج
 * @returns {Object} كائن المنتج الكامل
 */
function createProduct({
    id,
    name,
    description,
    mediaUrl = '',
    mediaType = MEDIA_TYPES.IMAGE,
    priceDZD = 0,
    priceUSD = 0,
    availability = AVAILABILITY_STATUS.AVAILABLE,
    features = [],
    paymentMethods = DEFAULT_PAYMENT_METHODS,
    subOffers = [],
    displayOrder = 0,
    isArchived = false,
    createdAt = null,
    updatedAt = null
}) {
    const now = new Date();
    
    return {
        id: id || generateId(),
        name: createTranslations(name?.ar, name?.en, name?.fr),
        description: createTranslations(description?.ar, description?.en, description?.fr),
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || MEDIA_TYPES.IMAGE,
        priceDZD: typeof priceDZD === 'number' ? priceDZD : 0,
        priceUSD: typeof priceUSD === 'number' ? priceUSD : 0,
        availability: availability || AVAILABILITY_STATUS.AVAILABLE,
        features: Array.isArray(features) ? features.map(f => createFeature(f)) : [],
        paymentMethods: {
            usdt: paymentMethods?.usdt !== false,
            redotpay: paymentMethods?.redotpay !== false,
            baridimob: paymentMethods?.baridimob !== false
        },
        subOffers: Array.isArray(subOffers) ? subOffers.map(s => createSubOffer(s)) : [],
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isArchived: Boolean(isArchived),
        createdAt: createdAt || now,
        updatedAt: updatedAt || now
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة - Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * توليد معرف فريد
 * @returns {string} معرف فريد
 */
function generateId() {
    return 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * تحويل المنتج إلى صيغة Firebase
 * @param {Object} product - كائن المنتج
 * @returns {Object} المنتج بصيغة Firebase
 */
function productToFirebase(product) {
    return {
        ...product,
        createdAt: product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt),
        updatedAt: new Date()
    };
}

/**
 * تحويل بيانات Firebase إلى كائن منتج
 * @param {string} id - معرف المستند
 * @param {Object} data - بيانات Firebase
 * @returns {Object} كائن المنتج
 */
function productFromFirebase(id, data) {
    return createProduct({
        id: id,
        name: data.name,
        description: data.description,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        priceDZD: data.priceDZD,
        priceUSD: data.priceUSD,
        availability: data.availability,
        features: data.features,
        paymentMethods: data.paymentMethods,
        subOffers: data.subOffers,
        displayOrder: data.displayOrder,
        isArchived: data.isArchived,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// اسم الـ Collection في Firebase
// ═══════════════════════════════════════════════════════════════════════════

const PRODUCTS_COLLECTION = 'products_v2';

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.ProductModel = {
        AVAILABILITY_STATUS,
        MEDIA_TYPES,
        DEFAULT_PAYMENT_METHODS,
        PRODUCTS_COLLECTION,
        createTranslations,
        createFeature,
        createSubOffer,
        createProduct,
        generateId,
        productToFirebase,
        productFromFirebase
    };
}

// CommonJS exports للاستخدام في Node.js (للاختبارات)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AVAILABILITY_STATUS,
        MEDIA_TYPES,
        DEFAULT_PAYMENT_METHODS,
        PRODUCTS_COLLECTION,
        createTranslations,
        createFeature,
        createSubOffer,
        createProduct,
        generateId,
        productToFirebase,
        productFromFirebase
    };
}
