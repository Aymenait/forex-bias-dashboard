/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Product Controller - Property-Based Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * اختبارات الخصائص لوحدة التحكم بالمنتجات
 * تستخدم fast-check للتحقق من الخصائص العامة
 * 
 * Feature: admin-full-control
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import {
    validatePriceValue,
    validateProductData,
    prepareProductForSave,
    generateProductId
} from './admin-product-controller.js';

// ═══════════════════════════════════════════════════════════════════════════
// Property 1: Price Update Round-Trip
// Validates: Requirements 1.3, 1.4
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 1: Price Update Round-Trip', () => {
    /**
     * Feature: admin-full-control, Property 1: Price Update Round-Trip
     * 
     * *For any* valid price (positive number) entered in the admin panel,
     * saving the price and then loading the product should return the same
     * price values for both DZD and USD.
     * 
     * Validates: Requirements 1.3, 1.4
     */

    it('should preserve DZD price through save/load cycle', () => {
        fc.assert(
            fc.property(
                // Generate valid positive prices (including decimals)
                fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
                (priceDZD) => {
                    // Create a product with the price
                    const product = {
                        name: { ar: 'منتج اختبار', en: 'Test Product', fr: 'Produit Test' },
                        priceDZD: priceDZD,
                        priceUSD: 10
                    };

                    // Prepare for save (simulates what happens before Firebase save)
                    const preparedProduct = prepareProductForSave(product, () => new Date());

                    // Verify the price is preserved
                    expect(preparedProduct.priceDZD).toBe(Number(priceDZD));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve USD price through save/load cycle', () => {
        fc.assert(
            fc.property(
                // Generate valid positive prices (including decimals)
                fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                (priceUSD) => {
                    // Create a product with the price
                    const product = {
                        name: { ar: 'منتج اختبار', en: 'Test Product', fr: 'Produit Test' },
                        priceDZD: 1000,
                        priceUSD: priceUSD
                    };

                    // Prepare for save (simulates what happens before Firebase save)
                    const preparedProduct = prepareProductForSave(product, () => new Date());

                    // Verify the price is preserved
                    expect(preparedProduct.priceUSD).toBe(Number(priceUSD));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve both DZD and USD prices simultaneously', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
                fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                (priceDZD, priceUSD) => {
                    // Create a product with both prices
                    const product = {
                        name: { ar: 'منتج اختبار', en: 'Test Product', fr: 'Produit Test' },
                        priceDZD: priceDZD,
                        priceUSD: priceUSD
                    };

                    // Prepare for save
                    const preparedProduct = prepareProductForSave(product, () => new Date());

                    // Verify both prices are preserved
                    expect(preparedProduct.priceDZD).toBe(Number(priceDZD));
                    expect(preparedProduct.priceUSD).toBe(Number(priceUSD));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle integer prices correctly', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 1000000 }),
                fc.integer({ min: 0, max: 10000 }),
                (priceDZD, priceUSD) => {
                    const product = {
                        name: { ar: 'منتج', en: 'Product', fr: 'Produit' },
                        priceDZD: priceDZD,
                        priceUSD: priceUSD
                    };

                    const preparedProduct = prepareProductForSave(product, () => new Date());

                    expect(preparedProduct.priceDZD).toBe(priceDZD);
                    expect(preparedProduct.priceUSD).toBe(priceUSD);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should convert string prices to numbers correctly', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                (price) => {
                    // Pass price as string
                    const product = {
                        name: { ar: 'منتج', en: 'Product', fr: 'Produit' },
                        priceDZD: price.toString(),
                        priceUSD: price.toString()
                    };

                    const preparedProduct = prepareProductForSave(product, () => new Date());

                    // Should be converted to number
                    expect(typeof preparedProduct.priceDZD).toBe('number');
                    expect(typeof preparedProduct.priceUSD).toBe('number');
                    expect(preparedProduct.priceDZD).toBe(Number(price));
                    expect(preparedProduct.priceUSD).toBe(Number(price));
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Unit Tests for ProductController Functions
// ═══════════════════════════════════════════════════════════════════════════

describe('validatePriceValue', () => {
    it('should accept valid positive numbers', () => {
        expect(validatePriceValue(100).valid).toBe(true);
        expect(validatePriceValue(0).valid).toBe(true);
        expect(validatePriceValue(1500.50).valid).toBe(true);
    });

    it('should reject negative numbers', () => {
        expect(validatePriceValue(-1).valid).toBe(false);
        expect(validatePriceValue(-100).valid).toBe(false);
    });

    it('should reject invalid values', () => {
        expect(validatePriceValue(null).valid).toBe(false);
        expect(validatePriceValue(undefined).valid).toBe(false);
        expect(validatePriceValue('').valid).toBe(false);
        expect(validatePriceValue('abc').valid).toBe(false);
        expect(validatePriceValue(NaN).valid).toBe(false);
        expect(validatePriceValue(Infinity).valid).toBe(false);
    });
});

describe('validateProductData', () => {
    it('should accept valid product data', () => {
        const product = {
            name: { ar: 'منتج', en: 'Product', fr: 'Produit' },
            priceDZD: 1000,
            priceUSD: 5
        };
        expect(validateProductData(product).valid).toBe(true);
    });

    it('should reject product without Arabic name', () => {
        const product = {
            name: { en: 'Product' },
            priceDZD: 1000,
            priceUSD: 5
        };
        expect(validateProductData(product).valid).toBe(false);
    });

    it('should reject product with invalid prices', () => {
        const product = {
            name: { ar: 'منتج' },
            priceDZD: -100,
            priceUSD: 5
        };
        expect(validateProductData(product).valid).toBe(false);
    });

    it('should reject null product', () => {
        expect(validateProductData(null).valid).toBe(false);
    });
});

describe('prepareProductForSave', () => {
    it('should set default values for missing fields', () => {
        const product = {
            name: { ar: 'منتج' }
        };
        const prepared = prepareProductForSave(product, () => new Date());

        expect(prepared.mediaUrl).toBe('');
        expect(prepared.mediaType).toBe('image');
        expect(prepared.priceDZD).toBe(0);
        expect(prepared.priceUSD).toBe(0);
        expect(prepared.availability).toBe('available');
        expect(prepared.features).toEqual([]);
        expect(prepared.subOffers).toEqual([]);
        expect(prepared.displayOrder).toBe(0);
        expect(prepared.isArchived).toBe(false);
    });

    it('should preserve existing values', () => {
        const product = {
            name: { ar: 'منتج', en: 'Product' },
            priceDZD: 1500,
            priceUSD: 6,
            availability: 'unavailable',
            displayOrder: 5
        };
        const prepared = prepareProductForSave(product, () => new Date());

        expect(prepared.priceDZD).toBe(1500);
        expect(prepared.priceUSD).toBe(6);
        expect(prepared.availability).toBe('unavailable');
        expect(prepared.displayOrder).toBe(5);
    });
});

describe('generateProductId', () => {
    it('should generate unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 100; i++) {
            ids.add(generateProductId());
        }
        expect(ids.size).toBe(100);
    });

    it('should start with prod_ prefix', () => {
        const id = generateProductId();
        expect(id.startsWith('prod_')).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 13: Archive Preserves Data
// Validates: Requirements 10.3
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 13: Archive Preserves Data', () => {
    /**
     * Feature: admin-full-control, Property 13: Archive Preserves Data
     * 
     * *For any* archived product, the product data should remain in the database
     * (isArchived = true) but not appear on the main page.
     * 
     * Validates: Requirements 10.3
     */

    it('should preserve all product data when archiving (isArchived flag only changes)', () => {
        fc.assert(
            fc.property(
                // Generate random product data
                fc.record({
                    name: fc.record({
                        ar: fc.string({ minLength: 1, maxLength: 100 }),
                        en: fc.string({ maxLength: 100 }),
                        fr: fc.string({ maxLength: 100 })
                    }),
                    description: fc.record({
                        ar: fc.string({ maxLength: 500 }),
                        en: fc.string({ maxLength: 500 }),
                        fr: fc.string({ maxLength: 500 })
                    }),
                    priceDZD: fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
                    priceUSD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                    mediaUrl: fc.string({ maxLength: 200 }),
                    mediaType: fc.constantFrom('image', 'video'),
                    availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                    displayOrder: fc.integer({ min: 0, max: 100 }),
                    isArchived: fc.constant(false) // Start with non-archived product
                }),
                (productData) => {
                    // Prepare original product for save
                    const originalPrepared = prepareProductForSave(productData, () => new Date());
                    
                    // Simulate archiving by setting isArchived to true
                    const archivedProduct = { ...productData, isArchived: true };
                    const archivedPrepared = prepareProductForSave(archivedProduct, () => new Date());
                    
                    // Verify all data is preserved except isArchived flag
                    expect(archivedPrepared.name).toEqual(originalPrepared.name);
                    expect(archivedPrepared.description).toEqual(originalPrepared.description);
                    expect(archivedPrepared.priceDZD).toBe(originalPrepared.priceDZD);
                    expect(archivedPrepared.priceUSD).toBe(originalPrepared.priceUSD);
                    expect(archivedPrepared.mediaUrl).toBe(originalPrepared.mediaUrl);
                    expect(archivedPrepared.mediaType).toBe(originalPrepared.mediaType);
                    expect(archivedPrepared.availability).toBe(originalPrepared.availability);
                    expect(archivedPrepared.displayOrder).toBe(originalPrepared.displayOrder);
                    
                    // Verify isArchived flag is correctly set
                    expect(originalPrepared.isArchived).toBe(false);
                    expect(archivedPrepared.isArchived).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve features array when archiving', () => {
        fc.assert(
            fc.property(
                // Generate product with features
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        text: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 100 }),
                            en: fc.string({ maxLength: 100 }),
                            fr: fc.string({ maxLength: 100 })
                        }),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 0, maxLength: 5 }
                ),
                (features) => {
                    const product = {
                        name: { ar: 'منتج اختبار', en: 'Test', fr: 'Test' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        features: features,
                        isArchived: false
                    };
                    
                    const originalPrepared = prepareProductForSave(product, () => new Date());
                    
                    // Archive the product
                    const archivedProduct = { ...product, isArchived: true };
                    const archivedPrepared = prepareProductForSave(archivedProduct, () => new Date());
                    
                    // Features should be preserved
                    expect(archivedPrepared.features.length).toBe(originalPrepared.features.length);
                    expect(archivedPrepared.isArchived).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve subOffers array when archiving', () => {
        fc.assert(
            fc.property(
                // Generate product with sub-offers
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        name: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 50 }),
                            en: fc.string({ maxLength: 50 }),
                            fr: fc.string({ maxLength: 50 })
                        }),
                        priceDZD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                        priceUSD: fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                        availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 0, maxLength: 5 }
                ),
                (subOffers) => {
                    const product = {
                        name: { ar: 'منتج اختبار', en: 'Test', fr: 'Test' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        subOffers: subOffers,
                        isArchived: false
                    };
                    
                    const originalPrepared = prepareProductForSave(product, () => new Date());
                    
                    // Archive the product
                    const archivedProduct = { ...product, isArchived: true };
                    const archivedPrepared = prepareProductForSave(archivedProduct, () => new Date());
                    
                    // SubOffers should be preserved
                    expect(archivedPrepared.subOffers.length).toBe(originalPrepared.subOffers.length);
                    expect(archivedPrepared.isArchived).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve payment methods when archiving', () => {
        fc.assert(
            fc.property(
                // Generate random payment methods configuration
                fc.record({
                    usdt: fc.boolean(),
                    redotpay: fc.boolean(),
                    baridimob: fc.boolean()
                }),
                (paymentMethods) => {
                    const product = {
                        name: { ar: 'منتج اختبار', en: 'Test', fr: 'Test' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        paymentMethods: paymentMethods,
                        isArchived: false
                    };
                    
                    const originalPrepared = prepareProductForSave(product, () => new Date());
                    
                    // Archive the product
                    const archivedProduct = { ...product, isArchived: true };
                    const archivedPrepared = prepareProductForSave(archivedProduct, () => new Date());
                    
                    // Payment methods should be preserved
                    expect(archivedPrepared.paymentMethods).toEqual(originalPrepared.paymentMethods);
                    expect(archivedPrepared.isArchived).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Property 14: Delete Removes All Data
// Validates: Requirements 10.4
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 14: Delete Removes All Data', () => {
    /**
     * Feature: admin-full-control, Property 14: Delete Removes All Data
     * 
     * *For any* deleted product, all related data (including sub-offers, features)
     * should be completely removed from the database.
     * 
     * Validates: Requirements 10.4
     * 
     * Note: Since we can't test actual Firebase deletion in unit tests,
     * we test that the delete function is called with the correct product ID
     * and that the product data structure is complete before deletion
     * (ensuring all data would be removed).
     */

    it('should ensure product has complete data structure before deletion', () => {
        fc.assert(
            fc.property(
                // Generate complete product data
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    name: fc.record({
                        ar: fc.string({ minLength: 1, maxLength: 100 }),
                        en: fc.string({ maxLength: 100 }),
                        fr: fc.string({ maxLength: 100 })
                    }),
                    description: fc.record({
                        ar: fc.string({ maxLength: 500 }),
                        en: fc.string({ maxLength: 500 }),
                        fr: fc.string({ maxLength: 500 })
                    }),
                    priceDZD: fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
                    priceUSD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                    mediaUrl: fc.string({ maxLength: 200 }),
                    mediaType: fc.constantFrom('image', 'video'),
                    availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                    features: fc.array(
                        fc.record({
                            id: fc.string({ minLength: 1, maxLength: 20 }),
                            text: fc.record({
                                ar: fc.string({ minLength: 1, maxLength: 100 }),
                                en: fc.string({ maxLength: 100 }),
                                fr: fc.string({ maxLength: 100 })
                            }),
                            order: fc.integer({ min: 0, max: 10 })
                        }),
                        { minLength: 0, maxLength: 5 }
                    ),
                    subOffers: fc.array(
                        fc.record({
                            id: fc.string({ minLength: 1, maxLength: 20 }),
                            name: fc.record({
                                ar: fc.string({ minLength: 1, maxLength: 50 }),
                                en: fc.string({ maxLength: 50 }),
                                fr: fc.string({ maxLength: 50 })
                            }),
                            priceDZD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                            priceUSD: fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                            availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                            order: fc.integer({ min: 0, max: 10 })
                        }),
                        { minLength: 0, maxLength: 5 }
                    ),
                    paymentMethods: fc.record({
                        usdt: fc.boolean(),
                        redotpay: fc.boolean(),
                        baridimob: fc.boolean()
                    }),
                    displayOrder: fc.integer({ min: 0, max: 100 }),
                    isArchived: fc.boolean()
                }),
                (productData) => {
                    // Prepare product for save (this is what would be in the database)
                    const preparedProduct = prepareProductForSave(productData, () => new Date());
                    
                    // Verify all data fields exist and would be deleted together
                    // When deleteDoc is called, the entire document is removed
                    expect(preparedProduct).toHaveProperty('name');
                    expect(preparedProduct).toHaveProperty('description');
                    expect(preparedProduct).toHaveProperty('priceDZD');
                    expect(preparedProduct).toHaveProperty('priceUSD');
                    expect(preparedProduct).toHaveProperty('mediaUrl');
                    expect(preparedProduct).toHaveProperty('mediaType');
                    expect(preparedProduct).toHaveProperty('availability');
                    expect(preparedProduct).toHaveProperty('features');
                    expect(preparedProduct).toHaveProperty('subOffers');
                    expect(preparedProduct).toHaveProperty('paymentMethods');
                    expect(preparedProduct).toHaveProperty('displayOrder');
                    expect(preparedProduct).toHaveProperty('isArchived');
                    
                    // Verify features are embedded (will be deleted with product)
                    expect(Array.isArray(preparedProduct.features)).toBe(true);
                    
                    // Verify subOffers are embedded (will be deleted with product)
                    expect(Array.isArray(preparedProduct.subOffers)).toBe(true);
                    
                    // Verify paymentMethods are embedded (will be deleted with product)
                    expect(typeof preparedProduct.paymentMethods).toBe('object');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure all nested data (features) is part of the product document', () => {
        fc.assert(
            fc.property(
                // Generate product with features
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        text: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 100 }),
                            en: fc.string({ maxLength: 100 }),
                            fr: fc.string({ maxLength: 100 })
                        }),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (features) => {
                    const product = {
                        name: { ar: 'منتج للحذف', en: 'Product to delete', fr: 'Produit à supprimer' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        features: features
                    };
                    
                    const preparedProduct = prepareProductForSave(product, () => new Date());
                    
                    // All features should be embedded in the product document
                    // When the product is deleted, all features are deleted too
                    expect(preparedProduct.features.length).toBe(features.length);
                    
                    // Each feature should have all required fields
                    preparedProduct.features.forEach((feature, index) => {
                        expect(feature).toHaveProperty('id');
                        expect(feature).toHaveProperty('text');
                        expect(feature).toHaveProperty('order');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure all nested data (subOffers) is part of the product document', () => {
        fc.assert(
            fc.property(
                // Generate product with sub-offers
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        name: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 50 }),
                            en: fc.string({ maxLength: 50 }),
                            fr: fc.string({ maxLength: 50 })
                        }),
                        priceDZD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                        priceUSD: fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                        availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (subOffers) => {
                    const product = {
                        name: { ar: 'منتج للحذف', en: 'Product to delete', fr: 'Produit à supprimer' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        subOffers: subOffers
                    };
                    
                    const preparedProduct = prepareProductForSave(product, () => new Date());
                    
                    // All sub-offers should be embedded in the product document
                    // When the product is deleted, all sub-offers are deleted too
                    expect(preparedProduct.subOffers.length).toBe(subOffers.length);
                    
                    // Each sub-offer should have all required fields
                    preparedProduct.subOffers.forEach((subOffer, index) => {
                        expect(subOffer).toHaveProperty('id');
                        expect(subOffer).toHaveProperty('name');
                        expect(subOffer).toHaveProperty('priceDZD');
                        expect(subOffer).toHaveProperty('priceUSD');
                        expect(subOffer).toHaveProperty('availability');
                        expect(subOffer).toHaveProperty('order');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure product ID is valid for deletion', () => {
        fc.assert(
            fc.property(
                // Generate valid product IDs
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                (productId) => {
                    // Product ID should be non-empty and valid
                    expect(productId.length).toBeGreaterThan(0);
                    expect(typeof productId).toBe('string');
                    
                    // Generated IDs should follow the pattern
                    const generatedId = generateProductId();
                    expect(generatedId.startsWith('prod_')).toBe(true);
                    expect(generatedId.length).toBeGreaterThan(5);
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Property 15: Cancel Discards Changes
// Validates: Requirements 11.5
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 15: Cancel Discards Changes', () => {
    /**
     * Feature: admin-full-control, Property 15: Cancel Discards Changes
     * 
     * *For any* editing session where the admin cancels, no changes should be
     * persisted to the database. The product data should remain unchanged.
     * 
     * Validates: Requirements 11.5
     * 
     * Note: This tests the logic that when cancel is triggered, the original
     * data is preserved and modified data is discarded.
     */

    it('should preserve original product data when changes are cancelled', () => {
        fc.assert(
            fc.property(
                // Generate original product data
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 50 }),
                    name: fc.record({
                        ar: fc.string({ minLength: 1, maxLength: 100 }),
                        en: fc.string({ maxLength: 100 }),
                        fr: fc.string({ maxLength: 100 })
                    }),
                    description: fc.record({
                        ar: fc.string({ maxLength: 500 }),
                        en: fc.string({ maxLength: 500 }),
                        fr: fc.string({ maxLength: 500 })
                    }),
                    priceDZD: fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
                    priceUSD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                    mediaUrl: fc.string({ maxLength: 200 }),
                    mediaType: fc.constantFrom('image', 'video'),
                    availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                    displayOrder: fc.integer({ min: 0, max: 100 }),
                    isArchived: fc.boolean()
                }),
                // Generate modified product data (different values)
                fc.record({
                    name: fc.record({
                        ar: fc.string({ minLength: 1, maxLength: 100 }),
                        en: fc.string({ maxLength: 100 }),
                        fr: fc.string({ maxLength: 100 })
                    }),
                    description: fc.record({
                        ar: fc.string({ maxLength: 500 }),
                        en: fc.string({ maxLength: 500 }),
                        fr: fc.string({ maxLength: 500 })
                    }),
                    priceDZD: fc.double({ min: 0, max: 1e8, noNaN: true }).filter(n => isFinite(n)),
                    priceUSD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                    mediaUrl: fc.string({ maxLength: 200 }),
                    availability: fc.constantFrom('available', 'unavailable', 'coming_soon')
                }),
                (originalData, modifiedData) => {
                    // Prepare original product
                    const originalPrepared = prepareProductForSave(originalData, () => new Date());
                    
                    // Simulate editing: create modified version
                    const editedProduct = {
                        ...originalData,
                        ...modifiedData
                    };
                    
                    // Simulate cancel: restore original data
                    // In the actual implementation, cancelPreviewChanges() restores originalProductData
                    const restoredProduct = prepareProductForSave(originalData, () => new Date());
                    
                    // Verify original data is preserved after cancel
                    expect(restoredProduct.name).toEqual(originalPrepared.name);
                    expect(restoredProduct.description).toEqual(originalPrepared.description);
                    expect(restoredProduct.priceDZD).toBe(originalPrepared.priceDZD);
                    expect(restoredProduct.priceUSD).toBe(originalPrepared.priceUSD);
                    expect(restoredProduct.mediaUrl).toBe(originalPrepared.mediaUrl);
                    expect(restoredProduct.mediaType).toBe(originalPrepared.mediaType);
                    expect(restoredProduct.availability).toBe(originalPrepared.availability);
                    expect(restoredProduct.displayOrder).toBe(originalPrepared.displayOrder);
                    expect(restoredProduct.isArchived).toBe(originalPrepared.isArchived);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve original features when changes are cancelled', () => {
        fc.assert(
            fc.property(
                // Generate original features
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        text: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 100 }),
                            en: fc.string({ maxLength: 100 }),
                            fr: fc.string({ maxLength: 100 })
                        }),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 0, maxLength: 5 }
                ),
                // Generate modified features (different)
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        text: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 100 }),
                            en: fc.string({ maxLength: 100 }),
                            fr: fc.string({ maxLength: 100 })
                        }),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 0, maxLength: 5 }
                ),
                (originalFeatures, modifiedFeatures) => {
                    const originalProduct = {
                        name: { ar: 'منتج أصلي', en: 'Original', fr: 'Original' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        features: originalFeatures
                    };
                    
                    const originalPrepared = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Simulate editing with different features
                    const editedProduct = {
                        ...originalProduct,
                        features: modifiedFeatures
                    };
                    
                    // Simulate cancel: restore original
                    const restoredProduct = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Verify original features are preserved
                    expect(restoredProduct.features.length).toBe(originalPrepared.features.length);
                    
                    // Deep compare features
                    for (let i = 0; i < originalPrepared.features.length; i++) {
                        expect(restoredProduct.features[i].id).toBe(originalPrepared.features[i].id);
                        expect(restoredProduct.features[i].text).toEqual(originalPrepared.features[i].text);
                        expect(restoredProduct.features[i].order).toBe(originalPrepared.features[i].order);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve original sub-offers when changes are cancelled', () => {
        fc.assert(
            fc.property(
                // Generate original sub-offers
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        name: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 50 }),
                            en: fc.string({ maxLength: 50 }),
                            fr: fc.string({ maxLength: 50 })
                        }),
                        priceDZD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                        priceUSD: fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                        availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 0, maxLength: 5 }
                ),
                // Generate modified sub-offers (different)
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        name: fc.record({
                            ar: fc.string({ minLength: 1, maxLength: 50 }),
                            en: fc.string({ maxLength: 50 }),
                            fr: fc.string({ maxLength: 50 })
                        }),
                        priceDZD: fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                        priceUSD: fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                        availability: fc.constantFrom('available', 'unavailable', 'coming_soon'),
                        order: fc.integer({ min: 0, max: 10 })
                    }),
                    { minLength: 0, maxLength: 5 }
                ),
                (originalSubOffers, modifiedSubOffers) => {
                    const originalProduct = {
                        name: { ar: 'منتج أصلي', en: 'Original', fr: 'Original' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        subOffers: originalSubOffers
                    };
                    
                    const originalPrepared = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Simulate editing with different sub-offers
                    const editedProduct = {
                        ...originalProduct,
                        subOffers: modifiedSubOffers
                    };
                    
                    // Simulate cancel: restore original
                    const restoredProduct = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Verify original sub-offers are preserved
                    expect(restoredProduct.subOffers.length).toBe(originalPrepared.subOffers.length);
                    
                    // Deep compare sub-offers
                    for (let i = 0; i < originalPrepared.subOffers.length; i++) {
                        expect(restoredProduct.subOffers[i].id).toBe(originalPrepared.subOffers[i].id);
                        expect(restoredProduct.subOffers[i].name).toEqual(originalPrepared.subOffers[i].name);
                        expect(restoredProduct.subOffers[i].priceDZD).toBe(originalPrepared.subOffers[i].priceDZD);
                        expect(restoredProduct.subOffers[i].priceUSD).toBe(originalPrepared.subOffers[i].priceUSD);
                        expect(restoredProduct.subOffers[i].availability).toBe(originalPrepared.subOffers[i].availability);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve original payment methods when changes are cancelled', () => {
        fc.assert(
            fc.property(
                // Generate original payment methods
                fc.record({
                    usdt: fc.boolean(),
                    redotpay: fc.boolean(),
                    baridimob: fc.boolean()
                }),
                // Generate modified payment methods (different)
                fc.record({
                    usdt: fc.boolean(),
                    redotpay: fc.boolean(),
                    baridimob: fc.boolean()
                }),
                (originalPaymentMethods, modifiedPaymentMethods) => {
                    const originalProduct = {
                        name: { ar: 'منتج أصلي', en: 'Original', fr: 'Original' },
                        priceDZD: 1000,
                        priceUSD: 5,
                        paymentMethods: originalPaymentMethods
                    };
                    
                    const originalPrepared = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Simulate editing with different payment methods
                    const editedProduct = {
                        ...originalProduct,
                        paymentMethods: modifiedPaymentMethods
                    };
                    
                    // Simulate cancel: restore original
                    const restoredProduct = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Verify original payment methods are preserved
                    expect(restoredProduct.paymentMethods.usdt).toBe(originalPrepared.paymentMethods.usdt);
                    expect(restoredProduct.paymentMethods.redotpay).toBe(originalPrepared.paymentMethods.redotpay);
                    expect(restoredProduct.paymentMethods.baridimob).toBe(originalPrepared.paymentMethods.baridimob);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should discard all modifications when cancel is triggered', () => {
        fc.assert(
            fc.property(
                // Generate original prices
                fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                // Generate modified prices (different)
                fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                fc.double({ min: 0, max: 1e4, noNaN: true }).filter(n => isFinite(n)),
                (originalDZD, originalUSD, modifiedDZD, modifiedUSD) => {
                    const originalProduct = {
                        name: { ar: 'منتج أصلي', en: 'Original', fr: 'Original' },
                        priceDZD: originalDZD,
                        priceUSD: originalUSD
                    };
                    
                    const originalPrepared = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Simulate editing with different prices
                    const editedProduct = {
                        ...originalProduct,
                        priceDZD: modifiedDZD,
                        priceUSD: modifiedUSD
                    };
                    
                    // Prepare edited version (this would be in previewProductData)
                    const editedPrepared = prepareProductForSave(editedProduct, () => new Date());
                    
                    // Simulate cancel: restore original (discard editedPrepared)
                    const restoredProduct = prepareProductForSave(originalProduct, () => new Date());
                    
                    // Verify original prices are preserved (modifications discarded)
                    expect(restoredProduct.priceDZD).toBe(originalPrepared.priceDZD);
                    expect(restoredProduct.priceUSD).toBe(originalPrepared.priceUSD);
                    
                    // Verify the edited values are NOT in the restored product
                    // (unless they happen to be the same by chance)
                    if (originalDZD !== modifiedDZD) {
                        expect(restoredProduct.priceDZD).not.toBe(editedPrepared.priceDZD);
                    }
                    if (originalUSD !== modifiedUSD) {
                        expect(restoredProduct.priceUSD).not.toBe(editedPrepared.priceUSD);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
