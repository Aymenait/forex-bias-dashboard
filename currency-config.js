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
    price_dzd: 2900,
    price_usd: 12,
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
    price_dzd: 1000,
    price_usd: 4,
    durations: {
      'plus': { dzd: 1000, usd: 4 },

      'go': { dzd: 1800, usd: 7 },
      'business': { dzd: 3000, usd: 12 }
    },
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
    price_dzd: 1200,
    price_usd: 4.5,
    durations: {
      '1month': { dzd: 1200, usd: 4.5 },
      '2months': { dzd: 1800, usd: 7 },
      '3months': { dzd: 2500, usd: 10 }
    },
    description: {
      ar: 'اشتراك Adobe Creative Cloud يشمل أكثر من 20 تطبيقًا احترافيًا',
      en: 'Adobe Creative Cloud subscription includes 20+ professional applications',
      fr: 'L\'abonnement Adobe Creative Cloud comprend plus de 20 applications professionnelles'
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
    price_usd: 4.5,
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
    price_usd: 4.5,
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
    price_dzd: 600,
    price_usd: 2.5,
    durations: {
      'standard': { dzd: 600, usd: 2.5 },
      'reseller': { dzd: 3900, usd: 16 }
    },
    description: {
      ar: 'اشتراك Canva Pro الكامل مع جميع المميزات الاحترافية للتصميم والإبداع (سنة كاملة).',
      en: 'Full Canva Pro subscription with all professional design and creativity features (1 Year).',
      fr: 'Abonnement Canva Pro complet avec toutes les fonctionnalités professionnelles de design et créativité (1 An).'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'capcut': {
    id: 'capcut',
    name: 'CapCut Pro',
    price_dzd: 800,
    price_usd: 3,
    durations: {
      '1month': { dzd: 800, usd: 3 },
      '3months': { dzd: 1200, usd: 4.5 },
      '6months': { dzd: 2000, usd: 8 },
      '1year': { dzd: 3500, usd: 14 }
    },
    original_price: 1500,
    features: ['all-platforms', 'no-watermark', 'cloud-storage'],
    category: 'creative',
    description: {
      ar: 'محرر فيديو احترافي مع مميزات الذكاء الاصطناعي - 30 يوم',
      en: 'Professional video editor with AI features - 30 days',
      fr: 'Éditeur vidéo professionnel avec fonctionnalités IA - 30 jours'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'netflix': {
    id: 'netflix',
    name: 'Netflix Premium',
    price_dzd: 600,
    price_usd: 2.5,
    durations: {
      '1month': { dzd: 600, usd: 2.5 },
      '3months': { dzd: 1200, usd: 4.5 },
      '12months': { dzd: 2000, usd: 8 }
    },
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
    name: 'Cursor AI',
    price_dzd: 900,
    price_usd: 3.6,
    cost_dzd: 300,
    durations: {
      '7days': { dzd: 900, usd: 3.6, cost_dzd: 300 },
      '30days': { dzd: 2900, usd: 11.6, cost_dzd: 1500 }
    },
    description: {
      ar: 'محرر أكواد ذكي بالذكاء الاصطناعي (حساب خاص متوفر)',
      en: 'AI-powered smart code editor (Private account available)',
      fr: 'Éditeur de code IA intelligent (Compte privé disponible)'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'lovable': {
    id: 'lovable',
    name: 'Lovable AI',
    price_dzd: 800,
    price_usd: 3.5,
    durations: {
      '1month': { dzd: 800, usd: 3.5 },
      '3months': { dzd: 2000, usd: 8 }
    },
    description: {
      ar: 'أداة متقدمة لبناء تطبيقات الويب بالذكاء الاصطناعي',
      en: 'Advanced tool for building web apps with AI',
      fr: 'Outil avancé pour créer des applications web avec l\'IA'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'primevideo': {
    id: 'primevideo',
    name: 'Prime Video',
    price_dzd: 1200,
    price_usd: 4.5,
    description: {
      ar: 'اشتراك Amazon Prime Video لمدة 3 أشهر',
      en: 'Amazon Prime Video subscription for 3 months',
      fr: 'Abonnement Amazon Prime Video pour 3 mois'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'crunchyroll': {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    price_dzd: 1200,
    price_usd: 4.5,
    description: {
      ar: 'اشتراك Crunchyroll Premium لمدة شهر واحد',
      en: 'Crunchyroll Premium subscription for 1 month',
      fr: 'Abonnement Crunchyroll Premium pour 1 mois'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'google-ai': {
    id: 'google-ai',
    name: 'Google AI Ultra & Veo 3',
    price_dzd: 1800,
    price_usd: 8,
    durations: {
      '1month': { dzd: 1800, usd: 8 },
      '1year': { dzd: 0, usd: 0 }
    },
    description: {
      ar: 'اشتراك Gemini Ultra و Veo 3 مع أدوات إنتاجية متقدمة',
      en: 'Gemini Ultra and Veo 3 subscription with advanced productivity tools',
      fr: 'Abonnement Gemini Ultra et Veo 3 avec outils de productivité avancés'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'hma-vpn': {
    id: 'hma-vpn',
    name: 'HMA VPN',
    price_dzd: 2000,
    price_usd: 8,
    durations: {
      '1year': { dzd: 2000, usd: 8 },
      '2years': { dzd: 3200, usd: 12.8 }
    },
    description: {
      ar: 'اشتراك HMA VPN مع وصول لكافة الخوادم.',
      en: 'HMA VPN subscription with access to all servers.',
      fr: 'Abonnement HMA VPN avec accès à tous les serveurs.'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  },
  'alight-motion': {
    id: 'alight-motion',
    name: 'Alight Motion PRO',
    price_dzd: 2500,
    price_usd: 10,
    cost_dzd: 1800,
    durations: {
      '1year': { dzd: 2500, usd: 10, cost_dzd: 1800 }
    },
    description: {
      ar: 'اشتراك Alight Motion Pro لمدة سنة كاملة لتصميم الفيديو باحترافية.',
      en: 'Alight Motion Pro 1-year subscription for professional video design.',
      fr: 'Abonnement Alight Motion Pro d\'un an pour la conception vidéo professionnelle.'
    },
    paymentMethods: {
      dzd: ['baridimob', 'crypto'],
      usd: ['binance', 'redotpay', 'crypto']
    }
  }
}


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
