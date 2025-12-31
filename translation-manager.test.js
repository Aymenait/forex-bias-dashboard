/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Translation Manager Module - Property-Based Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * اختبارات الخصائص لوحدة إدارة الترجمات
 * تستخدم fast-check للتحقق من الخصائص العامة
 * 
 * Feature: admin-full-control
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
    getFallback,
    getAvailableTranslations,
    hasTranslation,
    checkTranslationCompleteness,
    createTranslations,
    updateTranslation,
    mergeTranslations,
    getProductName,
    getProductDescription,
    getProductFeatures,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE
} from './translation-manager.js';

// ═══════════════════════════════════════════════════════════════════════════
// Property 6: Translation Fallback
// Validates: Requirements 4.3, 4.5
// ═══════════════════════════════════════════════════════════════════════════

describe('Property 6: Translation Fallback', () => {
    /**
     * Feature: admin-full-control, Property 6: Translation Fallback
     * 
     * *For any* product content where a translation is missing for the current language,
     * the system should display the Arabic content as fallback.
     * 
     * Validates: Requirements 4.3, 4.5
     */

    // Generator for non-empty Arabic strings
    const arabicTextGen = fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0);

    // Generator for optional translation strings (can be empty or non-empty)
    const optionalTextGen = fc.oneof(
        fc.constant(''),
        fc.constant(undefined),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
    );

    // Generator for language codes
    const languageGen = fc.constantFrom('ar', 'en', 'fr');

    // Generator for translations object with Arabic required
    const translationsWithArabicGen = fc.record({
        ar: arabicTextGen,
        en: optionalTextGen,
        fr: optionalTextGen
    });

    it('should always return Arabic content when requesting Arabic language', () => {
        fc.assert(
            fc.property(
                translationsWithArabicGen,
                (translations) => {
                    const result = getFallback(translations, 'ar');
                    expect(result).toBe(translations.ar);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return requested language content when available', () => {
        fc.assert(
            fc.property(
                arabicTextGen,
                arabicTextGen,
                arabicTextGen,
                languageGen,
                (arText, enText, frText, lang) => {
                    const translations = { ar: arText, en: enText, fr: frText };
                    const result = getFallback(translations, lang);
                    expect(result).toBe(translations[lang]);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should fallback to Arabic when requested language is missing', () => {
        fc.assert(
            fc.property(
                arabicTextGen,
                fc.constantFrom('en', 'fr'),
                (arText, lang) => {
                    // Create translations with only Arabic
                    const translations = { ar: arText };
                    const result = getFallback(translations, lang);
                    expect(result).toBe(arText);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should fallback to Arabic when requested language is empty string', () => {
        fc.assert(
            fc.property(
                arabicTextGen,
                fc.constantFrom('en', 'fr'),
                (arText, lang) => {
                    // Create translations with empty string for requested language
                    const translations = { ar: arText, [lang]: '' };
                    const result = getFallback(translations, lang);
                    expect(result).toBe(arText);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should fallback to Arabic when requested language is whitespace only', () => {
        fc.assert(
            fc.property(
                arabicTextGen,
                fc.constantFrom('en', 'fr'),
                fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }),
                (arText, lang, whitespace) => {
                    const translations = { ar: arText, [lang]: whitespace };
                    const result = getFallback(translations, lang);
                    expect(result).toBe(arText);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return empty string when translations object is null or undefined', () => {
        expect(getFallback(null, 'ar')).toBe('');
        expect(getFallback(undefined, 'ar')).toBe('');
        expect(getFallback(null, 'en')).toBe('');
        expect(getFallback(undefined, 'fr')).toBe('');
    });

    it('should return empty string when translations object is not an object', () => {
        const nonObjects = ['string', 123, true, []];
        nonObjects.forEach(value => {
            expect(getFallback(value, 'ar')).toBe('');
        });
    });

    it('should handle invalid language codes by defaulting to Arabic', () => {
        fc.assert(
            fc.property(
                arabicTextGen,
                fc.string().filter(s => !['ar', 'en', 'fr'].includes(s.toLowerCase())),
                (arText, invalidLang) => {
                    const translations = { ar: arText };
                    const result = getFallback(translations, invalidLang);
                    // Should fallback to Arabic for invalid language codes
                    expect(result).toBe(arText);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should be case-insensitive for language codes', () => {
        const translations = { ar: 'عربي', en: 'English', fr: 'Français' };
        
        expect(getFallback(translations, 'AR')).toBe('عربي');
        expect(getFallback(translations, 'En')).toBe('English');
        expect(getFallback(translations, 'FR')).toBe('Français');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional Unit Tests for Translation Manager
// ═══════════════════════════════════════════════════════════════════════════

describe('hasTranslation', () => {
    it('should return true when translation exists and is non-empty', () => {
        const translations = { ar: 'عربي', en: 'English' };
        expect(hasTranslation(translations, 'ar')).toBe(true);
        expect(hasTranslation(translations, 'en')).toBe(true);
    });

    it('should return false when translation is missing', () => {
        const translations = { ar: 'عربي' };
        expect(hasTranslation(translations, 'en')).toBe(false);
        expect(hasTranslation(translations, 'fr')).toBe(false);
    });

    it('should return false when translation is empty string', () => {
        const translations = { ar: 'عربي', en: '' };
        expect(hasTranslation(translations, 'en')).toBe(false);
    });

    it('should return false when translation is whitespace only', () => {
        const translations = { ar: 'عربي', en: '   ' };
        expect(hasTranslation(translations, 'en')).toBe(false);
    });

    it('should return false for null or undefined translations', () => {
        expect(hasTranslation(null, 'ar')).toBe(false);
        expect(hasTranslation(undefined, 'ar')).toBe(false);
    });
});

describe('checkTranslationCompleteness', () => {
    it('should return complete=true when all languages have translations', () => {
        const translations = { ar: 'عربي', en: 'English', fr: 'Français' };
        const result = checkTranslationCompleteness(translations);
        expect(result.complete).toBe(true);
        expect(result.missing).toEqual([]);
    });

    it('should return complete=false with missing languages', () => {
        const translations = { ar: 'عربي' };
        const result = checkTranslationCompleteness(translations);
        expect(result.complete).toBe(false);
        expect(result.missing).toContain('en');
        expect(result.missing).toContain('fr');
    });

    it('should treat empty strings as missing', () => {
        const translations = { ar: 'عربي', en: '', fr: 'Français' };
        const result = checkTranslationCompleteness(translations);
        expect(result.complete).toBe(false);
        expect(result.missing).toContain('en');
    });
});

describe('createTranslations', () => {
    it('should create translations object with provided values', () => {
        const result = createTranslations('عربي', 'English', 'Français');
        expect(result).toEqual({ ar: 'عربي', en: 'English', fr: 'Français' });
    });

    it('should use empty strings for missing optional values', () => {
        const result = createTranslations('عربي');
        expect(result).toEqual({ ar: 'عربي', en: '', fr: '' });
    });

    it('should handle null/undefined Arabic by using empty string', () => {
        const result = createTranslations(null);
        expect(result.ar).toBe('');
    });
});

describe('updateTranslation', () => {
    it('should update specific language translation', () => {
        const original = { ar: 'عربي', en: 'English', fr: '' };
        const updated = updateTranslation(original, 'fr', 'Français');
        expect(updated.fr).toBe('Français');
        expect(updated.ar).toBe('عربي');
        expect(updated.en).toBe('English');
    });

    it('should not modify original object', () => {
        const original = { ar: 'عربي', en: 'English', fr: '' };
        updateTranslation(original, 'fr', 'Français');
        expect(original.fr).toBe('');
    });

    it('should ignore invalid language codes', () => {
        const original = { ar: 'عربي', en: 'English', fr: '' };
        const updated = updateTranslation(original, 'de', 'German');
        expect(updated.de).toBeUndefined();
    });
});

describe('mergeTranslations', () => {
    it('should merge updates into existing translations', () => {
        const existing = { ar: 'عربي قديم', en: 'Old English', fr: '' };
        const updates = { en: 'New English', fr: 'Français' };
        const result = mergeTranslations(existing, updates);
        
        expect(result.ar).toBe('عربي قديم');
        expect(result.en).toBe('New English');
        expect(result.fr).toBe('Français');
    });

    it('should handle null existing translations', () => {
        const updates = { ar: 'عربي', en: 'English' };
        const result = mergeTranslations(null, updates);
        
        expect(result.ar).toBe('عربي');
        expect(result.en).toBe('English');
        expect(result.fr).toBe('');
    });

    it('should handle null updates', () => {
        const existing = { ar: 'عربي', en: 'English', fr: '' };
        const result = mergeTranslations(existing, null);
        
        expect(result.ar).toBe('عربي');
        expect(result.en).toBe('English');
        expect(result.fr).toBe('');
    });
});

describe('getProductName', () => {
    it('should return product name in requested language', () => {
        const product = {
            name: { ar: 'منتج', en: 'Product', fr: 'Produit' }
        };
        
        expect(getProductName(product, 'ar')).toBe('منتج');
        expect(getProductName(product, 'en')).toBe('Product');
        expect(getProductName(product, 'fr')).toBe('Produit');
    });

    it('should fallback to Arabic when requested language is missing', () => {
        const product = {
            name: { ar: 'منتج' }
        };
        
        expect(getProductName(product, 'en')).toBe('منتج');
        expect(getProductName(product, 'fr')).toBe('منتج');
    });

    it('should return empty string for null/undefined product', () => {
        expect(getProductName(null, 'ar')).toBe('');
        expect(getProductName(undefined, 'ar')).toBe('');
    });

    it('should return empty string when product has no name', () => {
        expect(getProductName({}, 'ar')).toBe('');
        expect(getProductName({ name: null }, 'ar')).toBe('');
    });
});

describe('getProductDescription', () => {
    it('should return product description in requested language', () => {
        const product = {
            description: { ar: 'وصف المنتج', en: 'Product description', fr: 'Description du produit' }
        };
        
        expect(getProductDescription(product, 'ar')).toBe('وصف المنتج');
        expect(getProductDescription(product, 'en')).toBe('Product description');
    });

    it('should fallback to Arabic when requested language is missing', () => {
        const product = {
            description: { ar: 'وصف المنتج' }
        };
        
        expect(getProductDescription(product, 'en')).toBe('وصف المنتج');
    });
});

describe('getProductFeatures', () => {
    it('should return features in requested language', () => {
        const product = {
            features: [
                { text: { ar: 'ميزة 1', en: 'Feature 1' } },
                { text: { ar: 'ميزة 2', en: 'Feature 2' } }
            ]
        };
        
        const features = getProductFeatures(product, 'en');
        expect(features).toEqual(['Feature 1', 'Feature 2']);
    });

    it('should fallback to Arabic for missing translations', () => {
        const product = {
            features: [
                { text: { ar: 'ميزة 1' } },
                { text: { ar: 'ميزة 2', en: 'Feature 2' } }
            ]
        };
        
        const features = getProductFeatures(product, 'en');
        expect(features).toEqual(['ميزة 1', 'Feature 2']);
    });

    it('should return empty array for null/undefined product', () => {
        expect(getProductFeatures(null, 'ar')).toEqual([]);
        expect(getProductFeatures(undefined, 'ar')).toEqual([]);
    });

    it('should return empty array when product has no features', () => {
        expect(getProductFeatures({}, 'ar')).toEqual([]);
        expect(getProductFeatures({ features: null }, 'ar')).toEqual([]);
    });

    it('should filter out empty feature texts', () => {
        const product = {
            features: [
                { text: { ar: 'ميزة 1' } },
                { text: { ar: '' } },
                { text: { ar: 'ميزة 3' } }
            ]
        };
        
        const features = getProductFeatures(product, 'ar');
        expect(features).toEqual(['ميزة 1', 'ميزة 3']);
    });
});

describe('getAvailableTranslations', () => {
    it('should return only non-empty translations', () => {
        const translations = { ar: 'عربي', en: '', fr: 'Français' };
        const result = getAvailableTranslations(translations);
        
        expect(result).toEqual({ ar: 'عربي', fr: 'Français' });
        expect(result.en).toBeUndefined();
    });

    it('should return empty object for null/undefined', () => {
        expect(getAvailableTranslations(null)).toEqual({});
        expect(getAvailableTranslations(undefined)).toEqual({});
    });
});

describe('Constants', () => {
    it('should have correct supported languages', () => {
        expect(SUPPORTED_LANGUAGES.AR).toBe('ar');
        expect(SUPPORTED_LANGUAGES.EN).toBe('en');
        expect(SUPPORTED_LANGUAGES.FR).toBe('fr');
    });

    it('should have Arabic as default language', () => {
        expect(DEFAULT_LANGUAGE).toBe('ar');
    });
});
