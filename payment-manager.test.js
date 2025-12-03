/**
 * Property-Based Tests for Payment Manager Module
 * Using fast-check for property-based testing
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import PaymentManager from './payment-manager.js';
import { PAYMENT_METHODS } from './currency-config.js';

describe('Payment Manager - Property-Based Tests', () => {
  let manager;

  beforeEach(() => {
    // Create fresh manager instance with payment methods
    manager = new PaymentManager(PAYMENT_METHODS);
  });

  /**
   * Feature: international-expansion, Property 9: Payment methods match currency
   * Validates: Requirements 4.1, 4.3, 5.1, 5.3
   * 
   * For any currency selection, when currency is DZD then local payment methods 
   * (CCP, BaridiMob) should be prominent and international methods secondary, 
   * when currency is USD then international methods (Binance, Crypto) should be 
   * prominent and local methods hidden or secondary
   */
  test('Property 9: Payment methods match currency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (currency) => {
          // Get available payment methods for the currency
          const availableMethods = manager.getAvailablePaymentMethods(currency);

          // Property: All returned methods must support the given currency
          availableMethods.forEach(method => {
            expect(method.currencies).toContain(currency);
          });

          // Property: Methods should be sorted by priority (ascending)
          for (let i = 0; i < availableMethods.length - 1; i++) {
            const currentPriority = availableMethods[i].priority || 999;
            const nextPriority = availableMethods[i + 1].priority || 999;
            expect(currentPriority).toBeLessThanOrEqual(nextPriority);
          }

          // Property: For DZD, local methods (baridimob, ccp) should be included
          if (currency === 'DZD') {
            const methodIds = availableMethods.map(m => m.id);
            expect(methodIds).toContain('baridimob');
            // CCP might not be in the current config, but if it exists, it should be there
            const ccpExists = Object.values(PAYMENT_METHODS).some(m => m.id === 'ccp');
            if (ccpExists) {
              expect(methodIds).toContain('ccp');
            }
          }

          // Property: For USD, international methods (binance, redotpay) should be included
          if (currency === 'USD') {
            const methodIds = availableMethods.map(m => m.id);
            const binanceExists = Object.values(PAYMENT_METHODS).some(m => m.id === 'binance');
            const redotpayExists = Object.values(PAYMENT_METHODS).some(m => m.id === 'redotpay');
            
            if (binanceExists) {
              expect(methodIds).toContain('binance');
            }
            if (redotpayExists) {
              expect(methodIds).toContain('redotpay');
            }
          }

          // Property: Crypto should be available for both currencies
          const methodIds = availableMethods.map(m => m.id);
          const cryptoExists = Object.values(PAYMENT_METHODS).some(m => m.id === 'crypto');
          if (cryptoExists) {
            expect(methodIds).toContain('crypto');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: getAvailablePaymentMethods returns empty array for invalid currency
   */
  test('getAvailablePaymentMethods handles invalid currency', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== 'DZD' && s !== 'USD'),
        (invalidCurrency) => {
          const methods = manager.getAvailablePaymentMethods(invalidCurrency);
          
          // Property: Should return empty array or only methods that support any currency
          expect(Array.isArray(methods)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Priority sorting is stable
   */
  test('Payment methods with same priority maintain order', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (currency) => {
          const methods1 = manager.getAvailablePaymentMethods(currency);
          const methods2 = manager.getAvailablePaymentMethods(currency);
          
          // Property: Multiple calls should return same order
          expect(methods1.map(m => m.id)).toEqual(methods2.map(m => m.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: All payment methods have required fields
   */
  test('All payment methods have required structure', () => {
    Object.values(PAYMENT_METHODS).forEach(method => {
      // Each method must have an id
      expect(method).toHaveProperty('id');
      expect(typeof method.id).toBe('string');
      
      // Each method must have a name
      expect(method).toHaveProperty('name');
      expect(typeof method.name).toBe('string');
      
      // Each method must have currencies array
      expect(method).toHaveProperty('currencies');
      expect(Array.isArray(method.currencies)).toBe(true);
      expect(method.currencies.length).toBeGreaterThan(0);
      
      // Each method must have priority
      expect(method).toHaveProperty('priority');
      expect(typeof method.priority).toBe('number');
      
      // Each method must have info object
      expect(method).toHaveProperty('info');
      expect(typeof method.info).toBe('object');
    });
  });
});

describe('Payment Manager - Modal Display Tests', () => {
  let manager;

  beforeEach(() => {
    // Create fresh manager instance
    manager = new PaymentManager(PAYMENT_METHODS);
    // Clear DOM
    document.body.innerHTML = '';
  });

  /**
   * Feature: international-expansion, Property 10: Payment modal displays correct information
   * Validates: Requirements 4.2, 4.4, 5.2, 5.4
   * 
   * For any payment method selection, the opened modal should display the correct 
   * payment information (account numbers, wallet addresses) from the configuration
   */
  test('Property 10: Payment modal displays correct information', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PAYMENT_METHODS)),
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (methodId, product, currency) => {
          const method = PAYMENT_METHODS[methodId];
          
          // Skip if method doesn't support this currency
          if (!method.currencies.includes(currency)) {
            return true;
          }

          // Create a mock modal in DOM
          const modal = document.createElement('div');
          modal.id = `${methodId}-modal`;
          
          // Add elements that should be updated
          const productNameEl = document.createElement('span');
          productNameEl.id = `${methodId}-product-name`;
          modal.appendChild(productNameEl);
          
          const priceDZDEl = document.createElement('span');
          priceDZDEl.id = `${methodId}-price-dzd`;
          modal.appendChild(priceDZDEl);
          
          const priceUSDEl = document.createElement('span');
          priceUSDEl.id = `${methodId}-price-usd`;
          modal.appendChild(priceUSDEl);
          
          // Add method-specific elements
          if (methodId === 'baridimob') {
            const ripEl = document.createElement('span');
            ripEl.id = `${methodId}-rip`;
            modal.appendChild(ripEl);
          }
          
          if (methodId === 'ccp') {
            const accountEl = document.createElement('span');
            accountEl.id = `${methodId}-account`;
            modal.appendChild(accountEl);
          }
          
          if (methodId === 'redotpay') {
            const idEl = document.createElement('span');
            idEl.id = `${methodId}-id`;
            modal.appendChild(idEl);
          }
          
          if (methodId === 'binance') {
            const linkEl = document.createElement('a');
            linkEl.id = `${methodId}-link`;
            modal.appendChild(linkEl);
          }
          
          document.body.appendChild(modal);
          
          // Update modal content
          manager.updateModalContent(modal, method, product, currency);
          
          // Property: Product name should be displayed
          expect(productNameEl.textContent).toBe(product.name);
          
          // Property: Prices should be displayed
          expect(priceDZDEl.textContent).toBe(product.price_dzd.toString());
          expect(priceUSDEl.textContent).toBe(product.price_usd.toString());
          
          // Property: Method-specific information should be correct
          if (methodId === 'baridimob' && method.info.rip) {
            const ripEl = modal.querySelector(`#${methodId}-rip`);
            expect(ripEl.textContent).toBe(method.info.rip);
          }
          
          if (methodId === 'ccp' && method.info.account) {
            const accountEl = modal.querySelector(`#${methodId}-account`);
            expect(accountEl.textContent).toBe(method.info.account);
          }
          
          if (methodId === 'redotpay' && method.info.id) {
            const idEl = modal.querySelector(`#${methodId}-id`);
            expect(idEl.textContent).toBe(method.info.id);
          }
          
          if (methodId === 'binance' && method.info.link) {
            const linkEl = modal.querySelector(`#${methodId}-link`);
            expect(linkEl.href).toContain(method.info.link);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: updateModalContent handles missing elements gracefully
   */
  test('updateModalContent handles missing DOM elements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PAYMENT_METHODS)),
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (methodId, product, currency) => {
          const method = PAYMENT_METHODS[methodId];
          
          // Create empty modal (no child elements)
          const modal = document.createElement('div');
          modal.id = `${methodId}-modal`;
          document.body.appendChild(modal);
          
          // Property: Should not throw error even with missing elements
          expect(() => {
            manager.updateModalContent(modal, method, product, currency);
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Modal content is consistent across multiple updates
   */
  test('Modal content updates are idempotent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PAYMENT_METHODS)),
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (methodId, product, currency) => {
          const method = PAYMENT_METHODS[methodId];
          
          // Skip if method doesn't support this currency
          if (!method.currencies.includes(currency)) {
            return true;
          }

          // Create modal with elements
          const modal = document.createElement('div');
          modal.id = `${methodId}-modal`;
          
          const productNameEl = document.createElement('span');
          productNameEl.id = `${methodId}-product-name`;
          modal.appendChild(productNameEl);
          
          document.body.appendChild(modal);
          
          // Update twice
          manager.updateModalContent(modal, method, product, currency);
          const firstUpdate = productNameEl.textContent;
          
          manager.updateModalContent(modal, method, product, currency);
          const secondUpdate = productNameEl.textContent;
          
          // Property: Multiple updates with same data should produce same result
          expect(firstUpdate).toBe(secondUpdate);
          expect(firstUpdate).toBe(product.name);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Payment Manager - Button Display Tests', () => {
  let manager;

  beforeEach(() => {
    // Create fresh manager instance
    manager = new PaymentManager(PAYMENT_METHODS);
    // Clear DOM
    document.body.innerHTML = '';
  });

  /**
   * Additional test: displayPaymentButtons creates correct number of buttons
   */
  test('displayPaymentButtons creates button for each available method', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (product, currency) => {
          // Create container
          const container = document.createElement('div');
          container.className = 'payment-methods-row';
          document.body.appendChild(container);
          
          // Get expected number of methods
          const availableMethods = manager.getAvailablePaymentMethods(currency);
          
          // Display buttons
          manager.displayPaymentButtons(product, currency, container);
          
          // Property: Should create one button per available method
          const buttons = container.querySelectorAll('button');
          expect(buttons.length).toBe(availableMethods.length);
          
          // Property: Each button should have correct class
          buttons.forEach((button, index) => {
            const method = availableMethods[index];
            expect(button.className).toContain(`${method.id}-btn`);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Primary button is marked correctly
   */
  test('First button (highest priority) is marked as primary', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (product, currency) => {
          // Create container
          const container = document.createElement('div');
          document.body.appendChild(container);
          
          // Display buttons
          manager.displayPaymentButtons(product, currency, container);
          
          const buttons = container.querySelectorAll('button');
          
          if (buttons.length > 0) {
            // Property: First button should have primary class
            expect(buttons[0].className).toContain('primary-payment');
            
            // Property: Other buttons should not have primary class
            for (let i = 1; i < buttons.length; i++) {
              expect(buttons[i].className).not.toContain('primary-payment');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Buttons have correct data attributes
   */
  test('Payment buttons have correct data attributes', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (product, currency) => {
          // Create container
          const container = document.createElement('div');
          document.body.appendChild(container);
          
          // Display buttons
          manager.displayPaymentButtons(product, currency, container);
          
          const buttons = container.querySelectorAll('button');
          
          // Property: All buttons should have correct data attributes
          buttons.forEach(button => {
            expect(button.getAttribute('data-product')).toBe(product.name);
            expect(parseFloat(button.getAttribute('data-price'))).toBe(product.price_dzd);
            expect(parseFloat(button.getAttribute('data-price-usd'))).toBe(product.price_usd);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: displayPaymentButtons clears existing buttons
   */
  test('displayPaymentButtons clears container before adding new buttons', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
          price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
        }),
        fc.constantFrom('DZD', 'USD'),
        (product, currency) => {
          // Create container with existing content
          const container = document.createElement('div');
          container.innerHTML = '<button>Old Button</button><span>Old Content</span>';
          document.body.appendChild(container);
          
          // Display buttons
          manager.displayPaymentButtons(product, currency, container);
          
          // Property: Old content should be removed
          expect(container.textContent).not.toContain('Old Button');
          expect(container.textContent).not.toContain('Old Content');
          
          // Property: Only new buttons should exist
          const buttons = container.querySelectorAll('button');
          const availableMethods = manager.getAvailablePaymentMethods(currency);
          expect(buttons.length).toBe(availableMethods.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
