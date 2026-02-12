/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sync Manager - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة المزامنة الفورية مع Firebase
 * تتضمن real-time listeners وإدارة حالة الاتصال
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

// ═══════════════════════════════════════════════════════════════════════════
// الثوابت - Constants
// ═══════════════════════════════════════════════════════════════════════════

const PRODUCTS_V2_COLLECTION = 'products_v2';
const CACHE_KEY = 'products_v2_cache';
const CACHE_TIMESTAMP_KEY = 'products_v2_cache_timestamp';
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds
const BATCH_UPDATE_DELAY = 100; // ms to wait before processing batched updates

// ═══════════════════════════════════════════════════════════════════════════
// المتغيرات العامة - Global Variables
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حالة الاتصال الحالية
 * @type {boolean}
 */
let isConnected = true;

/**
 * قائمة المستمعين لتغييرات الاتصال
 * @type {Array<Function>}
 */
let connectionListeners = [];

/**
 * قائمة المستمعين لتغييرات المنتجات
 * @type {Array<Function>}
 */
let productChangeListeners = [];

/**
 * دالة إلغاء الاشتراك في Firebase
 * @type {Function|null}
 */
let unsubscribeProducts = null;

/**
 * التحديثات المعلقة للـ batching
 * @type {Array}
 */
let pendingUpdates = [];

/**
 * مؤقت الـ batch
 * @type {number|null}
 */
let batchTimer = null;

/**
 * عنصر تحذير الاتصال
 * @type {HTMLElement|null}
 */
let connectionWarningElement = null;


// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة الاتصال - Connection Management Functions
// Requirements: 5.4, 5.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من حالة الاتصال
 * @returns {boolean} حالة الاتصال
 */
function getConnectionStatus() {
    return isConnected;
}

/**
 * تعيين حالة الاتصال
 * @param {boolean} connected - حالة الاتصال الجديدة
 */
function setConnectionStatus(connected) {
    const wasConnected = isConnected;
    isConnected = connected;
    
    // إشعار المستمعين إذا تغيرت الحالة
    if (wasConnected !== connected) {
        notifyConnectionListeners(connected);
        
        if (connected) {
            console.log('✅ تم استعادة الاتصال بـ Firebase');
            hideConnectionWarning();
            // مزامنة التغييرات المعلقة
            syncPendingChanges();
        } else {
            console.warn('⚠️ فقدان الاتصال بـ Firebase');
            showConnectionWarning();
        }
    }
}

/**
 * الاشتراك في تغييرات حالة الاتصال
 * @param {Function} callback - دالة الاستدعاء عند تغيير الحالة
 * @returns {Function} دالة إلغاء الاشتراك
 */
function onConnectionChange(callback) {
    if (typeof callback === 'function') {
        connectionListeners.push(callback);
        
        // إرسال الحالة الحالية فوراً
        callback(isConnected);
        
        // إرجاع دالة إلغاء الاشتراك
        return () => {
            const index = connectionListeners.indexOf(callback);
            if (index > -1) {
                connectionListeners.splice(index, 1);
            }
        };
    }
    return () => {};
}

/**
 * إشعار جميع المستمعين بتغيير حالة الاتصال
 * @param {boolean} connected - حالة الاتصال
 */
function notifyConnectionListeners(connected) {
    connectionListeners.forEach(listener => {
        try {
            listener(connected);
        } catch (error) {
            console.error('خطأ في مستمع الاتصال:', error);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال عرض تحذير الاتصال - Connection Warning UI Functions
// Requirements: 5.4
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء عنصر تحذير الاتصال
 * @returns {HTMLElement} عنصر التحذير
 */
function createConnectionWarningElement() {
    const warning = document.createElement('div');
    warning.id = 'connection-warning';
    warning.className = 'connection-warning';
    warning.innerHTML = `
        <div class="connection-warning-content">
            <span class="connection-warning-icon">⚠️</span>
            <span class="connection-warning-text" data-lang="ar">فقدان الاتصال - البيانات محفوظة محلياً</span>
            <span class="connection-warning-text" data-lang="en" style="display:none;">Connection lost - Data saved locally</span>
            <span class="connection-warning-text" data-lang="fr" style="display:none;">Connexion perdue - Données sauvegardées localement</span>
        </div>
    `;
    
    // إضافة الأنماط
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-weight: 600;
        z-index: 10000;
        display: none;
        animation: slideDown 0.3s ease-out;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    // إضافة الأنيميشن
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
        }
        @keyframes slideUp {
            from { transform: translateY(0); }
            to { transform: translateY(-100%); }
        }
        .connection-warning-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .connection-warning-icon {
            font-size: 1.2rem;
        }
    `;
    
    if (!document.querySelector('#connection-warning-styles')) {
        style.id = 'connection-warning-styles';
        document.head.appendChild(style);
    }
    
    return warning;
}

/**
 * عرض تحذير فقدان الاتصال
 */
function showConnectionWarning() {
    if (typeof document === 'undefined') return;
    
    if (!connectionWarningElement) {
        connectionWarningElement = createConnectionWarningElement();
        document.body.appendChild(connectionWarningElement);
    }
    
    // تحديث النص حسب اللغة الحالية
    const currentLang = (typeof window !== 'undefined' && window.currentLang) || 'ar';
    const texts = connectionWarningElement.querySelectorAll('.connection-warning-text');
    texts.forEach(text => {
        text.style.display = text.getAttribute('data-lang') === currentLang ? 'inline' : 'none';
    });
    
    connectionWarningElement.style.display = 'block';
    connectionWarningElement.style.animation = 'slideDown 0.3s ease-out';
}

/**
 * إخفاء تحذير فقدان الاتصال
 */
function hideConnectionWarning() {
    if (connectionWarningElement) {
        connectionWarningElement.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            if (connectionWarningElement) {
                connectionWarningElement.style.display = 'none';
            }
        }, 300);
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// دوال التخزين المؤقت - Cache Functions
// Requirements: 5.4, 5.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ المنتجات في التخزين المحلي
 * @param {Array} products - قائمة المنتجات
 */
function cacheProducts(products) {
    if (typeof localStorage === 'undefined') return;
    
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('💾 تم حفظ', products.length, 'منتج في التخزين المؤقت');
    } catch (error) {
        console.warn('⚠️ فشل حفظ المنتجات في التخزين المؤقت:', error.message);
    }
}

/**
 * استرجاع المنتجات من التخزين المحلي
 * @returns {Array} قائمة المنتجات المخزنة مؤقتاً
 */
function getCachedProducts() {
    if (typeof localStorage === 'undefined') return [];
    
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const products = JSON.parse(cached);
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            console.log('📦 تم استرجاع', products.length, 'منتج من التخزين المؤقت');
            if (timestamp) {
                const age = Date.now() - parseInt(timestamp);
                console.log('⏱️ عمر البيانات المخزنة:', Math.round(age / 1000), 'ثانية');
            }
            return products;
        }
    } catch (error) {
        console.warn('⚠️ فشل استرجاع المنتجات من التخزين المؤقت:', error.message);
    }
    
    return [];
}

/**
 * مسح التخزين المؤقت
 */
function clearCache() {
    if (typeof localStorage === 'undefined') return;
    
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        console.log('🗑️ تم مسح التخزين المؤقت');
    } catch (error) {
        console.warn('⚠️ فشل مسح التخزين المؤقت:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال Real-time Listeners - Firebase Real-time Functions
// Requirements: 5.1, 5.2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تهيئة مستمعي Firebase Real-time
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Function} دالة إلغاء الاشتراك
 */
function initializeListeners(db, firebaseModules) {
    if (!db || !firebaseModules) {
        console.warn('⚠️ Firebase غير متاح لتهيئة المستمعين');
        setConnectionStatus(false);
        return () => {};
    }
    
    // إلغاء الاشتراك السابق إذا وجد
    if (unsubscribeProducts) {
        unsubscribeProducts();
    }
    
    try {
        const { collection, onSnapshot, query, where, orderBy } = firebaseModules;
        
        // إنشاء استعلام للمنتجات غير المؤرشفة
        const q = query(
            collection(db, PRODUCTS_V2_COLLECTION),
            where('isArchived', '==', false),
            orderBy('displayOrder', 'asc')
        );
        
        // إعداد المستمع
        unsubscribeProducts = onSnapshot(q, 
            (snapshot) => {
                // الاتصال ناجح
                setConnectionStatus(true);
                
                const products = [];
                const changes = [];
                
                snapshot.forEach((docItem) => {
                    products.push({
                        id: docItem.id,
                        ...docItem.data()
                    });
                });
                
                // تتبع التغييرات
                snapshot.docChanges().forEach((change) => {
                    changes.push({
                        type: change.type, // 'added', 'modified', 'removed'
                        product: {
                            id: change.doc.id,
                            ...change.doc.data()
                        }
                    });
                });
                
                // حفظ في التخزين المؤقت
                cacheProducts(products);
                
                // معالجة التغييرات بالـ batching
                if (changes.length > 0) {
                    queueUpdates(changes);
                }
                
                console.log('🔄 تم استلام تحديث من Firebase:', products.length, 'منتج');
            },
            (error) => {
                console.error('❌ خطأ في مستمع Firebase:', error);
                setConnectionStatus(false);
            }
        );
        
        console.log('✅ تم تهيئة مستمعي Firebase Real-time');
        return unsubscribeProducts;
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة المستمعين:', error);
        setConnectionStatus(false);
        return () => {};
    }
}

/**
 * إيقاف جميع المستمعين
 */
function stopListeners() {
    if (unsubscribeProducts) {
        unsubscribeProducts();
        unsubscribeProducts = null;
        console.log('🛑 تم إيقاف مستمعي Firebase');
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// دوال Batch Updates - تجميع التحديثات
// Requirements: 5.3
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة تحديثات للقائمة المعلقة
 * @param {Array} updates - قائمة التحديثات
 */
function queueUpdates(updates) {
    pendingUpdates.push(...updates);
    
    // إلغاء المؤقت السابق
    if (batchTimer) {
        clearTimeout(batchTimer);
    }
    
    // إعداد مؤقت جديد لمعالجة التحديثات
    batchTimer = setTimeout(() => {
        processBatchedUpdates();
    }, BATCH_UPDATE_DELAY);
}

/**
 * معالجة التحديثات المجمعة
 */
function processBatchedUpdates() {
    if (pendingUpdates.length === 0) return;
    
    const updates = [...pendingUpdates];
    pendingUpdates = [];
    batchTimer = null;
    
    console.log('📦 معالجة', updates.length, 'تحديث مجمع');
    
    // إشعار المستمعين بالتغييرات
    updates.forEach(update => {
        notifyProductChangeListeners(update.product, update.type);
    });
    
    // تحديث الصفحة الرئيسية
    updateMainPage(updates);
}

/**
 * الاشتراك في تغييرات المنتجات
 * @param {Function} callback - دالة الاستدعاء عند تغيير منتج
 * @returns {Function} دالة إلغاء الاشتراك
 */
function onProductChange(callback) {
    if (typeof callback === 'function') {
        productChangeListeners.push(callback);
        
        // إرجاع دالة إلغاء الاشتراك
        return () => {
            const index = productChangeListeners.indexOf(callback);
            if (index > -1) {
                productChangeListeners.splice(index, 1);
            }
        };
    }
    return () => {};
}

/**
 * إشعار جميع المستمعين بتغيير منتج
 * @param {Object} product - المنتج المتغير
 * @param {string} changeType - نوع التغيير (added, modified, removed)
 */
function notifyProductChangeListeners(product, changeType) {
    productChangeListeners.forEach(listener => {
        try {
            listener(product, changeType);
        } catch (error) {
            console.error('خطأ في مستمع تغيير المنتج:', error);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث الصفحة الرئيسية - Main Page Update Functions
// Requirements: 5.2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث الصفحة الرئيسية بالتغييرات
 * @param {Array} updates - قائمة التحديثات
 */
function updateMainPage(updates) {
    if (typeof document === 'undefined') return;
    
    updates.forEach(update => {
        const { product, type } = update;
        
        switch (type) {
            case 'added':
                // منتج جديد - قد يحتاج إضافة بطاقة جديدة
                console.log('➕ منتج جديد:', product.name?.ar || product.id);
                updateProductCard(product);
                break;
                
            case 'modified':
                // تحديث منتج موجود
                console.log('✏️ تحديث منتج:', product.name?.ar || product.id);
                updateProductCard(product);
                break;
                
            case 'removed':
                // حذف منتج
                console.log('🗑️ حذف منتج:', product.name?.ar || product.id);
                removeProductCard(product);
                break;
        }
    });
}

/**
 * تحديث بطاقة منتج في الصفحة
 * @param {Object} product - بيانات المنتج
 */
function updateProductCard(product) {
    if (!product) return;
    
    // البحث عن بطاقة المنتج
    const card = findProductCard(product);
    
    if (!card) {
        console.log('⚠️ لم يتم العثور على بطاقة للمنتج:', product.name?.ar || product.id);
        return;
    }
    
    const currentLang = (typeof window !== 'undefined' && window.currentLang) || 'ar';
    
    // تحديث حالة التوفر
    updateAvailabilityUI(card, product, currentLang);
    
    // تحديث الأسعار
    updatePricesUI(card, product);
    
    // تحديث طرق الدفع
    updatePaymentMethodsUI(card, product);
    
    // تحديث الترجمات إذا كان ProductTranslationsUI متاحاً
    if (typeof window !== 'undefined' && window.ProductTranslationsUI) {
        window.ProductTranslationsUI.updateProductCardTranslations(card, product, currentLang);
    }
    
    console.log('✅ تم تحديث بطاقة المنتج:', product.name?.ar || product.id);
}

/**
 * البحث عن بطاقة المنتج في الصفحة
 * @param {Object} product - بيانات المنتج
 * @returns {HTMLElement|null} عنصر بطاقة المنتج
 */
function findProductCard(product) {
    if (!product || typeof document === 'undefined') return null;
    
    // استخدام ProductTranslationsUI إذا كان متاحاً
    if (typeof window !== 'undefined' && window.ProductTranslationsUI) {
        return window.ProductTranslationsUI.findProductCard(product);
    }
    
    // البحث بواسطة data-product-id
    let card = document.querySelector(`[data-product-id="${product.id}"]`);
    if (card) {
        return card.closest('.product-card') || card;
    }
    
    // البحث بواسطة اسم المنتج
    const names = [product.name?.ar, product.name?.en, product.name?.fr].filter(Boolean);
    for (const name of names) {
        const orderBtn = document.querySelector(`[data-product="${name}"]`);
        if (orderBtn) {
            return orderBtn.closest('.product-card');
        }
    }
    
    return null;
}

/**
 * إزالة بطاقة منتج من الصفحة
 * @param {Object} product - بيانات المنتج
 */
function removeProductCard(product) {
    const card = findProductCard(product);
    if (card) {
        card.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            card.remove();
        }, 300);
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث واجهة المنتج - Product UI Update Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث واجهة حالة التوفر
 * @param {HTMLElement} card - عنصر بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 * @param {string} lang - اللغة الحالية
 */
function updateAvailabilityUI(card, product, lang) {
    if (!card || !product) return;
    
    // استخدام AvailabilityUI إذا كان متاحاً
    if (typeof window !== 'undefined' && window.AvailabilityUI) {
        window.AvailabilityUI.updateProductAvailabilityUI(card, product.availability, lang);
        return;
    }
    
    // Fallback implementation
    const status = product.availability || 'available';
    
    // إزالة الشارات الموجودة
    const existingBadges = card.querySelectorAll('.status-badge, .coming-soon-badge, .unavailable-badge');
    existingBadges.forEach(badge => badge.remove());
    
    // الحصول على زر الطلب وأزرار الدفع
    const orderBtn = card.querySelector('.order-btn');
    const paymentBtns = card.querySelectorAll('.payment-btn-compact');
    
    if (status === 'available') {
        // تفعيل الأزرار
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.style.opacity = '1';
            orderBtn.style.cursor = 'pointer';
        }
        paymentBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    } else {
        // تعطيل الأزرار وإضافة شارة
        const statusTexts = {
            unavailable: {
                ar: '❌ غير متوفر حالياً',
                en: '❌ Currently Unavailable',
                fr: '❌ Actuellement Indisponible'
            },
            coming_soon: {
                ar: '🔜 قريباً',
                en: '🔜 Coming Soon',
                fr: '🔜 Bientôt'
            }
        };
        
        const badgeText = statusTexts[status]?.[lang] || statusTexts[status]?.ar || status;
        const badgeColor = status === 'unavailable' 
            ? 'linear-gradient(135deg, #e50914, #b20710)' 
            : 'linear-gradient(135deg, #f59e0b, #d97706)';
        
        // إضافة شارة
        const badge = document.createElement('div');
        badge.className = 'status-badge';
        badge.setAttribute('data-status', status);
        badge.textContent = badgeText;
        badge.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: ${badgeColor};
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 0.9rem;
            z-index: 10;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        card.style.position = 'relative';
        card.insertBefore(badge, card.firstChild);
        
        // تعطيل الأزرار
        if (orderBtn) {
            orderBtn.disabled = true;
            orderBtn.style.opacity = '0.5';
            orderBtn.style.cursor = 'not-allowed';
        }
        paymentBtns.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    }
}

/**
 * تحديث واجهة الأسعار
 * @param {HTMLElement} card - عنصر بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 */
function updatePricesUI(card, product) {
    if (!card || !product) return;
    
    const currentCurrency = (typeof window !== 'undefined' && window.currentCurrency) || 'DZD';
    
    // تحديث عناصر السعر
    const priceElements = card.querySelectorAll('.price-tag, [data-price-dzd]');
    priceElements.forEach(el => {
        if (el.hasAttribute('data-price-dzd')) {
            el.setAttribute('data-price-dzd', product.priceDZD || 0);
            el.setAttribute('data-price-usd', product.priceUSD || 0);
            
            // تحديث النص المعروض
            if (currentCurrency === 'USD') {
                el.textContent = `${product.priceUSD || 0} $`;
            } else {
                el.textContent = `${product.priceDZD || 0} د.ج`;
            }
        }
    });
    
    // تحديث أزرار الدفع
    const paymentBtns = card.querySelectorAll('.crypto-pay-btn, .redotpay-btn, .baridimob-btn');
    paymentBtns.forEach(btn => {
        btn.setAttribute('data-price', product.priceDZD || 0);
        btn.setAttribute('data-price-usd', product.priceUSD || 0);
    });
}

/**
 * تحديث واجهة طرق الدفع
 * @param {HTMLElement} card - عنصر بطاقة المنتج
 * @param {Object} product - بيانات المنتج
 */
function updatePaymentMethodsUI(card, product) {
    if (!card || !product || !product.paymentMethods) return;
    
    // استخدام PaymentUI إذا كان متاحاً
    if (typeof window !== 'undefined' && window.PaymentUI) {
        window.PaymentUI.updatePaymentButtonsVisibility(card, product.paymentMethods);
        return;
    }
    
    // Fallback implementation
    const methods = product.paymentMethods;
    
    // USDT button
    const usdtBtn = card.querySelector('.crypto-pay-btn');
    if (usdtBtn) {
        usdtBtn.style.display = methods.usdt ? '' : 'none';
    }
    
    // RedotPay button
    const redotpayBtn = card.querySelector('.redotpay-btn');
    if (redotpayBtn) {
        redotpayBtn.style.display = methods.redotpay ? '' : 'none';
    }
    
    // BaridiMob button
    const baridimobBtn = card.querySelector('.baridimob-btn');
    if (baridimobBtn) {
        baridimobBtn.style.display = methods.baridimob ? '' : 'none';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مزامنة التغييرات المعلقة - Pending Changes Sync Functions
// Requirements: 5.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * مزامنة التغييرات المعلقة عند استعادة الاتصال
 */
async function syncPendingChanges() {
    console.log('🔄 جاري مزامنة التغييرات المعلقة...');
    
    // في هذه الحالة، Firebase يتولى المزامنة تلقائياً
    // لكن يمكننا إعادة تحميل البيانات للتأكد
    
    if (typeof window !== 'undefined' && window.db && window.firebaseModules) {
        try {
            const { collection, getDocs, query, where, orderBy } = window.firebaseModules;
            
            const q = query(
                collection(window.db, PRODUCTS_V2_COLLECTION),
                where('isArchived', '==', false),
                orderBy('displayOrder', 'asc')
            );
            
            const snapshot = await getDocs(q);
            const products = [];
            
            snapshot.forEach((docItem) => {
                products.push({
                    id: docItem.id,
                    ...docItem.data()
                });
            });
            
            // تحديث التخزين المؤقت
            cacheProducts(products);
            
            // تحديث الصفحة
            products.forEach(product => {
                updateProductCard(product);
            });
            
            console.log('✅ تم مزامنة', products.length, 'منتج');
            
        } catch (error) {
            console.error('❌ خطأ في مزامنة التغييرات:', error);
        }
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// دوال التهيئة الرئيسية - Main Initialization Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تهيئة نظام المزامنة الكامل
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Object} كائن SyncManager مع دوال التحكم
 */
function initSyncManager(db, firebaseModules) {
    console.log('🚀 جاري تهيئة نظام المزامنة...');
    
    // تهيئة المستمعين
    const unsubscribe = initializeListeners(db, firebaseModules);
    
    // إعداد مراقبة الاتصال بالإنترنت
    setupNetworkMonitoring();
    
    // تحميل البيانات المخزنة مؤقتاً كـ fallback
    const cachedProducts = getCachedProducts();
    if (cachedProducts.length > 0 && !isConnected) {
        console.log('📦 استخدام البيانات المخزنة مؤقتاً');
        cachedProducts.forEach(product => {
            updateProductCard(product);
        });
    }
    
    console.log('✅ تم تهيئة نظام المزامنة بنجاح');
    
    return {
        // Connection management
        getConnectionStatus,
        onConnectionChange,
        
        // Product change listeners
        onProductChange,
        
        // Cache management
        getCachedProducts,
        clearCache,
        
        // Sync control
        syncPendingChanges,
        stopListeners: () => {
            stopListeners();
            stopNetworkMonitoring();
        },
        
        // Manual refresh
        refresh: () => syncPendingChanges()
    };
}

/**
 * مراقب حالة الشبكة
 * @type {number|null}
 */
let networkCheckInterval = null;

/**
 * إعداد مراقبة الاتصال بالإنترنت
 */
function setupNetworkMonitoring() {
    if (typeof window === 'undefined') return;
    
    // الاستماع لأحداث الاتصال/قطع الاتصال
    window.addEventListener('online', () => {
        console.log('🌐 الاتصال بالإنترنت متاح');
        setConnectionStatus(true);
    });
    
    window.addEventListener('offline', () => {
        console.log('📴 الاتصال بالإنترنت مقطوع');
        setConnectionStatus(false);
    });
    
    // فحص دوري للاتصال
    networkCheckInterval = setInterval(() => {
        if (typeof navigator !== 'undefined') {
            const wasConnected = isConnected;
            const nowOnline = navigator.onLine;
            
            if (wasConnected && !nowOnline) {
                setConnectionStatus(false);
            }
        }
    }, CONNECTION_CHECK_INTERVAL);
}

/**
 * إيقاف مراقبة الشبكة
 */
function stopNetworkMonitoring() {
    if (networkCheckInterval) {
        clearInterval(networkCheckInterval);
        networkCheckInterval = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.SyncManager = {
        // Main initialization
        initSyncManager,
        initializeListeners,
        stopListeners,
        
        // Connection management
        getConnectionStatus,
        setConnectionStatus,
        onConnectionChange,
        showConnectionWarning,
        hideConnectionWarning,
        
        // Product change listeners
        onProductChange,
        
        // Cache management
        cacheProducts,
        getCachedProducts,
        clearCache,
        
        // Sync functions
        syncPendingChanges,
        queueUpdates,
        
        // UI update functions
        updateMainPage,
        updateProductCard,
        findProductCard,
        removeProductCard,
        updateAvailabilityUI,
        updatePricesUI,
        updatePaymentMethodsUI,
        
        // Network monitoring
        setupNetworkMonitoring,
        stopNetworkMonitoring,
        
        // Constants
        PRODUCTS_V2_COLLECTION,
        CACHE_KEY
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    // Main initialization
    initSyncManager,
    initializeListeners,
    stopListeners,
    
    // Connection management
    getConnectionStatus,
    setConnectionStatus,
    onConnectionChange,
    showConnectionWarning,
    hideConnectionWarning,
    
    // Product change listeners
    onProductChange,
    
    // Cache management
    cacheProducts,
    getCachedProducts,
    clearCache,
    
    // Sync functions
    syncPendingChanges,
    queueUpdates,
    
    // UI update functions
    updateMainPage,
    updateProductCard,
    findProductCard,
    removeProductCard,
    updateAvailabilityUI,
    updatePricesUI,
    updatePaymentMethodsUI,
    
    // Network monitoring
    setupNetworkMonitoring,
    stopNetworkMonitoring,
    
    // Constants
    PRODUCTS_V2_COLLECTION,
    CACHE_KEY
};
