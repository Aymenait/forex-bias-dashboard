/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Product Controller - Market Algeriaa
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة التحكم بالمنتجات للوحة الأدمن
 * تتضمن دوال تحميل، حفظ، حذف، وتحديث المنتجات
 * 
 * Requirements: 1.1, 1.2, 1.3, 10.4
 */

// ═══════════════════════════════════════════════════════════════════════════
// استيراد الوحدات المطلوبة (للاختبارات)
// ═══════════════════════════════════════════════════════════════════════════

// Import validation module for Node.js environment
let ValidationModule;
let ProductModel;

// Check if we're in Node.js environment
if (typeof window === 'undefined') {
    // Node.js environment - dynamic imports will be handled in tests
    ValidationModule = null;
    ProductModel = null;
} else {
    // Browser environment
    ValidationModule = window.ValidationModule;
    ProductModel = window.ProductModel;
}

// ═══════════════════════════════════════════════════════════════════════════
// اسم الـ Collection في Firebase
// ═══════════════════════════════════════════════════════════════════════════

const PRODUCTS_V2_COLLECTION = 'products_v2';

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحميل المنتجات - Load Products Functions
// Requirements: 1.1
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل جميع المنتجات من Firebase (products_v2 collection)
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules (collection, getDocs, query, orderBy)
 * @returns {Promise<Array>} قائمة المنتجات
 */
async function loadProductsV2(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('Firebase غير متاح');
        return [];
    }

    try {
        const { collection, getDocs, query, orderBy } = firebaseModules;

        // Query products ordered by displayOrder
        const q = query(
            collection(db, PRODUCTS_V2_COLLECTION),
            orderBy('displayOrder', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const products = [];

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            // Use ProductModel to convert from Firebase format if available
            if (ProductModel && typeof ProductModel.productFromFirebase === 'function') {
                products.push(ProductModel.productFromFirebase(docItem.id, data));
            } else {
                products.push({
                    id: docItem.id,
                    ...data
                });
            }
        });

        console.log('تم تحميل', products.length, 'منتج من products_v2');
        return products;

    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        throw error;
    }
}

/**
 * تحميل منتج واحد بواسطة المعرف
 * @param {string} productId - معرف المنتج
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Object|null>} المنتج أو null إذا لم يوجد
 */
async function loadProductById(productId, db, firebaseModules) {
    if (!db || !firebaseModules || !productId) {
        return null;
    }

    try {
        const { doc, getDoc } = firebaseModules;

        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (ProductModel && typeof ProductModel.productFromFirebase === 'function') {
                return ProductModel.productFromFirebase(docSnap.id, data);
            }
            return {
                id: docSnap.id,
                ...data
            };
        }

        return null;

    } catch (error) {
        console.error('خطأ في تحميل المنتج:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال حفظ المنتجات - Save Products Functions
// Requirements: 1.3
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ منتج (إنشاء جديد أو تحديث موجود)
 * @param {Object} product - بيانات المنتج
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<string>} معرف المنتج المحفوظ
 */
async function saveProduct(product, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!product) {
        throw new Error('بيانات المنتج مطلوبة');
    }

    // التحقق من صحة البيانات
    const validation = validateProductData(product);
    if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
    }

    try {
        const { doc, setDoc, serverTimestamp } = firebaseModules;

        // Generate ID if not provided
        const productId = product.id || generateProductId();

        // Prepare product data for Firebase
        const productData = prepareProductForSave(product, serverTimestamp);

        // Save to Firebase
        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        await setDoc(docRef, productData, { merge: true });

        console.log('تم حفظ المنتج:', productId);
        return productId;

    } catch (error) {
        console.error('خطأ في حفظ المنتج:', error);
        throw error;
    }
}

/**
 * تحضير بيانات المنتج للحفظ في Firebase
 * @param {Object} product - بيانات المنتج
 * @param {Function} serverTimestamp - Firebase serverTimestamp function
 * @returns {Object} بيانات المنتج المحضرة
 */
function prepareProductForSave(product, serverTimestamp) {
    const now = serverTimestamp ? serverTimestamp() : new Date();

    return {
        name: product.name || { ar: '', en: '', fr: '' },
        description: product.description || { ar: '', en: '', fr: '' },
        mediaUrl: product.mediaUrl || '',
        mediaType: product.mediaType || 'image',
        priceDZD: Number(product.priceDZD) || 0,
        priceUSD: Number(product.priceUSD) || 0,
        availability: product.availability || 'available',
        features: Array.isArray(product.features) ? product.features : [],
        paymentMethods: product.paymentMethods || { usdt: true, redotpay: true, baridimob: true },
        subOffers: Array.isArray(product.subOffers) ? product.subOffers : [],
        displayOrder: typeof product.displayOrder === 'number' ? product.displayOrder : 0,
        isArchived: Boolean(product.isArchived),
        updatedAt: now,
        // Only set createdAt if it's a new product
        ...(product.createdAt ? {} : { createdAt: now })
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال حذف المنتجات - Delete Products Functions
// Requirements: 10.4
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حذف منتج نهائياً من Firebase
 * يحذف جميع البيانات المرتبطة بالمنتج
 * @param {string} productId - معرف المنتج
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تم الحذف بنجاح
 */
async function deleteProduct(productId, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    try {
        const { doc, deleteDoc } = firebaseModules;

        // Delete the product document
        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        await deleteDoc(docRef);

        console.log('تم حذف المنتج:', productId);
        return true;

    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال الأرشفة والاستعادة - Archive and Restore Functions
// Requirements: 10.2, 10.3
// ═══════════════════════════════════════════════════════════════════════════

/**
 * أرشفة منتج (إخفاؤه من الصفحة الرئيسية مع الحفاظ على البيانات)
 * @param {string} productId - معرف المنتج
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تمت الأرشفة بنجاح
 */
async function archiveProduct(productId, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    try {
        const { doc, updateDoc, serverTimestamp } = firebaseModules;

        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        await updateDoc(docRef, {
            isArchived: true,
            updatedAt: serverTimestamp()
        });

        console.log('تم أرشفة المنتج:', productId);
        return true;

    } catch (error) {
        console.error('خطأ في أرشفة المنتج:', error);
        throw error;
    }
}

/**
 * استعادة منتج مؤرشف (إعادته للظهور في الصفحة الرئيسية)
 * @param {string} productId - معرف المنتج
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تمت الاستعادة بنجاح
 */
async function restoreProduct(productId, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    try {
        const { doc, updateDoc, serverTimestamp } = firebaseModules;

        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        await updateDoc(docRef, {
            isArchived: false,
            updatedAt: serverTimestamp()
        });

        console.log('تم استعادة المنتج:', productId);
        return true;

    } catch (error) {
        console.error('خطأ في استعادة المنتج:', error);
        throw error;
    }
}

/**
 * تحميل المنتجات المؤرشفة فقط
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Array>} قائمة المنتجات المؤرشفة
 */
async function loadArchivedProducts(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('Firebase غير متاح');
        return [];
    }

    try {
        const { collection, getDocs, query, where, orderBy } = firebaseModules;

        // Query archived products
        const q = query(
            collection(db, PRODUCTS_V2_COLLECTION),
            where('isArchived', '==', true),
            orderBy('updatedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const products = [];

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            if (ProductModel && typeof ProductModel.productFromFirebase === 'function') {
                products.push(ProductModel.productFromFirebase(docItem.id, data));
            } else {
                products.push({
                    id: docItem.id,
                    ...data
                });
            }
        });

        console.log('تم تحميل', products.length, 'منتج مؤرشف');
        return products;

    } catch (error) {
        console.error('خطأ في تحميل المنتجات المؤرشفة:', error);
        throw error;
    }
}

/**
 * تحميل المنتجات النشطة فقط (غير المؤرشفة)
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Array>} قائمة المنتجات النشطة
 */
async function loadActiveProducts(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('Firebase غير متاح');
        return [];
    }

    try {
        const { collection, getDocs, query, where, orderBy } = firebaseModules;

        // Query active (non-archived) products
        const q = query(
            collection(db, PRODUCTS_V2_COLLECTION),
            where('isArchived', '==', false),
            orderBy('displayOrder', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const products = [];

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            if (ProductModel && typeof ProductModel.productFromFirebase === 'function') {
                products.push(ProductModel.productFromFirebase(docItem.id, data));
            } else {
                products.push({
                    id: docItem.id,
                    ...data
                });
            }
        });

        console.log('تم تحميل', products.length, 'منتج نشط');
        return products;

    } catch (error) {
        console.error('خطأ في تحميل المنتجات النشطة:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة الأسعار - Price Management Functions
// Requirements: 1.2, 1.3
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث أسعار المنتج
 * @param {string} productId - معرف المنتج
 * @param {number} priceDZD - السعر بالدينار الجزائري
 * @param {number} priceUSD - السعر بالدولار الأمريكي
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تم التحديث بنجاح
 */
async function updatePrices(productId, priceDZD, priceUSD, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    // التحقق من صحة الأسعار
    const priceDZDValidation = validatePriceValue(priceDZD);
    if (!priceDZDValidation.valid) {
        throw new Error('السعر بالدينار غير صالح: ' + priceDZDValidation.errors.join(', '));
    }

    const priceUSDValidation = validatePriceValue(priceUSD);
    if (!priceUSDValidation.valid) {
        throw new Error('السعر بالدولار غير صالح: ' + priceUSDValidation.errors.join(', '));
    }

    try {
        const { doc, updateDoc, serverTimestamp } = firebaseModules;

        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        await updateDoc(docRef, {
            priceDZD: Number(priceDZD),
            priceUSD: Number(priceUSD),
            updatedAt: serverTimestamp()
        });

        console.log('تم تحديث أسعار المنتج:', productId);
        return true;

    } catch (error) {
        console.error('خطأ في تحديث الأسعار:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة حالة التوفر - Availability Management Functions
// Requirements: 2.1, 2.2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحالات المتاحة للتوفر
 * @type {Object}
 */
const AVAILABILITY_STATUSES = {
    AVAILABLE: 'available',      // متوفر
    UNAVAILABLE: 'unavailable',  // غير متوفر
    COMING_SOON: 'coming_soon'   // قريباً
};

/**
 * التحقق من صحة حالة التوفر
 * @param {string} status - حالة التوفر للتحقق منها
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 */
function validateAvailabilityStatus(status) {
    const validStatuses = Object.values(AVAILABILITY_STATUSES);

    if (!status || typeof status !== 'string') {
        return {
            valid: false,
            errors: ['حالة التوفر مطلوبة']
        };
    }

    if (!validStatuses.includes(status)) {
        return {
            valid: false,
            errors: [`حالة التوفر غير صالحة. الحالات المتاحة: ${validStatuses.join(', ')}`]
        };
    }

    return { valid: true, errors: [] };
}

/**
 * تحديث حالة توفر المنتج
 * @param {string} productId - معرف المنتج
 * @param {string} status - حالة التوفر الجديدة (available, unavailable, coming_soon)
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تم التحديث بنجاح
 */
async function updateAvailability(productId, status, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    // التحقق من صحة حالة التوفر
    const statusValidation = validateAvailabilityStatus(status);
    if (!statusValidation.valid) {
        throw new Error(statusValidation.errors.join(', '));
    }

    try {
        const { doc, updateDoc, serverTimestamp } = firebaseModules;

        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        await updateDoc(docRef, {
            availability: status,
            updatedAt: serverTimestamp()
        });

        console.log('تم تحديث حالة توفر المنتج:', productId, '→', status);
        return true;

    } catch (error) {
        console.error('خطأ في تحديث حالة التوفر:', error);
        throw error;
    }
}

/**
 * الحصول على نص حالة التوفر بالعربية
 * @param {string} status - حالة التوفر
 * @returns {string} النص العربي للحالة
 */
function getAvailabilityText(status) {
    const texts = {
        [AVAILABILITY_STATUSES.AVAILABLE]: 'متوفر',
        [AVAILABILITY_STATUSES.UNAVAILABLE]: 'غير متوفر',
        [AVAILABILITY_STATUSES.COMING_SOON]: 'قريباً'
    };
    return texts[status] || 'غير معروف';
}

/**
 * الحصول على نص حالة التوفر بجميع اللغات
 * @param {string} status - حالة التوفر
 * @param {string} lang - اللغة (ar, en, fr)
 * @returns {string} النص بالغة المحددة
 */
function getAvailabilityTextByLang(status, lang = 'ar') {
    const texts = {
        [AVAILABILITY_STATUSES.AVAILABLE]: {
            ar: 'متوفر',
            en: 'Available',
            fr: 'Disponible'
        },
        [AVAILABILITY_STATUSES.UNAVAILABLE]: {
            ar: 'غير متوفر',
            en: 'Unavailable',
            fr: 'Indisponible'
        },
        [AVAILABILITY_STATUSES.COMING_SOON]: {
            ar: 'قريباً',
            en: 'Coming Soon',
            fr: 'Bientôt'
        }
    };

    const statusTexts = texts[status];
    if (!statusTexts) return 'غير معروف';

    return statusTexts[lang] || statusTexts.ar;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال التحقق من الصحة - Validation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من صحة بيانات المنتج
 * @param {Object} product - بيانات المنتج
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 */
function validateProductData(product) {
    const errors = [];

    if (!product) {
        return { valid: false, errors: ['بيانات المنتج مطلوبة'] };
    }

    // Use ValidationModule if available
    if (ValidationModule && typeof ValidationModule.validateProduct === 'function') {
        return ValidationModule.validateProduct(product);
    }

    // Fallback validation
    // Check product name (Arabic required)
    if (!product.name || !product.name.ar || product.name.ar.trim() === '') {
        errors.push('اسم المنتج بالعربية مطلوب');
    }

    // Check prices
    const priceDZDValidation = validatePriceValue(product.priceDZD);
    if (!priceDZDValidation.valid) {
        errors.push('السعر بالدينار غير صالح');
    }

    const priceUSDValidation = validatePriceValue(product.priceUSD);
    if (!priceUSDValidation.valid) {
        errors.push('السعر بالدولار غير صالح');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * التحقق من صحة قيمة السعر
 * @param {*} price - السعر للتحقق منه
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 */
function validatePriceValue(price) {
    // Use ValidationModule if available
    if (ValidationModule && typeof ValidationModule.validatePrice === 'function') {
        return ValidationModule.validatePrice(price);
    }

    // Fallback validation
    const errors = [];

    if (price === null || price === undefined || price === '') {
        errors.push('يرجى إدخال سعر صحيح (رقم موجب)');
        return { valid: false, errors };
    }

    const numPrice = Number(price);

    if (isNaN(numPrice) || numPrice < 0 || !isFinite(numPrice)) {
        errors.push('يرجى إدخال سعر صحيح (رقم موجب)');
        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة العروض الفرعية - Sub-Offer Management Functions
// Requirements: 3.3, 3.6
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من صحة بيانات العرض الفرعي
 * @param {Object} subOffer - بيانات العرض الفرعي
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 */
function validateSubOffer(subOffer) {
    const errors = [];

    if (!subOffer) {
        return { valid: false, errors: ['بيانات العرض الفرعي مطلوبة'] };
    }

    // Check Arabic name (required)
    if (!subOffer.name || !subOffer.name.ar || subOffer.name.ar.trim() === '') {
        errors.push('اسم العرض الفرعي بالعربية مطلوب');
    }

    // Check prices
    const priceDZDValidation = validatePriceValue(subOffer.priceDZD);
    if (!priceDZDValidation.valid) {
        errors.push('السعر بالدينار غير صالح');
    }

    const priceUSDValidation = validatePriceValue(subOffer.priceUSD);
    if (!priceUSDValidation.valid) {
        errors.push('السعر بالدولار غير صالح');
    }

    // Check availability status if provided
    if (subOffer.availability) {
        const statusValidation = validateAvailabilityStatus(subOffer.availability);
        if (!statusValidation.valid) {
            errors.push('حالة التوفر غير صالحة');
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * توليد معرف فريد للعرض الفرعي
 * @returns {string} معرف فريد
 */
function generateSubOfferId() {
    return 'suboffer_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * إضافة عرض فرعي جديد للمنتج
 * @param {string} productId - معرف المنتج
 * @param {Object} subOffer - بيانات العرض الفرعي
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<string>} معرف العرض الفرعي المضاف
 */
async function addSubOffer(productId, subOffer, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    // التحقق من صحة بيانات العرض الفرعي
    const validation = validateSubOffer(subOffer);
    if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
    }

    try {
        const { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } = firebaseModules;

        // Generate ID for the sub-offer
        const subOfferId = subOffer.id || generateSubOfferId();

        // Prepare sub-offer data
        const subOfferData = {
            id: subOfferId,
            name: {
                ar: subOffer.name.ar || '',
                en: subOffer.name.en || '',
                fr: subOffer.name.fr || ''
            },
            priceDZD: Number(subOffer.priceDZD) || 0,
            priceUSD: Number(subOffer.priceUSD) || 0,
            availability: subOffer.availability || AVAILABILITY_STATUSES.AVAILABLE,
            order: typeof subOffer.order === 'number' ? subOffer.order : 0
        };

        // Get current product to append sub-offer
        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('المنتج غير موجود');
        }

        const currentData = docSnap.data();
        const currentSubOffers = Array.isArray(currentData.subOffers) ? currentData.subOffers : [];

        // Set order to be at the end if not specified
        if (typeof subOffer.order !== 'number') {
            subOfferData.order = currentSubOffers.length;
        }

        // Add sub-offer to array
        await updateDoc(docRef, {
            subOffers: [...currentSubOffers, subOfferData],
            updatedAt: serverTimestamp()
        });

        console.log('تم إضافة العرض الفرعي:', subOfferId, 'للمنتج:', productId);
        return subOfferId;

    } catch (error) {
        console.error('خطأ في إضافة العرض الفرعي:', error);
        throw error;
    }
}

/**
 * تحديث عرض فرعي موجود
 * @param {string} productId - معرف المنتج
 * @param {string} subOfferId - معرف العرض الفرعي
 * @param {Object} subOffer - بيانات العرض الفرعي المحدثة
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تم التحديث بنجاح
 */
async function updateSubOffer(productId, subOfferId, subOffer, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    if (!subOfferId) {
        throw new Error('معرف العرض الفرعي مطلوب');
    }

    // التحقق من صحة بيانات العرض الفرعي
    const validation = validateSubOffer(subOffer);
    if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
    }

    try {
        const { doc, getDoc, updateDoc, serverTimestamp } = firebaseModules;

        // Get current product
        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('المنتج غير موجود');
        }

        const currentData = docSnap.data();
        const currentSubOffers = Array.isArray(currentData.subOffers) ? currentData.subOffers : [];

        // Find and update the sub-offer
        const subOfferIndex = currentSubOffers.findIndex(s => s.id === subOfferId);
        if (subOfferIndex === -1) {
            throw new Error('العرض الفرعي غير موجود');
        }

        // Update sub-offer data
        const updatedSubOffer = {
            id: subOfferId,
            name: {
                ar: subOffer.name?.ar || currentSubOffers[subOfferIndex].name?.ar || '',
                en: subOffer.name?.en || currentSubOffers[subOfferIndex].name?.en || '',
                fr: subOffer.name?.fr || currentSubOffers[subOfferIndex].name?.fr || ''
            },
            priceDZD: Number(subOffer.priceDZD) || 0,
            priceUSD: Number(subOffer.priceUSD) || 0,
            availability: subOffer.availability || currentSubOffers[subOfferIndex].availability || AVAILABILITY_STATUSES.AVAILABLE,
            order: typeof subOffer.order === 'number' ? subOffer.order : currentSubOffers[subOfferIndex].order || 0
        };

        // Replace the sub-offer in the array
        currentSubOffers[subOfferIndex] = updatedSubOffer;

        // Update product
        await updateDoc(docRef, {
            subOffers: currentSubOffers,
            updatedAt: serverTimestamp()
        });

        console.log('تم تحديث العرض الفرعي:', subOfferId, 'للمنتج:', productId);
        return true;

    } catch (error) {
        console.error('خطأ في تحديث العرض الفرعي:', error);
        throw error;
    }
}

/**
 * حذف عرض فرعي من المنتج
 * @param {string} productId - معرف المنتج
 * @param {string} subOfferId - معرف العرض الفرعي
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا تم الحذف بنجاح
 */
async function deleteSubOffer(productId, subOfferId, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    if (!productId) {
        throw new Error('معرف المنتج مطلوب');
    }

    if (!subOfferId) {
        throw new Error('معرف العرض الفرعي مطلوب');
    }

    try {
        const { doc, getDoc, updateDoc, serverTimestamp } = firebaseModules;

        // Get current product
        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('المنتج غير موجود');
        }

        const currentData = docSnap.data();
        const currentSubOffers = Array.isArray(currentData.subOffers) ? currentData.subOffers : [];

        // Filter out the sub-offer to delete
        const updatedSubOffers = currentSubOffers.filter(s => s.id !== subOfferId);

        // Check if sub-offer was found
        if (updatedSubOffers.length === currentSubOffers.length) {
            throw new Error('العرض الفرعي غير موجود');
        }

        // Update product
        await updateDoc(docRef, {
            subOffers: updatedSubOffers,
            updatedAt: serverTimestamp()
        });

        console.log('تم حذف العرض الفرعي:', subOfferId, 'من المنتج:', productId);
        return true;

    } catch (error) {
        console.error('خطأ في حذف العرض الفرعي:', error);
        throw error;
    }
}

/**
 * الحصول على العروض الفرعية لمنتج معين
 * @param {string} productId - معرف المنتج
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Array>} قائمة العروض الفرعية
 */
async function getSubOffers(productId, db, firebaseModules) {
    if (!db || !firebaseModules || !productId) {
        return [];
    }

    try {
        const { doc, getDoc } = firebaseModules;

        const docRef = doc(db, PRODUCTS_V2_COLLECTION, productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return [];
        }

        const data = docSnap.data();
        return Array.isArray(data.subOffers) ? data.subOffers : [];

    } catch (error) {
        console.error('خطأ في تحميل العروض الفرعية:', error);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة - Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * توليد معرف فريد للمنتج
 * @returns {string} معرف فريد
 */
function generateProductId() {
    return 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.ProductController = {
        PRODUCTS_V2_COLLECTION,
        AVAILABILITY_STATUSES,
        loadProductsV2,
        loadProductById,
        saveProduct,
        deleteProduct,
        updatePrices,
        updateAvailability,
        validateProductData,
        validatePriceValue,
        validateAvailabilityStatus,
        generateProductId,
        prepareProductForSave,
        getAvailabilityText,
        getAvailabilityTextByLang,
        // Sub-offer functions
        validateSubOffer,
        generateSubOfferId,
        addSubOffer,
        updateSubOffer,
        deleteSubOffer,
        getSubOffers,
        // Archive functions
        archiveProduct,
        restoreProduct,
        loadArchivedProducts,
        loadActiveProducts
    };
}

/*
// ES Module exports للاستخدام في Node.js (للاختبارات)
// export {
//     PRODUCTS_V2_COLLECTION,
//     AVAILABILITY_STATUSES,
//     loadProductsV2,
//     loadProductById,
//     saveProduct,
//     deleteProduct,
//     updatePrices,
//     updateAvailability,
//     validateProductData,
//     validatePriceValue,
//     validateAvailabilityStatus,
//     generateProductId,
//     prepareProductForSave,
//     getAvailabilityText,
//     getAvailabilityTextByLang,
//     // Sub-offer functions
//     validateSubOffer,
//     generateSubOfferId,
//     addSubOffer,
//     updateSubOffer,
//     deleteSubOffer,
//     getSubOffers,
//     // Archive functions
//     archiveProduct,
//     restoreProduct,
//     loadArchivedProducts,
//     loadActiveProducts
// };
*/
