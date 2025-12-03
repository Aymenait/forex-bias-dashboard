/**
 * Performance Testing Utility
 * Tests and measures performance of currency switching and price updates
 * Requirements: 7.1, 7.3
 */

class PerformanceTester {
  constructor() {
    this.results = [];
  }

  /**
   * Measure time for price update operation
   * @param {Function} operation - Operation to measure
   * @returns {Promise<number>} Time in milliseconds
   */
  async measureTime(operation) {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Test currency toggle performance
   * Should complete in less than 200ms (Requirement 7.1)
   * @param {CurrencyManager} currencyManager - Currency manager instance
   * @param {PaymentManager} paymentManager - Payment manager instance
   * @returns {Promise<Object>} Test results
   */
  async testCurrencyTogglePerformance(currencyManager, paymentManager) {
    console.log('🧪 Testing currency toggle performance...');
    
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const currency = i % 2 === 0 ? 'USD' : 'DZD';
      
      const time = await this.measureTime(async () => {
        currencyManager.setCurrency(currency);
        currencyManager.updateAllPrices(currency);
        paymentManager.updateAllPaymentButtons(currency);
      });
      
      times.push(time);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    const result = {
      test: 'Currency Toggle Performance',
      iterations,
      avgTime: avgTime.toFixed(2),
      maxTime: maxTime.toFixed(2),
      minTime: minTime.toFixed(2),
      requirement: '< 200ms',
      passed: maxTime < 200
    };
    
    this.results.push(result);
    
    console.log(`✅ Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`📊 Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    console.log(`${result.passed ? '✅' : '❌'} Requirement (< 200ms): ${result.passed ? 'PASSED' : 'FAILED'}`);
    
    return result;
  }

  /**
   * Test rapid toggle handling
   * Should handle multiple rapid clicks correctly (Requirement 7.3)
   * @param {Function} handleCurrencyToggle - Currency toggle handler
   * @param {CurrencyManager} currencyManager - Currency manager instance
   * @param {PaymentManager} paymentManager - Payment manager instance
   * @returns {Promise<Object>} Test results
   */
  async testRapidToggleHandling(handleCurrencyToggle, currencyManager, paymentManager) {
    console.log('🧪 Testing rapid toggle handling...');
    
    const startCurrency = currencyManager.getCurrentCurrency();
    const rapidClicks = 10;
    
    const startTime = performance.now();
    
    // Simulate rapid clicks
    for (let i = 0; i < rapidClicks; i++) {
      const targetCurrency = i % 2 === 0 ? 'USD' : 'DZD';
      handleCurrencyToggle(targetCurrency, currencyManager, paymentManager);
    }
    
    // Wait for debounce to complete (300ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    const finalCurrency = currencyManager.getCurrentCurrency();
    const expectedCurrency = rapidClicks % 2 === 0 ? startCurrency : (startCurrency === 'DZD' ? 'USD' : 'DZD');
    
    const result = {
      test: 'Rapid Toggle Handling',
      rapidClicks,
      totalTime: totalTime.toFixed(2),
      finalCurrency,
      expectedCurrency,
      passed: finalCurrency === expectedCurrency
    };
    
    this.results.push(result);
    
    console.log(`✅ Handled ${rapidClicks} rapid clicks in ${totalTime.toFixed(2)}ms`);
    console.log(`${result.passed ? '✅' : '❌'} Final currency correct: ${result.passed ? 'PASSED' : 'FAILED'}`);
    
    return result;
  }

  /**
   * Test geolocation API response time
   * @param {CurrencyManager} currencyManager - Currency manager instance
   * @returns {Promise<Object>} Test results
   */
  async testGeolocationPerformance(currencyManager) {
    console.log('🧪 Testing geolocation API performance...');
    
    const time = await this.measureTime(async () => {
      await currencyManager.detectLocation();
    });
    
    const result = {
      test: 'Geolocation API Response',
      responseTime: time.toFixed(2),
      requirement: '< 3000ms (timeout)',
      passed: time < 3000
    };
    
    this.results.push(result);
    
    console.log(`✅ Geolocation response time: ${time.toFixed(2)}ms`);
    console.log(`${result.passed ? '✅' : '❌'} Within timeout: ${result.passed ? 'PASSED' : 'FAILED'}`);
    
    return result;
  }

  /**
   * Test cache effectiveness
   * @param {CurrencyManager} currencyManager - Currency manager instance
   * @returns {Promise<Object>} Test results
   */
  async testCacheEffectiveness(currencyManager) {
    console.log('🧪 Testing geolocation cache effectiveness...');
    
    // First call - should hit API
    const firstCallTime = await this.measureTime(async () => {
      await currencyManager.detectLocation();
    });
    
    // Second call - should use cache
    const secondCallTime = await this.measureTime(async () => {
      await currencyManager.detectLocation();
    });
    
    const speedup = ((firstCallTime - secondCallTime) / firstCallTime * 100).toFixed(1);
    
    const result = {
      test: 'Geolocation Cache Effectiveness',
      firstCall: firstCallTime.toFixed(2),
      secondCall: secondCallTime.toFixed(2),
      speedup: `${speedup}%`,
      passed: secondCallTime < firstCallTime
    };
    
    this.results.push(result);
    
    console.log(`✅ First call: ${firstCallTime.toFixed(2)}ms`);
    console.log(`✅ Cached call: ${secondCallTime.toFixed(2)}ms`);
    console.log(`📈 Speedup: ${speedup}%`);
    console.log(`${result.passed ? '✅' : '❌'} Cache working: ${result.passed ? 'PASSED' : 'FAILED'}`);
    
    return result;
  }

  /**
   * Run all performance tests
   * @param {Object} managers - Object containing currencyManager and paymentManager
   * @param {Function} handleCurrencyToggle - Currency toggle handler function
   * @returns {Promise<Array>} All test results
   */
  async runAllTests(managers, handleCurrencyToggle) {
    console.log('🚀 Starting comprehensive performance tests...\n');
    
    this.results = [];
    
    try {
      await this.testCurrencyTogglePerformance(managers.currencyManager, managers.paymentManager);
      console.log('\n');
      
      await this.testRapidToggleHandling(handleCurrencyToggle, managers.currencyManager, managers.paymentManager);
      console.log('\n');
      
      await this.testGeolocationPerformance(managers.currencyManager);
      console.log('\n');
      
      await this.testCacheEffectiveness(managers.currencyManager);
      console.log('\n');
      
    } catch (error) {
      console.error('❌ Error during performance testing:', error);
    }
    
    this.printSummary();
    
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('📊 Performance Test Summary');
    console.log('═'.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.test}`);
    });
    
    console.log('═'.repeat(60));
    console.log(`Total: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All performance tests passed!');
    } else {
      console.log('⚠️ Some performance tests failed. Review results above.');
    }
  }

  /**
   * Export results as JSON
   * @returns {string} JSON string of results
   */
  exportResults() {
    return JSON.stringify(this.results, null, 2);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceTester;
}

// ES6 export for testing
export default PerformanceTester;
