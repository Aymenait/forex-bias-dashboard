/**
 * Currency Manager Module
 * Manages currency detection, selection, and persistence
 */

class CurrencyManager {
  constructor() {
    this.currentCurrency = null;
    this.userCountry = null;
    this.geolocationTimeout = 3000; // 3 seconds timeout
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Detect user location using IP geolocation API
   * @returns {Promise<Object>} Location data with country code
   */
  async detectLocation() {
    try {
      // Check if we have cached location data
      const cached = this.loadCachedLocation();
      if (cached && this.isCacheValid(cached.timestamp)) {
        this.userCountry = cached.country;
        return { country: cached.country, cached: true };
      }

      // Fetch location from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.geolocationTimeout);

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Geolocation API request failed');
      }

      const data = await response.json();
      
      if (!data.country) {
        throw new Error('Invalid geolocation response');
      }

      this.userCountry = data.country;
      
      // Cache the result
      this.cacheLocation(data.country);

      return { country: data.country, cached: false };
    } catch (error) {
      console.warn('Geolocation detection failed:', error.message);
      // Fallback to USD for any error
      this.userCountry = null;
      return { country: null, error: error.message };
    }
  }

  /**
   * Determine currency based on country code
   * @param {string} countryCode - ISO country code (e.g., 'DZ', 'US')
   * @returns {string} Currency code ('DZD' or 'USD')
   */
  determineCurrency(countryCode) {
    if (countryCode === 'DZ') {
      return 'DZD';
    }
    return 'USD';
  }

  /**
   * Get the current active currency
   * @returns {string} Current currency code
   */
  getCurrentCurrency() {
    return this.currentCurrency;
  }

  /**
   * Set currency manually
   * @param {string} currency - Currency code ('DZD' or 'USD')
   */
  setCurrency(currency) {
    if (currency !== 'DZD' && currency !== 'USD') {
      console.error('Invalid currency:', currency);
      return;
    }
    this.currentCurrency = currency;
    this.saveCurrencyPreference(currency);
  }

  /**
   * Save currency preference to localStorage
   * @param {string} currency - Currency code to save
   */
  saveCurrencyPreference(currency) {
    try {
      const data = {
        currency: currency,
        timestamp: Date.now()
      };
      localStorage.setItem('marketalgeriaa_currency', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save currency preference:', error.message);
    }
  }

  /**
   * Load currency preference from localStorage
   * @returns {string|null} Saved currency code or null
   */
  loadCurrencyPreference() {
    try {
      const data = localStorage.getItem('marketalgeriaa_currency');
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      return parsed.currency;
    } catch (error) {
      console.warn('Failed to load currency preference:', error.message);
      return null;
    }
  }

  /**
   * Cache location data to localStorage
   * @param {string} country - Country code to cache
   */
  cacheLocation(country) {
    try {
      const data = {
        country: country,
        timestamp: Date.now()
      };
      localStorage.setItem('marketalgeriaa_location', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache location:', error.message);
    }
  }

  /**
   * Load cached location from localStorage
   * @returns {Object|null} Cached location data or null
   */
  loadCachedLocation() {
    try {
      const data = localStorage.getItem('marketalgeriaa_location');
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to load cached location:', error.message);
      return null;
    }
  }

  /**
   * Check if cached data is still valid
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(timestamp) {
    const now = Date.now();
    return (now - timestamp) < this.cacheExpiry;
  }

  /**
   * Initialize currency manager
   * Loads saved preference or detects location
   * @returns {Promise<string>} Determined currency code
   */
  async initialize() {
    // First, check if user has a saved preference
    const savedCurrency = this.loadCurrencyPreference();
    if (savedCurrency) {
      this.currentCurrency = savedCurrency;
      return savedCurrency;
    }

    // If no preference, detect location
    const locationData = await this.detectLocation();
    const currency = this.determineCurrency(locationData.country);
    
    this.currentCurrency = currency;
    this.saveCurrencyPreference(currency);

    return currency;
  }

  /**
   * Validate product data structure
   * @param {Object} product - Product object to validate
   * @returns {boolean} True if product is valid
   */
  validateProduct(product) {
    if (!product) {
      console.error('Product is null or undefined');
      return false;
    }

    if (typeof product.price_dzd !== 'number' || product.price_dzd <= 0) {
      console.error('Invalid price_dzd for product:', product.id || 'unknown');
      return false;
    }

    if (typeof product.price_usd !== 'number' || product.price_usd <= 0) {
      console.error('Invalid price_usd for product:', product.id || 'unknown');
      return false;
    }

    return true;
  }

  /**
   * Get price for product in current currency
   * @param {Object} product - Product object with price_dzd and price_usd
   * @returns {number} Price in current currency
   */
  getPrice(product) {
    if (!this.validateProduct(product)) {
      return 0;
    }

    if (this.currentCurrency === 'DZD') {
      return product.price_dzd;
    } else {
      return product.price_usd;
    }
  }

  /**
   * Get currency symbol for current currency
   * @returns {string} Currency symbol
   */
  getCurrencySymbol() {
    if (this.currentCurrency === 'DZD') {
      return 'د.ج';
    } else {
      return '$';
    }
  }

  /**
   * Format price with currency symbol
   * @param {number} amount - Price amount
   * @param {string} currency - Currency code ('DZD' or 'USD')
   * @returns {string} Formatted price string
   */
  formatPrice(amount, currency) {
    if (typeof amount !== 'number' || amount < 0) {
      console.warn('Invalid price amount:', amount);
      return '0';
    }

    // Format number with thousands separator
    const formattedNumber = amount.toLocaleString('en-US');

    // Add currency symbol
    if (currency === 'DZD') {
      return `${formattedNumber} د.ج`;
    } else if (currency === 'USD') {
      return `$${formattedNumber}`;
    } else {
      console.warn('Invalid currency:', currency);
      return formattedNumber;
    }
  }

  /**
   * Display price for a single product
   * @param {Object} product - Product object with price_dzd and price_usd
   * @param {string} currency - Currency code ('DZD' or 'USD')
   * @returns {string} Formatted price string
   */
  displayPrice(product, currency) {
    if (!this.validateProduct(product)) {
      return this.formatPrice(0, currency || this.currentCurrency);
    }

    const activeCurrency = currency || this.currentCurrency;
    
    // Select the correct price based on currency (no conversion)
    const price = activeCurrency === 'DZD' ? product.price_dzd : product.price_usd;
    
    return this.formatPrice(price, activeCurrency);
  }

  /**
   * Update all prices in the page
   * @param {string} currency - Currency code ('DZD' or 'USD')
   */
  updateAllPrices(currency) {
    const activeCurrency = currency || this.currentCurrency;
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      // Find all price elements in DOM
      const priceElements = document.querySelectorAll('[data-price-dzd][data-price-usd]');
      
      priceElements.forEach(element => {
        // Add updating class for smooth transition
        element.classList.add('updating');
        
        const priceDZD = parseFloat(element.getAttribute('data-price-dzd'));
        const priceUSD = parseFloat(element.getAttribute('data-price-usd'));
        
        if (isNaN(priceDZD) || isNaN(priceUSD)) {
          console.warn('Invalid price data on element:', element);
          element.classList.remove('updating');
          return;
        }
        
        const product = {
          price_dzd: priceDZD,
          price_usd: priceUSD
        };
        
        const formattedPrice = this.displayPrice(product, activeCurrency);
        
        // Update price with slight delay for smooth transition
        setTimeout(() => {
          element.textContent = formattedPrice;
          // Remove updating class after transition
          setTimeout(() => {
            element.classList.remove('updating');
          }, 50);
        }, 150);
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CurrencyManager;
}

// ES6 export for testing (commented out for browser compatibility)
// export default CurrencyManager;
