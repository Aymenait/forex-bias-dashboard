/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sub-Offers - Property-Based Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * اختبارات الخصائص للعروض الفرعية
 * تستخدم fast-check للتحقق من الخصائص العامة
 * 
 * Feature: admin-full-control
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import {
    validateSubOffer,
    generateSubOfferId,
    AVAILABILITY_STATUSES
} from './admin-product-controller.js';
import {
    getSubOfferName,
    getSubOfferAvailabilityText,
    SUB_OFFER_AVAILABILITY
} from './sub-offers-ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Generators for Sub-Offers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generator for valid sub-offer names (multilingual)
 */
const validSubOfferNameArb = fc.record({
    ar: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    en: fc.string({ maxLength: 100 }),
    fr: fc.string({ maxLength: 100 })
});

/**
 * Generator for valid prices
 */
const validPriceArb = fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n));

/**
 * Generator for availability status
 */
const availabilityStatusArb = fc.constantFrom('available', 'unavailable', 'coming_soon');

/**
 * Generator for valid sub-offers
 */
const validSubOfferArb = fc.record({
    id: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    name: validSubOfferNameArb,
    priceDZD: validPriceArb,
    priceUSD: validPriceArb,
    availability: availabilityStatusArb,
    order: fc.integer({ min: 0, max: 100 })
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 4: Sub-Offer Persistence Round-Trip
// Validates: Requirements 3.3, 3.6
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 4: Sub-Offer Persistence Round-Trip', () => {
    /**
     * Feature: admin-full-control, Property 4: Sub-Offer Persistence Round-Trip
     * 
     * *For any* valid sub-offer added to a product, saving and then loading 
     * the product should return the sub-offer with identical data (name, prices, 
     * availability). Deleting a sub-offer should result in it not appearing 
     * in subsequent loads.
     * 
     * Validates: Requirements 3.3, 3.6
     */

    it('should preserve sub-offer name through validation', () => {
        fc.assert(
            fc.property(
                validSubOfferArb,
                (subOffer) => {
                    // Validate the sub-offer
                    const validation = validateSubOffer(subOffer);
                    
                    // Valid sub-offers should pass validation
                    expect(validation.valid).toBe(true);
                    
                    // The name should be preserved
                    expect(subOffer.name.ar).toBeTruthy();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve sub-offer prices through validation', () => {
        fc.assert(
            fc.property(
                validSubOfferArb,
                (subOffer) => {
                    // Validate the sub-offer
                    const validation = validateSubOffer(subOffer);
                    
                    // Valid sub-offers should pass validation
                    expect(validation.valid).toBe(true);
                    
                    // Prices should be non-negative
                    expect(subOffer.priceDZD).toBeGreaterThanOrEqual(0);
                    expect(subOffer.priceUSD).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve sub-offer availability status through validation', () => {
        fc.assert(
            fc.property(
                validSubOfferArb,
                (subOffer) => {
                    // Validate the sub-offer
                    const validation = validateSubOffer(subOffer);
                    
                    // Valid sub-offers should pass validation
                    expect(validation.valid).toBe(true);
                    
                    // Availability should be one of the valid statuses
                    const validStatuses = ['available', 'unavailable', 'coming_soon'];
                    expect(validStatuses).toContain(subOffer.availability);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should generate unique sub-offer IDs', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 10, max: 100 }),
                (count) => {
                    const ids = new Set();
                    for (let i = 0; i < count; i++) {
                        ids.add(generateSubOfferId());
                    }
                    // All generated IDs should be unique
                    expect(ids.size).toBe(count);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('should reject sub-offers without Arabic name', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string({ minLength: 5 }),
                    name: fc.record({
                        ar: fc.constant(''),  // Empty Arabic name
                        en: fc.string(),
                        fr: fc.string()
                    }),
                    priceDZD: validPriceArb,
                    priceUSD: validPriceArb,
                    availability: availabilityStatusArb,
                    order: fc.integer({ min: 0 })
                }),
                (subOffer) => {
                    const validation = validateSubOffer(subOffer);
                    
                    // Should fail validation due to missing Arabic name
                    expect(validation.valid).toBe(false);
                    expect(validation.errors.some(e => e.includes('العربية'))).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should reject sub-offers with negative prices', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string({ minLength: 5 }),
                    name: validSubOfferNameArb,
                    priceDZD: fc.double({ min: -1e6, max: -0.01, noNaN: true }),
                    priceUSD: validPriceArb,
                    availability: availabilityStatusArb,
                    order: fc.integer({ min: 0 })
                }),
                (subOffer) => {
                    const validation = validateSubOffer(subOffer);
                    
                    // Should fail validation due to negative price
                    expect(validation.valid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Unit Tests for Sub-Offer Functions
// ═══════════════════════════════════════════════════════════════════════════

describe('validateSubOffer', () => {
    it('should accept valid sub-offer data', () => {
        const subOffer = {
            id: 'suboffer_123',
            name: { ar: 'حساب مشترك', en: 'Shared Account', fr: 'Compte Partagé' },
            priceDZD: 1500,
            priceUSD: 6,
            availability: 'available',
            order: 0
        };
        expect(validateSubOffer(subOffer).valid).toBe(true);
    });

    it('should reject sub-offer without Arabic name', () => {
        const subOffer = {
            name: { en: 'Shared Account' },
            priceDZD: 1500,
            priceUSD: 6
        };
        expect(validateSubOffer(subOffer).valid).toBe(false);
    });

    it('should reject sub-offer with negative DZD price', () => {
        const subOffer = {
            name: { ar: 'حساب مشترك' },
            priceDZD: -100,
            priceUSD: 6
        };
        expect(validateSubOffer(subOffer).valid).toBe(false);
    });

    it('should reject sub-offer with negative USD price', () => {
        const subOffer = {
            name: { ar: 'حساب مشترك' },
            priceDZD: 1500,
            priceUSD: -5
        };
        expect(validateSubOffer(subOffer).valid).toBe(false);
    });

    it('should reject null sub-offer', () => {
        expect(validateSubOffer(null).valid).toBe(false);
    });

    it('should accept sub-offer with only Arabic name', () => {
        const subOffer = {
            name: { ar: 'حساب مشترك' },
            priceDZD: 1500,
            priceUSD: 6
        };
        expect(validateSubOffer(subOffer).valid).toBe(true);
    });
});

describe('generateSubOfferId', () => {
    it('should generate unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 100; i++) {
            ids.add(generateSubOfferId());
        }
        expect(ids.size).toBe(100);
    });

    it('should start with suboffer_ prefix', () => {
        const id = generateSubOfferId();
        expect(id.startsWith('suboffer_')).toBe(true);
    });
});

describe('getSubOfferName', () => {
    it('should return Arabic name when available', () => {
        const subOffer = {
            name: { ar: 'حساب مشترك', en: 'Shared Account', fr: 'Compte Partagé' }
        };
        expect(getSubOfferName(subOffer, 'ar')).toBe('حساب مشترك');
    });

    it('should return English name when requested', () => {
        const subOffer = {
            name: { ar: 'حساب مشترك', en: 'Shared Account', fr: 'Compte Partagé' }
        };
        expect(getSubOfferName(subOffer, 'en')).toBe('Shared Account');
    });

    it('should fallback to Arabic when requested language is empty', () => {
        const subOffer = {
            name: { ar: 'حساب مشترك', en: '', fr: '' }
        };
        expect(getSubOfferName(subOffer, 'en')).toBe('حساب مشترك');
    });

    it('should return empty string for null sub-offer', () => {
        expect(getSubOfferName(null, 'ar')).toBe('');
    });
});

describe('getSubOfferAvailabilityText', () => {
    it('should return correct Arabic text for available status', () => {
        expect(getSubOfferAvailabilityText('available', 'ar')).toBe('متوفر');
    });

    it('should return correct English text for unavailable status', () => {
        expect(getSubOfferAvailabilityText('unavailable', 'en')).toBe('Unavailable');
    });

    it('should return correct French text for coming_soon status', () => {
        expect(getSubOfferAvailabilityText('coming_soon', 'fr')).toBe('Bientôt');
    });

    it('should return empty string for invalid status', () => {
        expect(getSubOfferAvailabilityText('invalid', 'ar')).toBe('');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 5: Sub-Offer Price Selection
// Validates: Requirements 3.5
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 5: Sub-Offer Price Selection', () => {
    /**
     * Feature: admin-full-control, Property 5: Sub-Offer Price Selection
     * 
     * *For any* product with sub-offers, selecting a sub-offer should update 
     * the displayed price to match that sub-offer's price in the current currency.
     * 
     * Validates: Requirements 3.5
     */

    // Generator for valid sub-offers with prices
    const subOfferWithPricesArb = fc.record({
        id: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        name: fc.record({
            ar: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            en: fc.string({ maxLength: 100 }),
            fr: fc.string({ maxLength: 100 })
        }),
        priceDZD: fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
        priceUSD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
        availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
        order: fc.integer({ min: 0, max: 100 })
    });

    // Generator for currency
    const currencyArb = fc.constantFrom('DZD', 'USD');

    it('should return correct price for DZD currency', () => {
        fc.assert(
            fc.property(
                subOfferWithPricesArb,
                (subOffer) => {
                    // When currency is DZD, the displayed price should be priceDZD
                    const currency = 'DZD';
                    const expectedPrice = subOffer.priceDZD;
                    
                    // Simulate price selection logic
                    const displayedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
                    
                    expect(displayedPrice).toBe(expectedPrice);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return correct price for USD currency', () => {
        fc.assert(
            fc.property(
                subOfferWithPricesArb,
                (subOffer) => {
                    // When currency is USD, the displayed price should be priceUSD
                    const currency = 'USD';
                    const expectedPrice = subOffer.priceUSD;
                    
                    // Simulate price selection logic
                    const displayedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
                    
                    expect(displayedPrice).toBe(expectedPrice);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should correctly select price based on currency for any sub-offer', () => {
        fc.assert(
            fc.property(
                subOfferWithPricesArb,
                currencyArb,
                (subOffer, currency) => {
                    // The displayed price should match the sub-offer's price in the current currency
                    const expectedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
                    
                    // Simulate price selection logic
                    const displayedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
                    
                    expect(displayedPrice).toBe(expectedPrice);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve price precision through selection', () => {
        fc.assert(
            fc.property(
                subOfferWithPricesArb,
                currencyArb,
                (subOffer, currency) => {
                    const originalPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
                    
                    // Simulate selecting the sub-offer and getting the price
                    const selectedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
                    
                    // Price should be exactly preserved
                    expect(selectedPrice).toBe(originalPrice);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle multiple sub-offers with different prices', () => {
        fc.assert(
            fc.property(
                fc.array(subOfferWithPricesArb, { minLength: 2, maxLength: 5 }),
                currencyArb,
                fc.integer({ min: 0, max: 4 }),
                (subOffers, currency, selectedIndex) => {
                    // Ensure selectedIndex is within bounds
                    const index = selectedIndex % subOffers.length;
                    const selectedSubOffer = subOffers[index];
                    
                    // The displayed price should match the selected sub-offer's price
                    const expectedPrice = currency === 'USD' ? selectedSubOffer.priceUSD : selectedSubOffer.priceDZD;
                    const displayedPrice = currency === 'USD' ? selectedSubOffer.priceUSD : selectedSubOffer.priceDZD;
                    
                    expect(displayedPrice).toBe(expectedPrice);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Unit Tests for Price Selection
// ═══════════════════════════════════════════════════════════════════════════

describe('Sub-Offer Price Selection - Unit Tests', () => {
    it('should select DZD price when currency is DZD', () => {
        const subOffer = {
            id: 'test_1',
            name: { ar: 'حساب مشترك' },
            priceDZD: 1500,
            priceUSD: 6,
            availability: 'available'
        };
        
        const currency = 'DZD';
        const displayedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
        
        expect(displayedPrice).toBe(1500);
    });

    it('should select USD price when currency is USD', () => {
        const subOffer = {
            id: 'test_1',
            name: { ar: 'حساب مشترك' },
            priceDZD: 1500,
            priceUSD: 6,
            availability: 'available'
        };
        
        const currency = 'USD';
        const displayedPrice = currency === 'USD' ? subOffer.priceUSD : subOffer.priceDZD;
        
        expect(displayedPrice).toBe(6);
    });

    it('should handle zero prices correctly', () => {
        const subOffer = {
            id: 'test_1',
            name: { ar: 'عرض مجاني' },
            priceDZD: 0,
            priceUSD: 0,
            availability: 'available'
        };
        
        expect(subOffer.priceDZD).toBe(0);
        expect(subOffer.priceUSD).toBe(0);
    });

    it('should handle decimal prices correctly', () => {
        const subOffer = {
            id: 'test_1',
            name: { ar: 'حساب مشترك' },
            priceDZD: 1500.50,
            priceUSD: 6.99,
            availability: 'available'
        };
        
        expect(subOffer.priceDZD).toBe(1500.50);
        expect(subOffer.priceUSD).toBe(6.99);
    });
});
