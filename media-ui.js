/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Media UI Manager - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * وحدة إدارة عرض الوسائط (صور وفيديوهات) في الصفحة الرئيسية
 * تتضمن دوال اكتشاف نوع الوسائط وعرضها بالشكل المناسب
 * 
 * Requirements: 6.2, 6.5, 6.6
 */

// ═══════════════════════════════════════════════════════════════════════════
// ثوابت أنواع الوسائط - Media Type Constants
// ═══════════════════════════════════════════════════════════════════════════

const MEDIA_TYPE = {
    IMAGE: 'image',
    VIDEO: 'video'
};

/**
 * الامتدادات المسموح بها للصور
 */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif'];

/**
 * الامتدادات المسموح بها للفيديو
 */
const VIDEO_EXTENSIONS = ['.mp4'];

// ═══════════════════════════════════════════════════════════════════════════
// دوال اكتشاف نوع الوسائط - Media Type Detection Functions
// Requirements: 6.2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * اكتشاف نوع الوسائط من الرابط
 * @param {string} url - رابط الوسائط
 * @returns {string|null} نوع الوسائط ('image' أو 'video') أو null إذا كان غير صالح
 * 
 * @example
 * detectMediaType('https://i.imgur.com/abc.png')  // 'image'
 * detectMediaType('https://i.imgur.com/xyz.mp4') // 'video'
 * detectMediaType('https://i.imgur.com/test.gif') // 'image'
 */
function detectMediaType(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    const trimmedUrl = url.trim().toLowerCase();
    
    // التحقق من امتداد الصور
    const isImage = IMAGE_EXTENSIONS.some(ext => trimmedUrl.endsWith(ext));
    if (isImage) {
        return MEDIA_TYPE.IMAGE;
    }
    
    // التحقق من امتداد الفيديو
    const isVideo = VIDEO_EXTENSIONS.some(ext => trimmedUrl.endsWith(ext));
    if (isVideo) {
        return MEDIA_TYPE.VIDEO;
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إنشاء عناصر الوسائط - Media Element Creation Functions
// Requirements: 6.5, 6.6
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء عنصر صورة للعرض كـ background-image
 * @param {string} url - رابط الصورة
 * @param {string} altText - النص البديل للصورة
 * @returns {HTMLElement} عنصر div مع background-image
 */
function createImageElement(url, altText = '') {
    const container = document.createElement('div');
    container.className = 'product-image';
    container.style.backgroundImage = `url('${escapeUrl(url)}')`;
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', altText);
    
    return container;
}

/**
 * إنشاء عنصر فيديو مع autoplay, muted, loop
 * @param {string} url - رابط الفيديو
 * @param {string} altText - النص البديل للفيديو
 * @returns {HTMLElement} عنصر div يحتوي على video
 */
function createVideoElement(url, altText = '') {
    const container = document.createElement('div');
    container.className = 'product-image';
    container.style.backgroundColor = '#000';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', altText);
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    
    const source = document.createElement('source');
    source.src = escapeUrl(url);
    source.type = 'video/mp4';
    
    video.appendChild(source);
    container.appendChild(video);
    
    return container;
}

/**
 * إنشاء عنصر وسائط بناءً على نوع الرابط
 * @param {string} url - رابط الوسائط
 * @param {string} mediaType - نوع الوسائط (اختياري، سيتم اكتشافه تلقائياً)
 * @param {string} altText - النص البديل
 * @returns {HTMLElement|null} عنصر الوسائط أو null إذا كان الرابط غير صالح
 */
function createMediaElement(url, mediaType = null, altText = '') {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return null;
    }
    
    // اكتشاف نوع الوسائط إذا لم يتم تحديده
    const type = mediaType || detectMediaType(url);
    
    if (type === MEDIA_TYPE.VIDEO) {
        return createVideoElement(url, altText);
    } else if (type === MEDIA_TYPE.IMAGE) {
        return createImageElement(url, altText);
    }
    
    // افتراضياً، نعامل الرابط كصورة
    return createImageElement(url, altText);
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال تحديث عناصر الوسائط - Media Element Update Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث عنصر الوسائط في بطاقة المنتج
 * @param {HTMLElement} productCard - عنصر بطاقة المنتج
 * @param {string} url - رابط الوسائط الجديد
 * @param {string} mediaType - نوع الوسائط (اختياري)
 * @param {string} altText - النص البديل
 */
function updateProductCardMedia(productCard, url, mediaType = null, altText = '') {
    if (!productCard) return;
    
    // البحث عن عنصر الوسائط الحالي
    const existingMedia = productCard.querySelector('.product-image');
    
    if (!url || url.trim() === '') {
        // إذا لم يكن هناك رابط، نحتفظ بالعنصر الحالي
        return;
    }
    
    // اكتشاف نوع الوسائط
    const type = mediaType || detectMediaType(url);
    
    if (existingMedia) {
        // تحديث العنصر الموجود
        if (type === MEDIA_TYPE.VIDEO) {
            // تحويل إلى فيديو
            const newMedia = createVideoElement(url, altText);
            
            // نقل أي badges موجودة
            const badges = existingMedia.querySelectorAll('.availability-badge');
            badges.forEach(badge => newMedia.appendChild(badge.cloneNode(true)));
            
            existingMedia.replaceWith(newMedia);
        } else {
            // تحديث الصورة
            // إزالة أي فيديو موجود
            const existingVideo = existingMedia.querySelector('video');
            if (existingVideo) {
                existingVideo.remove();
            }
            
            existingMedia.style.backgroundImage = `url('${escapeUrl(url)}')`;
            existingMedia.style.backgroundColor = '';
            existingMedia.setAttribute('aria-label', altText);
        }
    } else {
        // إنشاء عنصر جديد
        const newMedia = createMediaElement(url, type, altText);
        if (newMedia) {
            // إضافة في بداية البطاقة
            productCard.insertBefore(newMedia, productCard.firstChild);
        }
    }
}

/**
 * تحديث جميع بطاقات المنتجات بالوسائط من Firebase
 * @param {Array} products - قائمة المنتجات مع بيانات الوسائط
 */
function updateAllProductCardsMedia(products) {
    if (!Array.isArray(products)) return;
    
    products.forEach(product => {
        if (!product.id) return;
        
        // البحث عن بطاقة المنتج
        const productCard = document.querySelector(
            `[data-product-id="${product.id}"]`
        )?.closest('.product-card');
        
        if (productCard && product.mediaUrl) {
            const altText = product.name?.ar || product.name || '';
            updateProductCardMedia(productCard, product.mediaUrl, product.mediaType, altText);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال إنشاء HTML للوسائط - Media HTML Generation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * إنشاء HTML لعنصر الوسائط
 * @param {string} url - رابط الوسائط
 * @param {string} mediaType - نوع الوسائط (اختياري)
 * @param {string} altText - النص البديل
 * @returns {string} HTML string
 */
function generateMediaHTML(url, mediaType = null, altText = '') {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return '<div class="product-image" style="background-color: #333;"></div>';
    }
    
    const type = mediaType || detectMediaType(url);
    const escapedUrl = escapeHtml(url);
    const escapedAlt = escapeHtml(altText);
    
    if (type === MEDIA_TYPE.VIDEO) {
        return `
            <div class="product-image" style="background: #000; position: relative; overflow: hidden;" role="img" aria-label="${escapedAlt}">
                <video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;">
                    <source src="${escapedUrl}" type="video/mp4">
                </video>
            </div>
        `.trim();
    }
    
    return `<div class="product-image" style="background-image: url('${escapedUrl}');" role="img" aria-label="${escapedAlt}"></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال مساعدة - Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تنظيف URL لمنع XSS
 * @param {string} url - الرابط
 * @returns {string} الرابط المنظف
 */
function escapeUrl(url) {
    if (!url) return '';
    return url.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * تنظيف HTML لمنع XSS
 * @param {string} str - النص
 * @returns {string} النص المنظف
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال للاختبار - Testing Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على حالة الوسائط المتوقعة
 * @param {string} url - رابط الوسائط
 * @returns {Object} حالة الوسائط المتوقعة
 */
function getExpectedMediaState(url) {
    const type = detectMediaType(url);
    
    return {
        mediaType: type,
        isImage: type === MEDIA_TYPE.IMAGE,
        isVideo: type === MEDIA_TYPE.VIDEO,
        hasBackgroundImage: type === MEDIA_TYPE.IMAGE,
        hasVideoElement: type === MEDIA_TYPE.VIDEO,
        videoAttributes: type === MEDIA_TYPE.VIDEO ? {
            autoplay: true,
            muted: true,
            loop: true,
            playsInline: true
        } : null
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.MediaUI = {
        MEDIA_TYPE,
        IMAGE_EXTENSIONS,
        VIDEO_EXTENSIONS,
        detectMediaType,
        createImageElement,
        createVideoElement,
        createMediaElement,
        updateProductCardMedia,
        updateAllProductCardsMedia,
        generateMediaHTML,
        escapeUrl,
        escapeHtml,
        getExpectedMediaState
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
export {
    MEDIA_TYPE,
    IMAGE_EXTENSIONS,
    VIDEO_EXTENSIONS,
    detectMediaType,
    createImageElement,
    createVideoElement,
    createMediaElement,
    updateProductCardMedia,
    updateAllProductCardsMedia,
    generateMediaHTML,
    escapeUrl,
    escapeHtml,
    getExpectedMediaState
};
