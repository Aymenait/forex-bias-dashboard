/**
 * International Expansion Initialization Module
 * Integrates Currency Manager, Payment Manager, and UI components
 * Requirements: 1.1, 1.5, 2.1, 2.2, 4.2, 5.2
 */

// Note: CurrencyManager, PaymentManager, and PAYMENT_METHODS should be loaded
// before this script in the HTML file via script tags

/**
 * Load product prices and configurations from Firebase or API
 * This allows for real-time price updates without code changes
 */
async function loadLivePrices() {
  if (typeof PRODUCTS === 'undefined') return;

  try {
    // Attempt to get prices from Firebase if it's initialized
    if (window.db && window.firebaseModules) {
      const { collection, getDocs } = window.firebaseModules;
      const querySnapshot = await getDocs(collection(window.db, 'products'));

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const remoteProduct = doc.data();
          const productId = doc.id;

          if (PRODUCTS[productId]) {
            // Update local product with remote data
            // Safeguard: Don't overwrite Adobe with old prices if local is already updated
            const isAdobe = productId === 'adobe';

            if (remoteProduct.price_dzd) {
              const isOldAdobePrice = isAdobe && remoteProduct.price_dzd < 1500;
              if (!isOldAdobePrice) PRODUCTS[productId].price_dzd = remoteProduct.price_dzd;
            }
            if (remoteProduct.price_usd) {
              const isOldAdobePriceUSD = isAdobe && remoteProduct.price_usd < 5.5;
              if (!isOldAdobePriceUSD) PRODUCTS[productId].price_usd = remoteProduct.price_usd;
            }

            if (remoteProduct.durations) {
              // Merge durations with safeguard for Adobe
              if (isAdobe) {
                const mergedDurations = { ...PRODUCTS[productId].durations };
                const minPrices = { '1month': 1500, '2months': 2500, '3months': 3200 };

                Object.entries(remoteProduct.durations).forEach(([key, val]) => {
                  const minPrice = minPrices[key];
                  // Only update if remote price is NOT an old/lower price
                  if (minPrice && val.dzd < minPrice) return;
                  mergedDurations[key] = val;
                });
                PRODUCTS[productId].durations = mergedDurations;
              } else {
                PRODUCTS[productId].durations = {
                  ...PRODUCTS[productId].durations,
                  ...remoteProduct.durations
                };
              }
            }
            if (remoteProduct.active !== undefined) PRODUCTS[productId].active = remoteProduct.active;

            console.log(`✅ Updated ${productId} from Firebase`);
          }
        });
      }
    }
  } catch (error) {
    console.error('⚠️ Could not load live prices:', error);
    // Fall back to local PRODUCTS config (already loaded)
  }
}

/**
 * Main initialization function for the international expansion system
 * Loads preferences, detects location, initializes UI, and updates prices/payment methods
 */
async function initInternationalExpansion() {
  console.log('🌍 Initializing International Expansion System...');

  try {
    // Step 1: Initialize Currency Manager
    const currencyManager = new CurrencyManager();

    // Step 2: Initialize Payment Manager with payment methods configuration
    const paymentManager = new PaymentManager(PAYMENT_METHODS);

    // Step 3: Load saved currency preference from localStorage
    const savedCurrency = currencyManager.loadCurrencyPreference();

    let activeCurrency;

    if (savedCurrency) {
      // User has a saved preference - use it
      console.log(`✅ Loaded saved currency preference: ${savedCurrency}`);
      activeCurrency = savedCurrency;
      currencyManager.currentCurrency = savedCurrency;
    } else {
      // No saved preference - detect location
      console.log('🔍 No saved preference found. Detecting location...');
      const locationData = await currencyManager.detectLocation();

      // Determine currency based on detected country
      activeCurrency = currencyManager.determineCurrency(locationData.country);
      console.log(`📍 Detected country: ${locationData.country || 'Unknown'}, Currency: ${activeCurrency}`);

      // Save the determined currency
      currencyManager.setCurrency(activeCurrency);
    }

    // Step 4: Initialize Currency Selector UI
    initializeCurrencySelector(activeCurrency, currencyManager, paymentManager);

    // Step 5: Load Live Prices from Firebase (Requirement: Live Updates)
    await loadLivePrices();
    console.log('☁️ Loaded live prices from Firebase');

    // Step 6: Sync DOM with PRODUCTS config (Ensure all cards have correct prices from config)
    syncDOMWithConfig();
    console.log('🔄 Synced DOM with PRODUCTS config');

    // Step 7: Update all prices on the page with initial currency
    currencyManager.updateAllPrices(activeCurrency);
    console.log(`💰 Updated all prices to ${activeCurrency}`);

    // Step 8: Update payment methods for initial currency
    paymentManager.setCurrency(activeCurrency);
    paymentManager.updateAllPaymentButtons(activeCurrency);
    console.log(`💳 Updated payment methods for ${activeCurrency}`);

    // Step 9: Store managers globally for access by other scripts
    window.currencyManager = currencyManager;
    window.paymentManager = paymentManager;

    console.log('✅ International Expansion System initialized successfully!');

    return {
      currencyManager,
      paymentManager,
      activeCurrency
    };

  } catch (error) {
    console.error('❌ Failed to initialize International Expansion System:', error);

    // Fallback: Initialize with DZD as default
    console.log('⚠️ Falling back to DZD as default currency');

    // Create fallback managers
    let fallbackCurrencyManager, fallbackPaymentManager;

    try {
      fallbackCurrencyManager = new CurrencyManager();
      fallbackPaymentManager = new PaymentManager(PAYMENT_METHODS);

      fallbackCurrencyManager.setCurrency('DZD');
      fallbackPaymentManager.setCurrency('DZD');

      initializeCurrencySelector('DZD', fallbackCurrencyManager, fallbackPaymentManager);
      syncDOMWithConfig(); // Sync DOM even in fallback
      fallbackCurrencyManager.updateAllPrices('DZD');
      fallbackPaymentManager.updateAllPaymentButtons('DZD');

      window.currencyManager = fallbackCurrencyManager;
      window.paymentManager = fallbackPaymentManager;

      return {
        currencyManager: fallbackCurrencyManager,
        paymentManager: fallbackPaymentManager,
        activeCurrency: 'DZD'
      };
    } catch (fallbackError) {
      console.error('❌ Fallback initialization also failed:', fallbackError);

      // Return minimal fallback object
      return {
        currencyManager: null,
        paymentManager: null,
        activeCurrency: 'DZD',
        error: fallbackError
      };
    }
  }
}

/**
 * Synchronize DOM attributes (data-price-dzd/usd) with PRODUCTS config
 * This ensures that even static cards reflect the centralized config
 */
function syncDOMWithConfig() {
  if (typeof PRODUCTS === 'undefined') return;

  // Find all product cards
  const cards = document.querySelectorAll('.product-card');

  cards.forEach(card => {
    // Find matching product in config using product ID detection
    // Many elements in the card have IDs starting with the product ID (e.g., chatgpt-order-btn)
    const product = Object.values(PRODUCTS).find(p => {
      // Check if any element in the card has an ID starting with the product ID
      const hasIdMatch = card.querySelector(`[id^="${p.id}-"]`);
      if (hasIdMatch) return true;

      // Fallback: Check if title matches (for older cards)
      const titleEl = card.querySelector('h3');
      return titleEl && titleEl.textContent.trim() === p.name;
    });

    if (product) {
      // Update all price tags in this card
      const priceTags = card.querySelectorAll('.price-tag');
      priceTags.forEach(tag => {
        // Check if this tag is inside a specific duration container
        const durationContainer = tag.closest('[id*="prices-"]');
        if (durationContainer && product.durations) {
          // Extract duration key from ID (e.g., "chatgpt-prices-plus" -> "plus")
          const parts = durationContainer.id.split('-');
          const durationKey = parts[parts.length - 1];
          if (product.durations[durationKey]) {
            tag.setAttribute('data-price-dzd', product.durations[durationKey].dzd);
            tag.setAttribute('data-price-usd', product.durations[durationKey].usd);
          }
        } else if (!durationContainer) {
          // Main price tag
          tag.setAttribute('data-price-dzd', product.price_dzd);
          tag.setAttribute('data-price-usd', product.price_usd);
        }
      });

      // Update all payment buttons in this card
      const paymentBtns = card.querySelectorAll('.payment-btn-compact');
      paymentBtns.forEach(btn => {
        // Check if this card has active durations (buttons are usually updated by JS functions,
        // but let's sync their initial data attributes)
        const activeBtn = card.querySelector('.segmented-btn.active, .duration-btn.active, .type-btn.active');
        const durationKey = activeBtn ? activeBtn.getAttribute('data-duration') || activeBtn.getAttribute('data-type') : null;

        if (durationKey && product.durations && product.durations[durationKey]) {
          btn.setAttribute('data-price', product.durations[durationKey].dzd);
          btn.setAttribute('data-price-usd', product.durations[durationKey].usd);
        } else {
          // Fallback to top-level price
          btn.setAttribute('data-price', product.price_dzd);
          btn.setAttribute('data-price-usd', product.price_usd);
        }
        btn.setAttribute('data-product', product.name);
      });

      // Update duration buttons visibility/status
      if (product.durations) {
        Object.entries(product.durations).forEach(([key, durConfig]) => {
          const isAvailable = durConfig.available !== false;
          const btn = card.querySelector(`[data-duration="${key}"], [data-type="${key}"]`);
          const priceContainer = card.querySelector(`[id*="-prices-${key}"]`);

          if (btn) {
            if (!isAvailable) {
              btn.style.display = 'none';
              // If the hidden button was active, we should try to switch to another active one
              if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                const firstAvailable = Object.entries(product.durations).find(([k, v]) => v.available !== false);
                if (firstAvailable) {
                  const nextBtn = card.querySelector(`[data-duration="${firstAvailable[0]}"], [data-type="${firstAvailable[0]}"]`);
                  if (nextBtn) nextBtn.click();
                }
              }
            } else {
              btn.style.display = ''; // Restore default
            }
          }

          if (priceContainer) {
            priceContainer.style.opacity = isAvailable ? '1' : '0.5';
          }
        });
      }

      // Update order button
      const orderBtn = card.querySelector('.order-btn');
      if (orderBtn) {
        orderBtn.setAttribute('data-product', product.name);
      }
    }
  });
}

/**
 * Initialize Currency Selector UI component
 * Sets up the currency toggle buttons and their active states
 * Requirements: 2.1
 */
function initializeCurrencySelector(activeCurrency, currencyManager, paymentManager) {
  console.log('🎨 Initializing Currency Selector UI...');

  // Find all currency selector buttons
  const currencyButtons = document.querySelectorAll('.currency-btn');

  if (currencyButtons.length === 0) {
    console.warn('⚠️ No currency selector buttons found in DOM');
    return;
  }

  // Update UI to reflect active currency
  updateCurrencySelectorUI(activeCurrency);

  // Add click event listeners to currency buttons
  currencyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedCurrency = button.getAttribute('data-currency');
      handleCurrencyToggle(selectedCurrency, currencyManager, paymentManager);
    });
  });

  console.log(`✅ Currency Selector UI initialized with ${activeCurrency}`);
}

/**
 * Update Currency Selector UI to reflect active currency
 * Adds/removes 'active' class from buttons
 * Requirements: 2.1
 */
function updateCurrencySelectorUI(currency) {
  const currencyButtons = document.querySelectorAll('.currency-btn');

  currencyButtons.forEach(btn => {
    const btnCurrency = btn.getAttribute('data-currency');
    if (btnCurrency === currency) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Debounce timer for currency toggle (Requirement 7.3)
let currencyToggleTimer = null;
const CURRENCY_TOGGLE_DEBOUNCE_MS = 300;

/**
 * Handle currency toggle when user clicks currency selector
 * Updates currency, prices, payment methods, and preserves scroll position
 * Includes debouncing to handle rapid clicks (Requirement 7.3)
 * Requirements: 2.2, 2.3, 7.3, 7.4
 */
function handleCurrencyToggle(selectedCurrency, currencyManager, paymentManager) {
  // Clear any pending toggle operations (debouncing for rapid clicks)
  if (currencyToggleTimer) {
    clearTimeout(currencyToggleTimer);
  }

  // Debounce the currency toggle to prevent rapid successive updates
  currencyToggleTimer = setTimeout(() => {
    console.log(`🔄 Toggling currency to: ${selectedCurrency}`);

    // Save current scroll position (Requirement 7.4)
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Update currency in manager
    currencyManager.setCurrency(selectedCurrency);

    // Update payment manager currency
    paymentManager.setCurrency(selectedCurrency);

    // Update UI
    updateCurrencySelectorUI(selectedCurrency);

    // Update all prices (Requirement 2.3)
    currencyManager.updateAllPrices(selectedCurrency);

    // Update all payment buttons (Requirement 4.1, 5.1)
    paymentManager.updateAllPaymentButtons(selectedCurrency);

    // Restore scroll position (Requirement 7.4)
    // Check if scrollTo is available (not in test environment)
    try {
      if (typeof window.scrollTo === 'function') {
        window.scrollTo(0, scrollPosition);
      }
    } catch (error) {
      // Ignore scrollTo errors in test environment
      if (error.type !== 'not implemented') {
        console.warn('Failed to restore scroll position:', error.message);
      }
    }

    console.log(`✅ Currency toggled to ${selectedCurrency}`);
    currencyToggleTimer = null;
  }, CURRENCY_TOGGLE_DEBOUNCE_MS);
}

/**
 * Setup event listeners for payment buttons
 * Handles clicks on payment method buttons to open modals
 * Requirements: 4.2, 5.2
 */
function setupPaymentButtonListeners(paymentManager) {
  console.log('🔗 Setting up payment button event listeners...');

  // This function will be called after DOM is ready
  // It delegates event handling to dynamically created payment buttons

  // Use event delegation on the document for dynamically created buttons
  document.addEventListener('click', (event) => {
    const target = event.target;

    // Check if clicked element is a payment button or its child
    const paymentButton = target.closest('.payment-btn-compact');

    if (paymentButton) {
      event.preventDefault();
      event.stopPropagation();

      // Extract payment method from button class
      let methodId = null;
      if (paymentButton.classList.contains('crypto-pay-btn')) {
        methodId = 'crypto';
      } else if (paymentButton.classList.contains('baridimob-btn')) {
        methodId = 'baridimob';
      } else if (paymentButton.classList.contains('redotpay-btn')) {
        methodId = 'redotpay';
      } else if (paymentButton.classList.contains('binance-btn')) {
        methodId = 'binance';
      } else if (paymentButton.classList.contains('ccp-btn')) {
        methodId = 'ccp';
      }

      if (methodId) {
        // Extract product information
        const productName = paymentButton.getAttribute('data-product');
        const priceDZD = parseFloat(paymentButton.getAttribute('data-price')) || 0;
        const priceUSD = parseFloat(paymentButton.getAttribute('data-price-usd')) || 0;

        const product = {
          name: productName,
          price_dzd: priceDZD,
          price_usd: priceUSD
        };

        const currency = paymentManager.getCurrency();

        console.log(`💳 Opening ${methodId} payment modal for ${productName}`);
        paymentManager.openPaymentModal(methodId, product, currency);
      }
    }
  });

  console.log('✅ Payment button event listeners set up');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initInternationalExpansion,
    initializeCurrencySelector,
    updateCurrencySelectorUI,
    handleCurrencyToggle,
    setupPaymentButtonListeners
  };
}

// ES6 export for testing (commented out for browser compatibility)
// export {
//   initInternationalExpansion,
//   initializeCurrencySelector,
//   updateCurrencySelectorUI,
//   handleCurrencyToggle,
//   setupPaymentButtonListeners
// };
