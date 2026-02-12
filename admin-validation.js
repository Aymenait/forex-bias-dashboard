/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Validation Module - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة التحقق من صحة البيانات للوحة التحكم
 * تتضمن دوال التحقق من الأسعار، روابط الوسائط، والترجمات
 * 
 * Requirements: 1.5, 4.2, 6.4
 */

// ═══════════════════════════════════════════════════════════════════════════
// نتيجة التحقق - Validation Result
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء نتيجة تحقق
 * @param {boolean} valid - هل البيانات صالحة
 * @param {string[]} errors - قائمة الأخطاء
 * @returns {Object} نتيجة التحقق
 */
function createValidationResult(valid, errors = []) {
    return {
        valid: Boolean(valid),
        errors: Array.isArray(errors) ? errors : []
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من الأسعار - Price Validation
// Requirements: 1.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من صحة السعر
 * يرفض الأسعار السالبة، غير الرقمية، والقيم الفارغة
 * 
 * @param {*} price - السعر للتحقق منه
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 * 
 * @example
 * validatePrice(100)    // {valid: true, errors: []}
 * validatePrice(-5)     // {valid: false, errors: ['يرجى إدخال سعر صحيح (رقم موجب)']}
 * validatePrice('abc')  // {valid: false, errors: ['يرجى إدخال سعر صحيح (رقم موجب)']}
 */
function validatePrice(price) {
    const errors = [];
    
    // التحقق من القيم الفارغة أو غير المعرفة
    if (price === null || price === undefined || price === '') {
        errors.push('يرجى إدخال سعر صحيح (رقم موجب)');
        return createValidationResult(false, errors);
    }
    
    // تحويل إلى رقم
    const numPrice = Number(price);
    
    // التحقق من أن القيمة رقم صالح
    if (isNaN(numPrice)) {
        errors.push('يرجى إدخال سعر صحيح (رقم موجب)');
        return createValidationResult(false, errors);
    }
    
    // التحقق من أن السعر موجب (أكبر من أو يساوي صفر)
    if (numPrice < 0) {
        errors.push('يرجى إدخال سعر صحيح (رقم موجب)');
        return createValidationResult(false, errors);
    }
    
    // التحقق من أن السعر ليس Infinity
    if (!isFinite(numPrice)) {
        errors.push('يرجى إدخال سعر صحيح (رقم موجب)');
        return createValidationResult(false, errors);
    }
    
    return createValidationResult(true, []);
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من روابط الوسائط - Media URL Validation
// Requirements: 6.4
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الامتدادات المسموح بها للصور
 */
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif'];

/**
 * الامتدادات المسموح بها للفيديو
 */
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4'];

/**
 * النطاقات المسموح بها للوسائط
 */
const ALLOWED_DOMAINS = ['i.imgur.com', 'imgur.com'];

/**
 * التحقق من صحة رابط الوسائط
 * يقبل فقط روابط Imgur بامتدادات صور أو فيديو صالحة
 * 
 * @param {string} url - رابط الوسائط للتحقق منه
 * @returns {Object} نتيجة التحقق مع نوع الوسائط {valid: boolean, errors: string[], mediaType?: string}
 * 
 * @example
 * validateMediaUrl('https://i.imgur.com/abc.png')  // {valid: true, errors: [], mediaType: 'image'}
 * validateMediaUrl('https://i.imgur.com/xyz.mp4') // {valid: true, errors: [], mediaType: 'video'}
 * validateMediaUrl('https://other.com/img.png')   // {valid: false, errors: ['يرجى إدخال رابط صحيح من Imgur']}
 */
function validateMediaUrl(url) {
    const errors = [];
    
    // السماح بالروابط الفارغة (الوسائط اختيارية)
    if (url === null || url === undefined || url === '') {
        return createValidationResult(true, []);
    }
    
    // التحقق من أن الرابط نص
    if (typeof url !== 'string') {
        errors.push('يرجى إدخال رابط صحيح من Imgur');
        return createValidationResult(false, errors);
    }
    
    const trimmedUrl = url.trim();
    
    // السماح بالروابط الفارغة بعد التقليم
    if (trimmedUrl === '') {
        return createValidationResult(true, []);
    }
    
    // التحقق من صيغة URL
    let parsedUrl;
    try {
        parsedUrl = new URL(trimmedUrl);
    } catch (e) {
        errors.push('يرجى إدخال رابط صحيح من Imgur');
        return createValidationResult(false, errors);
    }
    
    // التحقق من البروتوكول (https أو http)
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        errors.push('يرجى إدخال رابط صحيح من Imgur');
        return createValidationResult(false, errors);
    }
    
    // التحقق من النطاق (Imgur فقط)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(hostname)) {
        errors.push('يرجى إدخال رابط صحيح من Imgur');
        return createValidationResult(false, errors);
    }
    
    // التحقق من امتداد الملف
    const pathname = parsedUrl.pathname.toLowerCase();
    const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
    const isVideo = ALLOWED_VIDEO_EXTENSIONS.some(ext => pathname.endsWith(ext));
    
    if (!isImage && !isVideo) {
        errors.push('يرجى إدخال رابط صحيح من Imgur');
        return createValidationResult(false, errors);
    }
    
    // تحديد نوع الوسائط
    const mediaType = isImage ? 'image' : 'video';
    
    return {
        valid: true,
        errors: [],
        mediaType: mediaType
    };
}

/**
 * اكتشاف نوع الوسائط من الرابط
 * @param {string} url - رابط الوسائط
 * @returns {string|null} نوع الوسائط ('image' أو 'video') أو null إذا كان غير صالح
 */
function detectMediaType(url) {
    const result = validateMediaUrl(url);
    return result.valid ? result.mediaType : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من الترجمات - Translations Validation
// Requirements: 4.2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من صحة الترجمات
 * يتطلب وجود المحتوى العربي على الأقل
 * 
 * @param {Object} translations - كائن الترجمات {ar, en, fr}
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 * 
 * @example
 * validateTranslations({ar: 'نص', en: 'text'})  // {valid: true, errors: []}
 * validateTranslations({en: 'text'})            // {valid: false, errors: ['المحتوى العربي مطلوب']}
 * validateTranslations({ar: ''})                // {valid: false, errors: ['المحتوى العربي مطلوب']}
 */
function validateTranslations(translations) {
    const errors = [];
    
    // التحقق من وجود كائن الترجمات
    if (!translations || typeof translations !== 'object') {
        errors.push('المحتوى العربي مطلوب');
        return createValidationResult(false, errors);
    }
    
    // التحقق من وجود المحتوى العربي
    const arabicContent = translations.ar;
    
    if (arabicContent === null || arabicContent === undefined) {
        errors.push('المحتوى العربي مطلوب');
        return createValidationResult(false, errors);
    }
    
    // التحقق من أن المحتوى العربي ليس فارغاً
    if (typeof arabicContent !== 'string' || arabicContent.trim() === '') {
        errors.push('المحتوى العربي مطلوب');
        return createValidationResult(false, errors);
    }
    
    return createValidationResult(true, []);
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من المميزات - Features Validation
// Requirements: 7.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحد الأقصى لعدد المميزات
 */
const MAX_FEATURES_COUNT = 5;

/**
 * التحقق من صحة المميزات
 * يتحقق من أن عدد المميزات لا يتجاوز الحد الأقصى (5)
 * ويتحقق من أن كل ميزة تحتوي على محتوى عربي
 * 
 * @param {Array} features - مصفوفة المميزات
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[], count: number}
 * 
 * @example
 * validateFeatures([{text: {ar: 'ميزة 1'}}])  // {valid: true, errors: [], count: 1}
 * validateFeatures([...6 features])            // {valid: false, errors: ['الحد الأقصى للمميزات هو 5'], count: 6}
 */
function validateFeatures(features) {
    const errors = [];
    
    // إذا لم تكن هناك مميزات، فهذا صالح
    if (!features || !Array.isArray(features)) {
        return {
            valid: true,
            errors: [],
            count: 0
        };
    }
    
    const count = features.length;
    
    // التحقق من الحد الأقصى للمميزات
    if (count > MAX_FEATURES_COUNT) {
        errors.push('الحد الأقصى للمميزات هو 5');
    }
    
    // التحقق من أن كل ميزة تحتوي على محتوى عربي
    features.forEach((feature, index) => {
        if (!feature || !feature.text) {
            errors.push(`الميزة ${index + 1}: المحتوى مطلوب`);
        } else {
            const textValidation = validateTranslations(feature.text);
            if (!textValidation.valid) {
                errors.push(`الميزة ${index + 1}: المحتوى العربي مطلوب`);
            }
        }
    });
    
    return {
        valid: errors.length === 0,
        errors: errors,
        count: count
    };
}

/**
 * التحقق من إمكانية إضافة ميزة جديدة
 * @param {Array} currentFeatures - المميزات الحالية
 * @returns {Object} نتيجة التحقق {canAdd: boolean, currentCount: number, maxCount: number}
 */
function canAddFeature(currentFeatures) {
    const count = Array.isArray(currentFeatures) ? currentFeatures.length : 0;
    return {
        canAdd: count < MAX_FEATURES_COUNT,
        currentCount: count,
        maxCount: MAX_FEATURES_COUNT
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من المنتج الكامل - Full Product Validation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من صحة بيانات المنتج الكاملة
 * @param {Object} product - كائن المنتج
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 */
function validateProduct(product) {
    const errors = [];
    
    if (!product || typeof product !== 'object') {
        errors.push('بيانات المنتج غير صالحة');
        return createValidationResult(false, errors);
    }
    
    // التحقق من اسم المنتج
    const nameValidation = validateTranslations(product.name);
    if (!nameValidation.valid) {
        errors.push('اسم المنتج بالعربية مطلوب');
    }
    
    // التحقق من السعر بالدينار
    const priceDZDValidation = validatePrice(product.priceDZD);
    if (!priceDZDValidation.valid) {
        errors.push('السعر بالدينار غير صالح');
    }
    
    // التحقق من السعر بالدولار
    const priceUSDValidation = validatePrice(product.priceUSD);
    if (!priceUSDValidation.valid) {
        errors.push('السعر بالدولار غير صالح');
    }
    
    // التحقق من رابط الوسائط (إذا كان موجوداً)
    if (product.mediaUrl) {
        const mediaValidation = validateMediaUrl(product.mediaUrl);
        if (!mediaValidation.valid) {
            errors.push(...mediaValidation.errors);
        }
    }
    
    // التحقق من عدد المميزات (حد أقصى 5)
    if (product.features && Array.isArray(product.features) && product.features.length > 5) {
        errors.push('الحد الأقصى للمميزات هو 5');
    }
    
    // التحقق من طرق الدفع
    if (product.paymentMethods) {
        const { usdt, redotpay, baridimob } = product.paymentMethods;
        if (!usdt && !redotpay && !baridimob) {
            errors.push('يجب تفعيل طريقة دفع واحدة على الأقل');
        }
    }
    
    return createValidationResult(errors.length === 0, errors);
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.ValidationModule = {
        validatePrice,
        validateMediaUrl,
        validateTranslations,
        validateFeatures,
        canAddFeature,
        validateProduct,
        detectMediaType,
        createValidationResult,
        ALLOWED_IMAGE_EXTENSIONS,
        ALLOWED_VIDEO_EXTENSIONS,
        ALLOWED_DOMAINS,
        MAX_FEATURES_COUNT
    };
}

// CommonJS exports للاستخدام في Node.js (للاختبارات)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validatePrice,
        validateMediaUrl,
        validateTranslations,
        validateFeatures,
        canAddFeature,
        validateProduct,
        detectMediaType,
        createValidationResult,
        ALLOWED_IMAGE_EXTENSIONS,
        ALLOWED_VIDEO_EXTENSIONS,
        ALLOWED_DOMAINS,
        MAX_FEATURES_COUNT
    };
}
