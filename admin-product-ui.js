/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Product UI - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * واجهة إدارة المنتجات المحسنة للوحة الأدمن
 * تتضمن دوال إدارة النوافذ والمميزات والعروض الفرعية
 * 
 * Requirements: 1.1, 1.2, 4.1, 6.1, 9.1, 9.2
 */

// ═══════════════════════════════════════════════════════════════════════════
// المتغيرات العامة - Global Variables
// ═══════════════════════════════════════════════════════════════════════════

// editingProductId معرّف في admin.js - نستخدم window.editingProductId
let currentProductFeatures = [];
let currentProductSubOffers = [];
let editingSubOfferIndex = null;

function getDurationSubOfferLabel(id) {
    const labels = {
        pro: { ar: 'Claude Pro', en: 'Claude Pro', fr: 'Claude Pro' },
        api: { ar: 'Claude Code API', en: 'Claude Code API', fr: 'Claude Code API' },
        '7days': { ar: '7 أيام', en: '7 Days', fr: '7 jours' },
        '30days': { ar: '30 يوم', en: '30 Days', fr: '30 jours' },
        '1month': { ar: 'شهر واحد', en: '1 Month', fr: '1 mois' },
        '1month-upgrade': { ar: 'ترقية حساب', en: 'Account Upgrade', fr: 'Mise à niveau' },
        '3months': { ar: '3 أشهر', en: '3 Months', fr: '3 mois' },
        '6months': { ar: '6 أشهر', en: '6 Months', fr: '6 mois' },
        '12months': { ar: '12 شهر', en: '12 Months', fr: '12 mois' },
        '1year': { ar: 'سنة كاملة', en: '1 Year', fr: '1 an' },
        '2years': { ar: 'سنتان', en: '2 Years', fr: '2 ans' },
        standard: { ar: 'عرض قياسي', en: 'Standard', fr: 'Standard' },
        reseller: { ar: 'عرض موزعين', en: 'Reseller', fr: 'Revendeur' }
    };

    return labels[id] || { ar: id, en: id, fr: id };
}

function convertDurationsToSubOffers(durations = {}) {
    if (!durations || typeof durations !== 'object') return [];

    return Object.entries(durations).map(([id, prices]) => ({
        id,
        name: getDurationSubOfferLabel(id),
        priceDZD: Number(prices?.dzd ?? prices?.priceDZD ?? 0) || 0,
        priceUSD: Number(prices?.usd ?? prices?.priceUSD ?? 0) || 0,
        availability: prices?.available === false ? 'unavailable' : 'available'
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال نافذة المنتج - Product Modal Functions
// Requirements: 1.1, 1.2, 4.1, 6.1
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة إضافة/تعديل منتج
 * @param {string|null} productId - معرف المنتج للتعديل، أو null للإضافة
 */
function openProductModalV2(productId = null) {
    window.editingProductId = productId;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (!modal) return;
    
    // Reset form
    if (form) form.reset();
    currentProductFeatures = [];
    currentProductSubOffers = [];
    
    // Reset features container
    renderFeaturesContainer();
    renderSubOffersContainer();
    
    if (productId) {
        // Edit mode
        title.textContent = '✏️ تعديل المنتج';
        loadProductDataToForm(productId);
    } else {
        // Add mode
        title.textContent = '➕ إضافة منتج جديد';
        resetProductForm();
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المنتج
 */
function closeProductModalV2() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    window.editingProductId = null;
    currentProductFeatures = [];
    currentProductSubOffers = [];
}

/**
 * إعادة تعيين نموذج المنتج
 */
function resetProductForm() {
    // Reset multilingual names
    const nameAr = document.getElementById('product-name-ar');
    const nameEn = document.getElementById('product-name-en');
    const nameFr = document.getElementById('product-name-fr');
    if (nameAr) nameAr.value = '';
    if (nameEn) nameEn.value = '';
    if (nameFr) nameFr.value = '';
    
    // Reset prices
    const priceDzd = document.getElementById('product-price-dzd');
    const priceUsd = document.getElementById('product-price-usd');
    if (priceDzd) priceDzd.value = '';
    if (priceUsd) priceUsd.value = '';
    
    // Reset availability to 'available'
    const availableRadio = document.querySelector('input[name="product-availability"][value="available"]');
    if (availableRadio) availableRadio.checked = true;
    
    // Reset payment methods to all checked
    const paymentUsdt = document.getElementById('payment-usdt');
    const paymentRedotpay = document.getElementById('payment-redotpay');
    const paymentBaridimob = document.getElementById('payment-baridimob');
    if (paymentUsdt) paymentUsdt.checked = true;
    if (paymentRedotpay) paymentRedotpay.checked = true;
    if (paymentBaridimob) paymentBaridimob.checked = true;
    
    // Reset media
    const mediaUrl = document.getElementById('product-media-url');
    const mediaPreview = document.getElementById('product-media-preview');
    if (mediaUrl) mediaUrl.value = '';
    if (mediaPreview) mediaPreview.innerHTML = '<span class="text-gray-400">معاينة الوسائط</span>';
    
    // Reset descriptions
    const descAr = document.getElementById('product-desc-ar');
    const descEn = document.getElementById('product-desc-en');
    const descFr = document.getElementById('product-desc-fr');
    if (descAr) descAr.value = '';
    if (descEn) descEn.value = '';
    if (descFr) descFr.value = '';
    
    // Reset additional settings
    const productActive = document.getElementById('product-active');
    const productFeatured = document.getElementById('product-featured');
    const productArchived = document.getElementById('product-archived');
    if (productActive) productActive.checked = true;
    if (productFeatured) productFeatured.checked = false;
    if (productArchived) productArchived.checked = false;
}

/**
 * تحميل بيانات المنتج إلى النموذج
 * @param {string} productId - معرف المنتج
 */
function loadProductDataToForm(productId) {
    // Find product in allProducts array (from admin.js)
    const product = window.allProducts?.find(p => p.id === productId);
    if (!product) {
        console.warn('Product not found:', productId);
        return;
    }
    
    // Set product ID
    const idField = document.getElementById('product-id');
    if (idField) idField.value = product.id;
    
    // Set multilingual names
    if (product.name) {
        if (typeof product.name === 'object') {
            setFieldValue('product-name-ar', product.name.ar || '');
            setFieldValue('product-name-en', product.name.en || '');
            setFieldValue('product-name-fr', product.name.fr || '');
        } else {
            // Legacy: single name field
            setFieldValue('product-name-ar', product.name);
        }
    }
    
    // Set prices
    setFieldValue('product-price-dzd', product.priceDZD || product.price_dzd || 0);
    setFieldValue('product-price-usd', product.priceUSD || product.price_usd || 0);
    setFieldValue('product-old-price-dzd', product.old_price_dzd || '');
    setFieldValue('product-old-price-usd', product.old_price_usd || '');
    setFieldValue('product-cost-dzd', product.cost_dzd || '');
    setFieldValue('product-cost-usd', product.cost_usd || '');
    setFieldValue('product-supplier', product.supplier || '');
    
    // Set availability status
    const availability = product.availability || product.status || 
        (product.available === false ? 'unavailable' : 'available');
    const availabilityRadio = document.querySelector(`input[name="product-availability"][value="${availability}"]`);
    if (availabilityRadio) availabilityRadio.checked = true;
    
    // Set media URL
    const mediaUrl = product.mediaUrl || product.image || '';
    setFieldValue('product-media-url', mediaUrl);
    setFieldValue('product-image', mediaUrl); // Legacy field
    if (mediaUrl) previewProductMedia();
    
    // Set stock
    setFieldValue('product-stock', product.stock || '');
    
    // Set category
    setFieldValue('product-category', product.category || 'subscriptions');
    
    // Set display order
    setFieldValue('product-display-order', product.displayOrder || product.order || 0);
    
    // Set payment methods
    const paymentMethods = product.paymentMethods || { usdt: true, redotpay: true, baridimob: true };
    setCheckboxValue('payment-usdt', paymentMethods.usdt !== false);
    setCheckboxValue('payment-redotpay', paymentMethods.redotpay !== false);
    setCheckboxValue('payment-baridimob', paymentMethods.baridimob !== false);
    
    // Set descriptions
    if (product.description) {
        if (typeof product.description === 'object') {
            setFieldValue('product-desc-ar', product.description.ar || '');
            setFieldValue('product-desc-en', product.description.en || '');
            setFieldValue('product-desc-fr', product.description.fr || '');
        } else {
            setFieldValue('product-desc-ar', product.description);
        }
    }
    
    // Set additional settings
    setCheckboxValue('product-active', product.active !== false);
    setCheckboxValue('product-featured', product.featured === true);
    setCheckboxValue('product-archived', product.isArchived === true);
    
    // Set WhatsApp message
    setFieldValue('product-whatsapp-msg', product.whatsapp_msg || '');
    
    // Load features
    if (Array.isArray(product.features)) {
        currentProductFeatures = product.features.map((f, index) => {
            if (typeof f === 'object') {
                return {
                    id: f.id || `feature_${index}`,
                    text: f.text || { ar: '', en: '', fr: '' },
                    order: f.order || index
                };
            } else {
                // Legacy: string feature
                return {
                    id: `feature_${index}`,
                    text: { ar: f, en: '', fr: '' },
                    order: index
                };
            }
        });
    }
    renderFeaturesContainer();
    
    // Load sub-offers. Legacy products may still store them as durations.
    if (Array.isArray(product.subOffers) && product.subOffers.length > 0) {
        currentProductSubOffers = product.subOffers;
    } else {
        currentProductSubOffers = convertDurationsToSubOffers(product.durations);
    }
    renderSubOffersContainer();
}

/**
 * Helper: Set field value
 */
function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) field.value = value;
}

/**
 * Helper: Set checkbox value
 */
function setCheckboxValue(fieldId, checked) {
    const field = document.getElementById(fieldId);
    if (field) field.checked = checked;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة المميزات - Features Management Functions
// Requirements: 7.1, 7.2, 7.3, 7.5
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إضافة صف ميزة جديد
 */
function addFeatureRow() {
    if (currentProductFeatures.length >= 5) {
        const warning = document.getElementById('features-limit-warning');
        if (warning) warning.classList.remove('hidden');
        return;
    }
    
    const newFeature = {
        id: `feature_${Date.now()}`,
        text: { ar: '', en: '', fr: '' },
        order: currentProductFeatures.length
    };
    
    currentProductFeatures.push(newFeature);
    renderFeaturesContainer();
    
    // Hide warning if shown
    const warning = document.getElementById('features-limit-warning');
    if (warning && currentProductFeatures.length < 5) {
        warning.classList.add('hidden');
    }
}

/**
 * حذف ميزة
 * @param {number} index - فهرس الميزة
 */
function removeFeature(index) {
    currentProductFeatures.splice(index, 1);
    renderFeaturesContainer();
    
    // Hide warning
    const warning = document.getElementById('features-limit-warning');
    if (warning) warning.classList.add('hidden');
    
    // Show add button if hidden
    const addBtn = document.getElementById('add-feature-btn');
    if (addBtn) addBtn.classList.remove('hidden');
}

/**
 * تحريك ميزة لأعلى
 * @param {number} index - فهرس الميزة
 */
function moveFeatureUp(index) {
    if (index <= 0) return;
    const temp = currentProductFeatures[index];
    currentProductFeatures[index] = currentProductFeatures[index - 1];
    currentProductFeatures[index - 1] = temp;
    renderFeaturesContainer();
}

/**
 * تحريك ميزة لأسفل
 * @param {number} index - فهرس الميزة
 */
function moveFeatureDown(index) {
    if (index >= currentProductFeatures.length - 1) return;
    const temp = currentProductFeatures[index];
    currentProductFeatures[index] = currentProductFeatures[index + 1];
    currentProductFeatures[index + 1] = temp;
    renderFeaturesContainer();
}

/**
 * تحديث نص الميزة
 * @param {number} index - فهرس الميزة
 * @param {string} lang - اللغة (ar, en, fr)
 * @param {string} value - القيمة الجديدة
 */
function updateFeatureText(index, lang, value) {
    if (currentProductFeatures[index]) {
        if (!currentProductFeatures[index].text) {
            currentProductFeatures[index].text = { ar: '', en: '', fr: '' };
        }
        currentProductFeatures[index].text[lang] = value;
    }
}

/**
 * عرض حاوية المميزات
 */
function renderFeaturesContainer() {
    const container = document.getElementById('features-container');
    if (!container) return;
    
    if (currentProductFeatures.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">لا توجد مميزات. اضغط على "إضافة ميزة" لإضافة واحدة.</p>';
        return;
    }
    
    container.innerHTML = currentProductFeatures.map((feature, index) => `
        <div class="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg" data-feature-index="${index}">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="text" placeholder="الميزة بالعربية *" 
                    value="${escapeHtml(feature.text?.ar || '')}"
                    onchange="updateFeatureText(${index}, 'ar', this.value)"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:border-purple-500 focus:outline-none">
                <input type="text" placeholder="Feature in English" 
                    value="${escapeHtml(feature.text?.en || '')}"
                    onchange="updateFeatureText(${index}, 'en', this.value)"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:border-purple-500 focus:outline-none">
                <input type="text" placeholder="Caractéristique en français" 
                    value="${escapeHtml(feature.text?.fr || '')}"
                    onchange="updateFeatureText(${index}, 'fr', this.value)"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:border-purple-500 focus:outline-none">
            </div>
            <div class="flex gap-1">
                <button type="button" onclick="moveFeatureUp(${index})" 
                    class="p-1 text-gray-400 hover:text-white ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" 
                    ${index === 0 ? 'disabled' : ''} title="تحريك لأعلى">⬆️</button>
                <button type="button" onclick="moveFeatureDown(${index})" 
                    class="p-1 text-gray-400 hover:text-white ${index === currentProductFeatures.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" 
                    ${index === currentProductFeatures.length - 1 ? 'disabled' : ''} title="تحريك لأسفل">⬇️</button>
                <button type="button" onclick="removeFeature(${index})" 
                    class="p-1 text-red-400 hover:text-red-300" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
    
    // Update add button visibility
    const addBtn = document.getElementById('add-feature-btn');
    const warning = document.getElementById('features-limit-warning');
    if (currentProductFeatures.length >= 5) {
        if (addBtn) addBtn.classList.add('hidden');
        if (warning) warning.classList.remove('hidden');
    } else {
        if (addBtn) addBtn.classList.remove('hidden');
        if (warning) warning.classList.add('hidden');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة العروض الفرعية - Sub-Offers Management Functions
// Requirements: 3.1, 3.2, 3.3, 3.6
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة إضافة/تعديل عرض فرعي
 * @param {number|null} index - فهرس العرض الفرعي للتعديل، أو null للإضافة
 */
function openSubOfferModal(index = null) {
    editingSubOfferIndex = index;
    const modal = document.getElementById('sub-offer-modal');
    const title = document.getElementById('sub-offer-modal-title');
    const form = document.getElementById('sub-offer-form');
    
    if (!modal) return;
    
    // Reset form
    if (form) form.reset();
    
    if (index !== null && currentProductSubOffers[index]) {
        // Edit mode
        title.textContent = '✏️ تعديل العرض الفرعي';
        const subOffer = currentProductSubOffers[index];
        
        setFieldValue('sub-offer-id', subOffer.id || '');
        setFieldValue('sub-offer-index', index);
        const dkSelectEdit = document.getElementById('sub-offer-duration-key');
        if (dkSelectEdit) dkSelectEdit.value = subOffer.id || '';
        
        // Set names
        if (subOffer.name) {
            setFieldValue('sub-offer-name-ar', subOffer.name.ar || '');
            setFieldValue('sub-offer-name-en', subOffer.name.en || '');
            setFieldValue('sub-offer-name-fr', subOffer.name.fr || '');
        }
        
        // Set prices
        setFieldValue('sub-offer-price-dzd', subOffer.priceDZD || 0);
        setFieldValue('sub-offer-price-usd', subOffer.priceUSD || 0);
        
        // Set availability
        const availability = subOffer.availability || 'available';
        const radio = document.querySelector(`input[name="sub-offer-availability"][value="${availability}"]`);
        if (radio) radio.checked = true;
    } else {
        // Add mode
        title.textContent = '➕ إضافة عرض فرعي';
        setFieldValue('sub-offer-id', '');
        setFieldValue('sub-offer-index', '');
        const dkSelectAdd = document.getElementById('sub-offer-duration-key');
        if (dkSelectAdd) dkSelectAdd.value = '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة العرض الفرعي
 */
function closeSubOfferModal() {
    const modal = document.getElementById('sub-offer-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    editingSubOfferIndex = null;
}

/**
 * حفظ العرض الفرعي
 * @param {Event} event - حدث النموذج
 */
function saveSubOffer(event) {
    event.preventDefault();
    
    const nameAr = document.getElementById('sub-offer-name-ar')?.value?.trim();
    const nameEn = document.getElementById('sub-offer-name-en')?.value?.trim();
    const nameFr = document.getElementById('sub-offer-name-fr')?.value?.trim();
    const priceDzd = parseFloat(document.getElementById('sub-offer-price-dzd')?.value) || 0;
    const priceUsd = parseFloat(document.getElementById('sub-offer-price-usd')?.value) || 0;
    const availability = document.querySelector('input[name="sub-offer-availability"]:checked')?.value || 'available';
    
    if (!nameAr) {
        showToast('اسم العرض بالعربية مطلوب', 'error');
        return;
    }
    
    const subOffer = {
        id: document.getElementById('sub-offer-duration-key')?.value ||
            document.getElementById('sub-offer-id')?.value || `suboffer_${Date.now()}`,
        name: { ar: nameAr, en: nameEn, fr: nameFr },
        priceDZD: priceDzd,
        priceUSD: priceUsd,
        availability: availability,
        order: editingSubOfferIndex !== null ? editingSubOfferIndex : currentProductSubOffers.length
    };
    
    if (editingSubOfferIndex !== null) {
        // Update existing
        currentProductSubOffers[editingSubOfferIndex] = subOffer;
    } else {
        // Add new
        currentProductSubOffers.push(subOffer);
    }
    
    renderSubOffersContainer();
    closeSubOfferModal();
}

/**
 * حذف عرض فرعي
 * @param {number} index - فهرس العرض الفرعي
 */
function removeSubOffer(index) {
    if (confirm('هل تريد حذف هذا العرض الفرعي؟')) {
        currentProductSubOffers.splice(index, 1);
        renderSubOffersContainer();
    }
}

/**
 * عرض حاوية العروض الفرعية
 */
function renderSubOffersContainer() {
    const container = document.getElementById('sub-offers-container');
    const noSubOffersMsg = document.getElementById('no-sub-offers-msg');
    
    if (!container) return;
    
    if (currentProductSubOffers.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm" id="no-sub-offers-msg">لا توجد عروض فرعية حالياً</p>';
        return;
    }
    
    const availabilityLabels = {
        available: '<span class="text-green-400">✅ متوفر</span>',
        unavailable: '<span class="text-red-400">❌ غير متوفر</span>',
        coming_soon: '<span class="text-yellow-400">🔜 قريباً</span>'
    };
    
    container.innerHTML = currentProductSubOffers.map((subOffer, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div class="flex-1">
                <div class="font-bold text-sm">${escapeHtml(subOffer.name?.ar || 'بدون اسم')}</div>
                <div class="text-gray-400 text-xs">
                    ${subOffer.priceDZD?.toLocaleString() || 0} د.ج / ${subOffer.priceUSD || 0}$
                </div>
                <div class="text-xs mt-1">${availabilityLabels[subOffer.availability] || availabilityLabels.available}</div>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="openSubOfferModal(${index})" 
                    class="p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs" title="تعديل">✏️</button>
                <button type="button" onclick="removeSubOffer(${index})" 
                    class="p-2 bg-red-600 hover:bg-red-700 rounded text-xs" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال معاينة الوسائط - Media Preview Functions
// Requirements: 6.1, 6.2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * معاينة الوسائط (صورة أو فيديو)
 */
function previewProductMedia() {
    const mediaUrl = document.getElementById('product-media-url')?.value?.trim();
    const preview = document.getElementById('product-media-preview');
    
    if (!preview) return;
    
    if (!mediaUrl) {
        preview.innerHTML = '<span class="text-gray-400">معاينة الوسائط</span>';
        return;
    }
    
    // Detect media type
    const mediaType = detectMediaType(mediaUrl);
    
    if (mediaType === 'video') {
        preview.innerHTML = `
            <video src="${escapeHtml(mediaUrl)}" 
                class="w-full h-full object-cover" 
                autoplay muted loop playsinline
                onerror="this.parentElement.innerHTML='<span class=\\'text-red-400\\'>خطأ في تحميل الفيديو</span>'">
            </video>
        `;
    } else {
        preview.innerHTML = `
            <img src="${escapeHtml(mediaUrl)}" 
                class="w-full h-full object-cover" 
                alt="معاينة"
                onerror="this.parentElement.innerHTML='<span class=\\'text-red-400\\'>خطأ في تحميل الصورة</span>'">
        `;
    }
    
    // Also update legacy field
    const legacyField = document.getElementById('product-image');
    if (legacyField) legacyField.value = mediaUrl;
}

/**
 * اكتشاف نوع الوسائط من الرابط
 * @param {string} url - رابط الوسائط
 * @returns {string} نوع الوسائط (image أو video)
 */
function detectMediaType(url) {
    if (!url) return 'image';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.mp4') || lowerUrl.includes('.mp4?')) {
        return 'video';
    }
    return 'image';
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال جمع بيانات النموذج - Form Data Collection Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * جمع بيانات المنتج من النموذج
 * @returns {Object} بيانات المنتج
 */
function collectProductFormData() {
    const nameAr = document.getElementById('product-name-ar')?.value?.trim() || '';
    const nameEn = document.getElementById('product-name-en')?.value?.trim() || '';
    const nameFr = document.getElementById('product-name-fr')?.value?.trim() || '';
    
    const descAr = document.getElementById('product-desc-ar')?.value?.trim() || '';
    const descEn = document.getElementById('product-desc-en')?.value?.trim() || '';
    const descFr = document.getElementById('product-desc-fr')?.value?.trim() || '';
    
    const priceDzd = parseFloat(document.getElementById('product-price-dzd')?.value) || 0;
    const priceUsd = parseFloat(document.getElementById('product-price-usd')?.value) || 0;
    
    const availability = document.querySelector('input[name="product-availability"]:checked')?.value || 'available';
    
    const mediaUrl = document.getElementById('product-media-url')?.value?.trim() || '';
    const mediaType = detectMediaType(mediaUrl);
    
    const paymentMethods = {
        usdt: document.getElementById('payment-usdt')?.checked !== false,
        redotpay: document.getElementById('payment-redotpay')?.checked !== false,
        baridimob: document.getElementById('payment-baridimob')?.checked !== false
    };
    
    // Collect features with Arabic text
    const features = currentProductFeatures.filter(f => f.text?.ar?.trim());
    
    return {
        id: document.getElementById('product-id')?.value || null,
        name: { ar: nameAr, en: nameEn, fr: nameFr },
        description: { ar: descAr, en: descEn, fr: descFr },
        priceDZD: priceDzd,
        priceUSD: priceUsd,
        availability: availability,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        paymentMethods: paymentMethods,
        features: features,
        subOffers: currentProductSubOffers,
        displayOrder: parseInt(document.getElementById('product-display-order')?.value) || 0,
        isArchived: document.getElementById('product-archived')?.checked || false,
        active: document.getElementById('product-active')?.checked !== false,
        featured: document.getElementById('product-featured')?.checked || false,
        // Legacy fields for backward compatibility
        category: document.getElementById('product-category')?.value || 'subscriptions',
        stock: document.getElementById('product-stock')?.value || null,
        old_price_dzd: parseFloat(document.getElementById('product-old-price-dzd')?.value) || null,
        old_price_usd: parseFloat(document.getElementById('product-old-price-usd')?.value) || null,
        cost_dzd: parseFloat(document.getElementById('product-cost-dzd')?.value) || null,
        cost_usd: parseFloat(document.getElementById('product-cost-usd')?.value) || null,
        supplier: document.getElementById('product-supplier')?.value?.trim() || '',
        whatsapp_msg: document.getElementById('product-whatsapp-msg')?.value?.trim() || ''
    };
}

/**
 * التحقق من صحة بيانات المنتج
 * @param {Object} productData - بيانات المنتج
 * @returns {Object} نتيجة التحقق {valid: boolean, errors: string[]}
 */
function validateProductFormData(productData) {
    const errors = [];
    
    // Check Arabic name (required)
    if (!productData.name?.ar?.trim()) {
        errors.push('اسم المنتج بالعربية مطلوب');
    }
    
    // Check prices
    if (productData.priceDZD < 0) {
        errors.push('السعر بالدينار يجب أن يكون موجباً');
    }
    if (productData.priceUSD < 0) {
        errors.push('السعر بالدولار يجب أن يكون موجباً');
    }
    
    // Check payment methods
    const hasPaymentMethod = productData.paymentMethods?.usdt || 
                            productData.paymentMethods?.redotpay || 
                            productData.paymentMethods?.baridimob;
    if (!hasPaymentMethod) {
        errors.push('يجب تفعيل طريقة دفع واحدة على الأقل');
    }
    
    // Check features limit
    if (productData.features?.length > 5) {
        errors.push('الحد الأقصى للمميزات هو 5');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * معاينة التغييرات قبل الحفظ
 */
function previewProductChanges() {
    // Use the new enhanced preview modal
    openPreviewModal();
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

/**
 * عرض رسالة Toast
 * @param {string} message - الرسالة
 * @param {string} type - نوع الرسالة (success, error, warning)
 */
function showToast(message, type = 'success') {
    // Use existing showToast from admin.js if available
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // Fallback: simple alert
    alert(message);
}

// ═══════════════════════════════════════════════════════════════════════════
// تهيئة الأحداث - Event Initialization
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تهيئة أحداث نموذج المنتج
 */
function initProductFormEvents() {
    // Sub-offer form submit
    const subOfferForm = document.getElementById('sub-offer-form');
    if (subOfferForm) {
        subOfferForm.addEventListener('submit', saveSubOffer);
    }
    
    // Payment methods warning
    const paymentCheckboxes = ['payment-usdt', 'payment-redotpay', 'payment-baridimob'];
    paymentCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', checkPaymentMethods);
        }
    });
    
    // Media URL preview on input
    const mediaUrlInput = document.getElementById('product-media-url');
    if (mediaUrlInput) {
        mediaUrlInput.addEventListener('input', debounce(previewProductMedia, 500));
    }
}

/**
 * التحقق من طرق الدفع وعرض التحذير
 */
function checkPaymentMethods() {
    const usdt = document.getElementById('payment-usdt')?.checked;
    const redotpay = document.getElementById('payment-redotpay')?.checked;
    const baridimob = document.getElementById('payment-baridimob')?.checked;
    const warning = document.getElementById('payment-warning');
    
    if (!usdt && !redotpay && !baridimob) {
        if (warning) warning.classList.remove('hidden');
    } else {
        if (warning) warning.classList.add('hidden');
    }
}

/**
 * Debounce function
 * @param {Function} func - الدالة للتأخير
 * @param {number} wait - وقت الانتظار بالميلي ثانية
 * @returns {Function} الدالة المؤخرة
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إدارة المنتجات المؤرشفة - Archived Products Functions
// Requirements: 10.2, 10.3, 10.5
// ═══════════════════════════════════════════════════════════════════════════

let archivedProductsVisible = false;
let archivedProductsList = [];

/**
 * تبديل عرض قسم المنتجات المؤرشفة
 */
function toggleArchivedSection() {
    const section = document.getElementById('archived-products-section');
    const btn = document.getElementById('toggle-archived-btn');
    
    if (!section) return;
    
    archivedProductsVisible = !archivedProductsVisible;
    
    if (archivedProductsVisible) {
        section.classList.remove('hidden');
        if (btn) btn.textContent = '🙈 إخفاء المؤرشفة';
        loadArchivedProductsUI();
    } else {
        section.classList.add('hidden');
        if (btn) btn.textContent = '👁️ عرض المؤرشفة';
    }
}

/**
 * تحميل وعرض المنتجات المؤرشفة
 */
async function loadArchivedProductsUI() {
    const tableBody = document.getElementById('archived-products-table-body');
    const countSpan = document.getElementById('archived-products-count');
    
    if (!tableBody) return;
    
    // Show loading
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">جاري التحميل...</td></tr>';
    
    try {
        // Check if ProductController is available
        if (typeof window.ProductController?.loadArchivedProducts === 'function' && window.db && window.firebaseModules) {
            archivedProductsList = await window.ProductController.loadArchivedProducts(window.db, window.firebaseModules);
        } else {
            // Fallback: filter from allProducts if available
            if (typeof window.allProducts !== 'undefined' && Array.isArray(window.allProducts)) {
                archivedProductsList = window.allProducts.filter(p => p.isArchived === true);
            } else {
                archivedProductsList = [];
            }
        }
        
        // Update count
        if (countSpan) countSpan.textContent = `(${archivedProductsList.length})`;
        
        // Render table
        renderArchivedProductsTable(archivedProductsList);
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات المؤرشفة:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-red-400">خطأ في تحميل المنتجات المؤرشفة</td></tr>';
    }
}

/**
 * عرض جدول المنتجات المؤرشفة
 * @param {Array} products - قائمة المنتجات المؤرشفة
 */
function renderArchivedProductsTable(products) {
    const tableBody = document.getElementById('archived-products-table-body');
    
    if (!tableBody) return;
    
    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">لا توجد منتجات مؤرشفة</td></tr>';
        return;
    }
    
    tableBody.innerHTML = products.map(product => {
        const name = product.name?.ar || product.name || 'بدون اسم';
        const price = product.priceDZD || 0;
        const mediaUrl = product.mediaUrl || '';
        const updatedAt = product.updatedAt ? formatDate(product.updatedAt) : 'غير محدد';
        
        return `
            <tr class="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                <td class="px-4 py-3">
                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-700">
                        ${mediaUrl ? 
                            (product.mediaType === 'video' ? 
                                `<video src="${escapeHtml(mediaUrl)}" class="w-full h-full object-cover" muted></video>` :
                                `<img src="${escapeHtml(mediaUrl)}" class="w-full h-full object-cover" alt="${escapeHtml(name)}">`
                            ) : 
                            '<div class="w-full h-full flex items-center justify-center text-gray-500">📦</div>'
                        }
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="font-medium">${escapeHtml(name)}</div>
                    <div class="text-gray-500 text-xs">${escapeHtml(product.id || '')}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="font-bold" style="color: var(--accent);">${price.toLocaleString()} د.ج</div>
                    <div class="text-gray-500 text-xs">${product.priceUSD || 0}$</div>
                </td>
                <td class="px-4 py-3 text-gray-400 text-sm">${updatedAt}</td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="restoreProductUI('${escapeHtml(product.id)}')" 
                            class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm" 
                            title="استعادة المنتج">
                            ♻️ استعادة
                        </button>
                        <button onclick="confirmDeleteProduct('${escapeHtml(product.id)}', '${escapeHtml(name)}')" 
                            class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm" 
                            title="حذف نهائي">
                            🗑️ حذف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * تنسيق التاريخ
 * @param {Date|Object} date - التاريخ
 * @returns {string} التاريخ المنسق
 */
function formatDate(date) {
    if (!date) return 'غير محدد';
    
    // Handle Firebase Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
        date = date.toDate();
    }
    
    // Handle string dates
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    if (!(date instanceof Date) || isNaN(date)) {
        return 'غير محدد';
    }
    
    return date.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * استعادة منتج مؤرشف
 * @param {string} productId - معرف المنتج
 */
async function restoreProductUI(productId) {
    if (!productId) return;
    
    if (!confirm('هل تريد استعادة هذا المنتج؟')) return;
    
    try {
        if (typeof window.ProductController?.restoreProduct === 'function' && window.db && window.firebaseModules) {
            await window.ProductController.restoreProduct(productId, window.db, window.firebaseModules);
            showToast('✅ تم استعادة المنتج بنجاح');
            
            // Refresh archived products list
            await loadArchivedProductsUI();
            
            // Refresh main products list if function exists
            if (typeof window.loadProductsV2Table === 'function') {
                await window.loadProductsV2Table();
            } else if (typeof window.loadProducts === 'function') {
                await window.loadProducts();
            }
        } else {
            showToast('خطأ: وظيفة الاستعادة غير متاحة', 'error');
        }
    } catch (error) {
        console.error('خطأ في استعادة المنتج:', error);
        showToast('خطأ في استعادة المنتج', 'error');
    }
}

/**
 * أرشفة منتج من الواجهة
 * @param {string} productId - معرف المنتج
 * @param {string} productName - اسم المنتج (للعرض)
 */
async function archiveProductUI(productId, productName = '') {
    if (!productId) return;
    
    const confirmMsg = productName ? 
        `هل تريد أرشفة المنتج "${productName}"؟\n\nسيتم إخفاء المنتج من الصفحة الرئيسية ولكن ستبقى بياناته محفوظة.` :
        'هل تريد أرشفة هذا المنتج؟';
    
    if (!confirm(confirmMsg)) return;
    
    try {
        if (typeof window.ProductController?.archiveProduct === 'function' && window.db && window.firebaseModules) {
            await window.ProductController.archiveProduct(productId, window.db, window.firebaseModules);
            showToast('✅ تم أرشفة المنتج بنجاح');
            
            // Refresh main products list
            if (typeof window.loadProductsV2Table === 'function') {
                await window.loadProductsV2Table();
            } else if (typeof window.loadProducts === 'function') {
                await window.loadProducts();
            }
            
            // Refresh archived products list if visible
            if (archivedProductsVisible) {
                await loadArchivedProductsUI();
            }
        } else {
            showToast('خطأ: وظيفة الأرشفة غير متاحة', 'error');
        }
    } catch (error) {
        console.error('خطأ في أرشفة المنتج:', error);
        showToast('خطأ في أرشفة المنتج', 'error');
    }
}

/**
 * تأكيد حذف منتج نهائياً
 * @param {string} productId - معرف المنتج
 * @param {string} productName - اسم المنتج (للعرض)
 */
async function confirmDeleteProduct(productId, productName = '') {
    if (!productId) return;
    
    const confirmMsg = productName ? 
        `⚠️ تحذير: هل تريد حذف المنتج "${productName}" نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات المنتج.` :
        '⚠️ تحذير: هل تريد حذف هذا المنتج نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه.';
    
    if (!confirm(confirmMsg)) return;
    
    // Double confirmation for permanent delete
    if (!confirm('هل أنت متأكد تماماً؟ سيتم حذف المنتج نهائياً!')) return;
    
    try {
        if (typeof window.ProductController?.deleteProduct === 'function' && window.db && window.firebaseModules) {
            await window.ProductController.deleteProduct(productId, window.db, window.firebaseModules);
            showToast('✅ تم حذف المنتج نهائياً');
            
            // Refresh archived products list
            await loadArchivedProductsUI();
            
            // Refresh main products list
            if (typeof window.loadProductsV2Table === 'function') {
                await window.loadProductsV2Table();
            } else if (typeof window.loadProducts === 'function') {
                await window.loadProducts();
            }
        } else {
            showToast('خطأ: وظيفة الحذف غير متاحة', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        showToast('خطأ في حذف المنتج', 'error');
    }
}

/**
 * تحديث عداد المنتجات المؤرشفة
 */
async function updateArchivedProductsCount() {
    const countSpan = document.getElementById('archived-products-count');
    if (!countSpan) return;
    
    try {
        let count = 0;
        
        if (typeof window.ProductController?.loadArchivedProducts === 'function' && window.db && window.firebaseModules) {
            const archived = await window.ProductController.loadArchivedProducts(window.db, window.firebaseModules);
            count = archived.length;
        } else if (typeof window.allProducts !== 'undefined' && Array.isArray(window.allProducts)) {
            count = window.allProducts.filter(p => p.isArchived === true).length;
        }
        
        countSpan.textContent = `(${count})`;
    } catch (error) {
        console.error('خطأ في تحديث عداد المنتجات المؤرشفة:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الدوال للاستخدام العام - Export Functions
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// نافذة المعاينة المحسنة - Enhanced Preview Modal Functions
// Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
// ═══════════════════════════════════════════════════════════════════════════

let currentPreviewLanguage = 'ar';
let previewProductData = null;
let originalProductData = null;

/**
 * فتح نافذة المعاينة مع بيانات المنتج
 * @param {Object|null} productData - بيانات المنتج للمعاينة (null = جمع من النموذج)
 */
function openPreviewModal(productData = null) {
    const modal = document.getElementById('product-preview-modal');
    if (!modal) return;
    
    // If no product data provided, collect from form
    if (!productData) {
        productData = collectProductFormData();
    }
    
    // Validate before preview
    const validation = validateProductFormData(productData);
    if (!validation.valid) {
        showToast(validation.errors.join('\n'), 'error');
        return;
    }
    
    // Store product data for preview
    previewProductData = productData;
    
    // Store original data for cancel functionality
    if (window.editingProductId && window.allProducts) {
        originalProductData = window.allProducts.find(p => p.id === window.editingProductId);
    } else {
        originalProductData = null;
    }
    
    // Reset language to Arabic
    currentPreviewLanguage = 'ar';
    updatePreviewLanguageButtons();
    
    // Render preview
    renderPreviewContent(productData, currentPreviewLanguage);
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المعاينة
 */
function closePreviewModal() {
    const modal = document.getElementById('product-preview-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    previewProductData = null;
}

/**
 * تغيير لغة المعاينة
 * @param {string} lang - اللغة (ar, en, fr)
 */
function setPreviewLanguage(lang) {
    currentPreviewLanguage = lang;
    updatePreviewLanguageButtons();
    
    if (previewProductData) {
        renderPreviewContent(previewProductData, lang);
    }
}

/**
 * تحديث أزرار اللغة في المعاينة
 */
function updatePreviewLanguageButtons() {
    const buttons = document.querySelectorAll('.preview-lang-btn');
    buttons.forEach(btn => {
        if (btn.dataset.lang === currentPreviewLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * الحصول على الترجمة مع fallback للعربية
 * @param {Object} translations - كائن الترجمات
 * @param {string} lang - اللغة المطلوبة
 * @returns {string} النص المترجم
 */
function getTranslationWithFallback(translations, lang) {
    if (!translations) return '';
    if (typeof translations === 'string') return translations;
    
    // Try requested language first
    if (translations[lang] && translations[lang].trim()) {
        return translations[lang];
    }
    
    // Fallback to Arabic
    if (translations.ar && translations.ar.trim()) {
        return translations.ar;
    }
    
    // Fallback to any available translation
    return translations.en || translations.fr || '';
}

/**
 * عرض محتوى المعاينة
 * @param {Object} productData - بيانات المنتج
 * @param {string} lang - اللغة
 */
function renderPreviewContent(productData, lang) {
    const content = document.getElementById('product-preview-content');
    if (!content) return;
    
    const name = getTranslationWithFallback(productData.name, lang);
    const description = getTranslationWithFallback(productData.description, lang);
    
    // Availability badge
    const availabilityBadges = {
        available: { class: 'available', text: { ar: '✅ متوفر', en: '✅ Available', fr: '✅ Disponible' } },
        unavailable: { class: 'unavailable', text: { ar: '❌ غير متوفر', en: '❌ Unavailable', fr: '❌ Indisponible' } },
        coming_soon: { class: 'coming-soon', text: { ar: '🔜 قريباً', en: '🔜 Coming Soon', fr: '🔜 Bientôt' } }
    };
    
    const availability = productData.availability || 'available';
    const badge = availabilityBadges[availability] || availabilityBadges.available;
    const isDisabled = availability !== 'available';
    
    // Order button text
    const orderButtonText = {
        ar: 'اطلب الآن',
        en: 'Order Now',
        fr: 'Commander'
    };
    
    // Build features HTML
    let featuresHtml = '';
    if (productData.features && productData.features.length > 0) {
        const featureItems = productData.features.map(f => {
            const featureText = getTranslationWithFallback(f.text, lang);
            return featureText ? `<li>${escapeHtml(featureText)}</li>` : '';
        }).filter(f => f).join('');
        
        if (featureItems) {
            featuresHtml = `<ul class="preview-features">${featureItems}</ul>`;
        }
    }
    
    // Build sub-offers HTML
    let subOffersHtml = '';
    if (productData.subOffers && productData.subOffers.length > 0) {
        const subOfferButtons = productData.subOffers.map((so, index) => {
            const soName = getTranslationWithFallback(so.name, lang);
            const soAvailable = so.availability === 'available';
            return `
                <button type="button" class="preview-sub-offer-btn ${index === 0 ? 'active' : ''}" 
                    onclick="selectPreviewSubOffer(${index})"
                    ${!soAvailable ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    ${escapeHtml(soName)}
                </button>
            `;
        }).join('');
        
        subOffersHtml = `<div class="preview-sub-offers">${subOfferButtons}</div>`;
    }
    
    // Build payment methods HTML
    let paymentMethodsHtml = '';
    const paymentMethods = productData.paymentMethods || { usdt: true, redotpay: true, baridimob: true };
    
    if (paymentMethods.usdt) {
        paymentMethodsHtml += `<button class="preview-payment-btn usdt">💰 USDT</button>`;
    }
    if (paymentMethods.redotpay) {
        paymentMethodsHtml += `<button class="preview-payment-btn redotpay">💳 RedotPay</button>`;
    }
    if (paymentMethods.baridimob) {
        paymentMethodsHtml += `<button class="preview-payment-btn baridimob">📱 BaridiMob</button>`;
    }
    
    // Build media HTML
    let mediaHtml = '<div class="preview-media"><div class="w-full h-full flex items-center justify-center text-gray-500 text-4xl">📦</div></div>';
    if (productData.mediaUrl) {
        if (productData.mediaType === 'video') {
            mediaHtml = `
                <div class="preview-media">
                    <video src="${escapeHtml(productData.mediaUrl)}" autoplay muted loop playsinline></video>
                </div>
            `;
        } else {
            mediaHtml = `
                <div class="preview-media">
                    <img src="${escapeHtml(productData.mediaUrl)}" alt="${escapeHtml(name)}" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-gray-500 text-4xl\\'>📦</div>'">
                </div>
            `;
        }
    }
    
    // Currency label
    const currencyLabel = {
        ar: 'د.ج',
        en: 'DZD',
        fr: 'DA'
    };
    
    // Render the preview card
    content.innerHTML = `
        <div class="preview-product-card" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
            ${mediaHtml}
            
            <h4 class="preview-title">${escapeHtml(name) || 'بدون اسم'}</h4>
            
            ${description ? `<p class="preview-description">${escapeHtml(description)}</p>` : ''}
            
            <div class="preview-badge ${badge.class}">${badge.text[lang] || badge.text.ar}</div>
            
            ${subOffersHtml}
            
            <div class="preview-price-tag" id="preview-price-dzd">
                ${(productData.priceDZD || 0).toLocaleString()} ${currencyLabel[lang] || currencyLabel.ar}
            </div>
            <div class="preview-price-usd" id="preview-price-usd">
                ${productData.priceUSD || 0}$
            </div>
            
            ${paymentMethodsHtml ? `<div class="preview-payment-methods">${paymentMethodsHtml}</div>` : ''}
            
            ${featuresHtml}
            
            <button class="preview-order-btn" ${isDisabled ? 'disabled' : ''}>
                ${orderButtonText[lang] || orderButtonText.ar}
            </button>
        </div>
    `;
}

/**
 * اختيار عرض فرعي في المعاينة
 * @param {number} index - فهرس العرض الفرعي
 */
function selectPreviewSubOffer(index) {
    if (!previewProductData || !previewProductData.subOffers) return;
    
    const subOffer = previewProductData.subOffers[index];
    if (!subOffer) return;
    
    // Update active button
    const buttons = document.querySelectorAll('.preview-sub-offer-btn');
    buttons.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update prices
    const priceDzdEl = document.getElementById('preview-price-dzd');
    const priceUsdEl = document.getElementById('preview-price-usd');
    
    const currencyLabel = {
        ar: 'د.ج',
        en: 'DZD',
        fr: 'DA'
    };
    
    if (priceDzdEl) {
        priceDzdEl.textContent = `${(subOffer.priceDZD || 0).toLocaleString()} ${currencyLabel[currentPreviewLanguage] || currencyLabel.ar}`;
    }
    if (priceUsdEl) {
        priceUsdEl.textContent = `${subOffer.priceUSD || 0}$`;
    }
}

/**
 * إلغاء التغييرات وإغلاق المعاينة
 * Requirements: 11.5
 */
function cancelPreviewChanges() {
    // Close preview modal
    closePreviewModal();
    
    // If editing existing product, restore original data to form
    if (originalProductData && window.editingProductId) {
        // Restore original data to form
        loadProductDataToForm(window.editingProductId);
        showToast('تم إلغاء التغييرات', 'warning');
    } else if (window.editingProductId === null) {
        // For new product, reset the form completely
        if (typeof resetProductForm === 'function') {
            resetProductForm();
        }
        showToast('تم إلغاء الإضافة');
    } else {
        showToast('تم إلغاء المعاينة');
    }
    
    // Clear stored data - this ensures changes are discarded
    previewProductData = null;
    originalProductData = null;
}

/**
 * تأكيد ونشر التغييرات
 * Requirements: 11.4
 */
async function confirmAndPublish() {
    if (!previewProductData) {
        showToast('لا توجد بيانات للنشر', 'error');
        return;
    }
    
    // Close preview modal first
    closePreviewModal();
    
    try {
        // Save product directly to Firebase
        const productData = prepareProductDataForSave(previewProductData);
        
        // Check if Firebase is available
        if (!window.db || !window.firebaseModules) {
            showToast('خطأ: Firebase غير متاح', 'error');
            return;
        }
        
        const { setDoc, doc, deleteDoc, serverTimestamp } = window.firebaseModules;
        
        // Generate ID if new product
        if (!productData.id) {
            productData.id = 'product_' + Date.now();
        }
        
        // Add timestamps
        productData.updatedAt = serverTimestamp();
        if (!window.editingProductId) {
            productData.createdAt = serverTimestamp();
        }
        
        // Save to the main products collection. A deleted marker may exist if this
        // product was previously removed and is now intentionally recreated.
        if (deleteDoc) {
            await deleteDoc(doc(window.db, 'deleted_products', productData.id));
        }
        await setDoc(doc(window.db, 'products_v2', productData.id), productData, { merge: true });
        
        // Update local products array
        if (window.allProducts) {
            const index = window.allProducts.findIndex(p => p.id === productData.id);
            if (index >= 0) {
                window.allProducts[index] = productData;
            } else {
                window.allProducts.push(productData);
            }
        }
        
        // Refresh products table
        if (typeof window.displayProductsTable === 'function') {
            window.displayProductsTable();
        }
        
        // Close product modal if open
        if (typeof window.closeProductModalV2 === 'function') {
            window.closeProductModalV2();
        } else if (typeof window.closeProductModal === 'function') {
            window.closeProductModal();
        }
        
        showToast('✅ تم نشر المنتج بنجاح');
        
        // Log activity
        if (typeof window.logActivity === 'function') {
            window.logActivity('product', window.editingProductId ? 'updated' : 'created', productData.name?.ar || productData.name);
        }
        
    } catch (error) {
        console.error('خطأ في نشر المنتج:', error);
        showToast('خطأ في نشر المنتج: ' + error.message, 'error');
    }
    
    // Clear stored data
    previewProductData = null;
    originalProductData = null;
}

/**
 * تحضير بيانات المنتج للحفظ
 * @param {Object} data - بيانات المنتج من المعاينة
 * @returns {Object} بيانات المنتج جاهزة للحفظ
 */
function prepareProductDataForSave(data) {
    // Get existing product for preserving order
    const existingProduct = window.allProducts?.find(p => p.id === data.id);
    
    return {
        id: data.id || null,
        name: data.name?.ar || data.name,
        name_translations: data.name,
        category: data.category || 'subscriptions',
        price_dzd: data.priceDZD || 0,
        price_usd: data.priceUSD || 0,
        priceDZD: data.priceDZD || 0,
        priceUSD: data.priceUSD || 0,
        old_price_dzd: data.old_price_dzd || null,
        old_price_usd: data.old_price_usd || null,
        cost_dzd: data.cost_dzd || null,
        cost_usd: data.cost_usd || null,
        supplier: data.supplier || null,
        stock: data.stock || null,
        image: data.mediaUrl || '',
        mediaUrl: data.mediaUrl || '',
        mediaType: data.mediaType || 'image',
        features: data.features || [],
        paymentMethods: data.paymentMethods || { usdt: true, redotpay: true, baridimob: true },
        subOffers: data.subOffers || [],
        whatsappMsg: data.whatsapp_msg || '',
        whatsapp_msg: data.whatsapp_msg || '',
        description: data.description || { ar: '', en: '', fr: '' },
        availability: data.availability || 'available',
        available: data.availability === 'available',
        status: data.availability || 'available',
        active: data.active !== false,
        featured: data.featured || false,
        isArchived: data.isArchived || false,
        displayOrder: data.displayOrder || existingProduct?.displayOrder || existingProduct?.order || 0,
        order: existingProduct?.order || data.displayOrder || 0
    };
}

/**
 * معاينة المنتج من الجدول (للمنتجات الموجودة)
 * @param {string} productId - معرف المنتج
 */
function previewExistingProduct(productId) {
    const product = window.allProducts?.find(p => p.id === productId);
    if (!product) {
        showToast('المنتج غير موجود', 'error');
        return;
    }
    
    // Convert to preview format
    const previewData = {
        id: product.id,
        name: product.name || { ar: product.name },
        description: product.description || { ar: '' },
        priceDZD: product.priceDZD || product.price_dzd || 0,
        priceUSD: product.priceUSD || product.price_usd || 0,
        availability: product.availability || (product.available === false ? 'unavailable' : 'available'),
        mediaUrl: product.mediaUrl || product.image || '',
        mediaType: product.mediaType || detectMediaType(product.mediaUrl || product.image || ''),
        paymentMethods: product.paymentMethods || { usdt: true, redotpay: true, baridimob: true },
        features: product.features || [],
        subOffers: product.subOffers || []
    };
    
    // Store for cancel functionality
    originalProductData = product;
    window.editingProductId = productId;
    
    // Open preview with this data
    openPreviewModal(previewData);
    
    // Hide action buttons for view-only preview
    const actionButtons = document.getElementById('preview-action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = `
            <button type="button" onclick="closePreviewModal()" class="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
                إغلاق
            </button>
            <button type="button" onclick="closePreviewModal(); openProductModalV2('${escapeHtml(productId)}')" class="px-6 py-3 rounded-lg transition-colors" style="background: var(--accent); color: #1b1d32; font-weight: 700;">
                ✏️ تعديل
            </button>
        `;
    }
}

// Make functions available globally
function renderSubOffersContainerV2() {
    const container = document.getElementById('sub-offers-container');
    if (!container) return;

    if (!currentProductSubOffers.length) {
        container.innerHTML = `
            <div class="admin-empty-offers">
                <strong>لا توجد عروض فرعية بعد</strong>
                <span>أضف عرض شهر، 3 أشهر، سنة، Pro أو API من الزر بالأسفل.</span>
            </div>`;
        return;
    }

    const labels = {
        available: { text: 'متوفر', className: 'available' },
        unavailable: { text: 'غير متوفر', className: 'unavailable' },
        coming_soon: { text: 'قريباً', className: 'coming-soon' }
    };

    container.innerHTML = currentProductSubOffers.map((subOffer, index) => {
        const status = labels[subOffer.availability || 'available'] || labels.available;
        const name = subOffer.name?.ar || subOffer.name?.en || subOffer.id || 'عرض فرعي';
        const dzd = Number(subOffer.priceDZD || subOffer.price_dzd || 0).toLocaleString('ar-DZ');
        const usd = Number(subOffer.priceUSD || subOffer.price_usd || 0);

        return `
            <div class="admin-suboffer-item">
                <div>
                    <div class="admin-suboffer-title">${escapeHtml(name)}</div>
                    <div class="admin-suboffer-meta">
                        <span>${escapeHtml(subOffer.id || '')}</span>
                        <span>${dzd} د.ج</span>
                        <span>$${usd}</span>
                    </div>
                </div>
                <div class="admin-suboffer-actions">
                    <span class="admin-suboffer-status ${status.className}">${status.text}</span>
                    <button type="button" onclick="openSubOfferModal(${index})">تعديل</button>
                    <button type="button" class="danger" onclick="removeSubOffer(${index})">حذف</button>
                </div>
            </div>`;
    }).join('');
}

renderSubOffersContainer = renderSubOffersContainerV2;

if (typeof window !== 'undefined') {
    window.openProductModalV2 = openProductModalV2;
    window.closeProductModalV2 = closeProductModalV2;
    window.resetProductForm = resetProductForm;
    window.loadProductDataToForm = loadProductDataToForm;
    window.addFeatureRow = addFeatureRow;
    window.removeFeature = removeFeature;
    window.moveFeatureUp = moveFeatureUp;
    window.moveFeatureDown = moveFeatureDown;
    window.updateFeatureText = updateFeatureText;
    window.renderFeaturesContainer = renderFeaturesContainer;
    window.openSubOfferModal = openSubOfferModal;
    window.closeSubOfferModal = closeSubOfferModal;
    window.saveSubOffer = saveSubOffer;
    window.removeSubOffer = removeSubOffer;
    window.renderSubOffersContainer = renderSubOffersContainer;
    window.previewProductMedia = previewProductMedia;
    window.detectMediaType = detectMediaType;
    window.collectProductFormData = collectProductFormData;
    window.validateProductFormData = validateProductFormData;
    window.previewProductChanges = previewProductChanges;
    window.initProductFormEvents = initProductFormEvents;
    window.checkPaymentMethods = checkPaymentMethods;
    // Archived products functions
    window.toggleArchivedSection = toggleArchivedSection;
    window.loadArchivedProductsUI = loadArchivedProductsUI;
    window.renderArchivedProductsTable = renderArchivedProductsTable;
    window.restoreProductUI = restoreProductUI;
    window.archiveProductUI = archiveProductUI;
    window.confirmDeleteProduct = confirmDeleteProduct;
    window.updateArchivedProductsCount = updateArchivedProductsCount;
    // Enhanced Preview Modal functions
    window.openPreviewModal = openPreviewModal;
    window.closePreviewModal = closePreviewModal;
    window.setPreviewLanguage = setPreviewLanguage;
    window.selectPreviewSubOffer = selectPreviewSubOffer;
    window.cancelPreviewChanges = cancelPreviewChanges;
    window.confirmAndPublish = confirmAndPublish;
    window.prepareProductDataForSave = prepareProductDataForSave;
    window.previewExistingProduct = previewExistingProduct;
    window.getTranslationWithFallback = getTranslationWithFallback;
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', initProductFormEvents);
}
