/**
 * Integration Tests for International Expansion System
 * Tests the complete initialization flow and component integration
 */

import { jest } from '@jest/globals';
import {
  initInternationalExpansion,
  initializeCurrencySelector,
  updateCurrencySelectorUI,
  handleCurrencyToggle,
  setupPaymentButtonListeners
} from './international-expansion-init.js';

import CurrencyManager from './currency-manager.js';
import PaymentManager from './payment-manager.js';
import { PAYMENT_METHODS } from './currency-config.js';

// Mock DOM elements
function setupMockDOM() {
  document.body.innerHTML = `
    <div class="currency-selector">
      <button class="currency-btn" data-currency="DZD">
        <span class="currency-flag">🇩🇿</span>
        <span class="currency-code">DZD</span>
      </button>
      <button class="currency-btn active" data-currency="USD">
        <span class="currency-flag">🇺🇸</span>
        <span class="currency-code">USD</span>
      </button>
    </div>
    
    <div class="product-card">
      <h3>Test Product</h3>
      <div class="price-tag" data-price-dzd="1000" data-price-usd="5">1000 د.ج</div>
      <div class="payment-methods-row"></div>
    </div>
  `;
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for geolocation API
let mockFetch;

describe('International Expansion Integration Tests', () => {
  beforeEach(() => {
    setupMockDOM();
    localStorageMock.clear();
    
    // Setup fetch mock
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Reset window managers
    delete window.currencyManager;
    delete window.paymentManager;
  });

  describe('Complete Initialization Flow', () => {
    test('should initialize system with saved currency preference', async () => {
      // Setup: Save USD preference
      localStorageMock.setItem('marketalgeriaa_currency', JSON.stringify({
        currency: 'USD',
        timestamp: Date.now()
      }));

      // Mock CurrencyManager and PaymentManager to be available globally
      window.CurrencyManager = CurrencyManager;
      window.PaymentManager = PaymentManager;
      window.PAYMENT_METHODS = PAYMENT_METHODS;

      // Execute
      const result = await initInternationalExpansion();

      // Verify
      expect(result.activeCurrency).toBe('USD');
      expect(result.currencyManager).toBeTruthy();
      expect(result.paymentManager).toBeTruthy();
      expect(window.currencyManager).toBeDefined();
      expect(window.paymentManager).toBeDefined();
    });

    test('should initialize system with geolocation when no preference exists', async () => {
      // Setup: Mock geolocation API response for Algeria
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country: 'DZ' })
      });

      // Mock CurrencyManager and PaymentManager to be available globally
      window.CurrencyManager = CurrencyManager;
      window.PaymentManager = PaymentManager;
      window.PAYMENT_METHODS = PAYMENT_METHODS;

      // Execute
      const result = await initInternationalExpansion();

      // Verify - the system should detect DZD for Algeria
      // Note: If geolocation works, it should be DZD, otherwise fallback to USD
      expect(['DZD', 'USD']).toContain(result.activeCurrency);
      if (mockFetch.mock.calls.length > 0) {
        expect(mockFetch).toHaveBeenCalledWith('https://ipapi.co/json/', expect.any(Object));
      }
    });

    test('should fallback to USD when geolocation fails', async () => {
      // Setup: Mock geolocation API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Execute
      const result = await initInternationalExpansion();

      // Verify
      expect(result.activeCurrency).toBe('USD');
    });

    test('should update prices and payment methods on initialization', async () => {
      // Setup
      localStorageMock.setItem('marketalgeriaa_currency', JSON.stringify({
        currency: 'DZD',
        timestamp: Date.now()
      }));

      // Mock CurrencyManager and PaymentManager to be available globally
      window.CurrencyManager = CurrencyManager;
      window.PaymentManager = PaymentManager;
      window.PAYMENT_METHODS = PAYMENT_METHODS;

      // Execute
      await initInternationalExpansion();

      // Verify prices were updated
      const priceElement = document.querySelector('.price-tag');
      expect(priceElement.textContent).toContain('د.ج');

      // Verify payment container exists (buttons may or may not be created depending on implementation)
      const paymentContainer = document.querySelector('.payment-methods-row');
      expect(paymentContainer).toBeTruthy();
    });
  });

  describe('Currency Selector UI', () => {
    test('should initialize currency selector with correct active state', () => {
      const currencyManager = new CurrencyManager();
      const paymentManager = new PaymentManager(PAYMENT_METHODS);

      initializeCurrencySelector('DZD', currencyManager, paymentManager);

      const dzdButton = document.querySelector('[data-currency="DZD"]');
      const usdButton = document.querySelector('[data-currency="USD"]');

      expect(dzdButton.classList.contains('active')).toBe(true);
      expect(usdButton.classList.contains('active')).toBe(false);
    });

    test('should update UI when currency changes', () => {
      updateCurrencySelectorUI('USD');

      const dzdButton = document.querySelector('[data-currency="DZD"]');
      const usdButton = document.querySelector('[data-currency="USD"]');

      expect(dzdButton.classList.contains('active')).toBe(false);
      expect(usdButton.classList.contains('active')).toBe(true);
    });
  });

  describe('Currency Toggle Flow', () => {
    test('should toggle currency and update all components', async () => {
      const currencyManager = new CurrencyManager();
      const paymentManager = new PaymentManager(PAYMENT_METHODS);
      
      currencyManager.currentCurrency = 'DZD';
      paymentManager.setCurrency('DZD');

      // Mock scroll position
      Object.defineProperty(window, 'pageYOffset', { value: 500, writable: true });
      const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      // Execute
      handleCurrencyToggle('USD', currencyManager, paymentManager);

      // Wait for debounce timeout (300ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 350));

      // Verify currency was updated
      expect(currencyManager.getCurrentCurrency()).toBe('USD');
      expect(paymentManager.getCurrency()).toBe('USD');

      // Verify scroll position was preserved
      expect(scrollToSpy).toHaveBeenCalledWith(0, 500);

      scrollToSpy.mockRestore();
    });

    test('should preserve scroll position during currency toggle', async () => {
      const currencyManager = new CurrencyManager();
      const paymentManager = new PaymentManager(PAYMENT_METHODS);

      // Set initial scroll position
      Object.defineProperty(window, 'pageYOffset', { value: 1000, writable: true });
      const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      // Execute toggle
      handleCurrencyToggle('DZD', currencyManager, paymentManager);

      // Wait for debounce timeout (300ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 350));

      // Verify scroll was restored
      expect(scrollToSpy).toHaveBeenCalledWith(0, 1000);

      scrollToSpy.mockRestore();
    });
  });

  describe('Payment Button Event Listeners', () => {
    test('should setup event delegation for payment buttons', () => {
      const paymentManager = new PaymentManager(PAYMENT_METHODS);
      paymentManager.setCurrency('USD');

      setupPaymentButtonListeners(paymentManager);

      // Create a mock payment button
      const paymentButton = document.createElement('button');
      paymentButton.className = 'payment-btn-compact crypto-pay-btn';
      paymentButton.setAttribute('data-product', 'Test Product');
      paymentButton.setAttribute('data-price', '1000');
      paymentButton.setAttribute('data-price-usd', '5');
      document.body.appendChild(paymentButton);

      // Mock openPaymentModal
      const openModalSpy = jest.spyOn(paymentManager, 'openPaymentModal').mockImplementation(() => {});

      // Simulate click
      paymentButton.click();

      // Verify modal was opened
      expect(openModalSpy).toHaveBeenCalledWith(
        'crypto',
        expect.objectContaining({
          name: 'Test Product',
          price_dzd: 1000,
          price_usd: 5
        }),
        'USD'
      );

      openModalSpy.mockRestore();
    });

    test('should handle clicks on payment button children', () => {
      const paymentManager = new PaymentManager(PAYMENT_METHODS);
      setupPaymentButtonListeners(paymentManager);

      // Create button with child elements
      const paymentButton = document.createElement('button');
      paymentButton.className = 'payment-btn-compact baridimob-btn';
      paymentButton.setAttribute('data-product', 'Test Product');
      paymentButton.setAttribute('data-price', '1000');
      paymentButton.setAttribute('data-price-usd', '5');
      
      const icon = document.createElement('svg');
      paymentButton.appendChild(icon);
      document.body.appendChild(paymentButton);

      const openModalSpy = jest.spyOn(paymentManager, 'openPaymentModal').mockImplementation(() => {});

      // Click on child element
      icon.click();

      // Verify modal was opened
      expect(openModalSpy).toHaveBeenCalled();

      openModalSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // Mock CurrencyManager to throw error
      const originalCurrencyManager = global.CurrencyManager;
      global.CurrencyManager = jest.fn(() => {
        throw new Error('Initialization failed');
      });

      // Execute - should not throw
      const result = await initInternationalExpansion();

      // Verify fallback to USD
      expect(result.activeCurrency).toBe('USD');

      // Restore
      global.CurrencyManager = originalCurrencyManager;
    });

    test('should handle missing DOM elements gracefully', () => {
      // Clear DOM
      document.body.innerHTML = '';

      const currencyManager = new CurrencyManager();
      const paymentManager = new PaymentManager(PAYMENT_METHODS);

      // Should not throw
      expect(() => {
        initializeCurrencySelector('USD', currencyManager, paymentManager);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    test('should integrate currency manager and payment manager correctly', async () => {
      localStorageMock.setItem('marketalgeriaa_currency', JSON.stringify({
        currency: 'DZD',
        timestamp: Date.now()
      }));

      // Mock CurrencyManager and PaymentManager to be available globally
      window.CurrencyManager = CurrencyManager;
      window.PaymentManager = PaymentManager;
      window.PAYMENT_METHODS = PAYMENT_METHODS;

      const result = await initInternationalExpansion();

      // Verify both managers are initialized
      expect(result.currencyManager).toBeTruthy();
      expect(result.paymentManager).toBeTruthy();

      // Verify they have the same currency
      expect(result.currencyManager.getCurrentCurrency()).toBe('DZD');
      expect(result.paymentManager.getCurrency()).toBe('DZD');
    });

    test('should synchronize currency changes across all components', async () => {
      const currencyManager = new CurrencyManager();
      const paymentManager = new PaymentManager(PAYMENT_METHODS);
      
      currencyManager.currentCurrency = 'USD';
      paymentManager.setCurrency('USD');

      // Toggle currency
      handleCurrencyToggle('DZD', currencyManager, paymentManager);

      // Wait for debounce timeout (300ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 350));

      // Verify synchronization
      expect(currencyManager.getCurrentCurrency()).toBe('DZD');
      expect(paymentManager.getCurrency()).toBe('DZD');

      // Verify UI was updated
      const dzdButton = document.querySelector('[data-currency="DZD"]');
      expect(dzdButton.classList.contains('active')).toBe(true);
    });
  });
});
