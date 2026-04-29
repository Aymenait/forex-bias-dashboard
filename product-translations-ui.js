/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Product Translations UI - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة عرض ترجمات المنتجات الديناميكية في الصفحة الرئيسية
 * تتضمن دوال تحميل الترجمات من Firebase وتحديث المحتوى عند تغيير اللغة
 * 
 * Requirements: 4.5
 */

// ═══════════════════════════════════════════════════════════════════════════
// المتغيرات العامة - Global Variables
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قائمة المنتجات المحملة من Firebase
 * @type {Array}
 */
let loadedProducts = [];

/**
 * اللغة الحالية
 * @type {string}
 */
let currentLanguage = 'ar';

/**
 * حالة التحميل
 * @type {boolean}
 */
let isLoading = false;

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحميل المنتجات - Load Products Functions
// Requirements: 4.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل ترجمات المنتجات من Firebase
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Array>} قائمة المنتجات
 */
async function loadProductTranslations(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('Firebase غير متاح لتحميل الترجمات');
        return [];
    }
    
    if (isLoading) {
        console.log('جاري تحميل الترجمات...');
        return loadedProducts;
    }
    
    isLoading = true;
    
    try {
        const { collection, getDocs, query, orderBy, where } = firebaseModules;
        
        // Query non-archived products ordered by displayOrder
        const q = query(
            collection(db, 'products_v2'),
            where('isArchived', '==', false),
            orderBy('displayOrder', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        loadedProducts = [];
        
        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            loadedProducts.push({
                id: docItem.id,
                ...data
            });
        });
        
        console.log('تم تحميل ترجمات', loadedProducts.length, 'منتج');
        return loadedProducts;
        
    } catch (error) {
        console.error('خطأ في تحميل ترجمات المنتجات:', error);
        return [];
    } finally {
        isLoading = false;
    }
}

/**
 * الحصول على المنتجات المحملة
 * @returns {Array} قائمة المنتجات
 */
function getLoadedProducts() {
    return loadedProducts;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال الـ Fallback للترجمات - Translation Fallback Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على الترجمة مع Fallback للعربية
 * @param {Object} translations - كائن الترجمات {ar, en, fr}
 * @param {string} lang - اللغة المطلوبة
 * @returns {string} الترجمة أو العربية كبديل
 */
function getTranslationWithFallback(translations, lang) {
    // استخدام TranslationManager إذا كان متاحاً
    if (typeof window !== 'undefined' && window.TranslationManager) {
        return window.TranslationManager.getFallback(translations, lang);
    }
    
    // Fallback implementation
    if (!translations || typeof translations !== 'object') {
        return '';
    }
    
    const requestedLang = lang || 'ar';
    const requestedTranslation = translations[requestedLang];
    
    if (requestedTranslation && typeof requestedTranslation === 'string' && requestedTranslation.trim() !== '') {
        return requestedTranslation;
    }
    
    // Fallback to Arabic
    const arabicTranslation = translations.ar;
    if (arabicTranslation && typeof arabicTranslation === 'string' && arabicTranslation.trim() !== '') {
        return arabicTranslation;
    }
    
    return '';
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث واجهة المنتجات - Update Product UI Functions
// Requirements: 4.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث محتوى بطاقة منتج واحدة بالغة المحددة
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 * @param {string} lang - اللغة المطلوبة
 */
function updateProductCardTranslations(productCard, product, lang) {
    if (!productCard || !product) return;
    
    // تحديث اسم المنتج
    const nameElement = productCard.querySelector('h3');
    if (nameElement && product.name) {
        const translatedName = getTranslationWithFallback(product.name, lang);
        if (translatedName) {
            nameElement.textContent = translatedName;
        }
    }
    
    // تحديث وصف المنتج
    const descElement = productCard.querySelector('.description');
    if (descElement && product.description) {
        const translatedDesc = getTranslationWithFallback(product.description, lang);
        if (translatedDesc) {
            descElement.textContent = translatedDesc;
        }
    }
    
    // تحديث المميزات
    updateProductFeatures(productCard, product, lang);
}

/**
 * تحديث مميزات المنتج
 * Requirements: 7.4 - عرض المميزات من Firebase بدلاً من الثابتة
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 * @param {string} lang - اللغة المطلوبة
 */
function updateProductFeatures(productCard, product, lang) {
    if (!productCard || !product) return;
    
    const featuresList = productCard.querySelector('.product-features');
    if (!featuresList) return;
    
    // إذا كان المنتج يحتوي على مميزات من Firebase
    if (Array.isArray(product.features) && product.features.length > 0) {
        // مسح المميزات الحالية وإعادة بنائها من Firebase
        featuresList.innerHTML = '';
        
        // ترتيب المميزات حسب order إذا كان موجوداً
        const sortedFeatures = [...product.features].sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : 0;
            const orderB = typeof b.order === 'number' ? b.order : 0;
            return orderA - orderB;
        });
        
        // إضافة كل ميزة (حد أقصى 5)
        const maxFeatures = Math.min(sortedFeatures.length, 5);
        for (let i = 0; i < maxFeatures; i++) {
            const feature = sortedFeatures[i];
            if (feature && feature.text) {
                const translatedFeature = getTranslationWithFallback(feature.text, lang);
                if (translatedFeature && translatedFeature.trim()) {
                    const li = document.createElement('li');
                    li.textContent = translatedFeature;
                    featuresList.appendChild(li);
                }
            }
        }
        
        console.log(`تم تحديث مميزات المنتج "${product.name?.ar || product.id}" - ${maxFeatures} ميزة`);
    } else {
        // إذا لم تكن هناك مميزات من Firebase، حافظ على المميزات الثابتة
        // فقط قم بتحديث النص إذا كان هناك data-i18n
        const featureItems = featuresList.querySelectorAll('li');
        featureItems.forEach((item) => {
            // لا تفعل شيئاً - المميزات الثابتة ستبقى كما هي
            // سيتم تحديثها بواسطة نظام الترجمة العام
        });
    }
}

/**
 * إعادة بناء مميزات المنتج بالكامل من Firebase
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 * @param {string} lang - اللغة المطلوبة
 */
function rebuildProductFeatures(productCard, product, lang) {
    if (!productCard || !product) return;
    
    const featuresList = productCard.querySelector('.product-features');
    if (!featuresList) return;
    
    // إذا لم تكن هناك مميزات من Firebase، لا تفعل شيئاً
    if (!Array.isArray(product.features) || product.features.length === 0) {
        return;
    }
    
    // مسح المميزات الحالية
    featuresList.innerHTML = '';
    
    // ترتيب المميزات حسب order
    const sortedFeatures = [...product.features].sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        return orderA - orderB;
    });
    
    // إضافة كل ميزة (حد أقصى 5)
    const maxFeatures = Math.min(sortedFeatures.length, 5);
    for (let i = 0; i < maxFeatures; i++) {
        const feature = sortedFeatures[i];
        if (feature && feature.text) {
            const translatedFeature = getTranslationWithFallback(feature.text, lang);
            if (translatedFeature && translatedFeature.trim()) {
                const li = document.createElement('li');
                li.textContent = translatedFeature;
                featuresList.appendChild(li);
            }
        }
    }
}

/**
 * تحديث جميع بطاقات المنتجات بالغة المحددة
 * Requirements: 7.4 - عرض المميزات من Firebase بدلاً من الثابتة
 * @param {string} lang - اللغة المطلوبة
 */
function updateAllProductTranslations(lang) {
    currentLanguage = lang || 'ar';
    
    if (loadedProducts.length === 0) {
        console.log('لا توجد منتجات محملة للتحديث');
        return;
    }
    
    let updatedCount = 0;
    let featuresUpdatedCount = 0;
    
    loadedProducts.forEach(product => {
        // البحث عن بطاقة المنتج
        const productCard = findProductCard(product);
        
        if (productCard) {
            updateProductCardTranslations(productCard, product, currentLanguage);
            updatedCount++;
            
            // تتبع المنتجات التي تم تحديث مميزاتها
            if (Array.isArray(product.features) && product.features.length > 0) {
                featuresUpdatedCount++;
            }
        } else {
            console.log(`لم يتم العثور على بطاقة للمنتج: ${product.name?.ar || product.name?.en || product.id}`);
        }
    });
    
    console.log(`تم تحديث ترجمات ${updatedCount} منتج للغة: ${currentLanguage}`);
    if (featuresUpdatedCount > 0) {
        console.log(`تم تحديث مميزات ${featuresUpdatedCount} منتج من Firebase`);
    }
}

/**
 * البحث عن بطاقة المنتج في الصفحة
 * @param {Object} product - بيانات المنتج
 * @returns {HTMLElement|null} عنصر بطاقة المنتج
 */
function findProductCard(product) {
    if (!product) return null;
    
    // البحث بواسطة data-product-id
    let card = document.querySelector(`[data-product-id="${product.id}"]`);
    if (card) {
        return card.closest('.product-card') || card;
    }
    
    // البحث بواسطة اسم المنتج العربي
    if (product.name && product.name.ar) {
        const orderBtn = document.querySelector(`[data-product="${product.name.ar}"]`);
        if (orderBtn) {
            return orderBtn.closest('.product-card');
        }
    }
    
    // البحث بواسطة اسم المنتج الإنجليزي
    if (product.name && product.name.en) {
        const orderBtn = document.querySelector(`[data-product="${product.name.en}"]`);
        if (orderBtn) {
            return orderBtn.closest('.product-card');
        }
        
        // البحث بواسطة اسم المنتج الإنجليزي مع تجاهل الفراغات والحالة
        const normalizedName = product.name.en.toLowerCase().trim();
        const allOrderBtns = document.querySelectorAll('[data-product]');
        for (const btn of allOrderBtns) {
            const btnProduct = btn.getAttribute('data-product');
            if (btnProduct && btnProduct.toLowerCase().trim() === normalizedName) {
                return btn.closest('.product-card');
            }
            // البحث الجزئي - إذا كان اسم المنتج يحتوي على الاسم المطلوب
            if (btnProduct && btnProduct.toLowerCase().includes(normalizedName)) {
                return btn.closest('.product-card');
            }
            // البحث العكسي - إذا كان الاسم المطلوب يحتوي على اسم المنتج
            if (btnProduct && normalizedName.includes(btnProduct.toLowerCase())) {
                return btn.closest('.product-card');
            }
        }
    }
    
    // البحث بواسطة اسم المنتج الفرنسي
    if (product.name && product.name.fr) {
        const orderBtn = document.querySelector(`[data-product="${product.name.fr}"]`);
        if (orderBtn) {
            return orderBtn.closest('.product-card');
        }
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال التهيئة والاستماع للتغييرات - Initialization Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تهيئة نظام ترجمات المنتجات
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @param {string} initialLang - اللغة الابتدائية
 */
async function initProductTranslations(db, firebaseModules, initialLang = 'ar') {
    currentLanguage = initialLang;
    
    // تحميل المنتجات
    await loadProductTranslations(db, firebaseModules);
    
    // تحديث الواجهة
    updateAllProductTranslations(currentLanguage);
    
    // الاستماع لتغييرات اللغة
    setupLanguageChangeListener();
    
    console.log('تم تهيئة نظام ترجمات المنتجات');
}

/**
 * إعداد مستمع تغيير اللغة
 */
function setupLanguageChangeListener() {
    // الاستماع لأزرار تغيير اللغة
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const newLang = btn.getAttribute('data-lang');
            if (newLang && newLang !== currentLanguage) {
                onLanguageChange(newLang);
            }
        });
    });
}

/**
 * معالج تغيير اللغة
 * @param {string} newLang - اللغة الجديدة
 */
function onLanguageChange(newLang) {
    currentLanguage = newLang;
    updateAllProductTranslations(currentLanguage);

    // Update currency symbols
    if (typeof window.updateCurrencySymbols === 'function') {
        window.updateCurrencySymbols(newLang);
    }
}

/**
 * الحصول على اللغة الحالية
 * @returns {string} اللغة الحالية
 */
function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * تعيين اللغة الحالية
 * @param {string} lang - اللغة الجديدة
 */
function setCurrentLanguage(lang) {
    if (lang && typeof lang === 'string') {
        currentLanguage = lang;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال المزامنة الفورية - Real-time Sync Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إعداد مستمع التغييرات الفورية من Firebase
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Function} دالة إلغاء الاشتراك
 */
function setupRealtimeProductListener(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('Firebase غير متاح للمزامنة الفورية');
        return () => {};
    }
    
    try {
        const { collection, onSnapshot, query, where, orderBy } = firebaseModules;
        
        const q = query(
            collection(db, 'products_v2'),
            where('isArchived', '==', false),
            orderBy('displayOrder', 'asc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            loadedProducts = [];
            
            snapshot.forEach((docItem) => {
                loadedProducts.push({
                    id: docItem.id,
                    ...docItem.data()
                });
            });
            
            // تحديث الواجهة
            updateAllProductTranslations(currentLanguage);
            
            console.log('تم تحديث المنتجات من Firebase:', loadedProducts.length);
        }, (error) => {
            console.error('خطأ في الاستماع للتغييرات:', error);
        });
        
        return unsubscribe;
        
    } catch (error) {
        console.error('خطأ في إعداد المستمع:', error);
        return () => {};
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.ProductTranslationsUI = {
        // Load functions
        loadProductTranslations,
        getLoadedProducts,
        
        // Translation functions
        getTranslationWithFallback,
        
        // UI update functions
        updateProductCardTranslations,
        updateProductFeatures,
        rebuildProductFeatures,
        updateAllProductTranslations,
        findProductCard,
        
        // Initialization functions
        initProductTranslations,
        setupLanguageChangeListener,
        onLanguageChange,
        getCurrentLanguage,
        setCurrentLanguage,
        
        // Real-time sync
        setupRealtimeProductListener
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    loadProductTranslations,
    getLoadedProducts,
    getTranslationWithFallback,
    updateProductCardTranslations,
    updateProductFeatures,
    rebuildProductFeatures,
    updateAllProductTranslations,
    findProductCard,
    initProductTranslations,
    setupLanguageChangeListener,
    onLanguageChange,
    getCurrentLanguage,
    setCurrentLanguage,
    setupRealtimeProductListener
};
