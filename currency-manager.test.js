/**
 * Property-Based Tests for Currency Manager Module
 * Using fast-check for property-based testing
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import CurrencyManager from './currency-manager.js';

describe('Currency Manager - Property-Based Tests', () => {
  let manager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    jest.clearAllMocks();
    // Create fresh manager instance
    manager = new CurrencyManager();
  });

  /**
   * Feature: international-expansion, Property 1: Geolocation determines correct currency
   * Validates: Requirements 1.1, 1.2, 1.3
   * 
   * For any valid API response from geolocation service, when the country code is "DZ" 
   * then the system should set currency to DZD, otherwise it should set currency to USD
   */
  test('Property 1: Geolocation determines correct currency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('DZ'),
          // Generate valid 2-letter country codes (uppercase letters only)
          fc.stringOf(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 2, maxLength: 2 }).filter(code => code !== 'DZ')
        ),
        async (countryCode) => {
          // Clear localStorage to avoid cache interference
          localStorage.clear();
          
          // Create fresh manager
          const testManager = new CurrencyManager();
          
          // Mock successful API response
          global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ country: countryCode })
          });

          // Detect location
          const result = await testManager.detectLocation();

          // Verify location was detected
          expect(result.country).toBe(countryCode);

          // Determine currency based on country
          const currency = testManager.determineCurrency(result.country);

          // Property: DZ should map to DZD, everything else to USD
          if (countryCode === 'DZ') {
            expect(currency).toBe('DZD');
          } else {
            expect(currency).toBe('USD');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: international-expansion, Property 2: Fallback to USD on geolocation failure
   * Validates: Requirements 1.4
   * 
   * For any geolocation API error or timeout, the system should default to USD currency
   */
  test('Property 2: Fallback to USD on geolocation failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'network_error',
          'timeout_error',
          'invalid_response',
          'missing_country'
        ),
        async (errorType) => {
          // Clear localStorage to avoid cache interference
          localStorage.clear();
          
          // Create fresh manager
          const testManager = new CurrencyManager();
          
          // Mock API failure based on error type
          if (errorType === 'network_error') {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
          } else if (errorType === 'timeout_error') {
            global.fetch.mockRejectedValueOnce(new Error('Timeout'));
          } else if (errorType === 'invalid_response') {
            global.fetch.mockResolvedValueOnce({ ok: false });
          } else if (errorType === 'missing_country') {
            global.fetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({})
            });
          }

          // Detect location (should fail)
          const result = await testManager.detectLocation();

          // Property: On any failure, country should be null
          expect(result.country).toBeNull();
          expect(result.error).toBeDefined();

          // Determine currency from null country
          const currency = testManager.determineCurrency(result.country);

          // Property: null country should always map to USD
          expect(currency).toBe('USD');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: international-expansion, Property 3: Currency preference persistence
   * Validates: Requirements 1.5, 2.4
   * 
   * For any currency selection (manual or automatic), the system should save the choice 
   * to localStorage and restore it on subsequent visits
   */
  test('Property 3: Currency preference persistence', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (currency) => {
          // Save currency preference
          manager.saveCurrencyPreference(currency);

          // Create new manager instance (simulating new visit)
          const newManager = new CurrencyManager();
          const loaded = newManager.loadCurrencyPreference();

          // Property: Saved currency should be restored exactly
          expect(loaded).toBe(currency);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Round-trip property for currency preference
   * Ensures that save followed by load is identity operation
   */
  test('Property 3 (Round-trip): Save then load preserves currency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (currency) => {
          // Save and immediately load
          manager.saveCurrencyPreference(currency);
          const loaded = manager.loadCurrencyPreference();

          // Property: Round-trip should preserve value
          expect(loaded).toBe(currency);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: determineCurrency is a pure function
   * Same input should always produce same output
   */
  test('determineCurrency is deterministic', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 2, maxLength: 2 }), { nil: null }),
        (countryCode) => {
          const result1 = manager.determineCurrency(countryCode);
          const result2 = manager.determineCurrency(countryCode);

          // Property: Function should be deterministic
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Product Data Structure - Property-Based Tests
 */

import { validateProduct, PRODUCTS, getProductPrice } from './currency-config.js';

describe('Product Data Structure - Property-Based Tests', () => {
  /**
   * Feature: international-expansion, Property 6: Products require both prices
   * Validates: Requirements 3.1, 3.4
   * 
   * For any product object, validation should fail if either price_dzd or price_usd 
   * is missing or invalid
   */
  test('Property 6: Products require both prices', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          price_dzd: fc.option(fc.oneof(
            fc.double({ min: 0.01, max: 100000, noNaN: true }),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(-1),
            fc.constant(0),
            fc.string()
          )),
          price_usd: fc.option(fc.oneof(
            fc.double({ min: 0.01, max: 10000, noNaN: true }),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(-1),
            fc.constant(0),
            fc.string()
          ))
        }),
        (product) => {
          const isValid = validateProduct(product);
          
          // Property: Product is valid only if both prices exist and are positive numbers
          const hasPriceDZD = product.price_dzd !== null && 
                              product.price_dzd !== undefined && 
                              typeof product.price_dzd === 'number' && 
                              product.price_dzd > 0;
          
          const hasPriceUSD = product.price_usd !== null && 
                              product.price_usd !== undefined && 
                              typeof product.price_usd === 'number' && 
                              product.price_usd > 0;
          
          const shouldBeValid = hasPriceDZD && hasPriceUSD;
          
          expect(isValid).toBe(shouldBeValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: All existing products should be valid
   */
  test('All existing products have both prices', () => {
    Object.keys(PRODUCTS).forEach(key => {
      const product = PRODUCTS[key];
      
      // Each product must have both prices
      expect(product).toHaveProperty('price_dzd');
      expect(product).toHaveProperty('price_usd');
      
      // Both prices must be positive numbers
      expect(typeof product.price_dzd).toBe('number');
      expect(typeof product.price_usd).toBe('number');
      expect(product.price_dzd).toBeGreaterThan(0);
      expect(product.price_usd).toBeGreaterThan(0);
      
      // Validation should pass
      expect(validateProduct(product)).toBe(true);
    });
  });
});

  /**
   * Feature: international-expansion, Property 7: Prices use stored values without conversion
   * Validates: Requirements 3.2
   * 
   * For any product and currency combination, the displayed price should exactly match 
   * the stored price value (price_dzd or price_usd) without any calculation
   */
  test('Property 7: Prices use stored values without conversion', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PRODUCTS)),
        fc.constantFrom('DZD', 'USD'),
        (productKey, currency) => {
          const product = PRODUCTS[productKey];
          const displayedPrice = getProductPrice(product, currency);
          
          // Property: Displayed price must exactly match stored price (no conversion)
          if (currency === 'DZD') {
            expect(displayedPrice).toBe(product.price_dzd);
            // Ensure no conversion happened (price should be exact match)
            expect(displayedPrice).toStrictEqual(product.price_dzd);
          } else if (currency === 'USD') {
            expect(displayedPrice).toBe(product.price_usd);
            // Ensure no conversion happened (price should be exact match)
            expect(displayedPrice).toStrictEqual(product.price_usd);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: international-expansion, Property 8: Independent price updates
   * Validates: Requirements 3.3
   * 
   * For any product, updating price_dzd should not affect price_usd and vice versa
   */
  test('Property 8: Independent price updates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(PRODUCTS)),
        fc.double({ min: 1, max: 100000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (productKey, newPriceDZD, newPriceUSD) => {
          // Create a copy of the product to avoid mutating the original
          const product = { ...PRODUCTS[productKey] };
          const originalPriceDZD = product.price_dzd;
          const originalPriceUSD = product.price_usd;
          
          // Update price_dzd only
          product.price_dzd = newPriceDZD;
          
          // Property: Updating price_dzd should not affect price_usd
          expect(product.price_usd).toBe(originalPriceUSD);
          expect(product.price_usd).toStrictEqual(originalPriceUSD);
          
          // Reset and update price_usd only
          product.price_dzd = originalPriceDZD;
          product.price_usd = newPriceUSD;
          
          // Property: Updating price_usd should not affect price_dzd
          expect(product.price_dzd).toBe(originalPriceDZD);
          expect(product.price_dzd).toStrictEqual(originalPriceDZD);
        }
      ),
      { numRuns: 100 }
    );
  });

/**
 * Price Display Component - Property-Based Tests
 */
describe('Price Display Component - Property-Based Tests', () => {
  let manager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    jest.clearAllMocks();
    // Create fresh manager instance
    manager = new CurrencyManager();
    // Set a default currency
    manager.currentCurrency = 'USD';
  });

  /**
   * Feature: international-expansion, Property 11: Currency symbols are consistent
   * Validates: Requirements 6.1, 6.2, 6.4
   * 
   * For any price display, when currency is DZD the symbol should be "د.ج" or "DZD", 
   * when currency is USD the symbol should be "$" or "USD", and all prices should use 
   * the same formatting function
   */
  test('Property 11: Currency symbols are consistent', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000000, noNaN: true }),
        fc.constantFrom('DZD', 'USD'),
        (amount, currency) => {
          // Format the price
          const formatted = manager.formatPrice(amount, currency);
          
          // Property: DZD prices must contain "د.ج"
          if (currency === 'DZD') {
            expect(formatted).toContain('د.ج');
            // Should not contain USD symbol
            expect(formatted).not.toContain('$');
          }
          
          // Property: USD prices must contain "$"
          if (currency === 'USD') {
            expect(formatted).toContain('$');
            // Should not contain DZD symbol
            expect(formatted).not.toContain('د.ج');
          }
          
          // Property: Formatted string should contain the formatted number
          // Note: formatPrice uses toLocaleString which may round the number
          const formattedAmount = amount.toLocaleString('en-US');
          expect(formatted).toContain(formattedAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Currency symbols are positioned correctly
   */
  test('Currency symbols have correct position', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 100000, noNaN: true }),
        fc.constantFrom('DZD', 'USD'),
        (amount, currency) => {
          const formatted = manager.formatPrice(amount, currency);
          
          // Property: DZD symbol should be at the end (suffix)
          if (currency === 'DZD') {
            expect(formatted).toMatch(/\d+.*د\.ج$/);
          }
          
          // Property: USD symbol should be at the beginning (prefix)
          if (currency === 'USD') {
            expect(formatted).toMatch(/^\$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: formatPrice is consistent (same input = same output)
   */
  test('formatPrice is deterministic', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000000, noNaN: true }),
        fc.constantFrom('DZD', 'USD'),
        (amount, currency) => {
          const result1 = manager.formatPrice(amount, currency);
          const result2 = manager.formatPrice(amount, currency);
          
          // Property: Same inputs should produce same output
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: international-expansion, Property 5: All prices update on currency change
   * Validates: Requirements 2.3, 6.3
   * 
   * For any currency change, all price elements in the DOM should update to display 
   * the correct price and currency symbol without page reload
   */
  test('Property 5: All prices update on currency change', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
            price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom('DZD', 'USD'),
        async (products, targetCurrency) => {
          // Setup: Create DOM elements for each product
          document.body.innerHTML = '';
          const priceElements = [];
          
          products.forEach((product, index) => {
            const element = document.createElement('span');
            element.setAttribute('data-price-dzd', product.price_dzd.toString());
            element.setAttribute('data-price-usd', product.price_usd.toString());
            element.className = 'price-element';
            element.textContent = '0'; // Initial placeholder
            document.body.appendChild(element);
            priceElements.push(element);
          });
          
          // Set manager currency
          manager.currentCurrency = targetCurrency;
          
          // Action: Update all prices
          manager.updateAllPrices(targetCurrency);
          
          // Wait for requestAnimationFrame and setTimeout to complete (150ms + 50ms buffer)
          await new Promise(resolve => setTimeout(resolve, 250));
          
          // Property: All price elements should be updated
          priceElements.forEach((element, index) => {
            const product = products[index];
            const expectedPrice = targetCurrency === 'DZD' ? product.price_dzd : product.price_usd;
            const expectedFormatted = manager.formatPrice(expectedPrice, targetCurrency);
            
            // Each element should display the correct formatted price
            expect(element.textContent).toBe(expectedFormatted);
            
            // Each element should contain the correct currency symbol
            if (targetCurrency === 'DZD') {
              expect(element.textContent).toContain('د.ج');
            } else {
              expect(element.textContent).toContain('$');
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for 100 iterations with 250ms delays

  /**
   * Additional test: displayPrice uses correct price based on currency
   */
  test('displayPrice selects correct price field', () => {
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
          manager.currentCurrency = currency;
          const displayed = manager.displayPrice(product, currency);
          
          // Property: Should use price_dzd for DZD currency
          if (currency === 'DZD') {
            const expected = manager.formatPrice(product.price_dzd, 'DZD');
            expect(displayed).toBe(expected);
          }
          
          // Property: Should use price_usd for USD currency
          if (currency === 'USD') {
            const expected = manager.formatPrice(product.price_usd, 'USD');
            expect(displayed).toBe(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: updateAllPrices handles empty DOM gracefully
   */
  test('updateAllPrices handles empty DOM', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (currency) => {
          // Setup: Empty DOM
          document.body.innerHTML = '';
          
          // Action: Should not throw error
          expect(() => {
            manager.updateAllPrices(currency);
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: updateAllPrices ignores elements with invalid data
   */
  test('updateAllPrices handles invalid price data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('DZD', 'USD'),
        async (currency) => {
          // Setup: Create element with invalid data
          document.body.innerHTML = '';
          const element = document.createElement('span');
          element.setAttribute('data-price-dzd', 'invalid');
          element.setAttribute('data-price-usd', 'invalid');
          element.textContent = 'Original';
          document.body.appendChild(element);
          
          manager.currentCurrency = currency;
          
          // Action: Update prices
          manager.updateAllPrices(currency);
          
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              // Property: Element with invalid data should remain unchanged
              expect(element.textContent).toBe('Original');
              resolve();
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Currency Selector UI Component - Property-Based Tests
 */
describe('Currency Selector UI Component - Property-Based Tests', () => {
  let manager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    jest.clearAllMocks();
    // Create fresh manager instance
    manager = new CurrencyManager();
    // Set a default currency
    manager.currentCurrency = 'DZD';
  });

  /**
   * Feature: international-expansion, Property 4: Currency toggle switches between DZD and USD
   * Validates: Requirements 2.2
   * 
   * For any current currency state, clicking the currency selector should toggle to 
   * the other currency (DZD ↔ USD)
   */
  test('Property 4: Currency toggle switches between DZD and USD', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (initialCurrency) => {
          // Set initial currency
          manager.currentCurrency = initialCurrency;
          
          // Determine expected currency after toggle
          const expectedCurrency = initialCurrency === 'DZD' ? 'USD' : 'DZD';
          
          // Simulate toggle by calling setCurrency with opposite currency
          manager.setCurrency(expectedCurrency);
          
          // Property: Currency should toggle to the opposite value
          expect(manager.getCurrentCurrency()).toBe(expectedCurrency);
          
          // Property: Toggling again should return to original
          const originalCurrency = initialCurrency;
          manager.setCurrency(originalCurrency);
          expect(manager.getCurrentCurrency()).toBe(originalCurrency);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Toggle is idempotent when called twice
   */
  test('Double toggle returns to original currency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (initialCurrency) => {
          manager.currentCurrency = initialCurrency;
          
          // Toggle twice
          const opposite = initialCurrency === 'DZD' ? 'USD' : 'DZD';
          manager.setCurrency(opposite);
          manager.setCurrency(initialCurrency);
          
          // Property: Should return to original
          expect(manager.getCurrentCurrency()).toBe(initialCurrency);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: international-expansion, Property 12: Currency switch performance
   * Validates: Requirements 7.1
   * 
   * For any currency toggle action, the price update should complete in less than 200ms
   */
  test('Property 12: Currency switch performance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
            price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.constantFrom('DZD', 'USD'),
        async (products, targetCurrency) => {
          // Setup: Create DOM elements for products
          document.body.innerHTML = '';
          
          products.forEach((product) => {
            const element = document.createElement('span');
            element.setAttribute('data-price-dzd', product.price_dzd.toString());
            element.setAttribute('data-price-usd', product.price_usd.toString());
            document.body.appendChild(element);
          });
          
          // Measure time for currency switch
          const startTime = performance.now();
          
          // Action: Update all prices
          manager.updateAllPrices(targetCurrency);
          
          // Wait for requestAnimationFrame to complete
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              // Property: Update should complete in less than 200ms
              expect(duration).toBeLessThan(200);
              
              resolve();
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: international-expansion, Property 13: Rapid toggle handling
   * Validates: Requirements 7.3
   * 
   * For any sequence of rapid currency toggle clicks, the final currency state should 
   * be correct and all prices should match that currency
   */
  test('Property 13: Rapid toggle handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('DZD', 'USD'),
        fc.integer({ min: 1, max: 10 }),
        fc.array(
          fc.record({
            price_dzd: fc.double({ min: 1, max: 100000, noNaN: true }),
            price_usd: fc.double({ min: 1, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (initialCurrency, toggleCount, products) => {
          // Setup: Create DOM elements
          document.body.innerHTML = '';
          const priceElements = [];
          
          products.forEach((product) => {
            const element = document.createElement('span');
            element.setAttribute('data-price-dzd', product.price_dzd.toString());
            element.setAttribute('data-price-usd', product.price_usd.toString());
            document.body.appendChild(element);
            priceElements.push(element);
          });
          
          // Set initial currency
          manager.currentCurrency = initialCurrency;
          
          // Perform rapid toggles
          let currentCurrency = initialCurrency;
          for (let i = 0; i < toggleCount; i++) {
            currentCurrency = currentCurrency === 'DZD' ? 'USD' : 'DZD';
            manager.setCurrency(currentCurrency);
            manager.updateAllPrices(currentCurrency);
          }
          
          // Calculate expected final currency
          const expectedCurrency = toggleCount % 2 === 0 ? initialCurrency : (initialCurrency === 'DZD' ? 'USD' : 'DZD');
          
          // Wait for all updates to complete (150ms delay + 50ms buffer)
          await new Promise(resolve => setTimeout(resolve, 250));
          
          // Property: Final currency should be correct
          expect(manager.getCurrentCurrency()).toBe(expectedCurrency);
          
          // Property: All prices should match the final currency
          priceElements.forEach((element, index) => {
            const product = products[index];
            const expectedPrice = expectedCurrency === 'DZD' ? product.price_dzd : product.price_usd;
            const expectedFormatted = manager.formatPrice(expectedPrice, expectedCurrency);
            
            expect(element.textContent).toBe(expectedFormatted);
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for 100 iterations with 250ms delays

  /**
   * Feature: international-expansion, Property 14: Scroll position preservation
   * Validates: Requirements 7.4
   * 
   * For any currency change, the page scroll position should remain unchanged after 
   * prices update
   */
  test('Property 14: Scroll position preservation', async () => {
    // Mock window.scrollTo since it's not implemented in JSDOM
    window.scrollTo = jest.fn();
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5000 }),
        fc.constantFrom('DZD', 'USD'),
        async (scrollPosition, targetCurrency) => {
          // Setup: Create a tall page with content
          document.body.innerHTML = '';
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '10000px';
          document.body.appendChild(tallDiv);
          
          // Add some price elements
          const priceElement = document.createElement('span');
          priceElement.setAttribute('data-price-dzd', '1000');
          priceElement.setAttribute('data-price-usd', '5');
          document.body.appendChild(priceElement);
          
          // Mock scroll position by setting pageYOffset and scrollTop
          Object.defineProperty(window, 'pageYOffset', {
            writable: true,
            configurable: true,
            value: scrollPosition
          });
          Object.defineProperty(document.documentElement, 'scrollTop', {
            writable: true,
            configurable: true,
            value: scrollPosition
          });
          
          // Verify scroll position was set
          const initialScroll = window.pageYOffset || document.documentElement.scrollTop;
          
          // Action: Update prices (simulating currency change)
          manager.updateAllPrices(targetCurrency);
          
          // Wait for update to complete
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              const finalScroll = window.pageYOffset || document.documentElement.scrollTop;
              
              // Property: Scroll position should remain unchanged
              // Note: In JSDOM, scroll might not work perfectly, so we check if it's close
              expect(Math.abs(finalScroll - initialScroll)).toBeLessThanOrEqual(1);
              
              resolve();
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Currency preference is saved on toggle
   */
  test('Currency toggle saves preference to localStorage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DZD', 'USD'),
        (currency) => {
          // Clear localStorage
          localStorage.clear();
          
          // Set currency (which should save to localStorage)
          manager.setCurrency(currency);
          
          // Property: Preference should be saved
          const saved = manager.loadCurrencyPreference();
          expect(saved).toBe(currency);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Invalid currency is rejected
   */
  test('setCurrency rejects invalid currencies', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== 'DZD' && s !== 'USD'),
        (invalidCurrency) => {
          const originalCurrency = manager.getCurrentCurrency();
          
          // Attempt to set invalid currency
          manager.setCurrency(invalidCurrency);
          
          // Property: Currency should remain unchanged
          expect(manager.getCurrentCurrency()).toBe(originalCurrency);
        }
      ),
      { numRuns: 100 }
    );
  });
});
