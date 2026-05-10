/**
 * Payment Manager Module
 * Manages payment methods display and filtering based on currency
 */

class PaymentManager {
  constructor(paymentMethods) {
    this.paymentMethods = paymentMethods || {};
    this.currentCurrency = null;
  }

  /**
   * Get available payment methods for a specific currency
   * @param {string} currency - Currency code ('DZD' or 'USD')
   * @returns {Array} Sorted array of available payment methods
   */
  getAvailablePaymentMethods(currency) {
    if (!currency) {
      console.warn('No currency provided to getAvailablePaymentMethods');
      return [];
    }

    // Filter payment methods that support the given currency
    const availableMethods = Object.values(this.paymentMethods).filter(method => {
      return method.currencies && method.currencies.includes(currency);
    });

    // Sort by priority (lower number = higher priority)
    availableMethods.sort((a, b) => {
      const priorityA = a.priority || 999;
      const priorityB = b.priority || 999;
      return priorityA - priorityB;
    });

    return availableMethods;
  }

  /**
   * Set the current currency
   * @param {string} currency - Currency code ('DZD' or 'USD')
   */
  setCurrency(currency) {
    this.currentCurrency = currency;
  }

  /**
   * Get the current currency
   * @returns {string} Current currency code
   */
  getCurrency() {
    return this.currentCurrency;
  }

  /**
   * Display payment buttons for a product based on currency
   * @param {Object} product - Product object with payment methods
   * @param {string} currency - Currency code ('DZD' or 'USD')
   * @param {HTMLElement} container - Container element to render buttons into
   */
  displayPaymentButtons(product, currency, container) {
    if (!product || !currency || !container) {
      console.error('Missing required parameters for displayPaymentButtons');
      return;
    }

    // Clear existing buttons
    container.innerHTML = '';

    // Get available payment methods for this currency
    const availableMethods = this.getAvailablePaymentMethods(currency);

    if (availableMethods.length === 0) {
      console.warn(`No payment methods available for currency: ${currency}`);
      return;
    }

    // Create buttons for each payment method
    availableMethods.forEach((method, index) => {
      const button = this.createPaymentButton(method, product, currency, index === 0);
      container.appendChild(button);
    });
  }

  /**
   * Create a payment button element
   * @param {Object} method - Payment method object
   * @param {Object} product - Product object
   * @param {string} currency - Currency code
   * @param {boolean} isPrimary - Whether this is the primary (most prominent) button
   * @returns {HTMLElement} Button element
   */
  createPaymentButton(method, product, currency, isPrimary) {
    const button = document.createElement('button');
    button.className = `payment-btn-compact ${method.id}-btn`;

    // Add primary styling for the first (highest priority) button
    if (isPrimary) {
      button.classList.add('primary-payment');
    }

    // Set data attributes
    button.setAttribute('data-product', product.name || product.id);
    button.setAttribute('data-price', product.price_dzd || 0);
    button.setAttribute('data-price-usd', product.price_usd || 0);

    // Create icon (using the icon from config or a default)
    const icon = document.createElement('span');
    icon.textContent = method.icon || '💳';
    icon.style.marginRight = '6px';

    // Create label
    const label = document.createElement('span');
    label.textContent = method.name;

    button.appendChild(icon);
    button.appendChild(label);

    return button;
  }

  /**
   * Update all payment buttons on the page based on currency
   * @param {string} currency - Currency code ('DZD' or 'USD')
   */
  updateAllPaymentButtons(currency) {
    this.setCurrency(currency);

    // Get available payment methods for this currency
    const availableMethods = this.getAvailablePaymentMethods(currency);
    const availableMethodIds = availableMethods.map(m => m.id);

    // Find all payment buttons and show/hide based on currency
    const allButtons = document.querySelectorAll('.payment-btn-compact');

    allButtons.forEach(button => {
      // Determine which payment method this button is for
      let methodId = null;
      if (button.classList.contains('crypto-pay-btn')) {
        methodId = 'crypto';
      } else if (button.classList.contains('baridimob-btn')) {
        methodId = 'baridimob';
      } else if (button.classList.contains('redotpay-btn')) {
        methodId = 'redotpay';
      }

      // Show or hide button based on whether method is available for this currency
      if (methodId && availableMethodIds.includes(methodId)) {
        button.style.display = '';
      } else if (methodId) {
        button.style.display = 'none';
      }
    });
  }

  /**
   * Open payment modal with correct information
   * @param {string} methodId - Payment method ID ('baridimob', 'ccp', 'crypto', 'binance', 'redotpay')
   * @param {Object} product - Product object
   * @param {string} currency - Currency code ('DZD' or 'USD')
   */
  openPaymentModal(methodId, product, currency) {
    const method = this.paymentMethods[methodId];

    if (!method) {
      console.error(`Payment method not found: ${methodId}`);
      return;
    }

    // Get the modal element
    const modalId = `${methodId}-modal`;
    const modal = document.getElementById(modalId);

    if (!modal) {
      console.error(`Modal not found: ${modalId}`);
      return;
    }

    // Update modal content based on payment method
    this.updateModalContent(modal, method, product, currency);

    // Track AddPaymentInfo event — Pixel + CAPI (single source of truth)
    if (window.metaPixel) {
      const price = currency === 'USD' ? product.price_usd : product.price_dzd;
      const pixelValue = currency === 'USD' ? parseFloat(price) || 0 : parseFloat(((parseFloat(price) || 0) / 250).toFixed(2));
      window.metaPixel.trackEvent('AddPaymentInfo', {
        content_name: product.name || product.id,
        content_ids: [product.id || product.name],
        content_type: 'product',
        value: pixelValue,
        currency: 'USD',
        content_category: method.name
      });
    }

    // Show the modal
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    modal.classList.add('show');
  }

  /**
   * Update modal content with payment information
   * @param {HTMLElement} modal - Modal element
   * @param {Object} method - Payment method object
   * @param {Object} product - Product object
   * @param {string} currency - Currency code
   */
  updateModalContent(modal, method, product, currency) {
    // Update product name
    const productNameEl = modal.querySelector(`#${method.id}-product-name`);
    if (productNameEl) {
      productNameEl.textContent = product.name || product.id;
    }

    // Update prices
    const priceDZDEl = modal.querySelector(`#${method.id}-price-dzd`);
    const priceUSDEl = modal.querySelector(`#${method.id}-price-usd`);

    if (priceDZDEl) {
      priceDZDEl.textContent = product.price_dzd || 0;
    }

    if (priceUSDEl) {
      priceUSDEl.textContent = product.price_usd || 0;
    }

    // Update payment-specific information
    if (method.id === 'baridimob' && method.info.rip) {
      const ripEl = modal.querySelector(`#${method.id}-rip`);
      if (ripEl) {
        ripEl.textContent = method.info.rip;
      }
    }

    if (method.id === 'ccp' && method.info.account) {
      const accountEl = modal.querySelector(`#${method.id}-account`);
      if (accountEl) {
        accountEl.textContent = method.info.account;
      }
    }

    if (method.id === 'crypto' && method.info.networks) {
      // Update crypto wallet addresses for each network
      Object.keys(method.info.networks).forEach(network => {
        const addressEl = modal.querySelector(`[data-network="${network}"]`);
        if (addressEl) {
          addressEl.setAttribute('data-address', method.info.networks[network]);
        }
      });
    }

    if (method.id === 'binance' && method.info.link) {
      const linkEl = modal.querySelector(`#${method.id}-link`);
      if (linkEl) {
        linkEl.href = method.info.link;
      }
    }

    if (method.id === 'redotpay' && method.info.id) {
      const idEl = modal.querySelector(`#${method.id}-id`);
      if (idEl) {
        idEl.textContent = method.info.id;
      }
    }
  }

  /**
   * Sort payment methods by priority for a given currency
   * @param {Array} methods - Array of payment method objects
   * @param {string} currency - Currency code ('DZD' or 'USD')
   * @returns {Array} Sorted array with primary methods first
   */
  sortPaymentMethods(methods, currency) {
    return methods.sort((a, b) => {
      // Check if methods support the currency
      const aSupports = a.currencies && a.currencies.includes(currency);
      const bSupports = b.currencies && b.currencies.includes(currency);

      // Methods that don't support the currency go to the end
      if (aSupports && !bSupports) return -1;
      if (!aSupports && bSupports) return 1;

      // Sort by priority
      const priorityA = a.priority || 999;
      const priorityB = b.priority || 999;
      return priorityA - priorityB;
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentManager;
}

// ES6 export for testing (commented out for browser compatibility)
// export default PaymentManager;
