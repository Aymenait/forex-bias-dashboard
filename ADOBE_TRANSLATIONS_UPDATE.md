# تحديث ترجمات Adobe 🌐

## التحديثات المطبقة

تم إضافة ترجمات لنصوص "شهر واحد" و "3 أشهر" في أسعار Adobe Creative Cloud.

---

## الترجمات المضافة

### العربية (ar):
```javascript
'product.adobe.oneMonth': 'شهر واحد',
'product.adobe.threeMonths': '3 أشهر',
```

### الإنجليزية (en):
```javascript
'product.adobe.oneMonth': '1 Month',
'product.adobe.threeMonths': '3 Months',
```

### الفرنسية (fr):
```javascript
'product.adobe.oneMonth': '1 Mois',
'product.adobe.threeMonths': '3 Mois',
```

---

## التغييرات في HTML

### قبل:
```html
<span>شهر واحد: <strong class="price-tag">1500 د.ج</strong></span>
<span>3 أشهر: <strong class="price-tag">3000 د.ج</strong></span>
```

### بعد:
```html
<span><span data-i18n="product.adobe.oneMonth">شهر واحد</span>: <strong class="price-tag">1500 د.ج</strong></span>
<span><span data-i18n="product.adobe.threeMonths">3 أشهر</span>: <strong class="price-tag">3000 د.ج</strong></span>
```

---

## كيف يعمل الآن

### عند اختيار العربية:
```
شهر واحد: 1500 د.ج
3 أشهر: 3000 د.ج
```

### عند اختيار الإنجليزية:
```
1 Month: 1500 DZD
3 Months: 3000 DZD
```

### عند اختيار الفرنسية:
```
1 Mois: 1500 DZD
3 Mois: 3000 DZD
```

---

## الاختبار 🧪

### الخطوات:
1. افتح `index.html` في المتصفح
2. ابحث عن بطاقة Adobe Creative Cloud
3. انقر على زر اللغة في الأعلى:
   - **العربية:** يجب أن تظهر "شهر واحد" و "3 أشهر"
   - **English:** يجب أن تظهر "1 Month" و "3 Months"
   - **Français:** يجب أن تظهر "1 Mois" و "3 Mois"

---

## الملفات المحدثة

- ✅ `index.html` - إضافة data-i18n للنصوص
- ✅ `script.js` - إضافة الترجمات للغات الثلاث

---

## ملاحظات مهمة

### 1. الأسعار تبقى ديناميكية
الأسعار لا تزال تتغير حسب العملة المختارة (DZD/USD).

### 2. النصوص تتغير حسب اللغة
النصوص "شهر واحد" و "3 أشهر" الآن تتغير حسب اللغة المختارة.

### 3. التوافق مع جميع الأنواع
التحديثات تعمل مع:
- Shared Account (1 Month & 3 Months)
- Personal Account (1 Month & 3 Months)

---

## الخلاصة

تم إضافة ترجمات كاملة لنصوص Adobe بنجاح! ✨

الآن عند تغيير اللغة، ستتغير النصوص تلقائياً:
- ✅ العربية: شهر واحد / 3 أشهر
- ✅ English: 1 Month / 3 Months
- ✅ Français: 1 Mois / 3 Mois

---

**التاريخ:** ديسمبر 2024  
**الحالة:** ✅ مكتمل
