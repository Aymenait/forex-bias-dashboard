// Currency Configuration
const CURRENCIES = {
  DZD: {
    code: 'DZD',
    symbol: {
      ar: 'د.ج',
      en: 'DA',
      fr: 'DA'
    },
    flag: '🇩🇿',
    name: {
      ar: 'دينار جزائري',
      en: 'Algerian Dinar',
      fr: 'Dinar Algérien'
    },
    countries: ['DZ', 'Algeria']
  },
  USD: {
    code: 'USD',
    symbol: {
      ar: '$',
      en: '$',
      fr: '$'
    },
    flag: '🇺🇸',
    name: {
      ar: 'دولار أمريكي',
      en: 'US Dollar',
      fr: 'Dollar Américain'
    },
    countries: [] // default for all other countries
  }
};

// Helper function to get currency symbol based on language
function getCurrencySymbol(currencyCode, lang = 'ar') {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return currencyCode;
  
  if (typeof currency.symbol === 'object') {
    return currency.symbol[lang] || currency.symbol.ar;
  }
  return currency.symbol;
}

// Payment Methods Configuration
const PAYMENT_METHODS = {
  baridimob: {
    id: 'baridimob',
    name: 'BaridiMob',
    icon: '💳',
    currencies: ['DZD'],
    priority: 3,
    info: {
      rip: '00799999002787548473'
    }
  },
  crypto: {
    id: 'crypto',
    name: 'USDT',
    icon: '₿',
    currencies: ['DZD', 'USD'],
    priority: 1,
    info: {
      networks: {
        TRC20: 'TWTgY41LNFqZcgBiRCZYsSq6ooeCx8gus9',
        ERC20: 'ERC20_ADDRESS',
        BEP20: 'BEP20_ADDRESS'
      }
    }
  },
  redotpay: {
    id: 'redotpay',
    name: 'RedotPay',
    icon: '💳',
    currencies: ['DZD', 'USD'],
    priority: 2,
    info: {
      id: '1117632168'
    }
  }
};

// Product Data with USD prices
const PRODUCTS = {
  'trw': {
    id: 'trw',
    name: 'The Real World Account',
    price_dzd: 3750,
    price_usd: 15,
    description: {
      ar: 'حساب مشترك للكورسات ومنصة The Real World',
      en: 'Shared account for courses and The Real World platform',
      fr: 'Compte partagé pour les cours et la plateforme The Real World'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'chatgpt': {
    id: 'chatgpt',
    name: 'ChatGPT Business',
    price_dzd: 1200,
    price_usd: 5,
    description: {
      ar: 'حساب ChatGPT Business للاستخدام المشترك',
      en: 'ChatGPT Business shared account',
      fr: 'Compte ChatGPT Business partagé'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'adobe': {
    id: 'adobe',
    name: 'Adobe Creative Cloud',
    price_dzd: 2500,
    price_usd: 6,
    description: {
      ar: 'حساب Adobe Creative Cloud مشترك',
      en: 'Adobe Creative Cloud shared account',
      fr: 'Compte Adobe Creative Cloud partagé'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'gamma': {
    id: 'gamma',
    name: 'Gamma.AI',
    price_dzd: 1200,
    price_usd: 6,
    description: {
      ar: 'حساب Gamma.AI للعروض التقديمية',
      en: 'Gamma.AI account for presentations',
      fr: 'Compte Gamma.AI pour présentations'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'perplexity': {
    id: 'perplexity',
    name: 'Perplexity AI Pro',
    price_dzd: 1200,
    price_usd: 6,
    description: {
      ar: 'حساب Perplexity AI Pro للبحث الذكي',
      en: 'Perplexity AI Pro account for smart search',
      fr: 'Compte Perplexity AI Pro pour recherche intelligente'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'canva': {
    id: 'canva',
    name: 'Canva Pro',
    price_dzd: 1200,
    price_usd: 6,
    description: {
      ar: 'حساب Canva Pro للتصميم',
      en: 'Canva Pro account for design',
      fr: 'Compte Canva Pro pour design'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'capcut': {
    id: 'capcut',
    name: 'CapCut Pro',
    price_dzd: 1200,
    price_usd: 6,
    description: {
      ar: 'حساب CapCut Pro لتحرير الفيديو',
      en: 'CapCut Pro account for video editing',
      fr: 'Compte CapCut Pro pour montage vidéo'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'netflix': {
    id: 'netflix',
    name: 'Netflix Premium',
    price_dzd: 1500,
    price_usd: 6,
    description: {
      ar: 'حساب Netflix Premium مشترك',
      en: 'Netflix Premium shared account',
      fr: 'Compte Netflix Premium partagé'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'tradingview': {
    id: 'tradingview',
    name: 'TradingView Premium',
    price_dzd: 1500,
    price_usd: 6,
    description: {
      ar: 'حساب TradingView Premium للتحليل المالي',
      en: 'TradingView Premium account for financial analysis',
      fr: 'Compte TradingView Premium pour analyse financière'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'cursor': {
    id: 'cursor',
    name: 'Cursor AI - 7 Days',
    price_dzd: 700,
    price_usd: 3,
    description: {
      ar: 'محرر أكواد ذكي بالذكاء الاصطناعي لمدة 7 أيام',
      en: 'AI-powered smart code editor for 7 days',
      fr: 'Éditeur de code IA intelligent pour 7 jours'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  }
};

// Product Validation Function
function validateProduct(product) {
  const errors = [];
  
  // Check if product object exists
  if (!product || typeof product !== 'object') {
    console.error('❌ Product validation failed: Invalid product object');
    return false;
  }
  
  // Check for required price_dzd field
  if (!product.hasOwnProperty('price_dzd')) {
    errors.push('Missing price_dzd field');
  } else if (typeof product.price_dzd !== 'number') {
    errors.push('price_dzd must be a number');
  } else if (product.price_dzd <= 0) {
    errors.push('price_dzd must be a positive number');
  }
  
  // Check for required price_usd field
  if (!product.hasOwnProperty('price_usd')) {
    errors.push('Missing price_usd field');
  } else if (typeof product.price_usd !== 'number') {
    errors.push('price_usd must be a number');
  } else if (product.price_usd <= 0) {
    errors.push('price_usd must be a positive number');
  }
  
  // Log errors if any
  if (errors.length > 0) {
    console.warn(`⚠️ Product validation warnings for "${product.name || product.id || 'unknown'}":`, errors);
    return false;
  }
  
  return true;
}

// Validate all products on load
function validateAllProducts() {
  let allValid = true;
  Object.keys(PRODUCTS).forEach(key => {
    const product = PRODUCTS[key];
    if (!validateProduct(product)) {
      allValid = false;
    }
  });
  
  if (allValid) {
    console.log('✅ All products validated successfully');
  } else {
    console.warn('⚠️ Some products have validation issues');
  }
  
  return allValid;
}

// Get price for product based on currency (no conversion)
function getProductPrice(product, currency) {
  if (!product || !validateProduct(product)) {
    return null;
  }
  
  if (currency === 'DZD') {
    return product.price_dzd;
  } else if (currency === 'USD') {
    return product.price_usd;
  }
  
  return null;
}

// Export for use in other modules (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CURRENCIES, PAYMENT_METHODS, PRODUCTS, validateProduct, validateAllProducts, getProductPrice };
}

// ES6 exports for testing (commented out for browser compatibility)
// export { CURRENCIES, PAYMENT_METHODS, PRODUCTS, validateProduct, validateAllProducts, getProductPrice };
