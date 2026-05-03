# كيفية اختبار أسعار USD المحدثة 🧪

## الطريقة السريعة ⚡

1. افتح `test-usd-prices.html` في المتصفح
2. ستظهر جدول بجميع المنتجات والأسعار
3. انقر على زر USD 🇺🇸 لرؤية الأسعار بالدولار
4. انقر على زر DZD 🇩🇿 لرؤية الأسعار بالدينار
5. تحقق من أن جميع الأسعار تظهر بشكل صحيح مع علامة ✓

## الطريقة الكاملة 🌐

### 1. اختبار الصفحة الرئيسية

```bash
# افتح index.html في المتصفح
start index.html
```

**الخطوات:**
1. انتظر حتى يتم تحميل الصفحة بالكامل
2. ابحث عن أزرار العملة في الأعلى (🇩🇿 DZD / 🇺🇸 USD)
3. انقر على زر USD
4. تحقق من أن الأسعار تغيرت إلى الدولار
5. تحقق من أن رمز $ يظهر بشكل صحيح

**الأسعار المتوقعة بعد التبديل إلى USD:**
- The Real World: $15
- ChatGPT Business: $5
- Perplexity AI Pro: $6
- Gamma.AI: $6

### 2. اختبار صفحة Perplexity

```bash
# افتح perplexity_landing.html في المتصفح
start perplexity_landing.html
```

**الخطوات:**
1. ابحث عن أزرار الدفع (RedotPay, USDT, BaridiMob)
2. انقر على أي زر دفع
3. تحقق من أن السعر في النافذة المنبثقة يظهر $6

### 3. اختبار Console

افتح Developer Tools (F12) وأدخل الأوامر التالية:

```javascript
// اختبار 1: التحقق من أسعار USD في التكوين
console.log('Perplexity USD:', PRODUCTS.perplexity.price_usd); // يجب أن يكون 6
console.log('Gamma USD:', PRODUCTS.gamma.price_usd); // يجب أن يكون 6
console.log('Adobe USD:', PRODUCTS.adobe.price_usd); // يجب أن يكون 6

// اختبار 2: التحقق من تنسيق الأسعار
const manager = new CurrencyManager();
manager.currentCurrency = 'USD';
console.log(manager.formatPrice(6, 'USD')); // يجب أن يكون "$6"
console.log(manager.formatPrice(15, 'USD')); // يجب أن يكون "$15"

// اختبار 3: التحقق من عرض الأسعار
const product = { price_dzd: 1200, price_usd: 6 };
console.log(manager.displayPrice(product, 'USD')); // يجب أن يكون "$6"
console.log(manager.displayPrice(product, 'DZD')); // يجب أن يكون "1,200 د.ج"
```

## الأخطاء الشائعة وحلولها 🔧

### الخطأ 1: الأسعار لا تتغير

**السبب:** JavaScript لم يتم تحميله بشكل صحيح

**الحل:**
1. افتح Console (F12)
2. ابحث عن أخطاء JavaScript
3. تأكد من أن جميع الملفات محملة:
   - currency-config.js
   - currency-manager.js
   - international-expansion-init.js

### الخطأ 2: رمز $ لا يظهر

**السبب:** مشكلة في دالة formatPrice

**الحل:**
```javascript
// تحقق من أن الدالة تعمل بشكل صحيح
const manager = new CurrencyManager();
console.log(manager.formatPrice(10, 'USD')); // يجب أن يكون "$10"
```

### الخطأ 3: الأسعار تظهر بالدينار حتى عند اختيار USD

**السبب:** العملة النشطة لم يتم تحديثها

**الحل:**
```javascript
// تحقق من العملة النشطة
console.log(window.currencyManager.currentCurrency); // يجب أن يكون "USD"

// إذا كانت خاطئة، قم بتحديثها
window.currencyManager.setCurrency('USD');
window.currencyManager.updateAllPrices('USD');
```

## قائمة التحقق ✓

قبل إطلاق التحديثات، تأكد من:

- [ ] جميع الأسعار في currency-config.js محدثة
- [ ] رمز $ يظهر عند اختيار USD
- [ ] رمز د.ج يظهر عند اختيار DZD
- [ ] الأسعار تتغير بشكل صحيح عند التبديل بين العملات
- [ ] أزرار الدفع تحتوي على data-price-usd الصحيح
- [ ] النوافذ المنبثقة للدفع تعرض الأسعار الصحيحة
- [ ] لا توجد أخطاء في Console
- [ ] الأسعار تعمل على جميع المتصفحات (Chrome, Firefox, Safari, Edge)

## الأسعار المحدثة للمراجعة 📋

| المنتج | DZD | USD القديم | USD الجديد |
|--------|-----|-----------|-----------|
| The Real World | 3750 | $15 | $15 ✓ |
| ChatGPT | 1200 | $5 | $5 ✓ |
| Adobe | 2500 | $10 | $6 ✓ |
| Gamma | 1200 | $5 | $6 ✓ |
| Perplexity | 1200 | $5 | $6 ✓ |
| Canva | 1200 | $5 | $6 ✓ |
| CapCut | 1200 | $5 | $6 ✓ |
| Netflix | 1500 | $6 | $6 ✓ |
| TradingView | 2000 | $8 | $6 ✓ |

## الدعم 💬

إذا واجهت أي مشاكل:
1. تحقق من ملف `PRICE_UPDATE_SUMMARY.md` للحصول على معلومات مفصلة
2. افتح `test-usd-prices.html` للاختبار السريع
3. راجع Console للأخطاء

---

**آخر تحديث:** ديسمبر 2024  
**الحالة:** ✅ جاهز للاختبار
