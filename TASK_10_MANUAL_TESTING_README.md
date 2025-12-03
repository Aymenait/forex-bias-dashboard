# Task 10: Manual Testing Guide
## Quick Start for Tasks 10.1 & 10.2

---

## 🎯 What You Need to Do

Tasks 10.1 and 10.2 require **manual testing** that cannot be automated. These tasks involve:

- **Task 10.1**: Testing from different geographic locations (requires VPN)
- **Task 10.2**: Testing on different browsers and devices (requires physical access)

**Estimated Time**: 2-3 hours

---

## 🚀 Quick Start (3 Steps)

### Step 1: Open the Interactive Checklist

Open `manual-testing-checklist.html` in your browser:

```bash
# Just double-click the file or open it in your browser
manual-testing-checklist.html
```

**Features:**
- ✅ 15 test items with clear instructions
- ✅ Auto-saves progress every 30 seconds
- ✅ Visual progress tracking
- ✅ Export markdown report when done
- ✅ Notes section for each task

### Step 2: Follow the Checklist

Work through each test item:

**Task 10.1 - Geographic Testing (4 tests):**
1. Test from Algeria using VPN → Verify DZD currency
2. Test from another country using VPN → Verify USD currency
3. Test manual currency toggle → Verify smooth switching
4. Test geolocation failure → Verify fallback to USD

**Task 10.2 - Browser/Device Testing (11 tests):**
1. Test on Chrome, Firefox, Safari, Edge
2. Test on iPhone and Android phone
3. Test on iPad and Android tablet
4. Test in private browsing mode (3 browsers)

### Step 3: Mark Tasks Complete

Once you've completed all tests:

1. Export your test report from the checklist tool
2. Open `.kiro/specs/international-expansion/tasks.md`
3. Change `[ ]` to `[x]` for tasks 10.1 and 10.2
4. Task 10 will automatically be marked complete

---

## 📚 Detailed Documentation

If you need more detailed instructions, refer to:

### `MANUAL_TESTING_INSTRUCTIONS.md`
- Step-by-step testing procedures
- Expected results for each test
- Troubleshooting common issues
- Test report template

### `PERFORMANCE_TESTING_GUIDE.md`
- Performance requirements and metrics
- Automated test instructions
- Manual testing checklists
- Browser/device testing procedures

---

## 🧪 Optional: Run Automated Performance Tests

Before manual testing, you can verify performance metrics:

```bash
# Open in browser
test-performance.html
```

Click "Run All Tests" to verify:
- Currency toggle speed (< 200ms)
- Rapid click handling
- Geolocation API response time
- Cache effectiveness

---

## ✅ What's Already Done

**Subtask 10.3** ✅ - Performance Improvements:
- Geolocation caching (24 hours)
- Debouncing for rapid clicks (300ms)
- CSS transitions optimization

**Subtask 10.4** ✅ - Performance Testing Tools:
- Performance testing utility (`performance-test.js`)
- Interactive testing dashboard (`test-performance.html`)
- Comprehensive testing guide

---

## 🔧 Prerequisites for Manual Testing

### For Task 10.1 (Geographic Testing):
- **VPN Service** (e.g., NordVPN, ExpressVPN, ProtonVPN)
- Access to Algeria VPN server
- Access to at least one other country's VPN server

### For Task 10.2 (Browser/Device Testing):
- **Desktop Browsers**: Chrome, Firefox, Safari (Mac), Edge (Windows)
- **Mobile Devices**: iPhone or Android phone
- **Tablets** (optional): iPad or Android tablet
- **Private Browsing**: Available in all modern browsers

---

## 💡 Testing Tips

1. **Use the Checklist Tool**: It auto-saves your progress
2. **Add Notes**: Document any issues you find
3. **Take Screenshots**: Helpful for bug reports
4. **Check Console**: Open DevTools (F12) to check for errors
5. **Test Thoroughly**: Don't rush - quality over speed

---

## 🐛 Common Issues

### Issue: VPN Not Working
**Solution**: Try a different VPN server or service

### Issue: Currency Not Detected
**Solution**: Clear browser cache and localStorage, then reload

### Issue: Prices Not Updating
**Solution**: Check browser console for errors, verify data attributes exist

### Issue: localStorage Not Working
**Solution**: Exit private browsing mode, or note that system should work without persistence

---

## 📊 Success Criteria

Your testing is complete when:

- [ ] All 4 tests in Task 10.1 are checked off
- [ ] All 11 tests in Task 10.2 are checked off
- [ ] You've documented any issues found
- [ ] You've exported the test report
- [ ] No critical bugs prevent basic functionality

---

## 📞 Need Help?

If you encounter issues:

1. Check the detailed instructions in `MANUAL_TESTING_INSTRUCTIONS.md`
2. Review troubleshooting section in `PERFORMANCE_TESTING_GUIDE.md`
3. Check browser console for error messages
4. Document the issue with screenshots

---

## 🎉 After Completion

Once you've completed all manual testing:

1. **Review** your exported test report
2. **Document** any bugs or issues found
3. **Mark** tasks 10.1 and 10.2 as complete in `tasks.md`
4. **Celebrate** - you've completed comprehensive testing! 🎊

---

**Created**: December 2024
**Status**: Ready for manual testing
