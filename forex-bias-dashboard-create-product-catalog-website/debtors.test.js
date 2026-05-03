/**
 * Property-Based Tests for Debtors Management Module
 * Using fast-check for property-based testing
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';

// ═══════════════════════════════════════════════════════════════════════════
// Debtor Data Model and Serialization Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Serialize a debtor object for Firebase storage
 * This mirrors what would happen when saving to Firestore
 * @param {Object} debtor - The debtor object to serialize
 * @returns {Object} - Serialized debtor data
 */
function serializeDebtor(debtor) {
    return {
        name: debtor.name,
        phone: debtor.phone || '',
        productId: debtor.productId || '',
        productName: debtor.productName || '',
        amountOwed: debtor.amountOwed,
        amountPaid: debtor.amountPaid || 0,
        currency: debtor.currency || 'DZD',
        status: debtor.status || 'pending',
        notes: debtor.notes || '',
        createdAt: debtor.createdAt instanceof Date ? debtor.createdAt.toISOString() : debtor.createdAt,
        updatedAt: debtor.updatedAt instanceof Date ? debtor.updatedAt.toISOString() : debtor.updatedAt,
        paidAt: debtor.paidAt instanceof Date ? debtor.paidAt.toISOString() : (debtor.paidAt || null)
    };
}

/**
 * Deserialize a debtor object from Firebase storage
 * This mirrors what would happen when loading from Firestore
 * @param {string} id - The document ID
 * @param {Object} data - The raw data from Firestore
 * @returns {Object} - Deserialized debtor object
 */
function deserializeDebtor(id, data) {
    return {
        id: id,
        name: data.name,
        phone: data.phone || '',
        productId: data.productId || '',
        productName: data.productName || '',
        amountOwed: data.amountOwed,
        amountPaid: data.amountPaid || 0,
        currency: data.currency || 'DZD',
        status: data.status || 'pending',
        notes: data.notes || '',
        createdAt: data.createdAt ? new Date(data.createdAt) : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
        paidAt: data.paidAt ? new Date(data.paidAt) : null
    };
}

/**
 * Check if two debtor objects are equivalent (ignoring id for new records)
 * @param {Object} original - Original debtor data
 * @param {Object} loaded - Loaded debtor data
 * @returns {boolean} - True if equivalent
 */
function debtorsAreEquivalent(original, loaded) {
    // Compare core fields
    if (original.name !== loaded.name) return false;
    if (original.phone !== loaded.phone) return false;
    if (original.productId !== loaded.productId) return false;
    if (original.productName !== loaded.productName) return false;
    if (original.amountOwed !== loaded.amountOwed) return false;
    if (original.amountPaid !== loaded.amountPaid) return false;
    if (original.currency !== loaded.currency) return false;
    if (original.status !== loaded.status) return false;
    if (original.notes !== loaded.notes) return false;
    
    // Compare timestamps (allow for serialization differences)
    const originalCreatedAt = original.createdAt instanceof Date ? original.createdAt.getTime() : new Date(original.createdAt).getTime();
    const loadedCreatedAt = loaded.createdAt instanceof Date ? loaded.createdAt.getTime() : new Date(loaded.createdAt).getTime();
    if (originalCreatedAt !== loadedCreatedAt) return false;
    
    return true;
}

/**
 * Pure validation function for testing (mirrors validateDebtorForm logic)
 * This allows us to test the validation logic without DOM dependencies
 * @param {string} name - Debtor name
 * @param {number|string} amount - Amount owed
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateDebtorData(name, amount) {
    const errors = [];
    
    // Normalize name
    const trimmedName = (name || '').toString().trim();
    const parsedAmount = parseFloat(amount);
    
    // التحقق من الاسم (مطلوب)
    if (!trimmedName || trimmedName.length === 0) {
        errors.push('اسم المدين مطلوب');
    }
    
    // التحقق من المبلغ (مطلوب وأكبر من صفر)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push('المبلغ يجب أن يكون أكبر من صفر');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Arbitrary Generators for Debtor Data
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generator for valid debtor names (non-empty, non-whitespace-only)
 */
const validDebtorName = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);

/**
 * Generator for valid phone numbers
 */
const validPhone = fc.oneof(
    fc.constant(''),
    fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-', '+'), { minLength: 0, maxLength: 20 })
);

/**
 * Generator for valid currency values
 */
const validCurrency = fc.constantFrom('DZD', 'USD');

/**
 * Generator for valid status values
 */
const validStatus = fc.constantFrom('pending', 'partial', 'paid');

/**
 * Generator for valid positive amounts
 */
const validAmount = fc.double({ min: 0.01, max: 1000000, noNaN: true });

/**
 * Generator for valid timestamps (within reasonable range)
 */
const validTimestamp = fc.date({ 
    min: new Date('2020-01-01'), 
    max: new Date('2030-12-31') 
});

/**
 * Generator for complete valid debtor objects
 */
const validDebtorArbitrary = fc.record({
    name: validDebtorName,
    phone: validPhone,
    productId: fc.string({ maxLength: 50 }),
    productName: fc.string({ maxLength: 100 }),
    amountOwed: validAmount,
    amountPaid: fc.double({ min: 0, max: 1000000, noNaN: true }),
    currency: validCurrency,
    status: validStatus,
    notes: fc.string({ maxLength: 500 }),
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
    paidAt: fc.option(validTimestamp, { nil: null })
}).filter(debtor => debtor.amountPaid <= debtor.amountOwed);

describe('Debtors Management - Property-Based Tests', () => {
    
    /**
     * **Feature: debtors-management, Property 1: Data Persistence Round-Trip**
     * **Validates: Requirements 1.2, 3.4**
     * 
     * For any valid debtor data, saving to Firebase then loading should return 
     * an equivalent debtor record with all fields preserved.
     */
    describe('Property 1: Data Persistence Round-Trip', () => {
        
        /**
         * Test: Serialization then deserialization preserves all debtor fields
         */
        test('serializing then deserializing preserves all debtor fields', () => {
            fc.assert(
                fc.property(
                    validDebtorArbitrary,
                    fc.uuid(),
                    (debtor, documentId) => {
                        // Simulate save: serialize the debtor
                        const serialized = serializeDebtor(debtor);
                        
                        // Simulate load: deserialize with a document ID
                        const loaded = deserializeDebtor(documentId, serialized);
                        
                        // Property: All core fields should be preserved
                        expect(loaded.name).toBe(debtor.name);
                        expect(loaded.phone).toBe(debtor.phone || '');
                        expect(loaded.productId).toBe(debtor.productId || '');
                        expect(loaded.productName).toBe(debtor.productName || '');
                        expect(loaded.amountOwed).toBe(debtor.amountOwed);
                        expect(loaded.amountPaid).toBe(debtor.amountPaid || 0);
                        expect(loaded.currency).toBe(debtor.currency || 'DZD');
                        expect(loaded.status).toBe(debtor.status || 'pending');
                        expect(loaded.notes).toBe(debtor.notes || '');
                        
                        // Property: Document ID should be assigned
                        expect(loaded.id).toBe(documentId);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Timestamps are preserved through serialization round-trip
         */
        test('timestamps are preserved through serialization round-trip', () => {
            fc.assert(
                fc.property(
                    validDebtorArbitrary,
                    fc.uuid(),
                    (debtor, documentId) => {
                        // Simulate save: serialize the debtor
                        const serialized = serializeDebtor(debtor);
                        
                        // Simulate load: deserialize with a document ID
                        const loaded = deserializeDebtor(documentId, serialized);
                        
                        // Property: createdAt timestamp should be preserved
                        expect(loaded.createdAt.getTime()).toBe(debtor.createdAt.getTime());
                        
                        // Property: updatedAt timestamp should be preserved
                        expect(loaded.updatedAt.getTime()).toBe(debtor.updatedAt.getTime());
                        
                        // Property: paidAt should be preserved (null or Date)
                        if (debtor.paidAt === null) {
                            expect(loaded.paidAt).toBeNull();
                        } else {
                            expect(loaded.paidAt.getTime()).toBe(debtor.paidAt.getTime());
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Round-trip equivalence check passes for all valid debtors
         */
        test('round-trip produces equivalent debtor records', () => {
            fc.assert(
                fc.property(
                    validDebtorArbitrary,
                    fc.uuid(),
                    (debtor, documentId) => {
                        // Simulate save: serialize the debtor
                        const serialized = serializeDebtor(debtor);
                        
                        // Simulate load: deserialize with a document ID
                        const loaded = deserializeDebtor(documentId, serialized);
                        
                        // Property: The loaded debtor should be equivalent to the original
                        expect(debtorsAreEquivalent(debtor, loaded)).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Multiple round-trips produce identical results (idempotence)
         */
        test('multiple round-trips produce identical results', () => {
            fc.assert(
                fc.property(
                    validDebtorArbitrary,
                    fc.uuid(),
                    (debtor, documentId) => {
                        // First round-trip
                        const serialized1 = serializeDebtor(debtor);
                        const loaded1 = deserializeDebtor(documentId, serialized1);
                        
                        // Second round-trip (serialize the loaded data)
                        const serialized2 = serializeDebtor(loaded1);
                        const loaded2 = deserializeDebtor(documentId, serialized2);
                        
                        // Property: Both round-trips should produce equivalent results
                        expect(loaded1.name).toBe(loaded2.name);
                        expect(loaded1.phone).toBe(loaded2.phone);
                        expect(loaded1.amountOwed).toBe(loaded2.amountOwed);
                        expect(loaded1.amountPaid).toBe(loaded2.amountPaid);
                        expect(loaded1.currency).toBe(loaded2.currency);
                        expect(loaded1.status).toBe(loaded2.status);
                        expect(loaded1.createdAt.getTime()).toBe(loaded2.createdAt.getTime());
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Serialization is deterministic
         */
        test('serialization is deterministic', () => {
            fc.assert(
                fc.property(
                    validDebtorArbitrary,
                    (debtor) => {
                        const serialized1 = serializeDebtor(debtor);
                        const serialized2 = serializeDebtor(debtor);
                        
                        // Property: Same input should always produce same output
                        expect(JSON.stringify(serialized1)).toBe(JSON.stringify(serialized2));
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
    
    /**
     * **Feature: debtors-management, Property 2: Validation Rejects Invalid Inputs**
     * **Validates: Requirements 1.3**
     * 
     * For any debtor form submission with empty name or non-positive amount, 
     * the system should reject the submission and the debtors list should remain unchanged.
     */
    describe('Property 2: Validation Rejects Invalid Inputs', () => {
        
        /**
         * Test: Empty or whitespace-only names should be rejected
         */
        test('rejects empty or whitespace-only names', () => {
            fc.assert(
                fc.property(
                    // Generate empty strings or whitespace-only strings
                    fc.oneof(
                        fc.constant(''),
                        fc.constant('   '),
                        fc.constant('\t'),
                        fc.constant('\n'),
                        fc.constant('  \t\n  '),
                        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))
                    ),
                    // Generate valid positive amounts
                    fc.double({ min: 0.01, max: 100000, noNaN: true }),
                    (invalidName, validAmount) => {
                        const result = validateDebtorData(invalidName, validAmount);
                        
                        // Property: Should be invalid
                        expect(result.isValid).toBe(false);
                        
                        // Property: Should contain name error
                        expect(result.errors).toContain('اسم المدين مطلوب');
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Non-positive amounts should be rejected
         */
        test('rejects non-positive amounts (zero, negative, NaN)', () => {
            fc.assert(
                fc.property(
                    // Generate valid non-empty names
                    fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
                    // Generate invalid amounts: zero, negative, or NaN-producing values
                    fc.oneof(
                        fc.constant(0),
                        fc.constant(-1),
                        fc.double({ min: -100000, max: 0, noNaN: true }),
                        fc.constant(NaN),
                        fc.constant('invalid'),
                        fc.constant(''),
                        fc.constant(null),
                        fc.constant(undefined)
                    ),
                    (validName, invalidAmount) => {
                        const result = validateDebtorData(validName, invalidAmount);
                        
                        // Property: Should be invalid
                        expect(result.isValid).toBe(false);
                        
                        // Property: Should contain amount error
                        expect(result.errors).toContain('المبلغ يجب أن يكون أكبر من صفر');
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Both invalid name AND invalid amount should produce both errors
         */
        test('rejects submissions with both invalid name and invalid amount', () => {
            fc.assert(
                fc.property(
                    // Generate invalid names
                    fc.oneof(
                        fc.constant(''),
                        fc.constant('   '),
                        fc.stringOf(fc.constantFrom(' ', '\t', '\n'))
                    ),
                    // Generate invalid amounts
                    fc.oneof(
                        fc.constant(0),
                        fc.constant(-1),
                        fc.double({ min: -100000, max: 0, noNaN: true }),
                        fc.constant('invalid')
                    ),
                    (invalidName, invalidAmount) => {
                        const result = validateDebtorData(invalidName, invalidAmount);
                        
                        // Property: Should be invalid
                        expect(result.isValid).toBe(false);
                        
                        // Property: Should contain both errors
                        expect(result.errors).toContain('اسم المدين مطلوب');
                        expect(result.errors).toContain('المبلغ يجب أن يكون أكبر من صفر');
                        expect(result.errors.length).toBe(2);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Valid inputs should be accepted
         * This is the inverse property - ensures validation accepts valid data
         */
        test('accepts valid name and positive amount', () => {
            fc.assert(
                fc.property(
                    // Generate valid non-empty names (at least one non-whitespace char)
                    fc.string({ minLength: 1, maxLength: 100 })
                        .filter(s => s.trim().length > 0),
                    // Generate valid positive amounts
                    fc.double({ min: 0.01, max: 100000, noNaN: true }),
                    (validName, validAmount) => {
                        const result = validateDebtorData(validName, validAmount);
                        
                        // Property: Should be valid
                        expect(result.isValid).toBe(true);
                        
                        // Property: Should have no errors
                        expect(result.errors).toHaveLength(0);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Test: Validation is deterministic - same input always produces same result
         */
        test('validation is deterministic', () => {
            fc.assert(
                fc.property(
                    fc.string(),
                    fc.oneof(
                        fc.double({ noNaN: true }),
                        fc.constant(NaN),
                        fc.constant('invalid')
                    ),
                    (name, amount) => {
                        const result1 = validateDebtorData(name, amount);
                        const result2 = validateDebtorData(name, amount);
                        
                        // Property: Same input should always produce same output
                        expect(result1.isValid).toBe(result2.isValid);
                        expect(result1.errors).toEqual(result2.errors);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Deletion Logic Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simulates a debtors collection (in-memory store)
 * This mirrors the behavior of Firebase collection operations
 */
class DebtorsStore {
    constructor() {
        this.debtors = new Map();
    }
    
    /**
     * Add a debtor to the store
     * @param {string} id - Document ID
     * @param {Object} data - Debtor data
     */
    add(id, data) {
        this.debtors.set(id, { ...data, id });
    }
    
    /**
     * Delete a debtor from the store
     * @param {string} id - Document ID to delete
     * @returns {boolean} - True if deleted, false if not found
     */
    delete(id) {
        return this.debtors.delete(id);
    }
    
    /**
     * Get a debtor by ID
     * @param {string} id - Document ID
     * @returns {Object|undefined} - Debtor data or undefined
     */
    get(id) {
        return this.debtors.get(id);
    }
    
    /**
     * Check if a debtor exists
     * @param {string} id - Document ID
     * @returns {boolean} - True if exists
     */
    has(id) {
        return this.debtors.has(id);
    }
    
    /**
     * Get all debtors as an array
     * @returns {Array} - Array of debtor objects
     */
    getAll() {
        return Array.from(this.debtors.values());
    }
    
    /**
     * Get the count of debtors
     * @returns {number} - Number of debtors
     */
    count() {
        return this.debtors.size;
    }
    
    /**
     * Find debtors matching a predicate
     * @param {Function} predicate - Filter function
     * @returns {Array} - Matching debtors
     */
    find(predicate) {
        return this.getAll().filter(predicate);
    }
}

/**
 * **Feature: debtors-management, Property 10: Deletion Removes Record**
 * **Validates: Requirements 4.2**
 */
describe('Property 10: Deletion Removes Record', () => {
    
    /**
     * Test: After deletion, the debtor should not be found in subsequent queries
     */
    test('deleted debtor is not returned in subsequent queries', () => {
        fc.assert(
            fc.property(
                // Generate a list of valid debtors (1-10 debtors)
                fc.array(validDebtorArbitrary, { minLength: 1, maxLength: 10 }),
                // Generate unique IDs for each debtor
                fc.array(fc.uuid(), { minLength: 10, maxLength: 10 }),
                (debtors, ids) => {
                    const store = new DebtorsStore();
                    
                    // Add all debtors to the store
                    debtors.forEach((debtor, index) => {
                        store.add(ids[index], debtor);
                    });
                    
                    // Pick a random debtor to delete (first one for simplicity)
                    const idToDelete = ids[0];
                    
                    // Verify the debtor exists before deletion
                    expect(store.has(idToDelete)).toBe(true);
                    
                    // Delete the debtor
                    const deleteResult = store.delete(idToDelete);
                    
                    // Property: Delete operation should succeed
                    expect(deleteResult).toBe(true);
                    
                    // Property: Debtor should not exist after deletion
                    expect(store.has(idToDelete)).toBe(false);
                    
                    // Property: Get should return undefined for deleted debtor
                    expect(store.get(idToDelete)).toBeUndefined();
                    
                    // Property: Deleted debtor should not appear in getAll()
                    const allDebtors = store.getAll();
                    const foundDeleted = allDebtors.find(d => d.id === idToDelete);
                    expect(foundDeleted).toBeUndefined();
                    
                    // Property: Count should decrease by 1
                    expect(store.count()).toBe(debtors.length - 1);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Deleting a debtor does not affect other debtors
     */
    test('deletion does not affect other debtors', () => {
        fc.assert(
            fc.property(
                // Generate at least 2 debtors
                fc.array(validDebtorArbitrary, { minLength: 2, maxLength: 10 }),
                fc.array(fc.uuid(), { minLength: 10, maxLength: 10 }),
                (debtors, ids) => {
                    const store = new DebtorsStore();
                    
                    // Add all debtors to the store
                    debtors.forEach((debtor, index) => {
                        store.add(ids[index], debtor);
                    });
                    
                    // Store the original data of non-deleted debtors
                    const idToDelete = ids[0];
                    const remainingIds = ids.slice(1, debtors.length);
                    const originalData = remainingIds.map(id => ({
                        id,
                        data: JSON.stringify(store.get(id))
                    }));
                    
                    // Delete one debtor
                    store.delete(idToDelete);
                    
                    // Property: All other debtors should remain unchanged
                    originalData.forEach(({ id, data }) => {
                        expect(store.has(id)).toBe(true);
                        expect(JSON.stringify(store.get(id))).toBe(data);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Deleting non-existent debtor returns false
     */
    test('deleting non-existent debtor returns false', () => {
        fc.assert(
            fc.property(
                fc.array(validDebtorArbitrary, { minLength: 0, maxLength: 5 }),
                fc.array(fc.uuid(), { minLength: 5, maxLength: 5 }),
                fc.uuid(), // ID that won't be in the store
                (debtors, ids, nonExistentId) => {
                    const store = new DebtorsStore();
                    
                    // Add debtors with specific IDs
                    debtors.forEach((debtor, index) => {
                        store.add(ids[index], debtor);
                    });
                    
                    // Ensure nonExistentId is not in the store
                    fc.pre(!ids.slice(0, debtors.length).includes(nonExistentId));
                    
                    const initialCount = store.count();
                    
                    // Try to delete non-existent debtor
                    const deleteResult = store.delete(nonExistentId);
                    
                    // Property: Delete should return false for non-existent ID
                    expect(deleteResult).toBe(false);
                    
                    // Property: Count should remain unchanged
                    expect(store.count()).toBe(initialCount);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Multiple deletions work correctly
     */
    test('multiple deletions work correctly', () => {
        fc.assert(
            fc.property(
                // Generate 3-10 debtors
                fc.array(validDebtorArbitrary, { minLength: 3, maxLength: 10 }),
                fc.array(fc.uuid(), { minLength: 10, maxLength: 10 }),
                (debtors, ids) => {
                    const store = new DebtorsStore();
                    
                    // Add all debtors
                    debtors.forEach((debtor, index) => {
                        store.add(ids[index], debtor);
                    });
                    
                    const initialCount = store.count();
                    const idsToDelete = ids.slice(0, Math.min(2, debtors.length));
                    
                    // Delete multiple debtors
                    idsToDelete.forEach(id => {
                        store.delete(id);
                    });
                    
                    // Property: All deleted debtors should not exist
                    idsToDelete.forEach(id => {
                        expect(store.has(id)).toBe(false);
                        expect(store.get(id)).toBeUndefined();
                    });
                    
                    // Property: Count should decrease by number of deletions
                    expect(store.count()).toBe(initialCount - idsToDelete.length);
                    
                    // Property: Remaining debtors should still exist
                    const remainingIds = ids.slice(idsToDelete.length, debtors.length);
                    remainingIds.forEach(id => {
                        expect(store.has(id)).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Deletion is idempotent - deleting same ID twice doesn't cause errors
     */
    test('deletion is idempotent', () => {
        fc.assert(
            fc.property(
                validDebtorArbitrary,
                fc.uuid(),
                (debtor, id) => {
                    const store = new DebtorsStore();
                    
                    // Add debtor
                    store.add(id, debtor);
                    expect(store.count()).toBe(1);
                    
                    // First deletion should succeed
                    const firstDelete = store.delete(id);
                    expect(firstDelete).toBe(true);
                    expect(store.count()).toBe(0);
                    
                    // Second deletion should return false (already deleted)
                    const secondDelete = store.delete(id);
                    expect(secondDelete).toBe(false);
                    expect(store.count()).toBe(0);
                    
                    // Property: Store state should be consistent after multiple deletes
                    expect(store.has(id)).toBe(false);
                    expect(store.get(id)).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Timestamp Auto-Generation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simulates the timestamp generation behavior of Firebase serverTimestamp()
 * In the actual implementation, Firebase generates the timestamp on the server
 * This function simulates that behavior for testing purposes
 * @returns {Date} - Current timestamp
 */
function generateTimestamp() {
    return new Date();
}

/**
 * Creates a new debtor record with auto-generated timestamp
 * This mirrors the saveDebtor function's behavior
 * @param {Object} debtorInput - Input data for the debtor
 * @returns {Object} - Debtor record with auto-generated createdAt
 */
function createDebtorRecord(debtorInput) {
    const now = generateTimestamp();
    return {
        name: debtorInput.name,
        phone: debtorInput.phone || '',
        productId: debtorInput.productId || '',
        productName: debtorInput.productName || '',
        amountOwed: debtorInput.amountOwed,
        amountPaid: 0,
        currency: debtorInput.currency || 'DZD',
        status: 'pending',
        notes: debtorInput.notes || '',
        createdAt: now,
        updatedAt: null,
        paidAt: null
    };
}

/**
 * Checks if a timestamp is valid and within a reasonable time window
 * @param {Date} timestamp - The timestamp to validate
 * @param {Date} referenceTime - The reference time (when the operation started)
 * @param {number} toleranceMs - Tolerance in milliseconds (default 5000ms = 5 seconds)
 * @returns {boolean} - True if timestamp is valid and within tolerance
 */
function isValidTimestamp(timestamp, referenceTime, toleranceMs = 5000) {
    // Check if it's a valid Date object
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
        return false;
    }
    
    // Check if timestamp is within reasonable window of reference time
    const diff = Math.abs(timestamp.getTime() - referenceTime.getTime());
    return diff <= toleranceMs;
}

/**
 * **Feature: debtors-management, Property 3: Timestamp Auto-Generation**
 * **Validates: Requirements 1.4**
 * 
 * For any newly created debtor record, the createdAt field should be a valid 
 * timestamp within a reasonable time window of the save operation.
 */
describe('Property 3: Timestamp Auto-Generation', () => {
    
    /**
     * Generator for valid debtor input (without timestamps - those are auto-generated)
     */
    const validDebtorInput = fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.oneof(
            fc.constant(''),
            fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-', '+'), { minLength: 0, maxLength: 20 })
        ),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
        currency: fc.constantFrom('DZD', 'USD'),
        notes: fc.string({ maxLength: 500 })
    });
    
    /**
     * Test: createdAt is automatically set to a valid timestamp
     */
    test('createdAt is automatically set to a valid timestamp', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                (debtorInput) => {
                    const beforeCreate = new Date();
                    
                    // Create the debtor record (simulates saveDebtor)
                    const debtorRecord = createDebtorRecord(debtorInput);
                    
                    const afterCreate = new Date();
                    
                    // Property: createdAt should be a Date object
                    expect(debtorRecord.createdAt).toBeInstanceOf(Date);
                    
                    // Property: createdAt should not be NaN
                    expect(isNaN(debtorRecord.createdAt.getTime())).toBe(false);
                    
                    // Property: createdAt should be within the time window of the operation
                    expect(debtorRecord.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
                    expect(debtorRecord.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: createdAt is within reasonable tolerance of operation time
     */
    test('createdAt is within reasonable tolerance of operation time', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                (debtorInput) => {
                    const operationTime = new Date();
                    
                    // Create the debtor record
                    const debtorRecord = createDebtorRecord(debtorInput);
                    
                    // Property: Timestamp should be valid and within 5 second tolerance
                    expect(isValidTimestamp(debtorRecord.createdAt, operationTime, 5000)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: updatedAt is null for new records
     */
    test('updatedAt is null for new records', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                (debtorInput) => {
                    const debtorRecord = createDebtorRecord(debtorInput);
                    
                    // Property: updatedAt should be null for new records
                    expect(debtorRecord.updatedAt).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: paidAt is null for new records
     */
    test('paidAt is null for new records', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                (debtorInput) => {
                    const debtorRecord = createDebtorRecord(debtorInput);
                    
                    // Property: paidAt should be null for new records
                    expect(debtorRecord.paidAt).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: status is 'pending' for new records
     */
    test('status is pending for new records', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                (debtorInput) => {
                    const debtorRecord = createDebtorRecord(debtorInput);
                    
                    // Property: status should be 'pending' for new records
                    expect(debtorRecord.status).toBe('pending');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: amountPaid is 0 for new records
     */
    test('amountPaid is 0 for new records', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                (debtorInput) => {
                    const debtorRecord = createDebtorRecord(debtorInput);
                    
                    // Property: amountPaid should be 0 for new records
                    expect(debtorRecord.amountPaid).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Each new record gets a unique timestamp (not shared)
     */
    test('each new record gets its own timestamp', () => {
        fc.assert(
            fc.property(
                validDebtorInput,
                validDebtorInput,
                (debtorInput1, debtorInput2) => {
                    const record1 = createDebtorRecord(debtorInput1);
                    
                    // Small delay to ensure different timestamps
                    const record2 = createDebtorRecord(debtorInput2);
                    
                    // Property: Both records should have valid timestamps
                    expect(record1.createdAt).toBeInstanceOf(Date);
                    expect(record2.createdAt).toBeInstanceOf(Date);
                    
                    // Property: Timestamps should be independent (record2 >= record1)
                    expect(record2.createdAt.getTime()).toBeGreaterThanOrEqual(record1.createdAt.getTime());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Timestamp generation is deterministic within same millisecond
     * (multiple calls in same ms should produce same or increasing timestamps)
     */
    test('timestamps are monotonically non-decreasing', () => {
        fc.assert(
            fc.property(
                fc.array(validDebtorInput, { minLength: 2, maxLength: 10 }),
                (debtorInputs) => {
                    const records = debtorInputs.map(input => createDebtorRecord(input));
                    
                    // Property: Each subsequent timestamp should be >= previous
                    for (let i = 1; i < records.length; i++) {
                        expect(records[i].createdAt.getTime())
                            .toBeGreaterThanOrEqual(records[i-1].createdAt.getTime());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Payment Recording Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to calculate payment result
 * This mirrors the recordPayment logic from admin.js without Firebase dependencies
 * @param {Object} debtor - Current debtor state
 * @param {number} paymentAmount - Amount being paid
 * @returns {Object} - { success, newState, error }
 */
function calculatePaymentResult(debtor, paymentAmount) {
    // Validate payment amount
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };
    }
    
    const currentPaid = parseFloat(debtor.amountPaid) || 0;
    const amountOwed = parseFloat(debtor.amountOwed) || 0;
    const remainingAmount = amountOwed - currentPaid;
    
    // Check if payment exceeds remaining
    if (paymentAmount > remainingAmount) {
        return { success: false, error: 'المبلغ المدفوع أكبر من المتبقي' };
    }
    
    // Calculate new amount paid
    const newAmountPaid = currentPaid + paymentAmount;
    
    // Determine new status
    // Use a small epsilon for floating-point comparison to handle precision issues
    const epsilon = 0.0001;
    let newStatus;
    let paidAt = null;
    
    if (newAmountPaid >= amountOwed - epsilon) {
        // Full payment (Requirements: 3.3)
        newStatus = 'paid';
        paidAt = new Date();
    } else {
        // Partial payment (Requirements: 3.2)
        newStatus = 'partial';
    }
    
    return {
        success: true,
        newState: {
            ...debtor,
            amountPaid: newAmountPaid,
            status: newStatus,
            paidAt: paidAt,
            updatedAt: new Date()
        }
    };
}

/**
 * **Feature: debtors-management, Property 8: Partial Payment Calculation**
 * **Validates: Requirements 3.2**
 * 
 * For any debtor with amountOwed > 0 and any payment amount where 0 < payment < amountOwed,
 * after recording the payment: amountPaid should increase by the payment amount, 
 * and status should be 'partial'.
 */
describe('Property 8: Partial Payment Calculation', () => {
    
    /**
     * Generator for debtor with unpaid balance
     */
    const debtorWithBalance = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.string({ maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 100, max: 1000000, noNaN: true }), // Ensure meaningful amounts
        amountPaid: fc.constant(0), // Start with no payments
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constant('pending'),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.constant(null),
        paidAt: fc.constant(null)
    });
    
    /**
     * Test: Partial payment increases amountPaid by payment amount
     */
    test('partial payment increases amountPaid by payment amount', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    // Generate a partial payment (between 1% and 99% of amount owed)
                    const maxPartialPayment = debtor.amountOwed * 0.99;
                    const minPartialPayment = Math.max(0.01, debtor.amountOwed * 0.01);
                    const paymentAmount = minPartialPayment + Math.random() * (maxPartialPayment - minPartialPayment);
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: amountPaid should increase by exactly the payment amount
                    const expectedAmountPaid = debtor.amountPaid + paymentAmount;
                    expect(result.newState.amountPaid).toBeCloseTo(expectedAmountPaid, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Partial payment sets status to 'partial'
     */
    test('partial payment sets status to partial', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    // Generate a partial payment (strictly less than amount owed)
                    const paymentAmount = debtor.amountOwed * 0.5; // 50% payment
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: Status should be 'partial'
                    expect(result.newState.status).toBe('partial');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Partial payment does not set paidAt
     */
    test('partial payment does not set paidAt', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    // Generate a partial payment
                    const paymentAmount = debtor.amountOwed * 0.3; // 30% payment
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: paidAt should remain null for partial payments
                    expect(result.newState.paidAt).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Multiple partial payments accumulate correctly
     */
    test('multiple partial payments accumulate correctly', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                fc.integer({ min: 2, max: 5 }), // Number of payments
                (debtor, numPayments) => {
                    // Calculate payment amount that won't exceed total when summed
                    const paymentAmount = (debtor.amountOwed * 0.9) / numPayments;
                    
                    let currentState = { ...debtor };
                    
                    for (let i = 0; i < numPayments; i++) {
                        const result = calculatePaymentResult(currentState, paymentAmount);
                        expect(result.success).toBe(true);
                        currentState = result.newState;
                    }
                    
                    // Property: Total paid should equal sum of all payments
                    const expectedTotal = paymentAmount * numPayments;
                    expect(currentState.amountPaid).toBeCloseTo(expectedTotal, 10);
                    
                    // Property: Status should still be 'partial' (didn't pay full amount)
                    expect(currentState.status).toBe('partial');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Partial payment on already partially paid debtor
     */
    test('partial payment on already partially paid debtor works correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    phone: fc.string({ maxLength: 20 }),
                    productId: fc.string({ maxLength: 50 }),
                    productName: fc.string({ maxLength: 100 }),
                    amountOwed: fc.double({ min: 1000, max: 1000000, noNaN: true }),
                    amountPaid: fc.double({ min: 100, max: 500, noNaN: true }), // Already has some payment
                    currency: fc.constantFrom('DZD', 'USD'),
                    status: fc.constant('partial'),
                    notes: fc.string({ maxLength: 500 }),
                    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                    updatedAt: fc.constant(null),
                    paidAt: fc.constant(null)
                }),
                (debtor) => {
                    const remainingAmount = debtor.amountOwed - debtor.amountPaid;
                    // Make a partial payment (50% of remaining)
                    const paymentAmount = remainingAmount * 0.5;
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: amountPaid should be previous + new payment
                    expect(result.newState.amountPaid).toBeCloseTo(debtor.amountPaid + paymentAmount, 10);
                    
                    // Property: Status should be 'partial'
                    expect(result.newState.status).toBe('partial');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Payment exceeding remaining amount is rejected
     */
    test('payment exceeding remaining amount is rejected', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    // Try to pay more than owed
                    const excessPayment = debtor.amountOwed * 1.5;
                    
                    const result = calculatePaymentResult(debtor, excessPayment);
                    
                    // Property: Payment should fail
                    expect(result.success).toBe(false);
                    
                    // Property: Should have appropriate error message
                    expect(result.error).toBe('المبلغ المدفوع أكبر من المتبقي');
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: debtors-management, Property 9: Full Payment Status Transition**
 * **Validates: Requirements 3.3**
 * 
 * For any debtor, when amountPaid equals amountOwed, the status should be 'paid' 
 * and paidAt should be a valid timestamp.
 */
describe('Property 9: Full Payment Status Transition', () => {
    
    /**
     * Generator for debtor with unpaid balance
     */
    const debtorWithBalance = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.string({ maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 100, max: 1000000, noNaN: true }),
        amountPaid: fc.constant(0),
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constant('pending'),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.constant(null),
        paidAt: fc.constant(null)
    });
    
    /**
     * Test: Full payment sets status to 'paid'
     */
    test('full payment sets status to paid', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    // Pay the full amount
                    const paymentAmount = debtor.amountOwed;
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: Status should be 'paid'
                    expect(result.newState.status).toBe('paid');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Full payment sets paidAt to valid timestamp
     */
    test('full payment sets paidAt to valid timestamp', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    const beforePayment = new Date();
                    
                    // Pay the full amount
                    const paymentAmount = debtor.amountOwed;
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    const afterPayment = new Date();
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: paidAt should be a Date object
                    expect(result.newState.paidAt).toBeInstanceOf(Date);
                    
                    // Property: paidAt should be within the operation time window
                    expect(result.newState.paidAt.getTime()).toBeGreaterThanOrEqual(beforePayment.getTime());
                    expect(result.newState.paidAt.getTime()).toBeLessThanOrEqual(afterPayment.getTime());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Full payment makes amountPaid equal to amountOwed
     */
    test('full payment makes amountPaid equal to amountOwed', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    // Pay the full amount
                    const paymentAmount = debtor.amountOwed;
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: amountPaid should equal amountOwed
                    expect(result.newState.amountPaid).toBeCloseTo(debtor.amountOwed, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Final partial payment that completes debt triggers full payment status
     */
    test('final partial payment that completes debt triggers full payment status', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    phone: fc.string({ maxLength: 20 }),
                    productId: fc.string({ maxLength: 50 }),
                    productName: fc.string({ maxLength: 100 }),
                    amountOwed: fc.double({ min: 1000, max: 1000000, noNaN: true }),
                    amountPaid: fc.double({ min: 100, max: 900, noNaN: true }), // Already partially paid
                    currency: fc.constantFrom('DZD', 'USD'),
                    status: fc.constant('partial'),
                    notes: fc.string({ maxLength: 500 }),
                    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                    updatedAt: fc.constant(null),
                    paidAt: fc.constant(null)
                }),
                (debtor) => {
                    // Pay the remaining amount
                    const remainingAmount = debtor.amountOwed - debtor.amountPaid;
                    
                    const result = calculatePaymentResult(debtor, remainingAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: Status should be 'paid'
                    expect(result.newState.status).toBe('paid');
                    
                    // Property: paidAt should be set
                    expect(result.newState.paidAt).toBeInstanceOf(Date);
                    
                    // Property: amountPaid should equal amountOwed
                    expect(result.newState.amountPaid).toBeCloseTo(debtor.amountOwed, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: updatedAt is set on full payment
     */
    test('updatedAt is set on full payment', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                (debtor) => {
                    const beforePayment = new Date();
                    
                    // Pay the full amount
                    const paymentAmount = debtor.amountOwed;
                    
                    const result = calculatePaymentResult(debtor, paymentAmount);
                    
                    const afterPayment = new Date();
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: updatedAt should be set
                    expect(result.newState.updatedAt).toBeInstanceOf(Date);
                    
                    // Property: updatedAt should be within the operation time window
                    expect(result.newState.updatedAt.getTime()).toBeGreaterThanOrEqual(beforePayment.getTime());
                    expect(result.newState.updatedAt.getTime()).toBeLessThanOrEqual(afterPayment.getTime());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Zero or negative payment is rejected
     */
    test('zero or negative payment is rejected', () => {
        fc.assert(
            fc.property(
                debtorWithBalance,
                fc.oneof(
                    fc.constant(0),
                    fc.constant(-1),
                    fc.double({ min: -100000, max: 0, noNaN: true })
                ),
                (debtor, invalidPayment) => {
                    const result = calculatePaymentResult(debtor, invalidPayment);
                    
                    // Property: Payment should fail
                    expect(result.success).toBe(false);
                    
                    // Property: Should have appropriate error message
                    expect(result.error).toBe('المبلغ يجب أن يكون أكبر من صفر');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Payment is idempotent in terms of final state for full payment
     */
    test('paying exact remaining amount always results in paid status', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    phone: fc.string({ maxLength: 20 }),
                    productId: fc.string({ maxLength: 50 }),
                    productName: fc.string({ maxLength: 100 }),
                    amountOwed: fc.double({ min: 100, max: 1000000, noNaN: true }),
                    amountPaid: fc.double({ min: 0, max: 99, noNaN: true }), // Variable starting point
                    currency: fc.constantFrom('DZD', 'USD'),
                    status: fc.constantFrom('pending', 'partial'),
                    notes: fc.string({ maxLength: 500 }),
                    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                    updatedAt: fc.constant(null),
                    paidAt: fc.constant(null)
                }),
                (debtor) => {
                    // Pay exactly the remaining amount
                    const remainingAmount = debtor.amountOwed - debtor.amountPaid;
                    
                    // Skip if remaining is 0 or negative (already paid)
                    fc.pre(remainingAmount > 0);
                    
                    const result = calculatePaymentResult(debtor, remainingAmount);
                    
                    // Property: Payment should succeed
                    expect(result.success).toBe(true);
                    
                    // Property: Status should always be 'paid' when paying exact remaining
                    expect(result.newState.status).toBe('paid');
                    
                    // Property: paidAt should always be set
                    expect(result.newState.paidAt).not.toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Debtors Management - DOM Integration Tests', () => {
    
    beforeEach(() => {
        // Set up DOM elements for validateDebtorForm
        document.body.innerHTML = `
            <input type="text" id="debtor-name" value="" />
            <input type="number" id="debtor-amount" value="" />
        `;
    });
    
    /**
     * Helper function that mirrors the actual validateDebtorForm from admin.js
     * This tests the DOM-based validation
     */
    function validateDebtorForm() {
        const errors = [];
        
        const name = document.getElementById('debtor-name')?.value?.trim();
        const amount = parseFloat(document.getElementById('debtor-amount')?.value);
        
        // التحقق من الاسم (مطلوب)
        if (!name || name.length === 0) {
            errors.push('اسم المدين مطلوب');
        }
        
        // التحقق من المبلغ (مطلوب وأكبر من صفر)
        if (isNaN(amount) || amount <= 0) {
            errors.push('المبلغ يجب أن يكون أكبر من صفر');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * **Feature: debtors-management, Property 2: Validation Rejects Invalid Inputs (DOM)**
     * **Validates: Requirements 1.3**
     */
    test('DOM validation rejects invalid inputs', () => {
        fc.assert(
            fc.property(
                // Generate invalid names (empty or whitespace)
                fc.oneof(
                    fc.constant(''),
                    fc.constant('   '),
                    fc.stringOf(fc.constantFrom(' ', '\t'))
                ),
                // Generate invalid amounts
                fc.oneof(
                    fc.constant(''),
                    fc.constant('0'),
                    fc.constant('-5'),
                    fc.constant('invalid')
                ),
                (invalidName, invalidAmount) => {
                    // Set DOM values
                    document.getElementById('debtor-name').value = invalidName;
                    document.getElementById('debtor-amount').value = invalidAmount;
                    
                    const result = validateDebtorForm();
                    
                    // Property: Should be invalid
                    expect(result.isValid).toBe(false);
                    
                    // Property: Should have at least one error
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: DOM validation accepts valid inputs
     */
    test('DOM validation accepts valid inputs', () => {
        fc.assert(
            fc.property(
                // Generate valid names
                fc.string({ minLength: 1, maxLength: 50 })
                    .filter(s => s.trim().length > 0),
                // Generate valid positive amounts as strings
                fc.double({ min: 0.01, max: 100000, noNaN: true })
                    .map(n => n.toString()),
                (validName, validAmount) => {
                    // Set DOM values
                    document.getElementById('debtor-name').value = validName;
                    document.getElementById('debtor-amount').value = validAmount;
                    
                    const result = validateDebtorForm();
                    
                    // Property: Should be valid
                    expect(result.isValid).toBe(true);
                    
                    // Property: Should have no errors
                    expect(result.errors).toHaveLength(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Statistics Calculation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to calculate debtor statistics
 * This mirrors the updateDebtorStats logic from admin.js without DOM dependencies
 * @param {Array} debtors - Array of debtor objects
 * @param {number} usdToDzdRate - Exchange rate for USD to DZD conversion
 * @returns {Object} - { totalDebtDZD, totalDebtUSD, totalDebtInDZD, debtorsCount, overdueCount }
 */
function calculateDebtorStats(debtors, usdToDzdRate = 230) {
    let totalDebtDZD = 0;
    let totalDebtUSD = 0;
    let debtorsCount = 0;
    let overdueCount = 0;
    
    debtors.forEach(debtor => {
        // Skip fully paid debtors
        if (debtor.status === 'paid') return;
        
        // Calculate remaining amount
        const remainingAmount = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);
        
        // Add to total based on currency
        if (debtor.currency === 'USD') {
            totalDebtUSD += remainingAmount;
        } else {
            totalDebtDZD += remainingAmount;
        }
        
        // Count non-paid debtors
        debtorsCount++;
        
        // Count overdue debts (more than 7 days)
        const ageIndicator = calculateAgeIndicator(debtor.createdAt, debtor.status);
        if (ageIndicator === 'warning' || ageIndicator === 'critical') {
            overdueCount++;
        }
    });
    
    // Convert USD to DZD for unified display
    const totalDebtInDZD = totalDebtDZD + (totalDebtUSD * usdToDzdRate);
    
    return {
        totalDebtDZD,
        totalDebtUSD,
        totalDebtInDZD,
        debtorsCount,
        overdueCount
    };
}

/**
 * Pure function to calculate age indicator
 * This mirrors the getDebtAgeIndicator logic from admin.js
 * @param {Date|Object} createdAt - Creation date
 * @param {string} status - Debt status
 * @returns {string} - 'critical' | 'warning' | 'normal'
 */
function calculateAgeIndicator(createdAt, status) {
    // Paid debts don't need indicator
    if (status === 'paid') {
        return 'normal';
    }
    
    // Convert to Date object
    let debtDate;
    if (createdAt?.toDate) {
        debtDate = createdAt.toDate();
    } else if (createdAt instanceof Date) {
        debtDate = createdAt;
    } else if (createdAt) {
        debtDate = new Date(createdAt);
    } else {
        return 'normal';
    }
    
    // Calculate days since creation
    const now = new Date();
    const diffTime = now.getTime() - debtDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine indicator based on age
    if (diffDays > 30) {
        return 'critical';
    } else if (diffDays > 7) {
        return 'warning';
    }
    return 'normal';
}

/**
 * **Feature: debtors-management, Property 5: Statistics Calculation Correctness**
 * **Validates: Requirements 2.2**
 * 
 * For any set of debtors, the displayed total debt should equal the sum of 
 * (amountOwed - amountPaid) for all non-paid debtors, and the count should 
 * equal the number of debtors.
 */
describe('Property 5: Statistics Calculation Correctness', () => {
    
    /**
     * Generator for debtor with specific status
     */
    const debtorWithStatus = (status) => fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.string({ maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
        amountPaid: fc.double({ min: 0, max: 50000, noNaN: true }),
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constant(status),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null }),
        paidAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null })
    }).filter(d => d.amountPaid <= d.amountOwed);
    
    /**
     * Generator for mixed status debtors array
     */
    const mixedDebtorsArray = fc.array(
        fc.oneof(
            debtorWithStatus('pending'),
            debtorWithStatus('partial'),
            debtorWithStatus('paid')
        ),
        { minLength: 0, maxLength: 20 }
    );
    
    /**
     * Test: Total debt equals sum of (amountOwed - amountPaid) for non-paid debtors
     */
    test('total debt equals sum of remaining amounts for non-paid debtors', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const stats = calculateDebtorStats(debtors);
                    
                    // Manually calculate expected totals
                    let expectedDZD = 0;
                    let expectedUSD = 0;
                    
                    debtors.forEach(debtor => {
                        if (debtor.status !== 'paid') {
                            const remaining = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);
                            if (debtor.currency === 'USD') {
                                expectedUSD += remaining;
                            } else {
                                expectedDZD += remaining;
                            }
                        }
                    });
                    
                    // Property: DZD total should match
                    expect(stats.totalDebtDZD).toBeCloseTo(expectedDZD, 10);
                    
                    // Property: USD total should match
                    expect(stats.totalDebtUSD).toBeCloseTo(expectedUSD, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Debtors count equals number of non-paid debtors
     */
    test('debtors count equals number of non-paid debtors', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const stats = calculateDebtorStats(debtors);
                    
                    // Manually count non-paid debtors
                    const expectedCount = debtors.filter(d => d.status !== 'paid').length;
                    
                    // Property: Count should match
                    expect(stats.debtorsCount).toBe(expectedCount);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Paid debtors are excluded from total debt calculation
     */
    test('paid debtors are excluded from total debt calculation', () => {
        fc.assert(
            fc.property(
                // Generate only paid debtors
                fc.array(debtorWithStatus('paid'), { minLength: 1, maxLength: 10 }),
                (paidDebtors) => {
                    const stats = calculateDebtorStats(paidDebtors);
                    
                    // Property: Total debt should be 0 for all paid debtors
                    expect(stats.totalDebtDZD).toBe(0);
                    expect(stats.totalDebtUSD).toBe(0);
                    expect(stats.totalDebtInDZD).toBe(0);
                    
                    // Property: Debtors count should be 0
                    expect(stats.debtorsCount).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Combined DZD total includes converted USD
     */
    test('combined DZD total includes converted USD at correct rate', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                fc.double({ min: 100, max: 300, noNaN: true }), // Exchange rate
                (debtors, exchangeRate) => {
                    const stats = calculateDebtorStats(debtors, exchangeRate);
                    
                    // Property: totalDebtInDZD should equal DZD + (USD * rate)
                    const expectedTotal = stats.totalDebtDZD + (stats.totalDebtUSD * exchangeRate);
                    expect(stats.totalDebtInDZD).toBeCloseTo(expectedTotal, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Empty debtors array returns zero stats
     */
    test('empty debtors array returns zero stats', () => {
        fc.assert(
            fc.property(
                fc.constant([]),
                (emptyArray) => {
                    const stats = calculateDebtorStats(emptyArray);
                    
                    // Property: All stats should be 0
                    expect(stats.totalDebtDZD).toBe(0);
                    expect(stats.totalDebtUSD).toBe(0);
                    expect(stats.totalDebtInDZD).toBe(0);
                    expect(stats.debtorsCount).toBe(0);
                    expect(stats.overdueCount).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Statistics calculation is deterministic
     */
    test('statistics calculation is deterministic', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const stats1 = calculateDebtorStats(debtors);
                    const stats2 = calculateDebtorStats(debtors);
                    
                    // Property: Same input should produce same output
                    expect(stats1.totalDebtDZD).toBe(stats2.totalDebtDZD);
                    expect(stats1.totalDebtUSD).toBe(stats2.totalDebtUSD);
                    expect(stats1.debtorsCount).toBe(stats2.debtorsCount);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Pending and partial debtors are both counted
     */
    test('pending and partial debtors are both counted in statistics', () => {
        fc.assert(
            fc.property(
                fc.array(debtorWithStatus('pending'), { minLength: 1, maxLength: 5 }),
                fc.array(debtorWithStatus('partial'), { minLength: 1, maxLength: 5 }),
                (pendingDebtors, partialDebtors) => {
                    const allDebtors = [...pendingDebtors, ...partialDebtors];
                    const stats = calculateDebtorStats(allDebtors);
                    
                    // Property: Count should include both pending and partial
                    expect(stats.debtorsCount).toBe(pendingDebtors.length + partialDebtors.length);
                    
                    // Property: Total debt should be non-zero (since we have non-paid debtors)
                    expect(stats.totalDebtDZD + stats.totalDebtUSD).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Remaining amount calculation is correct (amountOwed - amountPaid)
     */
    test('remaining amount is correctly calculated as amountOwed minus amountPaid', () => {
        fc.assert(
            fc.property(
                // Single DZD debtor for simple verification
                fc.record({
                    id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    phone: fc.string({ maxLength: 20 }),
                    productId: fc.string({ maxLength: 50 }),
                    productName: fc.string({ maxLength: 100 }),
                    amountOwed: fc.double({ min: 1000, max: 10000, noNaN: true }),
                    amountPaid: fc.double({ min: 0, max: 500, noNaN: true }),
                    currency: fc.constant('DZD'),
                    status: fc.constant('pending'),
                    notes: fc.string({ maxLength: 500 }),
                    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                    updatedAt: fc.constant(null),
                    paidAt: fc.constant(null)
                }),
                (debtor) => {
                    const stats = calculateDebtorStats([debtor]);
                    
                    // Property: Total should equal amountOwed - amountPaid
                    const expectedRemaining = debtor.amountOwed - debtor.amountPaid;
                    expect(stats.totalDebtDZD).toBeCloseTo(expectedRemaining, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Currency separation is correct
     */
    test('DZD and USD debts are tracked separately', () => {
        fc.assert(
            fc.property(
                // Generate DZD debtors
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                        phone: fc.string({ maxLength: 20 }),
                        productId: fc.string({ maxLength: 50 }),
                        productName: fc.string({ maxLength: 100 }),
                        amountOwed: fc.double({ min: 100, max: 10000, noNaN: true }),
                        amountPaid: fc.constant(0),
                        currency: fc.constant('DZD'),
                        status: fc.constant('pending'),
                        notes: fc.string({ maxLength: 500 }),
                        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                        updatedAt: fc.constant(null),
                        paidAt: fc.constant(null)
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                // Generate USD debtors
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                        phone: fc.string({ maxLength: 20 }),
                        productId: fc.string({ maxLength: 50 }),
                        productName: fc.string({ maxLength: 100 }),
                        amountOwed: fc.double({ min: 10, max: 1000, noNaN: true }),
                        amountPaid: fc.constant(0),
                        currency: fc.constant('USD'),
                        status: fc.constant('pending'),
                        notes: fc.string({ maxLength: 500 }),
                        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                        updatedAt: fc.constant(null),
                        paidAt: fc.constant(null)
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (dzdDebtors, usdDebtors) => {
                    const allDebtors = [...dzdDebtors, ...usdDebtors];
                    const stats = calculateDebtorStats(allDebtors);
                    
                    // Calculate expected DZD total
                    const expectedDZD = dzdDebtors.reduce((sum, d) => sum + d.amountOwed, 0);
                    
                    // Calculate expected USD total
                    const expectedUSD = usdDebtors.reduce((sum, d) => sum + d.amountOwed, 0);
                    
                    // Property: DZD total should only include DZD debts
                    expect(stats.totalDebtDZD).toBeCloseTo(expectedDZD, 10);
                    
                    // Property: USD total should only include USD debts
                    expect(stats.totalDebtUSD).toBeCloseTo(expectedUSD, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Status Filtering Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to filter debtors by status
 * This mirrors the filtering logic from displayDebtorsTable in admin.js
 * @param {Array} debtors - Array of debtor objects
 * @param {string} statusFilter - Status to filter by ('all', 'pending', 'partial', 'paid')
 * @returns {Array} - Filtered array of debtors
 */
function filterByStatus(debtors, statusFilter) {
    if (statusFilter === 'all') {
        return [...debtors];
    }
    return debtors.filter(debtor => debtor.status === statusFilter);
}

/**
 * **Feature: debtors-management, Property 7: Status Filtering Correctness**
 * **Validates: Requirements 2.4**
 * 
 * For any status filter value and set of debtors, all displayed results should 
 * have a status matching the selected filter.
 */
describe('Property 7: Status Filtering Correctness', () => {
    
    /**
     * Generator for debtor with specific status
     */
    const debtorWithStatus = (status) => fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.string({ maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
        amountPaid: fc.double({ min: 0, max: 50000, noNaN: true }),
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constant(status),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null }),
        paidAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null })
    }).filter(d => d.amountPaid <= d.amountOwed);
    
    /**
     * Generator for mixed status debtors array
     */
    const mixedDebtorsArray = fc.array(
        fc.oneof(
            debtorWithStatus('pending'),
            debtorWithStatus('partial'),
            debtorWithStatus('paid')
        ),
        { minLength: 0, maxLength: 20 }
    );
    
    /**
     * Generator for valid status filter values
     */
    const validStatusFilter = fc.constantFrom('all', 'pending', 'partial', 'paid');
    
    /**
     * Test: All filtered results have matching status when filtering by specific status
     */
    test('all filtered results have matching status when filtering by specific status', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                fc.constantFrom('pending', 'partial', 'paid'), // Specific status filters (not 'all')
                (debtors, statusFilter) => {
                    const filtered = filterByStatus(debtors, statusFilter);
                    
                    // Property: Every result should have the matching status
                    filtered.forEach(debtor => {
                        expect(debtor.status).toBe(statusFilter);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: 'all' filter returns all debtors unchanged
     */
    test('all filter returns all debtors unchanged', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const filtered = filterByStatus(debtors, 'all');
                    
                    // Property: Should return same number of debtors
                    expect(filtered.length).toBe(debtors.length);
                    
                    // Property: All original debtors should be present
                    debtors.forEach(debtor => {
                        const found = filtered.find(d => d.id === debtor.id);
                        expect(found).toBeDefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Filtering by status returns correct count
     */
    test('filtering by status returns correct count', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                validStatusFilter,
                (debtors, statusFilter) => {
                    const filtered = filterByStatus(debtors, statusFilter);
                    
                    // Manually count expected results
                    const expectedCount = statusFilter === 'all' 
                        ? debtors.length 
                        : debtors.filter(d => d.status === statusFilter).length;
                    
                    // Property: Count should match expected
                    expect(filtered.length).toBe(expectedCount);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Filtering excludes debtors with non-matching status
     */
    test('filtering excludes debtors with non-matching status', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                fc.constantFrom('pending', 'partial', 'paid'),
                (debtors, statusFilter) => {
                    const filtered = filterByStatus(debtors, statusFilter);
                    
                    // Property: No debtor with different status should be in results
                    filtered.forEach(debtor => {
                        expect(debtor.status).not.toBe(
                            statusFilter === 'pending' ? 'partial' : 
                            statusFilter === 'partial' ? 'paid' : 'pending'
                        );
                    });
                    
                    // Property: All debtors with matching status should be included
                    const matchingDebtors = debtors.filter(d => d.status === statusFilter);
                    matchingDebtors.forEach(debtor => {
                        const found = filtered.find(d => d.id === debtor.id);
                        expect(found).toBeDefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Filtering is deterministic
     */
    test('filtering is deterministic', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                validStatusFilter,
                (debtors, statusFilter) => {
                    const filtered1 = filterByStatus(debtors, statusFilter);
                    const filtered2 = filterByStatus(debtors, statusFilter);
                    
                    // Property: Same input should produce same output
                    expect(filtered1.length).toBe(filtered2.length);
                    
                    // Property: Same debtors should be in both results
                    filtered1.forEach((debtor, index) => {
                        expect(debtor.id).toBe(filtered2[index].id);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Filtering preserves debtor data integrity
     */
    test('filtering preserves debtor data integrity', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                validStatusFilter,
                (debtors, statusFilter) => {
                    const filtered = filterByStatus(debtors, statusFilter);
                    
                    // Property: Each filtered debtor should have all original fields intact
                    filtered.forEach(filteredDebtor => {
                        const original = debtors.find(d => d.id === filteredDebtor.id);
                        expect(original).toBeDefined();
                        
                        // Verify all fields are preserved
                        expect(filteredDebtor.name).toBe(original.name);
                        expect(filteredDebtor.phone).toBe(original.phone);
                        expect(filteredDebtor.amountOwed).toBe(original.amountOwed);
                        expect(filteredDebtor.amountPaid).toBe(original.amountPaid);
                        expect(filteredDebtor.currency).toBe(original.currency);
                        expect(filteredDebtor.status).toBe(original.status);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Empty array returns empty result for any filter
     */
    test('empty array returns empty result for any filter', () => {
        fc.assert(
            fc.property(
                validStatusFilter,
                (statusFilter) => {
                    const filtered = filterByStatus([], statusFilter);
                    
                    // Property: Empty input should produce empty output
                    expect(filtered).toHaveLength(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Filtering only pending debtors returns only pending
     */
    test('filtering only pending debtors returns only pending', () => {
        fc.assert(
            fc.property(
                fc.array(debtorWithStatus('pending'), { minLength: 1, maxLength: 10 }),
                (pendingDebtors) => {
                    // Filter for pending
                    const filteredPending = filterByStatus(pendingDebtors, 'pending');
                    expect(filteredPending.length).toBe(pendingDebtors.length);
                    
                    // Filter for partial should return empty
                    const filteredPartial = filterByStatus(pendingDebtors, 'partial');
                    expect(filteredPartial.length).toBe(0);
                    
                    // Filter for paid should return empty
                    const filteredPaid = filterByStatus(pendingDebtors, 'paid');
                    expect(filteredPaid.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Sum of filtered counts equals total when filtering by each status
     */
    test('sum of filtered counts equals total when filtering by each status', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const pendingCount = filterByStatus(debtors, 'pending').length;
                    const partialCount = filterByStatus(debtors, 'partial').length;
                    const paidCount = filterByStatus(debtors, 'paid').length;
                    
                    // Property: Sum of all status counts should equal total
                    expect(pendingCount + partialCount + paidCount).toBe(debtors.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Default Sorting Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to sort debtors by age (oldest first for unpaid, paid at end)
 * This mirrors the sortDebtors logic from admin.js
 * Requirements: 5.3
 * @param {Array} debtors - Array of debtor objects
 * @returns {Array} - Sorted array of debtors
 */
function sortDebtors(debtors) {
    return [...debtors].sort((a, b) => {
        // Paid debtors go to the end
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (a.status !== 'paid' && b.status === 'paid') return -1;
        
        // Sort unpaid debtors by createdAt ascending (oldest first)
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateA - dateB;
    });
}

/**
 * **Feature: debtors-management, Property 12: Default Sorting By Age**
 * **Validates: Requirements 5.3**
 * 
 * For any list of debtors displayed with default sorting, unpaid debtors should 
 * appear sorted by createdAt ascending (oldest first).
 */
describe('Property 12: Default Sorting By Age', () => {
    
    /**
     * Generator for debtor with specific status and date
     */
    const debtorWithStatusAndDate = (status) => fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.string({ maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
        amountPaid: fc.double({ min: 0, max: 50000, noNaN: true }),
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constant(status),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null }),
        paidAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null })
    }).filter(d => d.amountPaid <= d.amountOwed);
    
    /**
     * Generator for mixed status debtors array
     */
    const mixedDebtorsArray = fc.array(
        fc.oneof(
            debtorWithStatusAndDate('pending'),
            debtorWithStatusAndDate('partial'),
            debtorWithStatusAndDate('paid')
        ),
        { minLength: 0, maxLength: 20 }
    );
    
    /**
     * Test: Unpaid debtors are sorted by createdAt ascending (oldest first)
     */
    test('unpaid debtors are sorted by createdAt ascending (oldest first)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.oneof(
                        debtorWithStatusAndDate('pending'),
                        debtorWithStatusAndDate('partial')
                    ),
                    { minLength: 2, maxLength: 15 }
                ),
                (unpaidDebtors) => {
                    const sorted = sortDebtors(unpaidDebtors);
                    
                    // Property: Each subsequent debtor should have createdAt >= previous
                    for (let i = 1; i < sorted.length; i++) {
                        const prevDate = sorted[i-1].createdAt instanceof Date 
                            ? sorted[i-1].createdAt 
                            : new Date(sorted[i-1].createdAt || 0);
                        const currDate = sorted[i].createdAt instanceof Date 
                            ? sorted[i].createdAt 
                            : new Date(sorted[i].createdAt || 0);
                        
                        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Paid debtors appear after unpaid debtors
     */
    test('paid debtors appear after unpaid debtors', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const sorted = sortDebtors(debtors);
                    
                    // Find the index of the first paid debtor
                    const firstPaidIndex = sorted.findIndex(d => d.status === 'paid');
                    
                    if (firstPaidIndex === -1) {
                        // No paid debtors, nothing to check
                        return;
                    }
                    
                    // Property: All debtors before firstPaidIndex should be unpaid
                    for (let i = 0; i < firstPaidIndex; i++) {
                        expect(sorted[i].status).not.toBe('paid');
                    }
                    
                    // Property: All debtors from firstPaidIndex onwards should be paid
                    for (let i = firstPaidIndex; i < sorted.length; i++) {
                        expect(sorted[i].status).toBe('paid');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Sorting preserves all debtors (no data loss)
     */
    test('sorting preserves all debtors (no data loss)', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const sorted = sortDebtors(debtors);
                    
                    // Property: Same number of debtors
                    expect(sorted.length).toBe(debtors.length);
                    
                    // Property: All original debtors should be present
                    debtors.forEach(debtor => {
                        const found = sorted.find(d => d.id === debtor.id);
                        expect(found).toBeDefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Sorting is deterministic
     */
    test('sorting is deterministic', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    const sorted1 = sortDebtors(debtors);
                    const sorted2 = sortDebtors(debtors);
                    
                    // Property: Same input should produce same output
                    expect(sorted1.length).toBe(sorted2.length);
                    
                    for (let i = 0; i < sorted1.length; i++) {
                        expect(sorted1[i].id).toBe(sorted2[i].id);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Sorting does not mutate original array
     */
    test('sorting does not mutate original array', () => {
        fc.assert(
            fc.property(
                mixedDebtorsArray,
                (debtors) => {
                    // Store original order
                    const originalIds = debtors.map(d => d.id);
                    
                    // Sort
                    sortDebtors(debtors);
                    
                    // Property: Original array should be unchanged
                    const afterIds = debtors.map(d => d.id);
                    expect(afterIds).toEqual(originalIds);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Empty array returns empty array
     */
    test('empty array returns empty array', () => {
        fc.assert(
            fc.property(
                fc.constant([]),
                (emptyArray) => {
                    const sorted = sortDebtors(emptyArray);
                    
                    // Property: Should return empty array
                    expect(sorted).toEqual([]);
                    expect(sorted.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Single debtor array returns same debtor
     */
    test('single debtor array returns same debtor', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    debtorWithStatusAndDate('pending'),
                    debtorWithStatusAndDate('partial'),
                    debtorWithStatusAndDate('paid')
                ),
                (debtor) => {
                    const sorted = sortDebtors([debtor]);
                    
                    // Property: Should return array with same debtor
                    expect(sorted.length).toBe(1);
                    expect(sorted[0].id).toBe(debtor.id);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Oldest unpaid debtor appears first
     */
    test('oldest unpaid debtor appears first', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.oneof(
                        debtorWithStatusAndDate('pending'),
                        debtorWithStatusAndDate('partial')
                    ),
                    { minLength: 2, maxLength: 10 }
                ),
                (unpaidDebtors) => {
                    const sorted = sortDebtors(unpaidDebtors);
                    
                    // Find the oldest debtor manually
                    const oldestDebtor = unpaidDebtors.reduce((oldest, current) => {
                        const oldestDate = oldest.createdAt instanceof Date 
                            ? oldest.createdAt 
                            : new Date(oldest.createdAt || 0);
                        const currentDate = current.createdAt instanceof Date 
                            ? current.createdAt 
                            : new Date(current.createdAt || 0);
                        return currentDate < oldestDate ? current : oldest;
                    });
                    
                    // Property: First sorted debtor should be the oldest
                    const firstSortedDate = sorted[0].createdAt instanceof Date 
                        ? sorted[0].createdAt 
                        : new Date(sorted[0].createdAt || 0);
                    const oldestDate = oldestDebtor.createdAt instanceof Date 
                        ? oldestDebtor.createdAt 
                        : new Date(oldestDebtor.createdAt || 0);
                    
                    expect(firstSortedDate.getTime()).toBe(oldestDate.getTime());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Paid debtors among themselves are also sorted by createdAt
     */
    test('paid debtors among themselves are sorted by createdAt ascending', () => {
        fc.assert(
            fc.property(
                fc.array(debtorWithStatusAndDate('paid'), { minLength: 2, maxLength: 10 }),
                (paidDebtors) => {
                    const sorted = sortDebtors(paidDebtors);
                    
                    // Property: Paid debtors should also be sorted by createdAt ascending
                    for (let i = 1; i < sorted.length; i++) {
                        const prevDate = sorted[i-1].createdAt instanceof Date 
                            ? sorted[i-1].createdAt 
                            : new Date(sorted[i-1].createdAt || 0);
                        const currDate = sorted[i].createdAt instanceof Date 
                            ? sorted[i].createdAt 
                            : new Date(sorted[i].createdAt || 0);
                        
                        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Mixed pending and partial debtors are sorted together by date
     */
    test('mixed pending and partial debtors are sorted together by date', () => {
        fc.assert(
            fc.property(
                fc.array(debtorWithStatusAndDate('pending'), { minLength: 1, maxLength: 5 }),
                fc.array(debtorWithStatusAndDate('partial'), { minLength: 1, maxLength: 5 }),
                (pendingDebtors, partialDebtors) => {
                    const allUnpaid = [...pendingDebtors, ...partialDebtors];
                    const sorted = sortDebtors(allUnpaid);
                    
                    // Property: All debtors should be sorted by createdAt regardless of pending/partial status
                    for (let i = 1; i < sorted.length; i++) {
                        const prevDate = sorted[i-1].createdAt instanceof Date 
                            ? sorted[i-1].createdAt 
                            : new Date(sorted[i-1].createdAt || 0);
                        const currDate = sorted[i].createdAt instanceof Date 
                            ? sorted[i].createdAt 
                            : new Date(sorted[i].createdAt || 0);
                        
                        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Property 11: Age Indicator Calculation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * **Feature: debtors-management, Property 11: Age Indicator Calculation**
 * **Validates: Requirements 5.1, 5.2**
 * 
 * For any unpaid debtor, the age indicator function should return:
 * - 'critical' if age > 30 days
 * - 'warning' if age > 7 days
 * - 'normal' otherwise
 */
describe('Property 11: Age Indicator Calculation', () => {
    
    /**
     * Generator for dates that are more than 30 days ago (critical)
     */
    const criticalDate = fc.integer({ min: 31, max: 365 }).map(daysAgo => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    });
    
    /**
     * Generator for dates that are between 8 and 30 days ago (warning)
     */
    const warningDate = fc.integer({ min: 8, max: 30 }).map(daysAgo => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    });
    
    /**
     * Generator for dates that are 7 days or less ago (normal)
     */
    const normalDate = fc.integer({ min: 0, max: 7 }).map(daysAgo => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    });
    
    /**
     * Generator for unpaid status values
     */
    const unpaidStatus = fc.constantFrom('pending', 'partial');
    
    /**
     * Test: Debts older than 30 days return 'critical' indicator
     */
    test('debts older than 30 days return critical indicator', () => {
        fc.assert(
            fc.property(
                criticalDate,
                unpaidStatus,
                (createdAt, status) => {
                    const indicator = calculateAgeIndicator(createdAt, status);
                    
                    // Property: Should return 'critical' for > 30 days
                    expect(indicator).toBe('critical');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Debts between 8 and 30 days return 'warning' indicator
     */
    test('debts between 8 and 30 days return warning indicator', () => {
        fc.assert(
            fc.property(
                warningDate,
                unpaidStatus,
                (createdAt, status) => {
                    const indicator = calculateAgeIndicator(createdAt, status);
                    
                    // Property: Should return 'warning' for 8-30 days
                    expect(indicator).toBe('warning');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Debts 7 days or less return 'normal' indicator
     */
    test('debts 7 days or less return normal indicator', () => {
        fc.assert(
            fc.property(
                normalDate,
                unpaidStatus,
                (createdAt, status) => {
                    const indicator = calculateAgeIndicator(createdAt, status);
                    
                    // Property: Should return 'normal' for <= 7 days
                    expect(indicator).toBe('normal');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Paid debts always return 'normal' regardless of age
     */
    test('paid debts always return normal regardless of age', () => {
        fc.assert(
            fc.property(
                fc.oneof(criticalDate, warningDate, normalDate),
                (createdAt) => {
                    const indicator = calculateAgeIndicator(createdAt, 'paid');
                    
                    // Property: Paid debts should always return 'normal'
                    expect(indicator).toBe('normal');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Null or undefined createdAt returns 'normal'
     */
    test('null or undefined createdAt returns normal', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(null, undefined),
                unpaidStatus,
                (createdAt, status) => {
                    const indicator = calculateAgeIndicator(createdAt, status);
                    
                    // Property: Missing date should return 'normal'
                    expect(indicator).toBe('normal');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Age indicator is deterministic - same input always produces same output
     */
    test('age indicator is deterministic', () => {
        fc.assert(
            fc.property(
                fc.oneof(criticalDate, warningDate, normalDate),
                fc.constantFrom('pending', 'partial', 'paid'),
                (createdAt, status) => {
                    const indicator1 = calculateAgeIndicator(createdAt, status);
                    const indicator2 = calculateAgeIndicator(createdAt, status);
                    
                    // Property: Same input should always produce same output
                    expect(indicator1).toBe(indicator2);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Age indicator handles ISO string dates correctly
     */
    test('handles ISO string dates correctly', () => {
        fc.assert(
            fc.property(
                fc.oneof(criticalDate, warningDate, normalDate),
                unpaidStatus,
                (createdAt, status) => {
                    // Convert to ISO string
                    const isoString = createdAt.toISOString();
                    
                    const indicatorFromDate = calculateAgeIndicator(createdAt, status);
                    const indicatorFromString = calculateAgeIndicator(isoString, status);
                    
                    // Property: ISO string should produce same result as Date object
                    expect(indicatorFromString).toBe(indicatorFromDate);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Age indicator returns only valid values
     */
    test('age indicator returns only valid values', () => {
        fc.assert(
            fc.property(
                fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                fc.constantFrom('pending', 'partial', 'paid'),
                (createdAt, status) => {
                    const indicator = calculateAgeIndicator(createdAt, status);
                    
                    // Property: Result should be one of the valid values
                    expect(['critical', 'warning', 'normal']).toContain(indicator);
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Search Filtering Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to filter debtors by search term
 * This mirrors the search filtering logic from admin.js displayDebtorsTable
 * Filters by name or phone (case-insensitive)
 * @param {Array} debtors - Array of debtor objects
 * @param {string} searchTerm - Search term to filter by
 * @returns {Array} - Filtered array of debtors
 */
function filterBySearch(debtors, searchTerm) {
    // Empty or whitespace-only search term returns all debtors
    const normalizedTerm = (searchTerm || '').toLowerCase().trim();
    if (!normalizedTerm) {
        return [...debtors];
    }
    
    return debtors.filter(debtor => {
        const nameMatch = (debtor.name || '').toLowerCase().includes(normalizedTerm);
        const phoneMatch = (debtor.phone || '').toLowerCase().includes(normalizedTerm);
        return nameMatch || phoneMatch;
    });
}

/**
 * **Feature: debtors-management, Property 6: Search Filtering Correctness**
 * **Validates: Requirements 2.3**
 * 
 * For any search term and set of debtors, all displayed results should contain 
 * the search term in either the name or phone field (case-insensitive).
 */
describe('Property 6: Search Filtering Correctness', () => {
    
    /**
     * Generator for debtor with searchable fields
     */
    const searchableDebtor = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.string({ maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ maxLength: 100 }),
        amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
        amountPaid: fc.double({ min: 0, max: 50000, noNaN: true }),
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constantFrom('pending', 'partial', 'paid'),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null }),
        paidAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null })
    }).filter(d => d.amountPaid <= d.amountOwed);
    
    /**
     * Generator for array of debtors
     */
    const debtorsArray = fc.array(searchableDebtor, { minLength: 0, maxLength: 20 });
    
    /**
     * Generator for non-empty search terms
     */
    const nonEmptySearchTerm = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    
    /**
     * Test: All filtered results contain the search term in name or phone (case-insensitive)
     */
    test('all filtered results contain search term in name or phone (case-insensitive)', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                nonEmptySearchTerm,
                (debtors, searchTerm) => {
                    const filtered = filterBySearch(debtors, searchTerm);
                    const normalizedTerm = searchTerm.toLowerCase().trim();
                    
                    // Property: Every result should contain the search term in name or phone
                    filtered.forEach(debtor => {
                        const nameContains = (debtor.name || '').toLowerCase().includes(normalizedTerm);
                        const phoneContains = (debtor.phone || '').toLowerCase().includes(normalizedTerm);
                        expect(nameContains || phoneContains).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Empty search term returns all debtors
     */
    test('empty search term returns all debtors', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '),
                (debtors, emptyTerm) => {
                    const filtered = filterBySearch(debtors, emptyTerm);
                    
                    // Property: Should return same number of debtors
                    expect(filtered.length).toBe(debtors.length);
                    
                    // Property: All original debtors should be present
                    debtors.forEach(debtor => {
                        const found = filtered.find(d => d.id === debtor.id);
                        expect(found).toBeDefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search is case-insensitive
     */
    test('search is case-insensitive', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                nonEmptySearchTerm,
                (debtors, searchTerm) => {
                    const lowerCaseResults = filterBySearch(debtors, searchTerm.toLowerCase());
                    const upperCaseResults = filterBySearch(debtors, searchTerm.toUpperCase());
                    const mixedCaseResults = filterBySearch(debtors, searchTerm);
                    
                    // Property: All case variations should return same number of results
                    expect(lowerCaseResults.length).toBe(upperCaseResults.length);
                    expect(lowerCaseResults.length).toBe(mixedCaseResults.length);
                    
                    // Property: Same debtors should be in all results
                    lowerCaseResults.forEach(debtor => {
                        expect(upperCaseResults.find(d => d.id === debtor.id)).toBeDefined();
                        expect(mixedCaseResults.find(d => d.id === debtor.id)).toBeDefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search by name finds matching debtors
     */
    test('search by name finds matching debtors', () => {
        fc.assert(
            fc.property(
                debtorsArray.filter(arr => arr.length > 0),
                (debtors) => {
                    // Pick a random debtor and use part of their name as search term
                    const targetDebtor = debtors[0];
                    const nameSubstring = targetDebtor.name.substring(0, Math.max(1, Math.floor(targetDebtor.name.length / 2)));
                    
                    const filtered = filterBySearch(debtors, nameSubstring);
                    
                    // Property: The target debtor should be in the results
                    const found = filtered.find(d => d.id === targetDebtor.id);
                    expect(found).toBeDefined();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search by phone finds matching debtors
     */
    test('search by phone finds matching debtors', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                        phone: fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 5, maxLength: 15 }),
                        productId: fc.string({ maxLength: 50 }),
                        productName: fc.string({ maxLength: 100 }),
                        amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
                        amountPaid: fc.constant(0),
                        currency: fc.constantFrom('DZD', 'USD'),
                        status: fc.constantFrom('pending', 'partial', 'paid'),
                        notes: fc.string({ maxLength: 500 }),
                        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                        updatedAt: fc.constant(null),
                        paidAt: fc.constant(null)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (debtors) => {
                    // Pick a random debtor and use part of their phone as search term
                    const targetDebtor = debtors[0];
                    const phoneSubstring = targetDebtor.phone.substring(0, Math.max(1, Math.floor(targetDebtor.phone.length / 2)));
                    
                    const filtered = filterBySearch(debtors, phoneSubstring);
                    
                    // Property: The target debtor should be in the results
                    const found = filtered.find(d => d.id === targetDebtor.id);
                    expect(found).toBeDefined();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search excludes debtors without matching name or phone
     */
    test('search excludes debtors without matching name or phone', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                nonEmptySearchTerm,
                (debtors, searchTerm) => {
                    const filtered = filterBySearch(debtors, searchTerm);
                    const normalizedTerm = searchTerm.toLowerCase().trim();
                    
                    // Get debtors that should NOT be in results
                    const excludedDebtors = debtors.filter(debtor => {
                        const nameContains = (debtor.name || '').toLowerCase().includes(normalizedTerm);
                        const phoneContains = (debtor.phone || '').toLowerCase().includes(normalizedTerm);
                        return !nameContains && !phoneContains;
                    });
                    
                    // Property: Excluded debtors should not be in filtered results
                    excludedDebtors.forEach(debtor => {
                        const found = filtered.find(d => d.id === debtor.id);
                        expect(found).toBeUndefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search returns correct count
     */
    test('search returns correct count', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                fc.oneof(nonEmptySearchTerm, fc.constant('')),
                (debtors, searchTerm) => {
                    const filtered = filterBySearch(debtors, searchTerm);
                    const normalizedTerm = (searchTerm || '').toLowerCase().trim();
                    
                    // Manually count expected results
                    const expectedCount = !normalizedTerm 
                        ? debtors.length 
                        : debtors.filter(d => 
                            (d.name || '').toLowerCase().includes(normalizedTerm) ||
                            (d.phone || '').toLowerCase().includes(normalizedTerm)
                        ).length;
                    
                    // Property: Count should match expected
                    expect(filtered.length).toBe(expectedCount);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search is deterministic
     */
    test('search is deterministic', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                fc.oneof(nonEmptySearchTerm, fc.constant('')),
                (debtors, searchTerm) => {
                    const filtered1 = filterBySearch(debtors, searchTerm);
                    const filtered2 = filterBySearch(debtors, searchTerm);
                    
                    // Property: Same input should produce same output
                    expect(filtered1.length).toBe(filtered2.length);
                    
                    // Property: Same debtors should be in both results
                    filtered1.forEach((debtor, index) => {
                        expect(debtor.id).toBe(filtered2[index].id);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Search preserves debtor data integrity
     */
    test('search preserves debtor data integrity', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                fc.oneof(nonEmptySearchTerm, fc.constant('')),
                (debtors, searchTerm) => {
                    const filtered = filterBySearch(debtors, searchTerm);
                    
                    // Property: Each filtered debtor should have all original fields intact
                    filtered.forEach(filteredDebtor => {
                        const original = debtors.find(d => d.id === filteredDebtor.id);
                        expect(original).toBeDefined();
                        
                        // Check all fields are preserved
                        expect(filteredDebtor.name).toBe(original.name);
                        expect(filteredDebtor.phone).toBe(original.phone);
                        expect(filteredDebtor.amountOwed).toBe(original.amountOwed);
                        expect(filteredDebtor.amountPaid).toBe(original.amountPaid);
                        expect(filteredDebtor.status).toBe(original.status);
                        expect(filteredDebtor.currency).toBe(original.currency);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Null/undefined search term returns all debtors
     */
    test('null or undefined search term returns all debtors', () => {
        fc.assert(
            fc.property(
                debtorsArray,
                fc.constantFrom(null, undefined),
                (debtors, nullishTerm) => {
                    const filtered = filterBySearch(debtors, nullishTerm);
                    
                    // Property: Should return same number of debtors
                    expect(filtered.length).toBe(debtors.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// Table Rendering Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pure function to render a debtor table row as HTML string
 * This mirrors the rendering logic from displayDebtorsTable in admin.js
 * @param {Object} debtor - Debtor object to render
 * @returns {string} - HTML string for the table row
 */
function renderDebtorRow(debtor) {
    const remainingAmount = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);
    const currencySymbol = debtor.currency === 'USD' ? '$' : 'د.ج';
    
    // Format date
    let dateStr = '-';
    if (debtor.createdAt) {
        const date = debtor.createdAt instanceof Date ? debtor.createdAt : new Date(debtor.createdAt);
        dateStr = date.toLocaleDateString('ar-DZ');
    }
    
    // Status badge
    let statusBadge = '';
    switch (debtor.status) {
        case 'pending':
            statusBadge = '<span class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">مستحق</span>';
            break;
        case 'partial':
            statusBadge = '<span class="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">جزئي</span>';
            break;
        case 'paid':
            statusBadge = '<span class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">مدفوع</span>';
            break;
        default:
            statusBadge = '<span class="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">غير محدد</span>';
    }
    
    // Amount display
    const amountDisplay = debtor.status === 'paid' 
        ? `<span class="text-green-400">${debtor.amountOwed?.toLocaleString()} ${currencySymbol}</span>`
        : `<span class="text-red-400">${remainingAmount.toLocaleString()} ${currencySymbol}</span>`;
    
    return `
        <tr class="hover:bg-white/5 transition-colors">
            <td class="px-4 py-3">
                <span class="font-medium text-white">${debtor.name || '-'}</span>
            </td>
            <td class="px-4 py-3 text-gray-300">${debtor.phone || '-'}</td>
            <td class="px-4 py-3 text-gray-300">${debtor.productName || '-'}</td>
            <td class="px-4 py-3">${amountDisplay}</td>
            <td class="px-4 py-3">${statusBadge}</td>
            <td class="px-4 py-3 text-gray-400 text-sm">${dateStr}</td>
            <td class="px-4 py-3">
                <div class="flex gap-2">
                    <button onclick="openDebtorModal('${debtor.id}')" 
                        class="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="تعديل">
                        ✏️
                    </button>
                    <button onclick="deleteDebtor('${debtor.id}')" 
                        class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * **Feature: debtors-management, Property 4: Table Rendering Contains Required Info**
 * **Validates: Requirements 2.1**
 * 
 * For any debtor record, the rendered table row should contain the debtor's name, 
 * phone, product name, amount owed, status, and creation date.
 */
describe('Property 4: Table Rendering Contains Required Info', () => {
    
    /**
     * Generator for complete debtor objects with all required fields
     */
    const completeDebtorArbitrary = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        phone: fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-', '+'), { minLength: 5, maxLength: 20 }),
        productId: fc.string({ maxLength: 50 }),
        productName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
        amountPaid: fc.double({ min: 0, max: 50000, noNaN: true }),
        currency: fc.constantFrom('DZD', 'USD'),
        status: fc.constantFrom('pending', 'partial', 'paid'),
        notes: fc.string({ maxLength: 500 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        updatedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null }),
        paidAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null })
    }).filter(d => d.amountPaid <= d.amountOwed);
    
    /**
     * Test: Rendered row contains debtor name
     */
    test('rendered row contains debtor name', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain the debtor's name
                    expect(renderedRow).toContain(debtor.name);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains debtor phone
     */
    test('rendered row contains debtor phone', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain the debtor's phone
                    expect(renderedRow).toContain(debtor.phone);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains product name
     */
    test('rendered row contains product name', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain the product name
                    expect(renderedRow).toContain(debtor.productName);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains amount information
     */
    test('rendered row contains amount information', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    const remainingAmount = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);
                    
                    // Property: The rendered HTML should contain the amount
                    // For paid status, it shows amountOwed; otherwise, it shows remaining amount
                    if (debtor.status === 'paid') {
                        expect(renderedRow).toContain(debtor.amountOwed.toLocaleString());
                    } else {
                        expect(renderedRow).toContain(remainingAmount.toLocaleString());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains status indicator
     */
    test('rendered row contains status indicator', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain a status badge
                    // Each status has a specific Arabic label
                    const statusLabels = {
                        'pending': 'مستحق',
                        'partial': 'جزئي',
                        'paid': 'مدفوع'
                    };
                    
                    const expectedLabel = statusLabels[debtor.status] || 'غير محدد';
                    expect(renderedRow).toContain(expectedLabel);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains creation date
     */
    test('rendered row contains creation date', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain the formatted date
                    const date = debtor.createdAt instanceof Date ? debtor.createdAt : new Date(debtor.createdAt);
                    const formattedDate = date.toLocaleDateString('ar-DZ');
                    
                    expect(renderedRow).toContain(formattedDate);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains currency symbol
     */
    test('rendered row contains currency symbol', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain the appropriate currency symbol
                    const currencySymbol = debtor.currency === 'USD' ? '$' : 'د.ج';
                    expect(renderedRow).toContain(currencySymbol);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row contains action buttons
     */
    test('rendered row contains action buttons', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: The rendered HTML should contain edit and delete buttons
                    expect(renderedRow).toContain('openDebtorModal');
                    expect(renderedRow).toContain('deleteDebtor');
                    expect(renderedRow).toContain(debtor.id);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendering is deterministic
     */
    test('rendering is deterministic', () => {
        fc.assert(
            fc.property(
                completeDebtorArbitrary,
                (debtor) => {
                    const rendered1 = renderDebtorRow(debtor);
                    const rendered2 = renderDebtorRow(debtor);
                    
                    // Property: Same input should produce same output
                    expect(rendered1).toBe(rendered2);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Test: Rendered row handles missing optional fields gracefully
     */
    test('rendered row handles missing optional fields gracefully', () => {
        const minimalDebtorArbitrary = fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            phone: fc.constant(''),
            productId: fc.constant(''),
            productName: fc.constant(''),
            amountOwed: fc.double({ min: 100, max: 100000, noNaN: true }),
            amountPaid: fc.constant(0),
            currency: fc.constantFrom('DZD', 'USD'),
            status: fc.constantFrom('pending', 'partial', 'paid'),
            notes: fc.constant(''),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            updatedAt: fc.constant(null),
            paidAt: fc.constant(null)
        });
        
        fc.assert(
            fc.property(
                minimalDebtorArbitrary,
                (debtor) => {
                    // Property: Rendering should not throw for minimal data
                    expect(() => renderDebtorRow(debtor)).not.toThrow();
                    
                    const renderedRow = renderDebtorRow(debtor);
                    
                    // Property: Should still contain the name
                    expect(renderedRow).toContain(debtor.name);
                    
                    // Property: Should use '-' placeholder for empty fields
                    expect(renderedRow).toContain('-');
                }
            ),
            { numRuns: 100 }
        );
    });
});
