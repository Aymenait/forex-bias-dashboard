// 📡 Products API Endpoint
// هذا الملف يعطي الأسعار الحالية للـ Instagram Bot

// Import products from currency-config.js
import { PRODUCTS, PAYMENT_METHODS } from './currency-config.js';

/**
 * Get all products with current prices
 * @returns {Object} Products data
 */
function getAllProducts() {
    const productsData = [];

    Object.keys(PRODUCTS).forEach(key => {
        const product = PRODUCTS[key];

        // Skip unavailable products
        if (product.available === false) {
            return;
        }

        const productInfo = {
            id: product.id,
            name: product.name,
            price_dzd: product.price_dzd,
            price_usd: product.price_usd,
            description: product.description?.ar || '',
            durations: []
        };

        // Add durations if available
        if (product.durations) {
            Object.keys(product.durations).forEach(durKey => {
                const dur = product.durations[durKey];
                productInfo.durations.push({
                    key: durKey,
                    price_dzd: dur.dzd,
                    price_usd: dur.usd
                });
            });
        }

        productsData.push(productInfo);
    });

    return {
        products: productsData,
        payment_methods: getPaymentMethods(),
        last_updated: new Date().toISOString()
    };
}

/**
 * Get payment methods
 * @returns {Array} Payment methods
 */
function getPaymentMethods() {
    return [
        {
            id: 'baridimob',
            name: 'BaridiMob',
            icon: '💳',
            rip: PAYMENT_METHODS.baridimob.info.rip
        },
        {
            id: 'usdt',
            name: 'USDT (Crypto)',
            icon: '₿',
            networks: {
                trc20: PAYMENT_METHODS.crypto.info.networks.TRC20,
                erc20: PAYMENT_METHODS.crypto.info.networks.ERC20,
                bep20: PAYMENT_METHODS.crypto.info.networks.BEP20
            }
        },
        {
            id: 'binance',
            name: 'Binance Pay',
            icon: '🟡',
            pay_id: PAYMENT_METHODS.crypto.info.binance_pay_id || ''
        },
        {
            id: 'redotpay',
            name: 'RedotPay',
            icon: '💳',
            id_number: PAYMENT_METHODS.redotpay.info.id
        }
    ];
}

/**
 * Get specific product by ID
 * @param {string} productId - Product ID
 * @returns {Object|null} Product data or null
 */
function getProductById(productId) {
    const product = PRODUCTS[productId];
    if (!product || product.available === false) {
        return null;
    }

    return {
        id: product.id,
        name: product.name,
        price_dzd: product.price_dzd,
        price_usd: product.price_usd,
        description: product.description?.ar || '',
        durations: product.durations || null
    };
}

/**
 * Search products by name
 * @param {string} query - Search query
 * @returns {Array} Matching products
 */
function searchProducts(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    Object.keys(PRODUCTS).forEach(key => {
        const product = PRODUCTS[key];

        if (product.available === false) {
            return;
        }

        if (
            product.name.toLowerCase().includes(lowerQuery) ||
            product.id.toLowerCase().includes(lowerQuery) ||
            (product.description?.ar && product.description.ar.includes(query))
        ) {
            results.push({
                id: product.id,
                name: product.name,
                price_dzd: product.price_dzd,
                price_usd: product.price_usd,
                description: product.description?.ar || ''
            });
        }
    });

    return results;
}

// Export functions
export {
    getAllProducts,
    getProductById,
    searchProducts,
    getPaymentMethods
};

// End of file
