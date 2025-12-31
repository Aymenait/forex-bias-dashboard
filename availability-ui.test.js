/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Availability UI - Property-Based Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * اختبارات الخصائص لوحدة عرض حالة التوفر
 * تستخدم fast-check للتحقق من الخصائص العامة
 * 
 * Feature: admin-full-control
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import {
    AVAILABILITY_STATUS,
    AVAILABILITY_TEXTS,
    getAvailabilityText,
    getExpectedUIState,
    createAvailabilityBadge,
    updateProductCardAvailability,
    enableProductButtons,
    disableProductButtons
} from './availability-ui.js';

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
            <button class="payment-btn-compact crypto-pay-btn">USDT</button>
            <button class="payment-btn-compact redotpay-btn">RedotPay</button>
            <button class="payment-btn-compact baridimob-btn">BaridiMob</button>
        </div>
        <button class="order-btn">اطلب الآن</button>
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
// Property 3: Availability Status UI Mapping
// Validates: Requirements 2.3, 2.4, 2.5
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 3: Availability Status UI Mapping', () => {
    /**
     * Feature: admin-full-control, Property 3: Availability Status UI Mapping
     * 
     * *For any* product with a given availability status (available, unavailable, coming_soon),
     * the main page should display the correct badge and button state:
     * - available → no badge, active order button
     * - unavailable → "غير متوفر" badge, disabled order button
     * - coming_soon → "قريباً" badge, disabled order button
     * 
     * Validates: Requirements 2.3, 2.4, 2.5
     */

    // Arbitrary for availability status
    const availabilityStatusArb = fc.constantFrom(
        AVAILABILITY_STATUS.AVAILABLE,
        AVAILABILITY_STATUS.UNAVAILABLE,
        AVAILABILITY_STATUS.COMING_SOON
    );

    // Arbitrary for language
    const languageArb = fc.constantFrom('ar', 'en', 'fr');

    it('should map availability status to correct UI state for all statuses and languages', () => {
        fc.assert(
            fc.property(
                availabilityStatusArb,
                languageArb,
                (status, lang) => {
                    // Get the expected UI state
                    const expectedState = getExpectedUIState(status);
                    
                    // Verify expected state is defined
                    expect(expectedState).not.toBeNull();
                    
                    // Verify badge presence
                    if (status === AVAILABILITY_STATUS.AVAILABLE) {
                        expect(expectedState.hasBadge).toBe(false);
                        expect(expectedState.orderButtonDisabled).toBe(false);
                        expect(expectedState.paymentButtonsDisabled).toBe(false);
                    } else {
                        expect(expectedState.hasBadge).toBe(true);
                        expect(expectedState.orderButtonDisabled).toBe(true);
                        expect(expectedState.paymentButtonsDisabled).toBe(true);
                    }
                    
                    // Verify badge text exists for the language
                    if (expectedState.hasBadge && expectedState.badgeText) {
                        expect(expectedState.badgeText[lang]).toBeDefined();
                        expect(expectedState.badgeText[lang].length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should create badge only for unavailable and coming_soon statuses', () => {
        fc.assert(
            fc.property(
                availabilityStatusArb,
                languageArb,
                (status, lang) => {
                    const badge = createAvailabilityBadge(status, lang);
                    
                    if (status === AVAILABILITY_STATUS.AVAILABLE) {
                        // No badge for available products
                        expect(badge).toBeNull();
                    } else {
                        // Badge should exist for unavailable/coming_soon
                        expect(badge).not.toBeNull();
                        expect(badge.textContent).toBe(getAvailabilityText(status, lang));
                        expect(badge.getAttribute('data-status')).toBe(status);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should apply correct CSS class to badge based on status', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(AVAILABILITY_STATUS.UNAVAILABLE, AVAILABILITY_STATUS.COMING_SOON),
                languageArb,
                (status, lang) => {
                    const badge = createAvailabilityBadge(status, lang);
                    
                    expect(badge).not.toBeNull();
                    expect(badge.classList.contains('availability-badge')).toBe(true);
                    
                    if (status === AVAILABILITY_STATUS.UNAVAILABLE) {
                        expect(badge.classList.contains('unavailable-badge')).toBe(true);
                        expect(badge.classList.contains('coming-soon-badge')).toBe(false);
                    } else if (status === AVAILABILITY_STATUS.COMING_SOON) {
                        expect(badge.classList.contains('coming-soon-badge')).toBe(true);
                        expect(badge.classList.contains('unavailable-badge')).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return correct text for all status and language combinations', () => {
        fc.assert(
            fc.property(
                availabilityStatusArb,
                languageArb,
                (status, lang) => {
                    const text = getAvailabilityText(status, lang);
                    const expectedText = AVAILABILITY_TEXTS[status]?.[lang] || AVAILABILITY_TEXTS[status]?.ar || '';
                    
                    expect(text).toBe(expectedText);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should update product card correctly for all availability statuses', () => {
        fc.assert(
            fc.property(
                availabilityStatusArb,
                languageArb,
                (status, lang) => {
                    // Reset DOM for each test
                    const productCard = document.querySelector('.product-card');
                    const orderBtn = productCard.querySelector('.order-btn');
                    const paymentBtns = productCard.querySelectorAll('.payment-btn-compact');
                    
                    // Clear previous state
                    productCard.classList.remove('unavailable-card', 'coming-soon-card');
                    const existingBadge = productCard.querySelector('.availability-badge');
                    if (existingBadge) existingBadge.remove();
                    orderBtn.disabled = false;
                    orderBtn.removeAttribute('data-status');
                    paymentBtns.forEach(btn => btn.disabled = false);
                    
                    // Apply the status
                    updateProductCardAvailability(productCard, status, lang);
                    
                    // Verify the result
                    const badge = productCard.querySelector('.availability-badge');
                    
                    if (status === AVAILABILITY_STATUS.AVAILABLE) {
                        // Available: no badge, buttons enabled
                        expect(badge).toBeNull();
                        expect(orderBtn.disabled).toBe(false);
                        paymentBtns.forEach(btn => {
                            expect(btn.disabled).toBe(false);
                        });
                    } else {
                        // Unavailable/Coming Soon: badge present, buttons disabled
                        expect(badge).not.toBeNull();
                        expect(badge.textContent).toBe(getAvailabilityText(status, lang));
                        expect(orderBtn.disabled).toBe(true);
                        expect(orderBtn.getAttribute('data-status')).toBe(status);
                        paymentBtns.forEach(btn => {
                            expect(btn.disabled).toBe(true);
                        });
                        
                        // Verify card class
                        if (status === AVAILABILITY_STATUS.UNAVAILABLE) {
                            expect(productCard.classList.contains('unavailable-card')).toBe(true);
                        } else if (status === AVAILABILITY_STATUS.COMING_SOON) {
                            expect(productCard.classList.contains('coming-soon-card')).toBe(true);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Unit Tests for Availability UI Functions
// ═══════════════════════════════════════════════════════════════════════════

describe('getAvailabilityText', () => {
    it('should return Arabic text by default', () => {
        expect(getAvailabilityText(AVAILABILITY_STATUS.AVAILABLE)).toBe('متوفر');
        expect(getAvailabilityText(AVAILABILITY_STATUS.UNAVAILABLE)).toBe('غير متوفر');
        expect(getAvailabilityText(AVAILABILITY_STATUS.COMING_SOON)).toBe('قريباً');
    });

    it('should return English text when specified', () => {
        expect(getAvailabilityText(AVAILABILITY_STATUS.AVAILABLE, 'en')).toBe('Available');
        expect(getAvailabilityText(AVAILABILITY_STATUS.UNAVAILABLE, 'en')).toBe('Unavailable');
        expect(getAvailabilityText(AVAILABILITY_STATUS.COMING_SOON, 'en')).toBe('Coming Soon');
    });

    it('should return French text when specified', () => {
        expect(getAvailabilityText(AVAILABILITY_STATUS.AVAILABLE, 'fr')).toBe('Disponible');
        expect(getAvailabilityText(AVAILABILITY_STATUS.UNAVAILABLE, 'fr')).toBe('Indisponible');
        expect(getAvailabilityText(AVAILABILITY_STATUS.COMING_SOON, 'fr')).toBe('Bientôt');
    });

    it('should return empty string for invalid status', () => {
        expect(getAvailabilityText('invalid_status')).toBe('');
        expect(getAvailabilityText(null)).toBe('');
        expect(getAvailabilityText(undefined)).toBe('');
    });
});

describe('getExpectedUIState', () => {
    it('should return correct state for available status', () => {
        const state = getExpectedUIState(AVAILABILITY_STATUS.AVAILABLE);
        expect(state.hasBadge).toBe(false);
        expect(state.orderButtonDisabled).toBe(false);
        expect(state.paymentButtonsDisabled).toBe(false);
        expect(state.cardClass).toBeNull();
    });

    it('should return correct state for unavailable status', () => {
        const state = getExpectedUIState(AVAILABILITY_STATUS.UNAVAILABLE);
        expect(state.hasBadge).toBe(true);
        expect(state.orderButtonDisabled).toBe(true);
        expect(state.paymentButtonsDisabled).toBe(true);
        expect(state.cardClass).toBe('unavailable-card');
    });

    it('should return correct state for coming_soon status', () => {
        const state = getExpectedUIState(AVAILABILITY_STATUS.COMING_SOON);
        expect(state.hasBadge).toBe(true);
        expect(state.orderButtonDisabled).toBe(true);
        expect(state.paymentButtonsDisabled).toBe(true);
        expect(state.cardClass).toBe('coming-soon-card');
    });

    it('should return null for invalid status', () => {
        expect(getExpectedUIState('invalid')).toBeNull();
    });
});

describe('enableProductButtons', () => {
    it('should enable order button', () => {
        const orderBtn = document.querySelector('.order-btn');
        orderBtn.disabled = true;
        orderBtn.setAttribute('data-status', 'unavailable');
        
        enableProductButtons(orderBtn, []);
        
        expect(orderBtn.disabled).toBe(false);
        expect(orderBtn.getAttribute('data-status')).toBeNull();
    });

    it('should enable payment buttons', () => {
        const paymentBtns = document.querySelectorAll('.payment-btn-compact');
        paymentBtns.forEach(btn => btn.disabled = true);
        
        enableProductButtons(null, paymentBtns);
        
        paymentBtns.forEach(btn => {
            expect(btn.disabled).toBe(false);
        });
    });
});

describe('disableProductButtons', () => {
    it('should disable order button with unavailable status', () => {
        const orderBtn = document.querySelector('.order-btn');
        
        disableProductButtons(orderBtn, [], AVAILABILITY_STATUS.UNAVAILABLE, 'ar');
        
        expect(orderBtn.disabled).toBe(true);
        expect(orderBtn.getAttribute('data-status')).toBe(AVAILABILITY_STATUS.UNAVAILABLE);
        expect(orderBtn.innerHTML).toContain('غير متوفر');
    });

    it('should disable order button with coming_soon status', () => {
        const orderBtn = document.querySelector('.order-btn');
        
        disableProductButtons(orderBtn, [], AVAILABILITY_STATUS.COMING_SOON, 'ar');
        
        expect(orderBtn.disabled).toBe(true);
        expect(orderBtn.getAttribute('data-status')).toBe(AVAILABILITY_STATUS.COMING_SOON);
        expect(orderBtn.innerHTML).toContain('قريباً');
    });

    it('should disable payment buttons', () => {
        const paymentBtns = document.querySelectorAll('.payment-btn-compact');
        
        disableProductButtons(null, paymentBtns, AVAILABILITY_STATUS.UNAVAILABLE, 'ar');
        
        paymentBtns.forEach(btn => {
            expect(btn.disabled).toBe(true);
        });
    });
});
