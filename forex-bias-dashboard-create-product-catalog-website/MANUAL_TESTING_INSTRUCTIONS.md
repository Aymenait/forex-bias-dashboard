# Manual Testing Instructions
## International Expansion Feature - Tasks 10.1 & 10.2

This document provides step-by-step instructions for completing the manual testing tasks that require human interaction and cannot be automated.

---

## 📋 Overview

**Tasks Requiring Manual Testing:**
- **Task 10.1**: Geographic Location Testing (VPN required)
- **Task 10.2**: Browser and Device Testing (Multiple browsers/devices required)

**Estimated Time**: 2-3 hours for complete testing

---

## 🌍 Task 10.1: Geographic Location Testing

### Requirements
This task validates Requirements 1.1, 1.2, and 1.3:
- System detects user location via IP geolocation
- Users from Algeria see DZD currency
- Users from other countries see USD currency

### Prerequisites
- VPN service (e.g., NordVPN, ExpressVPN, ProtonVPN, or free alternatives)
- Access to Algeria VPN server
- Access to at least one other country's VPN server (USA, France, UK, etc.)

### Test Procedure

#### Test 1: Algeria Location (DZD Currency)

**Steps:**
1. Connect VPN to Algeria server
2. Open browser DevTools (F12)
3. Go to Application tab → Storage → Clear all site data
4. Navigate to your website
5. Wait for page to load completely

**Expected Results:**
- [ ] Currency selector shows "🇩🇿 DZD" as active
- [ ] All prices display in Algerian Dinar (د.ج)
- [ ] Payment methods show:
  - ✅ BaridiMob (prominent)
  - ✅ CCP (prominent)
  - ✅ Crypto (secondary/additional)
- [ ] Console shows: "Location detected: DZ"
- [ ] localStorage contains: `marketalgeriaa_currency: "DZD"`

**How to Verify:**
```javascript
// Open browser console and run:
console.log('Current Currency:', localStorage.getItem('marketalgeriaa_currency'));
console.log('Cached Location:', JSON.parse(localStorage.getItem('marketalgeriaa_location')));
```

#### Test 2: International Location (USD Currency)

**Steps:**
1. Disconnect from Algeria VPN
2. Connect VPN to USA/France/UK server
3. Open browser DevTools (F12)
4. Go to Application tab → Storage → Clear all site data
5. Navigate to your website
6. Wait for page to load completely

**Expected Results:**
- [ ] Currency selector shows "🇺🇸 USD" as active
- [ ] All prices display in US Dollars ($)
- [ ] Payment methods show:
  - ✅ Binance (prominent)
  - ✅ Crypto (prominent)
  - ⚠️ Local methods (CCP, BaridiMob) hidden or de-emphasized
- [ ] Console shows: "Location detected: [Country Code]"
- [ ] localStorage contains: `marketalgeriaa_currency: "USD"`

#### Test 3: Manual Currency Toggle

**Steps:**
1. With VPN still connected (any location)
2. Click the currency selector in the navigation bar
3. Observe the changes

**Expected Results:**
- [ ] Currency switches immediately (DZD ↔ USD)
- [ ] All prices update without page reload
- [ ] Payment methods update to match currency
- [ ] Smooth CSS transition (no flickering)
- [ ] Page scroll position preserved
- [ ] New selection saved to localStorage

**Verify Persistence:**
1. Refresh the page (F5)
2. **Expected**: Previously selected currency is restored

#### Test 4: Geolocation Failure Handling

**Steps:**
1. Disconnect VPN
2. Open browser DevTools → Network tab
3. Block requests to `ipapi.co` (right-click → Block request domain)
4. Clear site data
5. Reload page

**Expected Results:**
- [ ] System defaults to USD currency
- [ ] No JavaScript errors in console
- [ ] Page loads normally
- [ ] Console shows: "Geolocation failed, using default USD"

---

## 🖥️ Task 10.2: Browser and Device Testing

### Requirements
This task validates cross-browser compatibility and responsive design.

### Test Matrix

| Browser | Desktop | Mobile | Tablet | Private Mode |
|---------|---------|--------|--------|--------------|
| Chrome  | ⬜      | ⬜     | ⬜     | ⬜           |
| Firefox | ⬜      | ⬜     | ⬜     | ⬜           |
| Safari  | ⬜      | ⬜     | ⬜     | ⬜           |
| Edge    | ⬜      | N/A    | N/A    | ⬜           |

### Desktop Browser Testing

#### Chrome (Windows/Mac/Linux)

**Steps:**
1. Open website in Chrome
2. Test all functionality

**Checklist:**
- [ ] Currency selector visible and clickable
- [ ] Currency toggle works smoothly
- [ ] All prices update correctly
- [ ] Payment buttons display correctly
- [ ] Payment modals open and show correct info
- [ ] No console errors
- [ ] localStorage works
- [ ] Geolocation API works

**Performance Check:**
1. Open DevTools → Performance tab
2. Start recording
3. Click currency selector
4. Stop recording
5. **Expected**: Update completes in < 200ms

#### Firefox (Windows/Mac/Linux)

**Repeat same checklist as Chrome**

**Additional Firefox-Specific Checks:**
- [ ] CSS Grid layout works correctly
- [ ] Flexbox layout works correctly
- [ ] Font rendering is acceptable

#### Safari (Mac/iOS)

**Repeat same checklist as Chrome**

**Additional Safari-Specific Checks:**
- [ ] Backdrop-filter effects work (or graceful fallback)
- [ ] Touch events work on iOS
- [ ] localStorage works in private mode (limited)

#### Edge (Windows)

**Repeat same checklist as Chrome**

**Additional Edge-Specific Checks:**
- [ ] All modern CSS features work
- [ ] No compatibility warnings

### Mobile Device Testing

#### iPhone (Safari)

**Steps:**
1. Open website on iPhone
2. Test in portrait orientation
3. Test in landscape orientation

**Checklist:**
- [ ] Responsive design adapts correctly
- [ ] Currency selector is easily tappable (min 44x44px)
- [ ] Text is readable without zooming
- [ ] Prices update smoothly
- [ ] Payment modals are mobile-friendly
- [ ] No horizontal scrolling
- [ ] Touch interactions work smoothly
- [ ] Page loads within 5 seconds

**Specific Tests:**
- [ ] Tap currency selector → switches currency
- [ ] Tap payment button → modal opens
- [ ] Scroll page → scroll position smooth
- [ ] Rotate device → layout adapts

#### Android Phone (Chrome)

**Repeat same checklist as iPhone**

**Additional Android-Specific Checks:**
- [ ] Back button works correctly
- [ ] Chrome autofill doesn't interfere
- [ ] Performance is acceptable

### Tablet Testing

#### iPad

**Steps:**
1. Open website on iPad
2. Test in portrait and landscape

**Checklist:**
- [ ] Layout uses available space well
- [ ] Currency selector accessible
- [ ] Product grid displays correctly
- [ ] Touch targets are appropriate size
- [ ] No layout breaking

#### Android Tablet

**Repeat same checklist as iPad**

### Private Browsing Mode Testing

This tests the system when localStorage is disabled or restricted.

#### Chrome Incognito

**Steps:**
1. Open Chrome Incognito window (Ctrl+Shift+N)
2. Navigate to website
3. Test functionality

**Expected Behavior:**
- [ ] Page loads without errors
- [ ] Geolocation still works
- [ ] Currency selector works
- [ ] Prices update correctly
- [ ] ⚠️ Currency preference NOT saved between sessions
- [ ] No JavaScript errors related to localStorage

**Verify:**
```javascript
// In console:
try {
  localStorage.setItem('test', 'test');
  console.log('localStorage available');
} catch (e) {
  console.log('localStorage blocked:', e.message);
}
```

#### Firefox Private Window

**Repeat same tests as Chrome Incognito**

#### Safari Private Browsing

**Repeat same tests as Chrome Incognito**

**Note**: Safari private mode has stricter localStorage restrictions.

---

## 🐛 Common Issues and Solutions

### Issue: Currency Not Detected Correctly

**Symptoms:**
- Wrong currency shown for location
- Currency always defaults to USD

**Troubleshooting:**
1. Check console for geolocation errors
2. Verify VPN is actually connected
3. Check Network tab for ipapi.co request
4. Verify response contains correct country code

**Solution:**
- Clear localStorage and try again
- Try different VPN server
- Check if ipapi.co is blocked by firewall

### Issue: Prices Not Updating

**Symptoms:**
- Clicking currency selector does nothing
- Prices don't change

**Troubleshooting:**
1. Check console for JavaScript errors
2. Verify price elements have data-price-dzd and data-price-usd attributes
3. Check if currency-manager.js is loaded

**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Clear cache and reload
- Check browser console for specific errors

### Issue: Payment Methods Not Changing

**Symptoms:**
- Same payment methods shown for both currencies
- Payment buttons missing

**Troubleshooting:**
1. Check console for errors
2. Verify payment-manager.js is loaded
3. Check PAYMENT_METHODS configuration

**Solution:**
- Verify currency-config.js is loaded correctly
- Check payment method configuration
- Ensure payment buttons have correct data attributes

### Issue: localStorage Not Working

**Symptoms:**
- Currency preference not saved
- Errors in console about localStorage

**Troubleshooting:**
1. Check if in private browsing mode
2. Check browser localStorage quota
3. Check for localStorage errors in console

**Solution:**
- Exit private browsing mode
- Clear some localStorage data
- System should work without localStorage (just no persistence)

---

## 📊 Test Report Template

After completing all tests, fill out this report:

```markdown
# Manual Testing Report
## International Expansion Feature

**Date**: [Date]
**Tester**: [Your Name]
**Duration**: [Time Spent]

### Task 10.1: Geographic Location Testing

#### Algeria Test (DZD)
- VPN Service Used: [Service Name]
- Server Location: [Algeria Server]
- Result: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### International Test (USD)
- VPN Service Used: [Service Name]
- Server Location: [Country]
- Result: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### Manual Toggle Test
- Result: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

#### Geolocation Failure Test
- Result: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Task 10.2: Browser and Device Testing

#### Desktop Browsers
- Chrome: ✅ PASS / ❌ FAIL
- Firefox: ✅ PASS / ❌ FAIL
- Safari: ✅ PASS / ❌ FAIL
- Edge: ✅ PASS / ❌ FAIL

#### Mobile Devices
- iPhone: ✅ PASS / ❌ FAIL
- Android: ✅ PASS / ❌ FAIL

#### Tablets
- iPad: ✅ PASS / ❌ FAIL
- Android Tablet: ✅ PASS / ❌ FAIL

#### Private Browsing
- Chrome Incognito: ✅ PASS / ❌ FAIL
- Firefox Private: ✅ PASS / ❌ FAIL
- Safari Private: ✅ PASS / ❌ FAIL

### Issues Found

1. **Issue**: [Description]
   - **Severity**: Critical / High / Medium / Low
   - **Browser/Device**: [Where found]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]

2. **Issue**: [Description]
   - ...

### Performance Observations

- Currency toggle speed: [Fast / Acceptable / Slow]
- Page load time: [Time in seconds]
- Mobile performance: [Smooth / Acceptable / Laggy]
- Geolocation API: [Fast / Acceptable / Slow]

### Recommendations

1. [Recommendation]
2. [Recommendation]

### Overall Assessment

- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Pass Rate: [Percentage]

**Final Status**: ✅ READY FOR PRODUCTION / ⚠️ NEEDS FIXES / ❌ NOT READY

**Tester Signature**: [Name]
**Date**: [Date]
```

---

## 🚀 Quick Start Guide

### Minimum Testing Requirements

If time is limited, perform at least these critical tests:

1. **Geographic Test** (15 minutes)
   - Test from Algeria (VPN)
   - Test from one other country (VPN)
   - Verify currency and payment methods

2. **Browser Test** (20 minutes)
   - Test on Chrome (your primary browser)
   - Test on one mobile device
   - Test in private browsing mode

3. **Functionality Test** (10 minutes)
   - Toggle currency manually
   - Verify prices update
   - Check payment methods change
   - Verify localStorage persistence

**Total Minimum Time**: ~45 minutes

### Comprehensive Testing

For thorough testing, allocate:
- Task 10.1: 45-60 minutes
- Task 10.2: 60-90 minutes
- **Total**: 2-3 hours

---

## 📞 Support

If you encounter issues during testing:

1. **Check Console**: Open browser DevTools (F12) and check Console tab for errors
2. **Check Network**: Look at Network tab for failed requests
3. **Check localStorage**: Application tab → Local Storage
4. **Document Issue**: Take screenshots and note exact steps
5. **Report**: Create detailed bug report using template above

---

## ✅ Completion Checklist

Before marking tasks as complete:

- [ ] Completed all Task 10.1 tests
- [ ] Completed all Task 10.2 tests
- [ ] Filled out test report
- [ ] Documented any issues found
- [ ] Verified all critical functionality works
- [ ] Tested on at least 2 browsers
- [ ] Tested on at least 1 mobile device
- [ ] Tested private browsing mode
- [ ] No critical bugs found (or bugs documented)

---

**Last Updated**: December 2024
**Version**: 1.0
