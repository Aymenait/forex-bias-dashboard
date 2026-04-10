/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Firebase Products Loader - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * تحميل المنتجات من Firebase وعرضها في الصفحة الرئيسية
 * مع الحفاظ على التوافق مع الكود الحالي
 * 
 * Requirements: 5.1, 9.4
 */

// ═══════════════════════════════════════════════════════════════════════════
// الثوابت - Constants
// ═══════════════════════════════════════════════════════════════════════════

const PRODUCTS_COLLECTION = 'products_v2';

// ═══════════════════════════════════════════════════════════════════════════
// تحميل المنتجات من Firebase
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل المنتجات النشطة من Firebase
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Array>} قائمة المنتجات
 */
async function loadProductsFromFirebase(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('Firebase غير متاح، سيتم استخدام البيانات المحلية');
        return [];
    }

    try {
        const { collection, getDocs, query, where, orderBy } = firebaseModules;

        // تحميل المنتجات غير المؤرشفة مرتبة حسب displayOrder
        const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where('isArchived', '==', false),
            orderBy('displayOrder', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const products = [];

        querySnapshot.forEach((docItem) => {
            products.push({
                id: docItem.id,
                ...docItem.data()
            });
        });

        console.log('✅ تم تحميل', products.length, 'منتج من Firebase');
        return products;

    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// إنشاء HTML لبطاقة المنتج
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء HTML لبطاقة منتج
 * @param {Object} product - بيانات المنتج
 * @param {string} lang - اللغة الحالية
 * @returns {string} HTML بطاقة المنتج
 */
function createProductCardHTML(product, lang = 'ar') {
    const name = product.name?.[lang] || product.name?.ar || 'منتج';
    const description = product.description?.[lang] || product.description?.ar || '';
    // ═══════════════════════════════════════════════════════════════════════════
    // Single Source of Truth - Sync with currency-config.js
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Check for ID match or name match in official PRODUCTS
    let officialProduct = null;
    if (typeof window !== 'undefined' && window.PRODUCTS) {
        if (window.PRODUCTS[product.id]) {
            officialProduct = window.PRODUCTS[product.id];
        } else {
            // Try matching by name (lowercase)
            const entries = Object.entries(window.PRODUCTS);
            const match = entries.find(([key, val]) => 
                (name && name.toLowerCase().includes(key)) || (product.id && product.id.includes(key))
            );
            if (match) officialProduct = match[1];
        }
    }

    if (officialProduct) {
        product.priceDZD = officialProduct.price_dzd;
        product.priceUSD = officialProduct.price_usd;
        if (officialProduct.id) product.id = officialProduct.id;
    }

    // Comprehensive Media Fallbacks (Mapping from index.html)
    const mediaMap = {
        'chatgpt': { url: 'https://i.imgur.com/hEiJhso.gif', type: 'image' },
        'trw': { url: 'https://i.pinimg.com/originals/94/29/77/94297745778a635848f1ea7154238e83.gif', type: 'image' },
        'adobe': { url: 'https://i.pinimg.com/1200x/ac/29/4c/ac294c4a7fb6ec4932b5b435260b53bc.jpg', type: 'image' },
        'gamma': { url: 'https://i.imgur.com/FDZBdd9.gif', type: 'image' },
        'super-grok': { url: 'https://i.pinimg.com/1200x/33/d7/e6/33d7e60098a9677bee53218fbe775b53.jpg', type: 'image' },
        'netflix': { url: 'https://i.pinimg.com/originals/67/9d/aa/679daac8c726277e809c6413a650c547.gif', type: 'image' },
        'canva': { url: 'https://i.pinimg.com/736x/71/8b/41/718b41945aab84bd2276c762266931d0.jpg', type: 'image' },
        'capcut': { url: 'https://i.pinimg.com/1200x/38/e3/08/38e308732b87069ed50893423f09ca4b.jpg', type: 'image' },
        'tradingview': { url: 'https://i.pinimg.com/736x/8c/63/a5/8c63a5c7d9d6e826b281b01dea6bd5da.jpg', type: 'image' },
        'cursor': { url: 'https://i.pinimg.com/736x/29/f9/48/29f9488bd27d42debcfbddb33c1c79d7.jpg', type: 'image' },
        'scispace': { url: 'https://i.pinimg.com/736x/06/b7/27/06b727adf3807349c0bf07bf2fd404a4.jpg', type: 'image' },
        'duolingo': { url: 'https://i.pinimg.com/originals/98/59/12/98591272861e66a02eecf5dae0450c73.gif', type: 'image' },
        'lovable': { url: 'https://i.pinimg.com/1200x/cd/d4/69/cdd469e94eb529ae307f9b5d56e8da96.jpg', type: 'image' },
        'google-ai': { url: 'https://i.pinimg.com/736x/c2/5b/dd/c25bdda8e7d4eb27bcb2f4d411441d92.jpg', type: 'image' },
        'alight-motion': { url: 'https://i.pinimg.com/originals/ad/8b/2c/ad8b2cf5e7b44514ab71b9fd9666ec16.jpg', type: 'image' },
        'perplexity': { url: 'https://i.imgur.com/mEy5oXF.mp4', type: 'video' },
        'microsoft-office': { url: 'https://i.pinimg.com/736x/3c/0d/b2/3c0db24fec715f86cc3e167892f88e2f.jpg', type: 'image' }
    };

    // Apply media fallback if missing in product data
    if (!product.mediaUrl || product.mediaUrl === '' || product.mediaUrl === 'null') {
        const fallback = mediaMap[product.id] || 
                         Object.entries(mediaMap).find(([key]) => name.toLowerCase().includes(key))?.[1];
        
        if (fallback) {
            product.mediaUrl = fallback.url;
            product.mediaType = fallback.type;
        }
    }

    const priceDZD = product.priceDZD || 0;
    const priceUSD = product.priceUSD || 0;
    const mediaUrl = product.mediaUrl || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(name);
    const mediaType = product.mediaType || 'image';
    const availability = product.availability || 'available';
    const features = product.features || [];
    const paymentMethods = product.paymentMethods || { usdt: true, redotpay: true, baridimob: true };
    const landingPage = product.landingPage || '';

    // إنشاء شارة الحالة
    let statusBadge = '';
    let buttonDisabled = '';
    let cardOpacity = '';

    if (availability === 'unavailable') {
        statusBadge = `
            <div class="status-badge unavailable-badge" data-status="unavailable"
                style="position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #e50914, #b20710); color: white; padding: 10px 20px; border-radius: 25px; font-weight: 700; font-size: 0.9rem; z-index: 10; box-shadow: 0 4px 15px rgba(229, 9, 20, 0.5);">
                <span data-i18n="product.unavailable">❌ غير متوفر</span>
            </div>`;
        buttonDisabled = 'disabled style="opacity: 0.5; cursor: not-allowed;"';
    } else if (availability === 'coming_soon') {
        statusBadge = `
            <div class="coming-soon-badge" data-status="coming_soon"
                style="position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; z-index: 10; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.5); animation: pulse 2s infinite;">
                <span data-i18n="product.comingSoon">قريباً</span>
            </div>`;
        buttonDisabled = 'disabled style="opacity: 0.5; cursor: not-allowed;"';
        cardOpacity = 'style="position: relative; opacity: 0.9;"';
    }

    // إنشاء عنصر الوسائط
    let mediaElement = '';
    if (mediaType === 'video') {
        mediaElement = `
            <div class="product-image" style="background: #000; position: relative; overflow: hidden;" role="img" aria-label="${name}">
                <video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;">
                    <source src="${mediaUrl}" type="video/mp4">
                </video>
            </div>`;
    } else {
        mediaElement = `
            <div class="product-image" style="background-image: url('${mediaUrl}');" role="img" aria-label="${name}"></div>`;
    }

    // إنشاء أزرار الدفع
    let paymentButtons = '';
    if (paymentMethods.usdt) {
        paymentButtons += `
            <button class="payment-btn-compact crypto-pay-btn" data-product="${name}" data-price="${priceDZD}" data-price-usd="${priceUSD}" ${buttonDisabled}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h3v2h-3v3h-2v-3H8v-2h3V8h2v3z"/>
                </svg>
                <span>USDT</span>
            </button>`;
    }
    if (paymentMethods.redotpay) {
        paymentButtons += `
            <button class="payment-btn-compact redotpay-btn" data-product="${name}" data-price="${priceDZD}" data-price-usd="${priceUSD}" ${buttonDisabled}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span>RedotPay</span>
            </button>`;
    }
    if (paymentMethods.baridimob) {
        paymentButtons += `
            <button class="payment-btn-compact baridimob-btn" data-product="${name}" data-price="${priceDZD}" data-price-usd="${priceUSD}" ${buttonDisabled}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                <span>BaridiMob</span>
            </button>`;
    }

    // إنشاء قائمة المميزات
    let featuresHTML = '';
    features.forEach((feature, index) => {
        const featureText = feature.text?.[lang] || feature.text?.ar || '';
        if (featureText) {
            featuresHTML += `<li data-i18n="product.${product.id}.feature${index + 1}">${featureText}</li>`;
        }
    });

    // زر اكتشف المزيد
    let discoverBtn = '';
    if (landingPage) {
        discoverBtn = `<a href="${landingPage}" class="discover-btn" data-i18n="product.discoverMore">اكتشف المزيد</a>`;
    }

    // إنشاء البطاقة الكاملة
    return `
        <div class="product-card fade-in" data-product-id="${product.id}" ${cardOpacity}>
            ${statusBadge}
            ${mediaElement}
            <h3>${name}</h3>
            <p class="description" data-i18n="product.${product.id}.desc">${description}</p>
            ${product.id === 'perplexity' ?
            `<div class="price-tag no-currency-update">
                <span data-price-dzd="${priceDZD}" data-price-usd="${priceUSD}">${priceDZD} د.ج</span>
                <span style="font-size: 0.8em; font-weight: normal;">/ <span data-i18n="perMonth">شهر</span></span>
            </div>` :
            `<div class="price-tag" data-price-dzd="${priceDZD}" data-price-usd="${priceUSD}">${priceDZD} د.ج</div>`}
            
            <div class="payment-methods-row">
                ${paymentButtons}
            </div>
            
            <ul class="product-features">
                ${featuresHTML}
            </ul>
            ${discoverBtn}
            <button class="order-btn" data-product="${name}" data-i18n="product.orderNow" onclick="${product.id === 'perplexity' ? 'orderPerplexity()' : `orderProduct('${name}')`}" ${buttonDisabled}>اطلب الآن</button>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض المنتجات في الصفحة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض المنتجات في شبكة المنتجات
 * @param {Array} products - قائمة المنتجات
 * @param {string} lang - اللغة الحالية
 */
function renderProducts(products, lang = 'ar') {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) {
        console.warn('لم يتم العثور على شبكة المنتجات');
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ترتيب المنتجات (وضع ميزات الذكاء الاصطناعي في المقدمة)
    // ═══════════════════════════════════════════════════════════════════════════
    const AI_PRODUCT_IDS = ['chatgpt', 'perplexity', 'google-ai', 'cursor', 'scispace', 'lovable', 'gamma', 'super-grok'];
    
    const sortedProducts = [...products].sort((a, b) => {
        const aName = (a.name?.ar || a.id || '').toLowerCase();
        const bName = (b.name?.ar || b.id || '').toLowerCase();
        
        const isAI_A = AI_PRODUCT_IDS.includes(a.id) || aName.includes('ai') || aName.includes('gemini') || aName.includes('gpt');
        const isAI_B = AI_PRODUCT_IDS.includes(b.id) || bName.includes('ai') || bName.includes('gemini') || bName.includes('gpt');
        
        if (isAI_A && !isAI_B) return -1;
        if (!isAI_A && isAI_B) return 1;
        return 0;
    });

    // مسح المحتوى الحالي
    productGrid.innerHTML = '';

    // إنشاء بطاقات المنتجات
    sortedProducts.forEach(product => {
        const cardHTML = createProductCardHTML(product, lang);
        productGrid.insertAdjacentHTML('beforeend', cardHTML);
    });

    console.log('✅ تم عرض', sortedProducts.length, 'منتج في الصفحة');

    // إعادة تهيئة الأحداث
    reinitializeEventListeners();
}

/**
 * إعادة تهيئة مستمعي الأحداث بعد تحديث DOM
 */
function reinitializeEventListeners() {
    // إعادة تهيئة أزرار الدفع
    if (typeof initPaymentButtons === 'function') {
        initPaymentButtons();
    }

    // إعادة تهيئة مؤشر التمرير
    if (typeof initProductScrollIndicator === 'function') {
        initProductScrollIndicator();
    }

    // تحديث الأسعار حسب العملة الحالية
    if (typeof window !== 'undefined' && window.CurrencyManager) {
        const currentCurrency = window.currentCurrency || 'DZD';
        window.CurrencyManager.updateAllPrices(currentCurrency);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تهيئة تحميل المنتجات من Firebase
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تهيئة تحميل المنتجات من Firebase
 * يتم استدعاؤها عند تحميل الصفحة
 */
async function initFirebaseProducts() {
    // التحقق من توفر Firebase
    if (typeof window === 'undefined') return;

    const db = window.db;
    const firebaseModules = window.firebaseModules;

    if (!db || !firebaseModules) {
        console.log('Firebase غير متاح، سيتم استخدام HTML الثابت');
        return;
    }

    try {
        // تحميل المنتجات
        const products = await loadProductsFromFirebase(db, firebaseModules);

        if (products.length > 0) {
            // عرض المنتجات
            const currentLang = window.currentLang || 'ar';
            renderProducts(products, currentLang);

            // حفظ في التخزين المؤقت
            if (window.SyncManager) {
                window.SyncManager.cacheProducts(products);
            }

            // تهيئة المزامنة الفورية
            if (window.SyncManager) {
                window.SyncManager.initializeListeners(db, firebaseModules);
            }
        } else {
            console.log('لا توجد منتجات في Firebase، سيتم استخدام HTML الثابت');
        }

    } catch (error) {
        console.error('خطأ في تهيئة المنتجات:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.FirebaseProductsLoader = {
        loadProductsFromFirebase,
        createProductCardHTML,
        renderProducts,
        reinitializeEventListeners,
        initFirebaseProducts
    };

    // تهيئة تلقائية عند تحميل الصفحة (اختياري - يمكن تفعيله لاحقاً)
    // document.addEventListener('DOMContentLoaded', initFirebaseProducts);
}

// CommonJS exports للاستخدام في Node.js (للاختبارات)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProductsFromFirebase,
        createProductCardHTML,
        renderProducts,
        reinitializeEventListeners,
        initFirebaseProducts
    };
}
