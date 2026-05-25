/**
 * Canonical product IDs shared by admin, homepage loader, and verification scripts.
 *
 * Direction: stale/ghost Firebase doc ID → admin-managed canonical doc ID.
 * This must match KNOWN_DUPLICATES in firebase-products-loader.js.
 */
const CANONICAL_PRODUCT_ID_ALIASES = {
    // Stale short-ID ghost docs → admin-managed long-ID docs
    'canva':                    'canva-pro',
    'netflix':                  'netflix-premium',
    'duolingo':                 'duolingo-super',
    'primevideo':               'prime-video',
    'lovable':                  'lovable-ai',
    'cursor':                   'cursor-ai',
    'perplexity':               'perplexity-ai-pro',
    // Stale long-ID ghost docs → admin-managed short-ID docs
    'the-real-world-account':   'trw',
    'google-gemini-pro-veo-3':  'google-ai',
    'capcut-pro':               'capcut',
    // Other aliases
    'gama-ai-pro':              'gamma',
    'youtube-premium':          'youtube',
    'microsoft-office-365':     'microsoft-office',
    'super-grok':               'super-grok',
    // UI card/element IDs → canonical product IDs
    'product-chatgpt':          'chatgpt',
    'product-claude':           'claude',
    'grok-card':                'super-grok',
    'gamma-card':               'gamma',
    'adobe-card':               'adobe',
    'veo-order-btn':            'google-ai'
};

function normalizeProductIdSlug(value = '') {
    return String(value || '')
        .toLowerCase()
        .replace(/^product-/, '')
        .replace(/-card$/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function resolveCanonicalProductId(rawId = '', fallbackName = '') {
    const normalizedRaw = normalizeProductIdSlug(rawId);
    if (CANONICAL_PRODUCT_ID_ALIASES[normalizedRaw]) {
        return CANONICAL_PRODUCT_ID_ALIASES[normalizedRaw];
    }

    const normalizedName = normalizeProductIdSlug(fallbackName);
    if (CANONICAL_PRODUCT_ID_ALIASES[normalizedName]) {
        return CANONICAL_PRODUCT_ID_ALIASES[normalizedName];
    }

    return normalizedRaw || normalizedName;
}

if (typeof window !== 'undefined') {
    window.ProductIdUtils = {
        CANONICAL_PRODUCT_ID_ALIASES,
        normalizeProductIdSlug,
        resolveCanonicalProductId
    };
}
