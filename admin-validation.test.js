/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Validation Module - Property-Based Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * اختبارات الخصائص لوحدة التحقق من صحة البيانات
 * تستخدم fast-check للتحقق من الخصائص العامة
 * 
 * Feature: admin-full-control
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
    validatePrice,
    validateMediaUrl,
    validateTranslations,
    validateFeatures,
    canAddFeature,
    MAX_FEATURES_COUNT
} from './admin-validation.js';

// ═══════════════════════════════════════════════════════════════════════════
// Property 2: Invalid Price Rejection
// Validates: Requirements 1.5
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 2: Invalid Price Rejection', () => {
    /**
     * Feature: admin-full-control, Property 2: Invalid Price Rejection
     * 
     * *For any* invalid price input (negative numbers, non-numeric strings, empty values),
     * the validation system should reject the input and prevent saving to the database.
     * 
     * Validates: Requirements 1.5
     */
    
    it('should reject all negative numbers', () => {
        fc.assert(
            fc.property(
                fc.double({ min: -1e10, max: -0.0001 }),
                (negativePrice) => {
                    const result = validatePrice(negativePrice);
                    expect(result.valid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(result.errors[0]).toBe('يرجى إدخال سعر صحيح (رقم موجب)');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should reject all non-numeric strings', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => isNaN(Number(s)) && s !== ''),
                (nonNumericString) => {
                    const result = validatePrice(nonNumericString);
                    expect(result.valid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should reject null, undefined, and empty string', () => {
        const invalidValues = [null, undefined, ''];
        
        invalidValues.forEach(value => {
            const result = validatePrice(value);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    it('should reject NaN and Infinity', () => {
        const specialValues = [NaN, Infinity, -Infinity];
        
        specialValues.forEach(value => {
            const result = validatePrice(value);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    it('should accept all valid positive numbers including zero', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 1e10, noNaN: true }),
                (validPrice) => {
                    // Skip Infinity
                    if (!isFinite(validPrice)) return true;
                    
                    const result = validatePrice(validPrice);
                    expect(result.valid).toBe(true);
                    expect(result.errors.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should accept numeric strings that represent valid prices', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 1e6, noNaN: true }).filter(n => isFinite(n)),
                (num) => {
                    const numericString = num.toString();
                    const result = validatePrice(numericString);
                    expect(result.valid).toBe(true);
                    expect(result.errors.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional Unit Tests for Edge Cases
// ═══════════════════════════════════════════════════════════════════════════

describe('validatePrice - Edge Cases', () => {
    it('should accept zero as a valid price', () => {
        const result = validatePrice(0);
        expect(result.valid).toBe(true);
    });

    it('should accept integer prices', () => {
        const result = validatePrice(1500);
        expect(result.valid).toBe(true);
    });

    it('should accept decimal prices', () => {
        const result = validatePrice(19.99);
        expect(result.valid).toBe(true);
    });
});

describe('validateMediaUrl - Basic Tests', () => {
    it('should accept valid Imgur image URLs', () => {
        const validUrls = [
            'https://i.imgur.com/abc123.png',
            'https://i.imgur.com/xyz789.jpg',
            'https://i.imgur.com/test.gif',
            'https://i.imgur.com/image.jpeg'
        ];
        
        validUrls.forEach(url => {
            const result = validateMediaUrl(url);
            expect(result.valid).toBe(true);
            expect(result.mediaType).toBe('image');
        });
    });

    it('should accept valid Imgur video URLs', () => {
        const result = validateMediaUrl('https://i.imgur.com/video.mp4');
        expect(result.valid).toBe(true);
        expect(result.mediaType).toBe('video');
    });

    it('should reject non-Imgur URLs', () => {
        const invalidUrls = [
            'https://example.com/image.png',
            'https://google.com/photo.jpg',
            'https://other-site.com/video.mp4'
        ];
        
        invalidUrls.forEach(url => {
            const result = validateMediaUrl(url);
            expect(result.valid).toBe(false);
        });
    });

    it('should accept empty URLs (media is optional)', () => {
        const result = validateMediaUrl('');
        expect(result.valid).toBe(true);
    });
});

describe('validateTranslations - Basic Tests', () => {
    it('should accept translations with Arabic content', () => {
        const result = validateTranslations({ ar: 'نص عربي', en: 'English text' });
        expect(result.valid).toBe(true);
    });

    it('should reject translations without Arabic content', () => {
        const result = validateTranslations({ en: 'English only' });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toBe('المحتوى العربي مطلوب');
    });

    it('should reject empty Arabic content', () => {
        const result = validateTranslations({ ar: '', en: 'English' });
        expect(result.valid).toBe(false);
    });

    it('should reject whitespace-only Arabic content', () => {
        const result = validateTranslations({ ar: '   ', en: 'English' });
        expect(result.valid).toBe(false);
    });

    it('should reject null or undefined translations object', () => {
        expect(validateTranslations(null).valid).toBe(false);
        expect(validateTranslations(undefined).valid).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Property 8: Media URL Validation
// Validates: Requirements 6.2, 6.4
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 8: Media URL Validation', () => {
    /**
     * Feature: admin-full-control, Property 8: Media URL Validation
     * 
     * *For any* media URL, the system should:
     * - Accept valid Imgur URLs (.png, .jpg, .gif, .mp4)
     * - Reject non-Imgur URLs or invalid formats
     * - Correctly detect media type (image vs video)
     * 
     * Validates: Requirements 6.2, 6.4
     */

    // Generator for valid Imgur image filenames
    const validImgurImageUrl = fc.tuple(
        fc.constantFrom('https://i.imgur.com/', 'http://i.imgur.com/', 'https://imgur.com/', 'http://imgur.com/'),
        fc.hexaString({ minLength: 5, maxLength: 10 }),
        fc.constantFrom('.png', '.jpg', '.jpeg', '.gif')
    ).map(([domain, filename, ext]) => domain + filename + ext);

    // Generator for valid Imgur video filenames
    const validImgurVideoUrl = fc.tuple(
        fc.constantFrom('https://i.imgur.com/', 'http://i.imgur.com/', 'https://imgur.com/', 'http://imgur.com/'),
        fc.hexaString({ minLength: 5, maxLength: 10 }),
        fc.constant('.mp4')
    ).map(([domain, filename, ext]) => domain + filename + ext);

    // Generator for non-Imgur domains
    const nonImgurUrl = fc.tuple(
        fc.constantFrom('https://example.com/', 'https://google.com/', 'https://other-site.com/', 'https://cdn.example.org/'),
        fc.hexaString({ minLength: 5, maxLength: 10 }),
        fc.constantFrom('.png', '.jpg', '.gif', '.mp4')
    ).map(([domain, filename, ext]) => domain + filename + ext);

    // Generator for invalid extensions on Imgur
    const invalidExtensionUrl = fc.tuple(
        fc.constantFrom('https://i.imgur.com/', 'http://i.imgur.com/'),
        fc.hexaString({ minLength: 5, maxLength: 10 }),
        fc.constantFrom('.txt', '.pdf', '.doc', '.exe', '.html', '.webp', '.svg', '.bmp')
    ).map(([domain, filename, ext]) => domain + filename + ext);

    it('should accept all valid Imgur image URLs and detect them as images', () => {
        fc.assert(
            fc.property(
                validImgurImageUrl,
                (url) => {
                    const result = validateMediaUrl(url);
                    expect(result.valid).toBe(true);
                    expect(result.mediaType).toBe('image');
                    expect(result.errors.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should accept all valid Imgur video URLs and detect them as videos', () => {
        fc.assert(
            fc.property(
                validImgurVideoUrl,
                (url) => {
                    const result = validateMediaUrl(url);
                    expect(result.valid).toBe(true);
                    expect(result.mediaType).toBe('video');
                    expect(result.errors.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should reject all non-Imgur URLs', () => {
        fc.assert(
            fc.property(
                nonImgurUrl,
                (url) => {
                    const result = validateMediaUrl(url);
                    expect(result.valid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(result.errors[0]).toBe('يرجى إدخال رابط صحيح من Imgur');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should reject Imgur URLs with invalid extensions', () => {
        fc.assert(
            fc.property(
                invalidExtensionUrl,
                (url) => {
                    const result = validateMediaUrl(url);
                    expect(result.valid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should correctly distinguish between image and video types', () => {
        // Test that .png, .jpg, .jpeg, .gif are detected as images
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
        imageExtensions.forEach(ext => {
            const url = `https://i.imgur.com/test123${ext}`;
            const result = validateMediaUrl(url);
            expect(result.valid).toBe(true);
            expect(result.mediaType).toBe('image');
        });

        // Test that .mp4 is detected as video
        const videoUrl = 'https://i.imgur.com/test123.mp4';
        const videoResult = validateMediaUrl(videoUrl);
        expect(videoResult.valid).toBe(true);
        expect(videoResult.mediaType).toBe('video');
    });

    it('should handle malformed URLs gracefully', () => {
        // URLs that should be rejected
        const invalidUrls = [
            'not-a-url',
            'ftp://i.imgur.com/image.png',  // Invalid protocol
            '://i.imgur.com/image.png'      // Missing protocol
        ];

        invalidUrls.forEach(url => {
            const result = validateMediaUrl(url);
            expect(result.valid).toBe(false);
        });

        // URLs without valid extensions should be rejected
        const noExtensionUrls = [
            'https://i.imgur.com',
            'https://i.imgur.com/'
        ];
        noExtensionUrls.forEach(url => {
            const result = validateMediaUrl(url);
            expect(result.valid).toBe(false);
        });

        // Non-string values should be rejected
        const nonStringValues = [123, {}, []];
        nonStringValues.forEach(value => {
            const result = validateMediaUrl(value);
            expect(result.valid).toBe(false);
        });

        // Null and undefined are allowed (media is optional)
        expect(validateMediaUrl(null).valid).toBe(true);
        expect(validateMediaUrl(undefined).valid).toBe(true);
    });

    it('should accept empty URLs since media is optional', () => {
        const emptyValues = ['', '   ', null, undefined];
        
        emptyValues.forEach(value => {
            const result = validateMediaUrl(value);
            expect(result.valid).toBe(true);
        });
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Property 9: Features Limit
// Validates: Requirements 7.5
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 9: Features Limit', () => {
    /**
     * Feature: admin-full-control, Property 9: Features Limit
     * 
     * *For any* product, the number of features should never exceed 5.
     * Attempting to add a 6th feature should be prevented.
     * 
     * Validates: Requirements 7.5
     */

    // Generator for valid feature text (Arabic required)
    const arabicTextGen = fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0);

    // Generator for optional translation strings
    const optionalTextGen = fc.oneof(
        fc.constant(''),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
    );

    // Generator for a single valid feature
    const validFeatureGen = fc.record({
        id: fc.hexaString({ minLength: 5, maxLength: 10 }),
        text: fc.record({
            ar: arabicTextGen,
            en: optionalTextGen,
            fr: optionalTextGen
        }),
        order: fc.integer({ min: 0, max: 100 })
    });

    // Generator for features array with 0-5 features (valid count)
    const validFeaturesArrayGen = fc.array(validFeatureGen, { minLength: 0, maxLength: 5 });

    // Generator for features array with 6+ features (invalid count)
    const invalidFeaturesArrayGen = fc.array(validFeatureGen, { minLength: 6, maxLength: 20 });

    it('should accept any features array with 5 or fewer features', () => {
        fc.assert(
            fc.property(
                validFeaturesArrayGen,
                (features) => {
                    const result = validateFeatures(features);
                    expect(result.valid).toBe(true);
                    expect(result.count).toBeLessThanOrEqual(5);
                    expect(result.errors.filter(e => e.includes('الحد الأقصى'))).toHaveLength(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should reject any features array with more than 5 features', () => {
        fc.assert(
            fc.property(
                invalidFeaturesArrayGen,
                (features) => {
                    const result = validateFeatures(features);
                    expect(result.valid).toBe(false);
                    expect(result.count).toBeGreaterThan(5);
                    expect(result.errors).toContain('الحد الأقصى للمميزات هو 5');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should correctly report the count of features', () => {
        fc.assert(
            fc.property(
                fc.array(validFeatureGen, { minLength: 0, maxLength: 15 }),
                (features) => {
                    const result = validateFeatures(features);
                    expect(result.count).toBe(features.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should prevent adding a 6th feature when 5 features exist', () => {
        fc.assert(
            fc.property(
                fc.array(validFeatureGen, { minLength: 5, maxLength: 5 }),
                (fiveFeatures) => {
                    const result = canAddFeature(fiveFeatures);
                    expect(result.canAdd).toBe(false);
                    expect(result.currentCount).toBe(5);
                    expect(result.maxCount).toBe(5);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should allow adding a feature when fewer than 5 features exist', () => {
        fc.assert(
            fc.property(
                fc.array(validFeatureGen, { minLength: 0, maxLength: 4 }),
                (features) => {
                    const result = canAddFeature(features);
                    expect(result.canAdd).toBe(true);
                    expect(result.currentCount).toBeLessThan(5);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional Unit Tests for Features Validation
// ═══════════════════════════════════════════════════════════════════════════

describe('validateFeatures - Edge Cases', () => {
    it('should accept empty features array', () => {
        const result = validateFeatures([]);
        expect(result.valid).toBe(true);
        expect(result.count).toBe(0);
    });

    it('should accept null or undefined features', () => {
        expect(validateFeatures(null).valid).toBe(true);
        expect(validateFeatures(undefined).valid).toBe(true);
    });

    it('should accept exactly 5 features', () => {
        const features = Array(5).fill(null).map((_, i) => ({
            id: `feature_${i}`,
            text: { ar: `ميزة ${i + 1}` },
            order: i
        }));
        const result = validateFeatures(features);
        expect(result.valid).toBe(true);
        expect(result.count).toBe(5);
    });

    it('should reject exactly 6 features', () => {
        const features = Array(6).fill(null).map((_, i) => ({
            id: `feature_${i}`,
            text: { ar: `ميزة ${i + 1}` },
            order: i
        }));
        const result = validateFeatures(features);
        expect(result.valid).toBe(false);
        expect(result.count).toBe(6);
        expect(result.errors).toContain('الحد الأقصى للمميزات هو 5');
    });

    it('should reject features without Arabic text', () => {
        const features = [{
            id: 'feature_1',
            text: { en: 'English only' },
            order: 0
        }];
        const result = validateFeatures(features);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('المحتوى العربي مطلوب'))).toBe(true);
    });

    it('should reject features with empty Arabic text', () => {
        const features = [{
            id: 'feature_1',
            text: { ar: '', en: 'English' },
            order: 0
        }];
        const result = validateFeatures(features);
        expect(result.valid).toBe(false);
    });

    it('should reject features without text object', () => {
        const features = [{
            id: 'feature_1',
            order: 0
        }];
        const result = validateFeatures(features);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('المحتوى مطلوب'))).toBe(true);
    });
});

describe('canAddFeature - Unit Tests', () => {
    it('should return canAdd=true for empty array', () => {
        const result = canAddFeature([]);
        expect(result.canAdd).toBe(true);
        expect(result.currentCount).toBe(0);
    });

    it('should return canAdd=true for 4 features', () => {
        const features = Array(4).fill({ id: 'test', text: { ar: 'ميزة' }, order: 0 });
        const result = canAddFeature(features);
        expect(result.canAdd).toBe(true);
        expect(result.currentCount).toBe(4);
    });

    it('should return canAdd=false for 5 features', () => {
        const features = Array(5).fill({ id: 'test', text: { ar: 'ميزة' }, order: 0 });
        const result = canAddFeature(features);
        expect(result.canAdd).toBe(false);
        expect(result.currentCount).toBe(5);
    });

    it('should handle non-array input', () => {
        expect(canAddFeature(null).canAdd).toBe(true);
        expect(canAddFeature(undefined).canAdd).toBe(true);
        expect(canAddFeature('not an array').canAdd).toBe(true);
    });

    it('should always return maxCount as 5', () => {
        expect(canAddFeature([]).maxCount).toBe(5);
        expect(canAddFeature(Array(3).fill({})).maxCount).toBe(5);
        expect(canAddFeature(Array(5).fill({})).maxCount).toBe(5);
    });
});
