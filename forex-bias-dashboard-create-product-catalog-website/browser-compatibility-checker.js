/**
 * Browser Compatibility Checker
 * Detects browser capabilities and compatibility for international expansion features
 * Task 10.2: Browser and Device Testing
 */

class BrowserCompatibilityChecker {
  constructor() {
    this.results = {
      browser: {},
      features: {},
      storage: {},
      api: {},
      css: {},
      performance: {}
    };
  }

  /**
   * Detect browser information
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    const browser = {
      name: 'Unknown',
      version: 'Unknown',
      engine: 'Unknown',
      platform: navigator.platform,
      userAgent: ua,
      mobile: /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
    };

    // Detect browser name and version
    if (ua.indexOf('Firefox') > -1) {
      browser.name = 'Firefox';
      browser.version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
      browser.engine = 'Gecko';
    } else if (ua.indexOf('Edg') > -1) {
      browser.name = 'Edge';
      browser.version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
      browser.engine = 'Blink';
    } else if (ua.indexOf('Chrome') > -1) {
      browser.name = 'Chrome';
      browser.version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
      browser.engine = 'Blink';
    } else if (ua.indexOf('Safari') > -1) {
      browser.name = 'Safari';
      browser.version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
      browser.engine = 'WebKit';
    }

    this.results.browser = browser;
    return browser;
  }

  /**
   * Check localStorage support and availability
   */
  checkLocalStorage() {
    const storage = {
      supported: false,
      available: false,
      quota: null,
      usage: null,
      error: null
    };

    try {
      // Check if localStorage exists
      storage.supported = typeof Storage !== 'undefined' && typeof localStorage !== 'undefined';

      if (storage.supported) {
        // Test if we can actually use it (might be disabled in private mode)
        const testKey = '__browser_compat_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        storage.available = true;

        // Try to get storage quota (if available)
        if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then(estimate => {
            storage.quota = estimate.quota;
            storage.usage = estimate.usage;
          });
        }
      }
    } catch (error) {
      storage.error = error.message;
      storage.available = false;
    }

    this.results.storage = storage;
    return storage;
  }

  /**
   * Check Fetch API support
   */
  checkFetchAPI() {
    const fetchSupport = {
      supported: typeof fetch !== 'undefined',
      abortController: typeof AbortController !== 'undefined',
      headers: typeof Headers !== 'undefined',
      request: typeof Request !== 'undefined',
      response: typeof Response !== 'undefined'
    };

    this.results.api.fetch = fetchSupport;
    return fetchSupport;
  }

  /**
   * Check Promise support
   */
  checkPromises() {
    const promiseSupport = {
      supported: typeof Promise !== 'undefined',
      asyncAwait: false
    };

    // Test async/await support
    try {
      eval('(async () => {})');
      promiseSupport.asyncAwait = true;
    } catch (e) {
      promiseSupport.asyncAwait = false;
    }

    this.results.api.promises = promiseSupport;
    return promiseSupport;
  }

  /**
   * Check CSS features support
   */
  checkCSSFeatures() {
    const css = {
      flexbox: this.checkCSSProperty('display', 'flex'),
      grid: this.checkCSSProperty('display', 'grid'),
      transitions: this.checkCSSProperty('transition', 'all 0.3s'),
      transforms: this.checkCSSProperty('transform', 'translateX(0)'),
      animations: this.checkCSSProperty('animation', 'test 1s'),
      backdropFilter: this.checkCSSProperty('backdrop-filter', 'blur(10px)'),
      customProperties: CSS.supports('--test', '0')
    };

    this.results.css = css;
    return css;
  }

  /**
   * Helper to check if a CSS property is supported
   */
  checkCSSProperty(property, value) {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports(property, value);
    }
    
    // Fallback for older browsers
    const element = document.createElement('div');
    const style = element.style;
    style[property] = value;
    return style[property] !== '';
  }

  /**
   * Check Performance API support
   */
  checkPerformanceAPI() {
    const performance = {
      supported: typeof window.performance !== 'undefined',
      now: typeof window.performance?.now === 'function',
      timing: typeof window.performance?.timing !== 'undefined',
      navigation: typeof window.performance?.navigation !== 'undefined',
      mark: typeof window.performance?.mark === 'function',
      measure: typeof window.performance?.measure === 'function'
    };

    this.results.performance = performance;
    return performance;
  }

  /**
   * Check requestAnimationFrame support
   */
  checkAnimationFrame() {
    const raf = {
      supported: typeof requestAnimationFrame !== 'undefined',
      cancelSupported: typeof cancelAnimationFrame !== 'undefined'
    };

    this.results.api.requestAnimationFrame = raf;
    return raf;
  }

  /**
   * Check Geolocation API support
   */
  checkGeolocationAPI() {
    const geo = {
      supported: 'geolocation' in navigator,
      getCurrentPosition: typeof navigator.geolocation?.getCurrentPosition === 'function',
      watchPosition: typeof navigator.geolocation?.watchPosition === 'function'
    };

    this.results.api.geolocation = geo;
    return geo;
  }

  /**
   * Check touch support
   */
  checkTouchSupport() {
    const touch = {
      supported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvents: 'ontouchstart' in window
    };

    this.results.features.touch = touch;
    return touch;
  }

  /**
   * Check viewport and screen information
   */
  checkViewport() {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation?.type || 'unknown'
    };

    this.results.features.viewport = viewport;
    return viewport;
  }

  /**
   * Run all compatibility checks
   */
  async runAllChecks() {
    console.log('🔍 Running browser compatibility checks...');

    this.detectBrowser();
    this.checkLocalStorage();
    this.checkFetchAPI();
    this.checkPromises();
    this.checkCSSFeatures();
    this.checkPerformanceAPI();
    this.checkAnimationFrame();
    this.checkGeolocationAPI();
    this.checkTouchSupport();
    this.checkViewport();

    console.log('✅ Compatibility checks complete');
    return this.results;
  }

  /**
   * Generate compatibility report
   */
  generateReport() {
    const report = {
      summary: this.generateSummary(),
      details: this.results,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate summary of compatibility
   */
  generateSummary() {
    const summary = {
      compatible: true,
      warnings: [],
      errors: [],
      score: 100
    };

    // Check critical features
    if (!this.results.api.fetch?.supported) {
      summary.errors.push('Fetch API not supported - geolocation will fail');
      summary.compatible = false;
      summary.score -= 30;
    }

    if (!this.results.api.promises?.supported) {
      summary.errors.push('Promises not supported - async operations will fail');
      summary.compatible = false;
      summary.score -= 30;
    }

    if (!this.results.storage.available) {
      summary.warnings.push('localStorage not available - currency preference will not persist');
      summary.score -= 15;
    }

    if (!this.results.css.flexbox) {
      summary.warnings.push('Flexbox not supported - layout may be broken');
      summary.score -= 10;
    }

    if (!this.results.css.transitions) {
      summary.warnings.push('CSS transitions not supported - animations will be instant');
      summary.score -= 5;
    }

    if (!this.results.api.requestAnimationFrame?.supported) {
      summary.warnings.push('requestAnimationFrame not supported - performance may be degraded');
      summary.score -= 10;
    }

    return summary;
  }

  /**
   * Generate recommendations based on compatibility results
   */
  generateRecommendations() {
    const recommendations = [];

    if (!this.results.storage.available) {
      recommendations.push({
        issue: 'localStorage not available',
        solution: 'Exit private browsing mode or use a different browser',
        severity: 'medium'
      });
    }

    if (!this.results.api.fetch?.supported) {
      recommendations.push({
        issue: 'Fetch API not supported',
        solution: 'Update to a modern browser (Chrome 42+, Firefox 39+, Safari 10.1+, Edge 14+)',
        severity: 'critical'
      });
    }

    if (!this.results.css.flexbox) {
      recommendations.push({
        issue: 'Flexbox not supported',
        solution: 'Update to a modern browser for proper layout',
        severity: 'high'
      });
    }

    const browserVersion = parseFloat(this.results.browser.version);
    const browserName = this.results.browser.name;

    if (browserName === 'Chrome' && browserVersion < 90) {
      recommendations.push({
        issue: 'Chrome version is outdated',
        solution: 'Update Chrome to version 90 or higher',
        severity: 'medium'
      });
    }

    if (browserName === 'Firefox' && browserVersion < 88) {
      recommendations.push({
        issue: 'Firefox version is outdated',
        solution: 'Update Firefox to version 88 or higher',
        severity: 'medium'
      });
    }

    if (browserName === 'Safari' && browserVersion < 14) {
      recommendations.push({
        issue: 'Safari version is outdated',
        solution: 'Update Safari to version 14 or higher',
        severity: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Test international expansion features specifically
   */
  async testInternationalExpansionFeatures() {
    const tests = {
      currencyManager: false,
      paymentManager: false,
      geolocationAPI: false,
      priceUpdate: false,
      paymentMethodsUpdate: false
    };

    // Test if CurrencyManager is available
    tests.currencyManager = typeof CurrencyManager !== 'undefined';

    // Test if PaymentManager is available
    tests.paymentManager = typeof PaymentManager !== 'undefined';

    // Test geolocation API call
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      tests.geolocationAPI = response.ok;
    } catch (error) {
      tests.geolocationAPI = false;
    }

    // Test price update functionality
    const priceElements = document.querySelectorAll('[data-price-dzd][data-price-usd]');
    tests.priceUpdate = priceElements.length > 0;

    // Test payment methods containers
    const paymentContainers = document.querySelectorAll('.payment-methods-row');
    tests.paymentMethodsUpdate = paymentContainers.length > 0;

    return tests;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserCompatibilityChecker;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.BrowserCompatibilityChecker = BrowserCompatibilityChecker;
}
