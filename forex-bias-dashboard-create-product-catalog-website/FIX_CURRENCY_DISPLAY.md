# إصلاح مشكلة عرض العملة 🔧

## المشكلة 🐛

عند اختيار USD، الأسعار لا تزال تظهر بالدينار الجزائري.

### السبب:
الأسعار في HTML كانت نصوص ثابتة بدون `data-price-dzd` و `data-price-usd`:

```html
<!-- ❌ خطأ - نص ثابت -->
<div class="price-tag">3750 <span data-i18n="currency">د.ج</span></div>
```

---

## الحل ✅

تم إضافة `data-price-dzd` و `data-price-usd` لجميع عناصر الأسعار:

```html
<!-- ✅ صحيح - سعر ديناميكي -->
<div class="price-tag" data-price-dzd="3750" data-price-usd="15">3750 د.ج</div>
```

---

## التحديثات المطبقة

### 1. The Real World Account
```html
<!-- قبل -->
<div class="price-tag">3750 <span data-i18n="currency">د.ج</span></div>

<!-- بعد -->
<div class="price-tag" data-price-dzd="3750" data-price-usd="15">3750 د.ج</div>
```

### 2. ChatGPT Business
```html
<!-- قبل -->
<div class="price-tag">1200 <span data-i18n="currency">د.ج</span> / <span data-i18n="perMonth">للشهر</span></div>

<!-- بعد -->
<div class="price-tag" data-price-dzd="1200" data-price-usd="5">1200 د.ج / للشهر</div>
```

### 3. Gamma.AI
```html
<!-- قبل -->
<div class="price-tag">1200 <span data-i18n="currency">د.ج</span></div>

<!-- بعد -->
<div class="price-tag" data-price-dzd="1200" data-price-usd="6">1200 د.ج</div>
```

### 4. Perplexity AI Pro
```html
<!-- قبل -->
<div class="price-tag">1200 <span data-i18n="currency">د.ج</span> / <span data-i18n="perYear">للسنة</span></div>

<!-- بعد -->
<div class="price-tag" data-price-dzd="1200" data-price-usd="6">1200 د.ج / للسنة</div>
```

---

## كيف يعمل الآن

### 1. عند تحميل الصفحة:
```javascript
// يتم تهيئة CurrencyManager
const currencyManager = new CurrencyManager();
currencyManager.currentCurrency = 'DZD'; // افتراضياً
```

### 2. عند النقر على زر USD:
```javascript
// يتم تحديث العملة
currencyManager.setCurrency('USD');

// يتم البحث عن جميع العناصر مع data-price-dzd و data-price-usd
const priceElements = document.querySelectorAll('[data-price-dzd][data-price-usd]');

// يتم تحديث كل عنصر
priceElements.forEach(element => {
    const priceDZD = element.getAttribute('data-price-dzd'); // 3750
    const priceUSD = element.getAttribute('data-price-usd'); // 15
    
    // يتم عرض السعر بالدولار
    element.textContent = '$15'; // بدلاً من 3750 د.ج
});
```

### 3. عند النقر على زر DZD:
```javascript
// نفس العملية لكن يتم عرض السعر بالدينار
element.textContent = '3,750 د.ج'; // بدلاً من $15
```

---

## الاختبار 🧪

### الطريقة 1: اختبار سريع
```bash
# افتح ملف الاختبار
start test-currency-switch.html
```

**الخطوات:**
1. انقر على زر USD 🇺🇸
2. تحقق من أن الأسعار تغيرت إلى الدولار
3. انقر على زر DZD 🇩🇿
4. تحقق من أن الأسعار عادت إلى الدينار

### الطريقة 2: اختبار على الموقع الفعلي
```bash
# افتح الصفحة الرئيسية
start index.html
```

**النتائج المتوقعة:**

| المنتج | DZD | USD |
|--------|-----|-----|
| The Real World | 3,750 د.ج | $15 |
| ChatGPT Business | 1,200 د.ج / للشهر | $5 / per month |
| Gamma.AI | 1,200 د.ج | $6 |
| Perplexity AI Pro | 1,200 د.ج / للسنة | $6 / per year |

---

## استكشاف الأخطاء 🔍

### المشكلة: الأسعار لا تزال لا تتغير

**الحل 1: تحقق من Console**
```javascript
// افتح Console (F12) وأدخل:
console.log(window.currencyManager.currentCurrency);
// يجب أن يكون "USD" أو "DZD"

// اختبر تحديث الأسعار يدوياً
window.currencyManager.updateAllPrices('USD');
```

**الحل 2: تحقق من تحميل الملفات**
```javascript
// تحقق من أن جميع الملفات محملة
console.log(typeof CurrencyManager); // يجب أن يكون "function"
console.log(typeof PRODUCTS); // يجب أن يكون "object"
```

**الحل 3: امسح الذاكرة المؤقتة**
```
1. اضغط Ctrl+Shift+Delete
2. امسح الذاكرة المؤقتة
3. أعد تحميل الصفحة (Ctrl+F5)
```

---

## الملفات المحدثة

- ✅ `index.html` - إضافة data-price-dzd و data-price-usd
- ✅ `currency-manager.js` - دالة updateAllPrices تعمل بشكل صحيح
- ✅ `test-currency-switch.html` - ملف اختبار جديد

---

## الخلاصة

تم إصلاح المشكلة بإضافة `data-price-dzd` و `data-price-usd` لجميع عناصر الأسعار في HTML.

الآن عند اختيار USD، ستتغير الأسعار تلقائياً من الدينار إلى الدولار! ✨

---

**التاريخ:** ديسمبر 2024  
**الحالة:** ✅ تم الإصلاح
