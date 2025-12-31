/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Payment UI - Property-Based Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * اختبارات الخصائص لوحدة عرض أزرار الدفع
 * تستخدم fast-check للتحقق من الخصائص العامة
 * 
 * Feature: admin-full-control
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import {
    PAYMENT_METHODS,
    PAYMENT_BUTTON_CLASSES,
    getPaymentButtons,
    updatePaymentButtonsVisibility,
    setPaymentButtonVisibility,
    getPaymentButtonsVisibilityState,
    isPaymentButtonVisible,
    getExpectedPaymentUIState,
    verifyPaymentUIState
} from './payment-ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Setup DOM Environment
// ═══════════════════════════════════════════════════════════════════════════

function createTestProductCard() {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', 'test-product');
    card.innerHTML = `
        <div class="product-image"></div>
        <h3>Test Product</h3>
        <div class="payment-methods-row">
            <button class="payment-btn-compact crypto-pay-btn" data-product="Test Product">
                <span>USDT</span>
            </button>
            <button class="payment-btn-compact redotpay-btn" data-product="Test Product">
                <span>RedotPay</span>
            </button>
            <button class="payment-btn-compact baridimob-btn" data-product="Test Product">
                <span>BaridiMob</span>
            </button>
        </div>
        <button class="order-btn" data-product="Test Product">اطلب الآن</button>
    `;
    return card;
}

let testContainer;

beforeEach(() => {
    // Clear the document body and create fresh test container
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.appendChild(createTestProductCard());
    document.body.appendChild(testContainer);
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 10: Payment Method Visibility
// Validates: Requirements 8.2, 8.4
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 10: Payment Method Visibility', () => {
    /**
     * Feature: admin-full-control, Property 10: Payment Method Visibility
     * 
     * *For any* product with disabled payment methods, those payment buttons 
     * should not appear on the main page. Only enabled payment methods should be visible.
     * 
     * Validates: Requirements 8.2, 8.4
     */

    // Arbitrary for payment methods configuration
    const paymentMethodsArb = fc.record({
        usdt: fc.boolean(),
        redotpay: fc.boolean(),
        baridimob: fc.boolean()
    });

    it('should show only enabled payment methods for all configurations', () => {
        fc.assert(
            fc.property(
                paymentMethodsArb,
                (paymentMethods) => {
                    // Get the product card
                    const productCard = document.querySelector('.product-card');
                    
                    // Reset all buttons to visible
                    const buttons = getPaymentButtons(productCard);
                    Object.values(buttons).forEach(btn => {
                        if (btn) {
                            btn.style.display = '';
                            btn.classList.remove('payment-hidden');
                        }
                    });
                    
                    // Apply the payment methods configuration
                    updatePaymentButtonsVisibility(productCard, paymentMethods);
                    
                    // Verify each button's visibility matches the configuration
                    const visibilityState = getPaymentButtonsVisibilityState(productCard);
                    
                    // USDT button visibility should match usdt setting
                    expect(visibilityState.usdt).toBe(paymentMethods.usdt);
                    
                    // RedotPay button visibility should match redotpay setting
                    expect(visibilityState.redotpay).toBe(paymentMethods.redotpay);
                    
                    // BaridiMob button visibility should match baridimob setting
                    expect(visibilityState.baridimob).toBe(paymentMethods.baridimob);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should correctly predict expected UI state for all configurations', () => {
        fc.assert(
            fc.property(
                paymentMethodsArb,
                (paymentMethods) => {
                    const expectedState = getExpectedPaymentUIState(paymentMethods);
                    
                    // Expected state should match the input configuration
                    expect(expectedState.usdt).toBe(paymentMethods.usdt);
                    expect(expectedState.redotpay).toBe(paymentMethods.redotpay);
                    expect(expectedState.baridimob).toBe(paymentMethods.baridimob);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should verify UI state matches configuration after update', () => {
        fc.assert(
            fc.property(
                paymentMethodsArb,
                (paymentMethods) => {
                    const productCard = document.querySelector('.product-card');
                    
                    // Reset all buttons
                    const buttons = getPaymentButtons(productCard);
                    Object.values(buttons).forEach(btn => {
                        if (btn) {
                            btn.style.display = '';
                            btn.classList.remove('payment-hidden');
                        }
                    });
                    
                    // Apply configuration
                    updatePaymentButtonsVisibility(productCard, paymentMethods);
                    
                    // Verify using the verification function
                    const isValid = verifyPaymentUIState(productCard, paymentMethods);
                    expect(isValid).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should hide disabled payment buttons and show enabled ones', () => {
        fc.assert(
            fc.property(
                paymentMethodsArb,
                (paymentMethods) => {
                    const productCard = document.querySelector('.product-card');
                    
                    // Reset buttons
                    const buttons = getPaymentButtons(productCard);
                    Object.values(buttons).forEach(btn => {
                        if (btn) {
                            btn.style.display = '';
                            btn.classList.remove('payment-hidden');
                        }
                    });
                    
                    // Apply configuration
                    updatePaymentButtonsVisibility(productCard, paymentMethods);
                    
                    // Check each button
                    if (buttons.usdt) {
                        if (paymentMethods.usdt) {
                            expect(buttons.usdt.style.display).not.toBe('none');
                            expect(buttons.usdt.classList.contains('payment-hidden')).toBe(false);
                        } else {
                            expect(buttons.usdt.style.display).toBe('none');
                            expect(buttons.usdt.classList.contains('payment-hidden')).toBe(true);
                        }
                    }
                    
                    if (buttons.redotpay) {
                        if (paymentMethods.redotpay) {
                            expect(buttons.redotpay.style.display).not.toBe('none');
                            expect(buttons.redotpay.classList.contains('payment-hidden')).toBe(false);
                        } else {
                            expect(buttons.redotpay.style.display).toBe('none');
                            expect(buttons.redotpay.classList.contains('payment-hidden')).toBe(true);
                        }
                    }
                    
                    if (buttons.baridimob) {
                        if (paymentMethods.baridimob) {
                            expect(buttons.baridimob.style.display).not.toBe('none');
                            expect(buttons.baridimob.classList.contains('payment-hidden')).toBe(false);
                        } else {
                            expect(buttons.baridimob.style.display).toBe('none');
                            expect(buttons.baridimob.classList.contains('payment-hidden')).toBe(true);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Unit Tests for Payment UI Functions
// ═══════════════════════════════════════════════════════════════════════════

describe('getPaymentButtons', () => {
    it('should return all payment buttons from product card', () => {
        const productCard = document.querySelector('.product-card');
        const buttons = getPaymentButtons(productCard);
        
        expect(buttons.usdt).not.toBeNull();
        expect(buttons.redotpay).not.toBeNull();
        expect(buttons.baridimob).not.toBeNull();
    });

    it('should return empty object for null product card', () => {
        const buttons = getPaymentButtons(null);
        expect(buttons).toEqual({});
    });
});

describe('setPaymentButtonVisibility', () => {
    it('should hide button when visible is false', () => {
        const productCard = document.querySelector('.product-card');
        const button = productCard.querySelector('.crypto-pay-btn');
        
        setPaymentButtonVisibility(button, false);
        
        expect(button.style.display).toBe('none');
        expect(button.classList.contains('payment-hidden')).toBe(true);
    });

    it('should show button when visible is true', () => {
        const productCard = document.querySelector('.product-card');
        const button = productCard.querySelector('.crypto-pay-btn');
        
        // First hide it
        setPaymentButtonVisibility(button, false);
        // Then show it
        setPaymentButtonVisibility(button, true);
        
        expect(button.style.display).not.toBe('none');
        expect(button.classList.contains('payment-hidden')).toBe(false);
    });

    it('should handle null button gracefully', () => {
        expect(() => setPaymentButtonVisibility(null, true)).not.toThrow();
        expect(() => setPaymentButtonVisibility(null, false)).not.toThrow();
    });
});

describe('isPaymentButtonVisible', () => {
    it('should return true for visible button', () => {
        const productCard = document.querySelector('.product-card');
        const button = productCard.querySelector('.crypto-pay-btn');
        
        expect(isPaymentButtonVisible(button)).toBe(true);
    });

    it('should return false for hidden button', () => {
        const productCard = document.querySelector('.product-card');
        const button = productCard.querySelector('.crypto-pay-btn');
        
        setPaymentButtonVisibility(button, false);
        
        expect(isPaymentButtonVisible(button)).toBe(false);
    });

    it('should return false for null button', () => {
        expect(isPaymentButtonVisible(null)).toBe(false);
    });
});

describe('updatePaymentButtonsVisibility', () => {
    it('should hide all buttons when all methods are disabled', () => {
        const productCard = document.querySelector('.product-card');
        
        updatePaymentButtonsVisibility(productCard, {
            usdt: false,
            redotpay: false,
            baridimob: false
        });
        
        const buttons = getPaymentButtons(productCard);
        expect(isPaymentButtonVisible(buttons.usdt)).toBe(false);
        expect(isPaymentButtonVisible(buttons.redotpay)).toBe(false);
        expect(isPaymentButtonVisible(buttons.baridimob)).toBe(false);
    });

    it('should show all buttons when all methods are enabled', () => {
        const productCard = document.querySelector('.product-card');
        
        // First hide all
        updatePaymentButtonsVisibility(productCard, {
            usdt: false,
            redotpay: false,
            baridimob: false
        });
        
        // Then enable all
        updatePaymentButtonsVisibility(productCard, {
            usdt: true,
            redotpay: true,
            baridimob: true
        });
        
        const buttons = getPaymentButtons(productCard);
        expect(isPaymentButtonVisible(buttons.usdt)).toBe(true);
        expect(isPaymentButtonVisible(buttons.redotpay)).toBe(true);
        expect(isPaymentButtonVisible(buttons.baridimob)).toBe(true);
    });

    it('should handle partial configurations', () => {
        const productCard = document.querySelector('.product-card');
        
        updatePaymentButtonsVisibility(productCard, {
            usdt: true,
            redotpay: false,
            baridimob: true
        });
        
        const buttons = getPaymentButtons(productCard);
        expect(isPaymentButtonVisible(buttons.usdt)).toBe(true);
        expect(isPaymentButtonVisible(buttons.redotpay)).toBe(false);
        expect(isPaymentButtonVisible(buttons.baridimob)).toBe(true);
    });

    it('should handle null product card gracefully', () => {
        expect(() => updatePaymentButtonsVisibility(null, { usdt: true })).not.toThrow();
    });

    it('should handle null payment methods gracefully', () => {
        const productCard = document.querySelector('.product-card');
        expect(() => updatePaymentButtonsVisibility(productCard, null)).not.toThrow();
    });
});

describe('getExpectedPaymentUIState', () => {
    it('should return all true for null payment methods', () => {
        const state = getExpectedPaymentUIState(null);
        expect(state.usdt).toBe(true);
        expect(state.redotpay).toBe(true);
        expect(state.baridimob).toBe(true);
    });

    it('should return correct state for mixed configuration', () => {
        const state = getExpectedPaymentUIState({
            usdt: true,
            redotpay: false,
            baridimob: true
        });
        expect(state.usdt).toBe(true);
        expect(state.redotpay).toBe(false);
        expect(state.baridimob).toBe(true);
    });
});

describe('verifyPaymentUIState', () => {
    it('should return true when UI matches configuration', () => {
        const productCard = document.querySelector('.product-card');
        const config = { usdt: true, redotpay: false, baridimob: true };
        
        updatePaymentButtonsVisibility(productCard, config);
        
        expect(verifyPaymentUIState(productCard, config)).toBe(true);
    });

    it('should return false when UI does not match configuration', () => {
        const productCard = document.querySelector('.product-card');
        
        // Set UI to one state
        updatePaymentButtonsVisibility(productCard, {
            usdt: true,
            redotpay: true,
            baridimob: true
        });
        
        // Verify against different configuration
        expect(verifyPaymentUIState(productCard, {
            usdt: false,
            redotpay: true,
            baridimob: true
        })).toBe(false);
    });
});
