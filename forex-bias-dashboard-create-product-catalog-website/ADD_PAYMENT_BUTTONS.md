# إضافة أزرار الدفع لـ Adobe و Gamma 💳

## التحديثات المطبقة

تم إضافة أزرار الدفع (USDT, RedotPay, BaridiMob) لمنتجات Adobe Creative Cloud و Gamma.AI.

---

## أزرار الدفع المضافة

### 1. Adobe Creative Cloud
```html
<div class="payment-methods-row">
    <button class="payment-btn-compact crypto-pay-btn" data-product="Adobe Creative Cloud"
        data-price="1500" data-price-usd="6">
        <span>USDT</span>
    </button>
    <button class="payment-btn-compact redotpay-btn" data-product="Adobe Creative Cloud"
        data-price="1500" data-price-usd="6">
        <span>RedotPay</span>
    </button>
    <button class="payment-btn-compact baridimob-btn" data-product="Adobe Creative Cloud"
        data-price="1500" data-price-usd="6">
        <span>BaridiMob</span>
    </button>
</div>
```

**الأسعار:**
- Shared 1 Month: 1500 DZD / $6 USD
- Shared 3 Months: 3000 DZD / $12 USD
- Personal 1 Month: 3000 DZD / $12 USD
- Personal 3 Months: 4500 DZD / $18 USD

---

### 2. Gamma.AI
```html
<div class="payment-methods-row">
    <button class="payment-btn-compact crypto-pay-btn" data-product="Gamma.AI"
        data-price="1200" data-price-usd="6">
        <span>USDT</span>
    </button>
    <button class="payment-btn-compact redotpay-btn" data-product="Gamma.AI"
        data-price="1200" data-price-usd="6">
        <span>RedotPay</span>
    </button>
    <button class="payment-btn-compact baridimob-btn" data-product="Gamma.AI"
        data-price="1200" data-price-usd="6">
        <span>BaridiMob</span>
    </button>
</div>
```

**الأسعار:**
- Shared Account: 1200 DZD / $6 USD
- Personal Account: 2000 DZD / $8 USD

---

## كيف تعمل أزرار الدفع

### عند النقر على زر USDT:
1. يفتح نافذة منبثقة للدفع بالعملات الرقمية
2. يعرض السعر بالدينار والدولار
3. يعرض عنوان المحفظة و QR Code
4. يسمح للمستخدم بنسخ العنوان

### عند النقر على زر RedotPay:
1. يفتح نافذة منبثقة للدفع عبر RedotPay
2. يعرض السعر بالدولار
3. يعرض RedotPay ID للتحويل
4. يسمح للمستخدم بنسخ الـ ID

### عند النقر على زر BaridiMob:
1. يفتح نافذة منبثقة للدفع عبر BaridiMob
2. يعرض السعر بالدينار
3. يعرض رقم RIP للتحويل
4. يسمح للمستخدم بنسخ الرقم

---

## الموقع في الصفحة

تم إضافة أزرار الدفع في الموقع التالي:

```
بطاقة المنتج
    ├── الصورة
    ├── العنوان
    ├── الوصف
    ├── اختيار نوع الحساب (Adobe/Gamma)
    ├── الأسعار
    ├── ✨ أزرار الدفع (جديد!)
    ├── قائمة المميزات
    └── زر "اطلب الآن"
```

---

## الاختبار 🧪

### الخطوات:
1. افتح `index.html` في المتصفح
2. ابحث عن بطاقة Adobe Creative Cloud
3. انقر على أحد أزرار الدفع (USDT, RedotPay, BaridiMob)
4. تحقق من فتح النافذة المنبثقة
5. تحقق من عرض السعر الصحيح
6. كرر نفس الخطوات لـ Gamma.AI

---

## التكامل مع نظام العملات

أزرار الدفع متكاملة مع نظام العملات:

### عند اختيار DZD:
- USDT: يعرض السعر بالدينار
- RedotPay: يعرض السعر بالدينار
- BaridiMob: يعرض السعر بالدينار

### عند اختيار USD:
- USDT: يعرض السعر بالدولار
- RedotPay: يعرض السعر بالدولار
- BaridiMob: يعرض السعر بالدولار

---

## ملاحظات مهمة ⚠️

### 1. الأسعار الافتراضية
الأسعار المعروضة في `data-price` و `data-price-usd` هي للحساب المشترك (Shared) بشهر واحد.

### 2. تحديث الأسعار حسب النوع
عند تغيير نوع الحساب (Shared/Personal) أو المدة (1 Month/3 Months)، يجب تحديث أسعار أزرار الدفع ديناميكياً.

### 3. التوافق مع جميع المتصفحات
أزرار الدفع تعمل على جميع المتصفحات الحديثة.

---

## الملفات المحدثة

- ✅ `index.html` - إضافة أزرار الدفع لـ Adobe و Gamma
- ✅ `ADD_PAYMENT_BUTTONS.md` - هذا الملف (التوثيق)

---

## الخلاصة

تم إضافة أزرار الدفع بنجاح لـ Adobe Creative Cloud و Gamma.AI! ✨

الآن المستخدمون يمكنهم:
- ✅ الدفع بـ USDT (العملات الرقمية)
- ✅ الدفع بـ RedotPay
- ✅ الدفع بـ BaridiMob

**جميع المنتجات الآن لديها أزرار دفع:**
- ✅ The Real World
- ✅ ChatGPT Business
- ✅ **Adobe Creative Cloud** (تم الإضافة!)
- ✅ **Gamma.AI** (تم الإضافة!)
- ✅ Perplexity AI Pro

---

**التاريخ:** ديسمبر 2024  
**الحالة:** ✅ مكتمل
