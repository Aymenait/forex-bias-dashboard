# إصلاح أسعار Adobe 🔧

## المشكلة 🐛

أسعار Adobe Creative Cloud لا تتغير عند اختيار USD.

### السبب:
الأسعار كانت معروضة في عناصر `<span>` مع `data-i18n` كنصوص ثابتة:

```html
<!-- ❌ خطأ - نص ثابت -->
<span data-i18n="product.adobe.shared.price1">
    شهر واحد: <strong>1500 د.ج</strong>
</span>
```

---

## الحل ✅

تم تحويل الأسعار إلى عناصر ديناميكية مع `data-price-dzd` و `data-price-usd`:

```html
<!-- ✅ صحيح - سعر ديناميكي -->
<span>
    شهر واحد: <strong class="price-tag" data-price-dzd="1500" data-price-usd="6">1500 د.ج</strong>
</span>
```

---

## أسعار Adobe المحدثة

### حساب مشترك (Shared Account):

| المدة | DZD | USD |
|------|-----|-----|
| شهر واحد | 1500 د.ج | $6 |
| 3 أشهر | 3000 د.ج | $12 |

### حساب شخصي (Personal Account - Keys):

| المدة | DZD | USD |
|------|-----|-----|
| شهر واحد | 3000 د.ج | $12 |
| 3 أشهر | 4500 د.ج | $18 |

---

## التحديثات المطبقة

### 1. Shared Account - 1 Month
```html
<!-- قبل -->
<span data-i18n="product.adobe.shared.price1">شهر واحد: <strong>1500 د.ج</strong></span>

<!-- بعد -->
<span>شهر واحد: <strong class="price-tag" data-price-dzd="1500" data-price-usd="6">1500 د.ج</strong></span>
```

### 2. Shared Account - 3 Months
```html
<!-- قبل -->
<span data-i18n="product.adobe.shared.price2">3 أشهر: <strong>3000 د.ج</strong></span>

<!-- بعد -->
<span>3 أشهر: <strong class="price-tag" data-price-dzd="3000" data-price-usd="12">3000 د.ج</strong></span>
```

### 3. Personal Account - 1 Month
```html
<!-- قبل -->
<span data-i18n="product.adobe.personal.price1">شهر واحد: <strong>3000 د.ج</strong></span>

<!-- بعد -->
<span>شهر واحد: <strong class="price-tag" data-price-dzd="3000" data-price-usd="12">3000 د.ج</strong></span>
```

### 4. Personal Account - 3 Months
```html
<!-- قبل -->
<span data-i18n="product.adobe.personal.price2">3 أشهر: <strong>4500 د.ج</strong></span>

<!-- بعد -->
<span>3 أشهر: <strong class="price-tag" data-price-dzd="4500" data-price-usd="18">4500 د.ج</strong></span>
```

---

## كيف يعمل الآن

### عند اختيار USD:
```
Shared - 1 Month:  1500 د.ج  →  $6
Shared - 3 Months: 3000 د.ج  →  $12
Personal - 1 Month: 3000 د.ج  →  $12
Personal - 3 Months: 4500 د.ج  →  $18
```

### عند اختيار DZD:
```
Shared - 1 Month:  $6  →  1,500 د.ج
Shared - 3 Months: $12 →  3,000 د.ج
Personal - 1 Month: $12 →  3,000 د.ج
Personal - 3 Months: $18 →  4,500 د.ج
```

---

## الاختبار 🧪

### الطريقة 1: صفحة الاختبار
```bash
# افتح ملف الاختبار
start test-currency-switch.html
```

**الخطوات:**
1. انقر على زر USD 🇺🇸
2. تحقق من أسعار Adobe:
   - Shared 1M: $6
   - Shared 3M: $12
   - Personal 1M: $12
   - Personal 3M: $18

### الطريقة 2: الموقع الفعلي
```bash
# افتح الصفحة الرئيسية
start index.html
```

**الخطوات:**
1. ابحث عن بطاقة Adobe Creative Cloud
2. انقر على زر USD في الأعلى
3. تحقق من تغيير الأسعار
4. جرب التبديل بين Shared و Personal
5. تحقق من أن جميع الأسعار تتغير

---

## ملاحظات مهمة ⚠️

### 1. إزالة data-i18n
تم إزالة `data-i18n` من عناصر الأسعار لأنها كانت تمنع التحديث الديناميكي.

### 2. إضافة class="price-tag"
تم إضافة `class="price-tag"` للعناصر `<strong>` حتى يتمكن `CurrencyManager` من العثور عليها وتحديثها.

### 3. الأسعار الافتراضية
الأسعار الافتراضية المعروضة هي بالدينار الجزائري (DZD).

---

## استكشاف الأخطاء 🔍

### المشكلة: أسعار Adobe لا تزال لا تتغير

**الحل 1: امسح الذاكرة المؤقتة**
```
1. اضغط Ctrl+Shift+Delete
2. امسح الذاكرة المؤقتة
3. أعد تحميل الصفحة (Ctrl+F5)
```

**الحل 2: تحقق من Console**
```javascript
// افتح Console (F12) وأدخل:
const adobePrices = document.querySelectorAll('#adobe-prices-shared .price-tag, #adobe-prices-personal .price-tag');
console.log('Adobe price elements:', adobePrices.length); // يجب أن يكون 4

// اختبر التحديث يدوياً
window.currencyManager.updateAllPrices('USD');
```

**الحل 3: تحقق من العناصر**
```javascript
// تحقق من أن العناصر تحتوي على data-price-dzd و data-price-usd
document.querySelectorAll('.price-tag').forEach(el => {
    console.log(el.getAttribute('data-price-dzd'), el.getAttribute('data-price-usd'));
});
```

---

## الملفات المحدثة

- ✅ `index.html` - تحديث أسعار Adobe
- ✅ `test-currency-switch.html` - إضافة أسعار Adobe للاختبار
- ✅ `FIX_ADOBE_PRICES.md` - هذا الملف (التوثيق)

---

## الخلاصة

تم إصلاح أسعار Adobe بتحويلها من نصوص ثابتة إلى عناصر ديناميكية.

الآن عند اختيار USD، ستتغير جميع أسعار Adobe تلقائياً! ✨

**جميع الأسعار الآن تعمل بشكل صحيح:**
- ✅ The Real World
- ✅ ChatGPT Business
- ✅ **Adobe Creative Cloud** (تم الإصلاح!)
- ✅ Gamma.AI
- ✅ Perplexity AI Pro

---

**التاريخ:** ديسمبر 2024  
**الحالة:** ✅ تم الإصلاح
