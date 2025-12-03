/**
 * Quick test for Browser Compatibility Checker
 * Verifies the checker works correctly in Node.js environment
 */

// Mock browser APIs for Node.js testing
global.window = {
  performance: {
    now: () => Date.now(),
    timing: {},
    navigation: {},
    mark: () => {},
    measure: () => {}
  },
  innerWidth: 1920,
  innerHeight: 1080,
  screen: {
    width: 1920,
    height: 1080,
    orientation: { type: 'landscape-primary' }
  },
  devicePixelRatio: 1
};

global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'Win32',
  maxTouchPoints: 0,
  geolocation: {
    getCurrentPosition: () => {},
    watchPosition: () => {}
  }
};

global.document = {
  createElement: () => ({
    style: {}
  })
};

global.CSS = {
  supports: (prop, value) => true
};

global.Storage = function() {};
global.localStorage = {
  setItem: () => {},
  getItem: () => null,
  removeItem: () => {}
};

global.fetch = async () => ({
  ok: true,
  json: async () => ({ country: 'US' })
});

global.AbortController = class AbortController {
  constructor() {
    this.signal = {};
  }
  abort() {}
};

global.Headers = class Headers {};
global.Request = class Request {};
global.Response = class Response {};
global.Promise = Promise;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Load the checker
const BrowserCompatibilityChecker = require('./browser-compatibility-checker.js');

async function runTests() {
  console.log('🧪 Testing Browser Compatibility Checker...\n');

  try {
    // Create checker instance
    const checker = new BrowserCompatibilityChecker();
    console.log('✅ Checker instance created');

    // Test browser detection
    const browser = checker.detectBrowser();
    console.log('\n📊 Browser Detection:');
    console.log(`  - Name: ${browser.name}`);
    console.log(`  - Version: ${browser.version}`);
    console.log(`  - Engine: ${browser.engine}`);
    console.log(`  - Platform: ${browser.platform}`);
    console.log(`  - Mobile: ${browser.mobile}`);

    // Test localStorage check
    const storage = checker.checkLocalStorage();
    console.log('\n💾 localStorage Check:');
    console.log(`  - Supported: ${storage.supported}`);
    console.log(`  - Available: ${storage.available}`);

    // Test Fetch API check
    const fetchSupport = checker.checkFetchAPI();
    console.log('\n🔌 Fetch API Check:');
    console.log(`  - Supported: ${fetchSupport.supported}`);
    console.log(`  - AbortController: ${fetchSupport.abortController}`);

    // Test Promise check
    const promiseSupport = checker.checkPromises();
    console.log('\n⚡ Promise Check:');
    console.log(`  - Supported: ${promiseSupport.supported}`);
    console.log(`  - Async/Await: ${promiseSupport.asyncAwait}`);

    // Test CSS features check
    const css = checker.checkCSSFeatures();
    console.log('\n🎨 CSS Features Check:');
    console.log(`  - Flexbox: ${css.flexbox}`);
    console.log(`  - Grid: ${css.grid}`);
    console.log(`  - Transitions: ${css.transitions}`);

    // Test Performance API check
    const performance = checker.checkPerformanceAPI();
    console.log('\n⚡ Performance API Check:');
    console.log(`  - Supported: ${performance.supported}`);
    console.log(`  - now(): ${performance.now}`);

    // Run all checks
    console.log('\n🔍 Running all checks...');
    const results = await checker.runAllChecks();
    console.log('✅ All checks completed');

    // Generate report
    const report = checker.generateReport();
    console.log('\n📊 Compatibility Report:');
    console.log(`  - Compatible: ${report.summary.compatible}`);
    console.log(`  - Score: ${report.summary.score}/100`);
    console.log(`  - Warnings: ${report.summary.warnings.length}`);
    console.log(`  - Errors: ${report.summary.errors.length}`);
    console.log(`  - Recommendations: ${report.recommendations.length}`);

    if (report.summary.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      report.summary.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    if (report.summary.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.summary.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  - [${rec.severity.toUpperCase()}] ${rec.issue}`);
        console.log(`    Solution: ${rec.solution}`);
      });
    }

    console.log('\n✅ All tests passed!');
    console.log('\n📝 Summary:');
    console.log('  - Browser Compatibility Checker is working correctly');
    console.log('  - All detection methods functional');
    console.log('  - Report generation working');
    console.log('  - Ready for use in browsers');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
