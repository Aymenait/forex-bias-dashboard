/**
 * Canonical product IDs shared by admin, homepage loader, and verification scripts.
 */
export const CANONICAL_PRODUCT_ID_ALIASES = {
    'capcut-pro': 'capcut',
    'lovable-ai': 'lovable',
    'the-real-world-account': 'trw',
    'gama-ai-pro': 'gamma',
    'canva-pro': 'canva',
    'netflix-premium': 'netflix',
    'prime-video': 'primevideo',
    'youtube-premium': 'youtube',
    'microsoft-office-365': 'microsoft-office',
    'duolingo-super': 'duolingo',
    'google-gemini-pro-veo-3': 'google-ai',
    'perplexity-ai-pro': 'perplexity',
    'cursor-ai': 'cursor',
    'super-grok': 'super-grok',
    'product-chatgpt': 'chatgpt',
    'product-claude': 'claude',
    'grok-card': 'super-grok',
    'gamma-card': 'gamma',
    'adobe-card': 'adobe',
    'veo-order-btn': 'google-ai'
};

export function normalizeProductIdSlug(value = '') {
    return String(value || '')
        .toLowerCase()
        .replace(/^product-/, '')
        .replace(/-card$/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function resolveCanonicalProductId(rawId = '', fallbackName = '') {
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

