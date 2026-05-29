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
const HOMEPAGE_PRODUCT_DEBUG = true;
let productsUnsubscribe = null;

function homepageProductDebug(label, payload) {
    if (!HOMEPAGE_PRODUCT_DEBUG) return;
    if (payload === undefined) {
        console.log(`[homepage-products] ${label}`);
        return;
    }
    console.log(`[homepage-products] ${label}`, payload);
}

function getProductDisplayNameForSort(product) {
    return getLocalizedText(product?.name, 'en', product?.id || '');
}
const DEFAULT_LANDING_PAGES = {
    trw: 'trw_landing.html',
    chatgpt: 'chatgpt_landing.html',
    claude: 'claude_landing.html',
    adobe: 'adobe_landing.html',
    gamma: 'gamma_landing.html',
    netflix: 'netflix_landing.html',
    tradingview: 'tradingview_landing.html',
    perplexity: 'perplexity_landing.html',
    canva: 'canva_landing.html',
    capcut: 'capcut_landing.html',
    'google-ai': 'google_ai_landing.html',
    duolingo: 'duolingo_landing.html'
};

function getLocalizedText(value, lang = 'ar', fallback = '') {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    return value[lang] || value.ar || value.en || value.fr || fallback;
}

function getNumericValue(source, keys, fallback = 0) {
    for (const key of keys) {
        const value = Number(source?.[key]);
        if (Number.isFinite(value) && value > 0) return value;
    }
    return fallback;
}

function getUiText(key, lang = 'ar') {
    const texts = {
        orderNow: { ar: 'اطلب الآن', en: 'Order Now', fr: 'Commander' },
        productDetails: { ar: 'تفاصيل المنتج', en: 'Product Details', fr: 'Details du produit' },
        discoverMore: { ar: 'اكتشف المزيد', en: 'Discover More', fr: 'Decouvrir plus' },
        unavailable: { ar: 'غير متوفر', en: 'Unavailable', fr: 'Indisponible' },
        unavailableIcon: { ar: '❌ غير متوفر', en: '❌ Unavailable', fr: '❌ Indisponible' },
        comingSoon: { ar: 'قريباً', en: 'Coming Soon', fr: 'Bientot' },
        deliveryLabel: { ar: 'مدة التوصيل', en: 'Delivery', fr: 'Livraison' },
        selectDuration: { ar: 'اختر المدة:', en: 'Choose duration:', fr: 'Choisir la duree :' },
        month: { ar: 'شهر', en: 'month', fr: 'mois' },
        currencyDzd: { ar: 'د.ج', en: 'DA', fr: 'DA' }
    };

    return texts[key]?.[lang] || texts[key]?.ar || '';
}

const DELIVERY_TIME_OPTIONS = {
    '5-10min': { ar: '5 إلى 10 دقائق', en: '5 to 10 minutes', fr: '5 à 10 minutes' },
    '30min-1h': { ar: '30 دقيقة إلى ساعة', en: '30 min to 1 hour', fr: '30 min à 1 heure' },
    '2-3h': { ar: 'ساعتين إلى 3 ساعات', en: '2 to 3 hours', fr: '2 à 3 heures' },
    '5h': { ar: '5 ساعات', en: '5 hours', fr: '5 heures' },
    '24h': { ar: '24 ساعة', en: '24 hours', fr: '24 heures' }
};

function getDeliveryTimeText(key, lang = 'ar') {
    if (!key || !DELIVERY_TIME_OPTIONS[key]) return '';
    return DELIVERY_TIME_OPTIONS[key][lang] || DELIVERY_TIME_OPTIONS[key].ar || '';
}

function buildDeliveryTimeBadge(deliveryKey, lang = 'ar') {
    if (!deliveryKey || !DELIVERY_TIME_OPTIONS[deliveryKey]) return '';
    const text = getDeliveryTimeText(deliveryKey, lang);
    const label = getUiText('deliveryLabel', lang);
    return `<div class="delivery-time-badge" data-delivery-key="${deliveryKey}"
        style="margin:4px 0;font-size:0.75rem;color:var(--text-secondary,#999);text-align:center;">
        ${label}: <span style="font-weight:600;color:var(--accent,#d4a843);">${text}</span>
    </div>`;
}

function formatDzd(amount, lang = 'ar') {
    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-DZ';
    return `${Number(amount || 0).toLocaleString(locale)} ${getUiText('currencyDzd', lang)}`;
}

function formatPrice(dzd, usd, lang = 'ar') {
    const currency = window.currencyManager?.getCurrentCurrency() || 'DZD';
    if (currency === 'USD' && usd) return `$${usd}`;
    return formatDzd(dzd, lang);
}

function normalizeFeatures(features) {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
        return features
            .split(/\r?\n|,/)
            .map(text => text.trim())
            .filter(Boolean)
            .map(text => ({ text: { ar: text, en: '', fr: '' } }));
    }
    return [];
}

function cleanFeatureText(text) {
    return String(text || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

function normalizeSearchText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function normalizeProductCategory(product) {
    const rawCategory = normalizeSearchText(product?.category);
    const id = normalizeSearchText(product?.id);
    const name = normalizeSearchText([
        getLocalizedText(product?.name, 'en', ''),
        getLocalizedText(product?.name, 'fr', ''),
        getLocalizedText(product?.name, 'ar', '')
    ].join(' '));

    const directCategoryMap = {
        ai: 'ai',
        'ai tools': 'ai',
        aitools: 'ai',
        artificial: 'ai',
        intelligence: 'ai',
        'artificial intelligence': 'ai',
        design: 'design',
        creative: 'design',
        video: 'design',
        montage: 'design',
        editing: 'design',
        courses: 'courses',
        course: 'courses',
        education: 'courses',
        accounts: 'courses',
        account: 'courses',
        learning: 'courses',
        entertainment: 'entertainment',
        streaming: 'entertainment',
        stream: 'entertainment',
        movies: 'entertainment',
        subscriptions: ''
    };

    if (directCategoryMap[rawCategory]) return directCategoryMap[rawCategory];

    const haystack = `${id} ${name}`;
    const aiIds = ['chatgpt', 'gpt', 'claude', 'grok', 'super grok', 'google ai', 'google gemini', 'gemini', 'veo', 'gamma', 'gama', 'perplexity', 'cursor', 'scispace', 'sci space', 'lovable'];
    const designIds = ['adobe', 'creative cloud', 'canva', 'capcut', 'cap cut', 'alight', 'motion'];
    const courseIds = ['trw', 'real world', 'duolingo', 'microsoft', 'office', 'hma', 'vpn', 'tradingview', 'trading view'];
    const entertainmentIds = ['netflix', 'primevideo', 'prime video', 'crunchyroll', 'youtube', 'spotify'];

    if (aiIds.some(key => haystack.includes(key))) return 'ai';
    if (designIds.some(key => haystack.includes(key))) return 'design';
    if (courseIds.some(key => haystack.includes(key))) return 'courses';
    if (entertainmentIds.some(key => haystack.includes(key))) return 'entertainment';

    if (['other', 'subscriptions', 'tools', 'tool', ''].includes(rawCategory)) return 'courses';
    return rawCategory || 'courses';
}

function getExplicitProductSortOrder(product) {
    const displayOrder = Number(product?.displayOrder);
    if (Number.isFinite(displayOrder) && displayOrder >= 0) {
        return displayOrder;
    }

    const order = Number(product?.order);
    if (Number.isFinite(order) && order >= 0) {
        return order;
    }

    return null;
}

function getProductOrderValue(product) {
    const explicitOrder = getExplicitProductSortOrder(product);
    return explicitOrder === null ? 9999 : explicitOrder;
}

function normalizeProductOrderFields(product) {
    if (!product) return product;
    const sortOrder = getExplicitProductSortOrder(product);
    if (sortOrder !== null) {
        product.displayOrder = sortOrder;
        product.order = sortOrder;
    }
    return product;
}

function isCanonicalFirestoreDoc(product, canonicalId) {
    const docId = product?.firebaseDocId || product?.id;
    if (!docId || !canonicalId) return false;
    return resolveCanonicalFirestoreId(docId) === canonicalId && docId === canonicalId;
}

function resolveCanonicalFirestoreId(rawId = '', fallbackName = '') {
    if (window.ProductIdUtils?.resolveCanonicalProductId) {
        return window.ProductIdUtils.resolveCanonicalProductId(rawId, fallbackName);
    }
    // Map stale/ghost Firebase documents → their admin-managed canonical ID.
    // The canonical ID is whichever document the admin panel actually manages
    // (usually the one with active:true and a real displayOrder).
    // To add a new mapping: find the stale doc ID, map it to the admin-managed doc ID.
    const KNOWN_DUPLICATES = {
        // Stale short-ID docs → admin-managed long-ID docs
        'canva':        'canva-pro',
        'netflix':      'netflix-premium',
        'duolingo':     'duolingo-super',
        'primevideo':   'prime-video',
        'lovable':      'lovable-ai',
        'cursor':       'cursor-ai',
        'perplexity':   'perplexity-ai-pro',
        // Stale long-ID docs → admin-managed short-ID docs
        'the-real-world-account':   'trw',
        'google-gemini-pro-veo-3':  'google-ai',
        'capcut-pro':               'capcut'
    };
    const id = String(rawId || '').toLowerCase().trim();
    return KNOWN_DUPLICATES[id] || id;
}

function resolveMergedProductSortOrder(existing, incoming, canonicalId) {
    const candidates = [existing, incoming].filter(Boolean);
    const canonicalRecord = candidates.find(item => isCanonicalFirestoreDoc(item, canonicalId));

    if (canonicalRecord) {
        const canonicalOrder = getExplicitProductSortOrder(canonicalRecord);
        if (canonicalOrder !== null) return canonicalOrder;
    }

    const candidateOrders = candidates
        .map(getExplicitProductSortOrder)
        .filter(order => order !== null);

    if (candidateOrders.length > 0) {
        return Math.min(...candidateOrders);
    }

    return 9999;
}

function mergeCanonicalProductRecords(existing, incoming, canonicalId) {
    const existingCanonical = isCanonicalFirestoreDoc(existing, canonicalId);
    const incomingCanonical = isCanonicalFirestoreDoc(incoming, canonicalId);

    let preferred = existing;
    let secondary = incoming;

    if (incomingCanonical && !existingCanonical) {
        preferred = incoming;
        secondary = existing;
    } else if (!incomingCanonical && !existingCanonical) {
        preferred = { ...existing, ...incoming };
        secondary = null;
    }

    const merged = secondary ? { ...secondary, ...preferred } : { ...preferred };
    merged.id = canonicalId;
    merged.firebaseDocId = preferred.firebaseDocId || incoming.firebaseDocId || canonicalId;

    if (Array.isArray(preferred.subOffers)) {
        merged.subOffers = preferred.subOffers;
    }

    const sortOrder = resolveMergedProductSortOrder(existing, incoming, canonicalId);
    if (sortOrder !== 9999) {
        merged.displayOrder = sortOrder;
        merged.order = sortOrder;
    }

    return normalizeProductOrderFields(merged);
}

function getProductLandingPage(product) {
    if (product?.landingPage) return product.landingPage;

    const id = String(product?.id || '').toLowerCase().trim();
    if (DEFAULT_LANDING_PAGES[id]) return DEFAULT_LANDING_PAGES[id];

    const name = getLocalizedText(product?.name, 'en', '').toLowerCase();
    const matchedKey = Object.keys(DEFAULT_LANDING_PAGES).find(key => id.includes(key) || name.includes(key));
    return matchedKey ? DEFAULT_LANDING_PAGES[matchedKey] : '';
}

function dedupeProductsToCanonicalIds(products) {
    const map = new Map();

    products.forEach((product) => {
        if (!product) return;

        const firebaseDocId = product.firebaseDocId || product.id;
        const canonicalId = resolveCanonicalFirestoreId(
            firebaseDocId,
            getProductDisplayNameForSort(product)
        );
        const normalized = normalizeProductOrderFields({
            ...product,
            id: canonicalId,
            firebaseDocId
        });
        const existing = map.get(canonicalId);

        if (!existing) {
            map.set(canonicalId, normalized);
            return;
        }

        map.set(canonicalId, mergeCanonicalProductRecords(existing, normalized, canonicalId));
    });

    return Array.from(map.values());
}

function logSortedProductsForDebug(products, stage = 'sorted') {
    homepageProductDebug(`${stage} product order`, products.map((product, index) => ({
        index,
        id: product.id,
        firebaseDocId: product.firebaseDocId,
        name: getProductDisplayNameForSort(product),
        displayOrder: product.displayOrder,
        order: product.order,
        sortValue: getProductOrderValue(product)
    })));
    homepageProductDebug('Lovable sort debug', products
        .filter(product => /lovable/i.test(String(product.id)) || /lovable/i.test(getProductDisplayNameForSort(product)))
        .map((product, index) => ({
            index,
            id: product.id,
            firebaseDocId: product.firebaseDocId,
            displayOrder: product.displayOrder,
            order: product.order,
            sortValue: getProductOrderValue(product)
        })));
}

function normalizeProducts(products) {
    const deduped = dedupeProductsToCanonicalIds(products)
        .filter(product => {
            if (!product || product.isArchived === true) return false;
            // If admin set availability to 'unavailable', show the product with a badge
            if (product.availability === 'unavailable') return true;
            // Otherwise, respect the active toggle — hide deactivated products
            return product.active !== false;
        })
        .map(normalizeProductOrderFields);

    const sorted = deduped.sort((a, b) => {
        const explicitOrderDiff = getProductOrderValue(a) - getProductOrderValue(b);
        if (explicitOrderDiff !== 0) return explicitOrderDiff;
        return String(a.id || '').localeCompare(String(b.id || ''));
    });

    logSortedProductsForDebug(sorted, 'normalizeProducts');
    return sorted;
}

function preloadCriticalProductMedia(products, count = 6) {
    const criticalMedia = normalizeProducts(products)
        .slice(0, count)
        .map(product => product.mediaUrl || product.image || product.imageUrl)
        .filter(url => typeof url === 'string' && url && !url.includes('.mp4'));

    return Promise.allSettled(
        criticalMedia.map(url => new Promise(resolve => {
            const image = new Image();
            const timeoutId = window.setTimeout(resolve, 1200);
            image.onload = () => {
                window.clearTimeout(timeoutId);
                resolve();
            };
            image.onerror = () => {
                window.clearTimeout(timeoutId);
                resolve();
            };
            image.src = url;
        }))
    );
}

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
        const { collection, getDocs } = firebaseModules;
        const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
        const products = [];

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();
            products.push({
                ...data,
                id: docItem.id,
                firebaseDocId: docItem.id
            });
        });

        homepageProductDebug('Firestore raw docs before normalize', products.map(product => ({
            firebaseDocId: product.firebaseDocId,
            id: product.id,
            name: getProductDisplayNameForSort(product),
            displayOrder: product.displayOrder,
            order: product.order
        })));

        const visibleProducts = normalizeProducts(products);
        console.log('✅ تم تحميل', visibleProducts.length, 'منتج من Firebase');
        return visibleProducts;

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
    const name = getLocalizedText(product.name, lang, product.id || 'منتج');
    const description = getLocalizedText(product.description, lang, '');
    // ═══════════════════════════════════════════════════════════════════════════
    // Firebase is the Single Source of Truth for prices
    // Admin panel changes in Firebase will now reflect directly on the homepage
    // currency-config.js PRODUCTS are only used as fallback if Firebase data is missing
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Only use currency-config.js as fallback for missing data (NOT for overriding)
    if (typeof window !== 'undefined' && window.PRODUCTS) {
        let officialProduct = null;
        if (window.PRODUCTS[product.id]) {
            officialProduct = window.PRODUCTS[product.id];
        } else {
            const entries = Object.entries(window.PRODUCTS);
            const match = entries.find(([key, val]) => 
                (name && name.toLowerCase().includes(key)) || (product.id && product.id.includes(key))
            );
            if (match) officialProduct = match[1];
        }

        // Only use fallback prices if Firebase has NO price data
        if (officialProduct && (!product.priceDZD || product.priceDZD === 0)) {
            product.priceDZD = officialProduct.price_dzd;
            product.priceUSD = officialProduct.price_usd;
        }
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
        'microsoft-office': { url: 'https://i.pinimg.com/736x/3c/0d/b2/3c0db24fec715f86cc3e167892f88e2f.jpg', type: 'image' },
        // Canonical long-ID aliases (after dedup, products use these IDs)
        'canva-pro':          { url: 'https://i.pinimg.com/736x/71/8b/41/718b41945aab84bd2276c762266931d0.jpg', type: 'image' },
        'netflix-premium':    { url: 'https://i.pinimg.com/originals/67/9d/aa/679daac8c726277e809c6413a650c547.gif', type: 'image' },
        'duolingo-super':     { url: 'https://i.pinimg.com/originals/98/59/12/98591272861e66a02eecf5dae0450c73.gif', type: 'image' },
        'prime-video':        { url: 'https://i.pinimg.com/originals/67/9d/aa/679daac8c726277e809c6413a650c547.gif', type: 'image' },
        'primevideo':         { url: 'https://i.pinimg.com/originals/67/9d/aa/679daac8c726277e809c6413a650c547.gif', type: 'image' },
        'lovable-ai':         { url: 'https://i.pinimg.com/1200x/cd/d4/69/cdd469e94eb529ae307f9b5d56e8da96.jpg', type: 'image' },
        'cursor-ai':          { url: 'https://i.pinimg.com/736x/29/f9/48/29f9488bd27d42debcfbddb33c1c79d7.jpg', type: 'image' },
        'perplexity-ai-pro':  { url: 'https://i.imgur.com/mEy5oXF.mp4', type: 'video' },
        'capcut-pro':         { url: 'https://i.pinimg.com/1200x/38/e3/08/38e308732b87069ed50893423f09ca4b.jpg', type: 'image' },
        'tradingview-premium':{ url: 'https://i.pinimg.com/736x/8c/63/a5/8c63a5c7d9d6e826b281b01dea6bd5da.jpg', type: 'image' }
    };

    // Apply media fallback + cross-contamination detection
    const correctMedia = mediaMap[product.id];
    const firebaseUrl = (product.mediaUrl || '').trim();
    const hasFirebaseUrl = firebaseUrl && firebaseUrl !== '' && firebaseUrl !== 'null';

    if (correctMedia) {
        if (!hasFirebaseUrl) {
            // No Firebase media → use our known-good fallback
            product.mediaUrl = correctMedia.url;
            product.mediaType = correctMedia.type;
        } else if (firebaseUrl !== correctMedia.url) {
            // Firebase has a URL but it's different from what we expect.
            // Check if it actually belongs to ANOTHER product (cross-contamination).
            const isCrossContaminated = Object.entries(mediaMap).some(
                ([otherId, other]) => otherId !== product.id && other.url === firebaseUrl
            );
            if (isCrossContaminated) {
                product.mediaUrl = correctMedia.url;
                product.mediaType = correctMedia.type;
            }
        }
    } else if (!hasFirebaseUrl) {
        // No known media and no Firebase URL → try fuzzy name match
        const fallback = Object.entries(mediaMap).find(([key]) => name.toLowerCase().includes(key))?.[1];
        if (fallback) {
            product.mediaUrl = fallback.url;
            product.mediaType = fallback.type;
        }
    }

    const priceDZD = getNumericValue(product, ['priceDZD', 'price_dzd'], 0);
    const priceUSD = getNumericValue(product, ['priceUSD', 'price_usd'], 0);
    const mediaUrl = product.mediaUrl || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(name);
    const mediaType = product.mediaType || 'image';
    const availability = product.availability || 'available';
    const features = normalizeFeatures(product.features);
    const paymentMethods = product.paymentMethods || { usdt: true, redotpay: true, baridimob: true };
    const landingPage = getProductLandingPage(product);
    const category = normalizeProductCategory(product);

    // بناء أزرار العروض الفرعية (المدد المختلفة)
    const subOffers = Array.isArray(product.subOffers) && product.subOffers.length > 0
        ? product.subOffers : null;

    let activePriceDZD = priceDZD;
    let activePriceUSD = priceUSD;
    let durationSelectorHTML = '';

    const firstAvailableSubOffer = subOffers?.find(s => (s.availability || 'available') === 'available');
    const firstSubOffer = subOffers?.[0];
    const effectiveAvailability = availability !== 'available'
        ? availability
        : (subOffers && !firstAvailableSubOffer ? (firstSubOffer?.availability || 'unavailable') : 'available');
    const isUnavailableState = effectiveAvailability !== 'available';

    const getFallbackDurationPrice = (offerId, field) => {
        // Try multiple ID variants to handle cases like Firebase 'capcut-pro' vs config 'capcut'
        const idVariants = [
            product.id,
            product.id?.replace(/(-(ai|pro|premium|super|lite))+$/i, ''),
            product.id?.replace(/-/g, '')
        ].filter((id, i, arr) => id && arr.indexOf(id) === i);

        for (const tryId of idVariants) {
            const localProduct = typeof window !== 'undefined' ? window.PRODUCTS?.[tryId] : null;
            if (!localProduct?.durations) continue;
            const normKey = k => String(k).toLowerCase().replace(/[\s-]/g, '');
            const localDur = localProduct.durations[offerId] ||
                localProduct.durations[Object.keys(localProduct.durations).find(k => normKey(k) === normKey(String(offerId)))];
            if (!localDur) continue;
            if (field === 'dzd') return localDur.dzd || localDur.price_dzd || 0;
            return localDur.usd || localDur.price_usd || 0;
        }
        return 0;
    };

    if (subOffers) {
        const firstAvail = firstAvailableSubOffer || firstSubOffer;
        activePriceDZD = getNumericValue(firstAvail, ['priceDZD', 'price_dzd'], priceDZD);
        activePriceUSD = getNumericValue(firstAvail, ['priceUSD', 'price_usd'], priceUSD);
        if (!activePriceDZD) activePriceDZD = getFallbackDurationPrice(firstAvail?.id, 'dzd');
        if (!activePriceUSD) activePriceUSD = getFallbackDurationPrice(firstAvail?.id, 'usd');

        const btns = subOffers.map(offer => {
            const label = getLocalizedText(offer.name, lang, offer.id || '');
            const isActive = offer.id === firstAvail.id;
            const isDisabled = offer.availability !== 'available';
            let offerPriceDZD = getNumericValue(offer, ['priceDZD', 'price_dzd'], 0);
            let offerPriceUSD = getNumericValue(offer, ['priceUSD', 'price_usd'], 0);
            if (!offerPriceDZD) offerPriceDZD = getFallbackDurationPrice(offer.id, 'dzd');
            if (!offerPriceUSD) offerPriceUSD = getFallbackDurationPrice(offer.id, 'usd');
            const subLabel = isDisabled
                ? `<span style="display:block;font-size:0.7rem;color:#ef4444;">${offer.availability === 'coming_soon' ? getUiText('comingSoon', lang) : getUiText('unavailable', lang)}</span>`
                : '';
            return `<button ${isDisabled ? 'disabled' : ''}
                class="product-duration-btn${isActive ? ' active' : ''}"
                data-product-id="${product.id}"
                data-duration="${offer.id}"
                data-price-dzd="${offerPriceDZD}"
                data-price-usd="${offerPriceUSD}"
                data-delivery-time="${offer.deliveryTime || ''}"
                onclick="selectProductDuration(this,'${product.id}')">${label}${subLabel}</button>`;
        }).join('');

        durationSelectorHTML = `
            <div class="product-duration-selector" style="margin:12px 0 6px;">
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">${getUiText('selectDuration', lang)}</p>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">${btns}</div>
            </div>`;
    }

    // إنشاء شارة الحالة
    let statusBadge = '';
    let buttonDisabled = '';
    let cardOpacity = '';

    if (effectiveAvailability === 'unavailable') {
        statusBadge = `
            <div class="status-badge unavailable-badge" data-status="unavailable"
                style="position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #e50914, #b20710); color: white; padding: 10px 20px; border-radius: 25px; font-weight: 700; font-size: 0.9rem; z-index: 10; box-shadow: 0 4px 15px rgba(229, 9, 20, 0.5);">
                <span data-i18n="product.unavailable">${getUiText('unavailableIcon', lang)}</span>
            </div>`;
        buttonDisabled = 'disabled style="opacity: 0.5; cursor: not-allowed;"';
    } else if (effectiveAvailability === 'coming_soon') {
        statusBadge = `
            <div class="coming-soon-badge" data-status="coming_soon"
                style="position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; z-index: 10; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.5); animation: pulse 2s infinite;">
                <span data-i18n="product.comingSoon">${getUiText('comingSoon', lang)}</span>
            </div>`;
        buttonDisabled = 'disabled style="opacity: 0.5; cursor: not-allowed;"';
        cardOpacity = 'style="position: relative; opacity: 0.9;"';
    }

    const orderButtonText = effectiveAvailability === 'available'
        ? getUiText('orderNow', lang)
        : (effectiveAvailability === 'coming_soon' ? getUiText('comingSoon', lang) : getUiText('unavailable', lang));
    const orderButtonStatusAttr = effectiveAvailability === 'available' ? '' : `data-status="${effectiveAvailability}"`;

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
            <button class="payment-btn-compact crypto-pay-btn" data-product="${name}" data-price="${activePriceDZD}" data-price-usd="${activePriceUSD}" ${buttonDisabled}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-11h3v2h-3v3h-2v-3H8v-2h3V8h2v3z"/>
                </svg>
                <span>USDT</span>
            </button>`;
    }
    if (paymentMethods.redotpay) {
        paymentButtons += `
            <button class="payment-btn-compact redotpay-btn" data-product="${name}" data-price="${activePriceDZD}" data-price-usd="${activePriceUSD}" ${buttonDisabled}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span>RedotPay</span>
            </button>`;
    }
    if (paymentMethods.baridimob) {
        paymentButtons += `
            <button class="payment-btn-compact baridimob-btn" data-product="${name}" data-price="${activePriceDZD}" data-price-usd="${activePriceUSD}" ${buttonDisabled}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                <span>BaridiMob</span>
            </button>`;
    }

    // إنشاء قائمة المميزات
    let featuresHTML = '';
    features.forEach((feature, index) => {
        const featureText = cleanFeatureText(getLocalizedText(feature.text || feature, lang, ''));
        if (featureText) {
            featuresHTML += `<li data-i18n="product.${product.id}.feature${index + 1}">${featureText}</li>`;
        }
    });

    // زر اكتشف المزيد
    let discoverBtn = '';
    if (landingPage) {
        discoverBtn = `<a href="${landingPage}" class="discover-btn" data-i18n="product.discoverMore">${getUiText('discoverMore', lang)}</a>`;
    }

    // مدة التوصيل للعرض النشط
    const activeDeliveryKey = subOffers
        ? (firstAvailableSubOffer || firstSubOffer)?.deliveryTime || ''
        : '';
    const deliveryTimeHTML = !isUnavailableState
        ? (activeDeliveryKey ? buildDeliveryTimeBadge(activeDeliveryKey, lang) : `<div class="delivery-time-badge" style="display:none;"></div>`)
        : '';

    // إنشاء البطاقة الكاملة
    return `
        <div class="product-card fade-in" data-product-id="${product.id}" data-category="${category}" ${cardOpacity}>
            ${statusBadge}
            ${mediaElement}
            <h3>${name}</h3>
            <p class="description" data-i18n="product.${product.id}.desc">${description}</p>
            ${!isUnavailableState && product.id === 'perplexity' ?
            `<div class="price-tag no-currency-update">
                <span data-price-dzd="${activePriceDZD}" data-price-usd="${activePriceUSD}">${formatDzd(activePriceDZD, lang)}</span>
                <span style="font-size: 0.8em; font-weight: normal;">/ <span data-i18n="perMonth">${getUiText('month', lang)}</span></span>
            </div>` :
            (!isUnavailableState ? `<div class="price-tag" data-price-dzd="${activePriceDZD}" data-price-usd="${activePriceUSD}">${formatDzd(activePriceDZD, lang)}</div>` : '')}
            ${!isUnavailableState ? durationSelectorHTML : ''}
            ${deliveryTimeHTML}

            ${!isUnavailableState ? `<div class="payment-methods-row">
                ${paymentButtons}
            </div>` : ''}
            
            <ul class="product-features">
                ${featuresHTML}
            </ul>
            ${discoverBtn}
            <button class="order-btn" data-product="${name}" data-price="${activePriceDZD}" data-price-usd="${activePriceUSD}" ${orderButtonStatusAttr} onclick="${product.id === 'perplexity' ? 'orderPerplexity()' : 'orderProduct(this.dataset.product)'}" ${buttonDisabled}>${orderButtonText}</button>
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

    if (!Array.isArray(products) || products.length === 0) {
        console.warn('No Firebase products to render; keeping the existing static product cards visible.');
        productGrid.querySelectorAll('.product-card.fade-in').forEach(card => card.classList.add('visible'));
        return;
    }

    const sortedProducts = normalizeProducts(products);
    logSortedProductsForDebug(sortedProducts, 'renderProducts');

    window.__firebaseRenderedProducts = sortedProducts;

    // مسح المحتوى الحالي
    productGrid.innerHTML = '';

    // إنشاء بطاقات المنتجات
    sortedProducts.forEach(product => {
        const cardHTML = createProductCardHTML(product, lang);
        productGrid.insertAdjacentHTML('beforeend', cardHTML);
    });

    productGrid.querySelectorAll('.product-card.fade-in').forEach(card => card.classList.add('visible'));

    window.dispatchEvent(new CustomEvent('productsRendered', {
        detail: { products: sortedProducts }
    }));

    console.log('✅ تم عرض', sortedProducts.length, 'منتج في الصفحة');

    // إعادة تهيئة الأحداث
    reinitializeEventListeners();
    renderMobileProducts(sortedProducts, lang);
    if (typeof window.applyProductCategoryFilter === 'function') {
        const activeFilter = document.querySelector('.category-pill.active')?.getAttribute('data-filter') || 'all';
        window.applyProductCategoryFilter(activeFilter);
    }
    window.dispatchEvent(new CustomEvent('firebaseProductsRendered', { detail: { products: sortedProducts } }));
    productGrid.classList.add('ready');
}

function renderMobileProducts(products, lang = 'ar') {
    const mobileGrid = document.querySelector('.mobile-expand-offers');
    if (!mobileGrid) return;

    mobileGrid.dataset.generated = 'true';
    mobileGrid.innerHTML = products.map((product, index) => {
        const name = getLocalizedText(product.name, lang, product.id || 'Product');
        const description = getLocalizedText(product.description, lang, '');
        const priceDZD = getNumericValue(product, ['priceDZD', 'price_dzd'], 0);
        const priceUSD = getNumericValue(product, ['priceUSD', 'price_usd'], 0);
        const mediaUrl = product.mediaUrl || product.image || '';
        const mediaType = product.mediaType || (String(mediaUrl).includes('.mp4') ? 'video' : 'image');
        const category = normalizeProductCategory(product);
        const availability = product.availability || product.status || (product.available === false ? 'unavailable' : 'available');
        const subOffers = Array.isArray(product.subOffers) ? product.subOffers : [];
        const firstAvailableOffer = subOffers.find(offer => (offer.availability || 'available') === 'available');
        const activeOffer = firstAvailableOffer || subOffers[0];
        const effectiveAvailability = availability !== 'available'
            ? availability
            : (subOffers.length > 0 && !firstAvailableOffer ? (activeOffer?.availability || 'unavailable') : 'available');
        const disabled = effectiveAvailability !== 'available';
        const activePriceDZD = activeOffer ? getNumericValue(activeOffer, ['priceDZD', 'price_dzd'], priceDZD) : priceDZD;
        const activePriceUSD = activeOffer ? getNumericValue(activeOffer, ['priceUSD', 'price_usd'], priceUSD) : priceUSD;
        const features = normalizeFeatures(product.features)
            .slice(0, 2)
            .map(feature => `<li>${getLocalizedText(feature.text || feature, lang, '')}</li>`)
            .join('');
        const offerButtons = !disabled && subOffers.length > 1 ? `
            <div class="mobile-offer-options">
                ${subOffers.map((offer, offerIndex) => {
                    const offerDisabled = offer.availability !== 'available';
                    const offerPriceDZD = getNumericValue(offer, ['priceDZD', 'price_dzd'], 0);
                    const offerPriceUSD = getNumericValue(offer, ['priceUSD', 'price_usd'], 0);
                    return `<button type="button"
                        class="mobile-offer-option${offerIndex === 0 ? ' is-selected' : ''}"
                        data-price-dzd="${offerPriceDZD}"
                        data-price-usd="${offerPriceUSD}"
                        data-delivery-time="${offer.deliveryTime || ''}"
                        ${offerDisabled ? 'disabled aria-disabled="true"' : ''}>
                        <span>${getLocalizedText(offer.name, lang, offer.id || '')}</span>
                        <strong data-price-dzd="${offerPriceDZD}" data-price-usd="${offerPriceUSD}">${formatPrice(offerPriceDZD, offerPriceUSD, lang)}</strong>
                    </button>`;
                }).join('')}
            </div>` : '';
        const media = mediaType === 'video'
            ? `<video autoplay loop muted playsinline aria-label="${name}"><source src="${mediaUrl}" type="video/mp4"></video>`
            : `<img src="${mediaUrl}" alt="${name}">`;
        const statusLabel = effectiveAvailability === 'coming_soon' ? getUiText('comingSoon', lang) : getUiText('unavailable', lang);

        return `
            <article class="mobile-expand-card${index === 0 ? ' is-open' : ''}${disabled ? ' is-unavailable' : ''}"
                data-mobile-expand-product="${product.id}"
                data-category="${category}"
                data-mobile-status="${effectiveAvailability}">
                <button class="mobile-expand-toggle" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}" ${disabled ? 'aria-disabled="true"' : ''}>
                    ${media}
                    ${disabled ? `<span class="mobile-status-badge">${statusLabel}</span>` : ''}
                    <span><strong>${name}</strong><em data-price-dzd="${activePriceDZD}" data-price-usd="${activePriceUSD}" data-available-price="${formatPrice(activePriceDZD, activePriceUSD, lang)}">${disabled ? statusLabel : formatPrice(activePriceDZD, activePriceUSD, lang)}</em></span>
                </button>
                <div class="mobile-expand-details">
                    <p>${description}</p>
                    ${offerButtons}
                    ${(() => {
                        const mobileDeliveryKey = activeOffer?.deliveryTime || '';
                        if (mobileDeliveryKey && DELIVERY_TIME_OPTIONS[mobileDeliveryKey]) {
                            const text = getDeliveryTimeText(mobileDeliveryKey, lang);
                            const label = getUiText('deliveryLabel', lang);
                            return `<div class="mobile-delivery-time" data-delivery-key="${mobileDeliveryKey}"
                                style="margin:4px 0;font-size:0.72rem;color:var(--text-secondary,#999);text-align:center;">
                                ${label}: <span style="font-weight:600;color:var(--accent,#d4a843);">${text}</span>
                            </div>`;
                        }
                        return `<div class="mobile-delivery-time" style="display:none;"></div>`;
                    })()}
                    ${features ? `<ul>${features}</ul>` : ''}
                    <div class="mobile-expand-actions">
                        <a href="${getProductLandingPage(product) || '#products'}">${getUiText('productDetails', lang)}</a>
                        <button type="button" data-product="${name}" data-price="${activePriceDZD}" data-price-usd="${activePriceUSD}" ${disabled ? 'disabled' : ''}>${disabled ? statusLabel : getUiText('orderNow', lang)}</button>
                    </div>
                </div>
            </article>`;
    }).join('');

    mobileGrid.querySelectorAll('.mobile-expand-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const card = toggle.closest('.mobile-expand-card');
            const isOpen = card.classList.contains('is-open');
            mobileGrid.querySelectorAll('.mobile-expand-card').forEach(item => {
                item.classList.remove('is-open');
                item.querySelector('.mobile-expand-toggle')?.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                card.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });
    });

    mobileGrid.querySelectorAll('.mobile-offer-option').forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            const card = button.closest('.mobile-expand-card');
            card.querySelectorAll('.mobile-offer-option').forEach(option => option.classList.remove('is-selected'));
            button.classList.add('is-selected');
            const dzd = Number(button.dataset.priceDzd) || 0;
            const usd = Number(button.dataset.priceUsd) || 0;
            const label = formatPrice(dzd, usd, lang);
            const priceLabel = card.querySelector('.mobile-expand-toggle em');
            const orderButton = card.querySelector('.mobile-expand-actions button');
            if (priceLabel) {
                priceLabel.textContent = label;
                priceLabel.dataset.availablePrice = label;
            }
            if (orderButton) {
                orderButton.dataset.price = dzd;
                orderButton.dataset.priceUsd = usd;
            }
            const mobileDeliveryBadge = card.querySelector('.mobile-delivery-time');
            if (mobileDeliveryBadge) {
                const dtKey = button.dataset.deliveryTime || '';
                if (dtKey && DELIVERY_TIME_OPTIONS[dtKey]) {
                    const text = getDeliveryTimeText(dtKey, lang);
                    const label = getUiText('deliveryLabel', lang);
                    mobileDeliveryBadge.innerHTML = `<span>${label}:</span><span style="font-weight:600;color:var(--accent,#d4a843);">${text}</span>`;
                    mobileDeliveryBadge.style.display = 'inline-flex';
                    mobileDeliveryBadge.dataset.deliveryKey = dtKey;
                } else {
                    mobileDeliveryBadge.style.display = 'none';
                }
            }
        });
    });

    mobileGrid.querySelectorAll('.mobile-expand-actions button').forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            if (typeof orderProduct === 'function') {
                orderProduct(button.dataset.product);
            }
        });
    });
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
    if (window.__firebaseProductsInitStarted) return;
    window.__firebaseProductsInitStarted = true;

    const db = window.db;
    const firebaseModules = window.firebaseModules;

    if (!db || !firebaseModules) {
        console.log('Firebase غير متاح، سيتم استخدام HTML الثابت');
        window.__firebaseProductsInitStarted = false;
        return;
    }

    try {
        // تحميل المنتجات
        const products = await loadProductsFromFirebase(db, firebaseModules);

        if (products.length > 0) {
            await preloadCriticalProductMedia(products);

            // عرض المنتجات
            const currentLang = window.currentLang || 'ar';
            renderProducts(products, currentLang);

            // حفظ في التخزين المؤقت
            if (window.SyncManager?.cacheProducts) {
                window.SyncManager.cacheProducts(products);
            }

            // تهيئة المزامنة الفورية
            if (window.SyncManager?.initializeListeners) {
                window.SyncManager.initializeListeners(db, firebaseModules);
            }

            subscribeToProductChanges(db, firebaseModules);
        } else {
            console.log('لا توجد منتجات في Firebase، سيتم استخدام HTML الثابت');
        }

    } catch (error) {
        console.error('خطأ في تهيئة المنتجات:', error);
    }
}

function subscribeToProductChanges(db, firebaseModules) {
    if (!firebaseModules?.onSnapshot || productsUnsubscribe) return;
    const { collection, onSnapshot } = firebaseModules;

    productsUnsubscribe = onSnapshot(collection(db, PRODUCTS_COLLECTION), (snapshot) => {
        const products = [];
        snapshot.forEach(docItem => {
            const data = docItem.data();
            products.push({
                ...data,
                id: docItem.id,
                firebaseDocId: docItem.id
            });
        });

        homepageProductDebug('Realtime snapshot received', products.length);
        const currentLang = window.currentLang || 'ar';
        renderProducts(products, currentLang);
    }, (error) => {
        console.warn('Realtime product sync unavailable:', error);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تبديل السعر عند الضغط على زر مدة العرض الفرعي
 */
function selectProductDuration(btn, productId) {
    const container = btn.closest('.product-duration-selector');
    if (container) {
        container.querySelectorAll('.product-duration-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const newDZD = parseInt(btn.dataset.priceDzd) || 0;
    const newUSD = parseFloat(btn.dataset.priceUsd) || 0;
    const card = btn.closest('.product-card');
    if (!card) return;

    const priceTag = card.querySelector('.price-tag');
    if (priceTag) {
        priceTag.dataset.priceDzd = newDZD;
        priceTag.dataset.priceUsd = newUSD;
        const isUSD = window.currentCurrency === 'USD';
        const lang = window.currentLang || document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'ar';
        priceTag.textContent = isUSD ? `$${newUSD}` : formatDzd(newDZD, lang);
    }
    card.querySelectorAll('[data-price]').forEach(b => {
        b.dataset.price = newDZD;
        b.dataset.priceUsd = newUSD;
    });

    const deliveryBadge = card.querySelector('.delivery-time-badge');
    if (deliveryBadge) {
        const deliveryKey = btn.dataset.deliveryTime || '';
        if (deliveryKey && DELIVERY_TIME_OPTIONS[deliveryKey]) {
            const lang = window.currentLang || document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'ar';
            const text = getDeliveryTimeText(deliveryKey, lang);
            const label = getUiText('deliveryLabel', lang);
            deliveryBadge.innerHTML = `<span>${label}:</span><span style="font-weight:600;color:var(--accent,#d4a843);">${text}</span>`;
            deliveryBadge.style.display = 'inline-flex';
            deliveryBadge.dataset.deliveryKey = deliveryKey;
        } else {
            deliveryBadge.style.display = 'none';
        }
    }
}

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.selectProductDuration = selectProductDuration;
    window.FirebaseProductsLoader = {
        loadProductsFromFirebase,
        preloadCriticalProductMedia,
        createProductCardHTML,
        renderProducts,
        renderMobileProducts,
        reinitializeEventListeners,
        initFirebaseProducts,
        selectProductDuration
    };

    // تهيئة تلقائية عند تحميل الصفحة (اختياري - يمكن تفعيله لاحقاً)
    // document.addEventListener('DOMContentLoaded', initFirebaseProducts);
}

// CommonJS exports للاستخدام في Node.js (للاختبارات)
if (typeof window !== 'undefined') {
    if (window.firebaseReady) {
        initFirebaseProducts();
    } else {
        window.addEventListener('firebaseReady', initFirebaseProducts, { once: true });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProductsFromFirebase,
        createProductCardHTML,
        renderProducts,
        renderMobileProducts,
        reinitializeEventListeners,
        initFirebaseProducts
    };
}
