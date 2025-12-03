# Modal اختيار وسيلة التواصل

## التحديث
تم إضافة modal جديد يظهر عند الضغط على "اطلب الآن" يعرض 3 خيارات للتواصل: WhatsApp، Telegram، و Instagram.

## كيف يعمل

### 1. عند الضغط على "اطلب الآن"
- يتم حفظ اسم المنتج في متغير `currentProductName`
- يفتح modal اختيار وسيلة التواصل
- يعرض 3 أزرار كبيرة وجميلة

### 2. الخيارات المتاحة

#### WhatsApp
- **اللون**: أخضر WhatsApp (#25D366)
- **الأيقونة**: أيقونة WhatsApp الرسمية
- **الرابط**: https://wa.me/213782125821
- **الرسالة**: تحتوي على اسم المنتج باللغة المختارة

#### Telegram
- **اللون**: أزرق Telegram (gradient)
- **الأيقونة**: أيقونة Telegram الرسمية
- **الرابط**: https://t.me/+213656165400
- **الرسالة**: تحتوي على اسم المنتج باللغة المختارة

#### Instagram
- **اللون**: gradient Instagram الملون
- **الأيقونة**: أيقونة Instagram الرسمية
- **الرابط**: https://www.instagram.com/market_algeriaa
- **ملاحظة**: يفتح صفحة Instagram مباشرة

### 3. الرسائل متعددة اللغات

**العربية:**
```
مرحباً 👋
أريد طلب: [اسم المنتج]

شكراً 🙏
```

**English:**
```
Hello 👋
I would like to order: [Product Name]

Thank you 🙏
```

**Français:**
```
Bonjour 👋
Je voudrais commander: [Nom du produit]

Merci 🙏
```

## الدوال المعدلة

### 1. `orderProduct(productName)`
```javascript
function orderProduct(productName) {
    currentProductName = productName;
    // فتح modal اختيار وسيلة التواصل
    document.getElementById('contact-choice-modal').style.display = 'flex';
}
```

### 2. `orderAdobe()`
```javascript
function orderAdobe() {
    // تحديد نوع الحساب (Shared/Personal)
    const productName = type === 'shared' ? 'Adobe Creative Cloud - Shared' : 'Adobe Creative Cloud - Personal';
    currentProductName = productName;
    // فتح modal اختيار وسيلة التواصل
    document.getElementById('contact-choice-modal').style.display = 'flex';
}
```

### 3. `orderGamma()`
```javascript
function orderGamma() {
    // تحديد نوع الحساب (Shared/Personal)
    const productName = type === 'shared' ? 'Gamma.AI - Shared' : 'Gamma.AI - Personal';
    currentProductName = productName;
    // فتح modal اختيار وسيلة التواصل
    document.getElementById('contact-choice-modal').style.display = 'flex';
}
```

### 4. `contactVia(platform)` - دالة جديدة
```javascript
function contactVia(platform) {
    // إنشاء الرسالة باللغة المختارة
    const message = messages[currentLang] || messages.ar;
    
    // فتح المنصة المختارة
    if (platform === 'whatsapp') {
        window.open(`https://wa.me/213782125821?text=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'telegram') {
        window.open(`https://t.me/+213656165400?text=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'instagram') {
        window.open('https://www.instagram.com/market_algeriaa', '_blank');
    }
    
    // إغلاق الـ modal
    document.getElementById('contact-choice-modal').style.display = 'none';
}
```

## التصميم

### Modal
- **العرض الأقصى**: 500px
- **محاذاة**: في المنتصف
- **خلفية**: شفافة مع overlay
- **تأثيرات**: fade in/out

### الأزرار
- **الحجم**: كبير (padding: 18px)
- **الخط**: 1.1rem، bold
- **الأيقونات**: 28x28px
- **المسافة**: 15px بين الأزرار
- **تأثير Hover**: 
  - `transform: translateY(-3px)`
  - ظل أكبر وأكثر وضوحاً
- **تأثير Active**: `transform: translateY(-1px)`

### الألوان
- **WhatsApp**: #25D366
- **Telegram**: linear-gradient(135deg, #0088cc, #229ED9)
- **Instagram**: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)

## الترجمات المضافة

### العربية
```javascript
'modal.chooseContact': 'اختر وسيلة التواصل'
'modal.chooseContactDesc': 'اختر الطريقة المفضلة لديك لإتمام الطلب'
'modal.whatsapp': 'واتساب'
'modal.telegram': 'تيليجرام'
'modal.instagram': 'إنستغرام'
```

### English
```javascript
'modal.chooseContact': 'Choose Contact Method'
'modal.chooseContactDesc': 'Choose your preferred way to complete the order'
'modal.whatsapp': 'WhatsApp'
'modal.telegram': 'Telegram'
'modal.instagram': 'Instagram'
```

### Français
```javascript
'modal.chooseContact': 'Choisissez le Moyen de Contact'
'modal.chooseContactDesc': 'Choisissez votre méthode préférée pour finaliser la commande'
'modal.whatsapp': 'WhatsApp'
'modal.telegram': 'Telegram'
'modal.instagram': 'Instagram'
```

## الملفات المعدلة
1. `index.html` - إضافة modal اختيار وسيلة التواصل
2. `style.css` - إضافة تنسيقات الأزرار
3. `script.js` - تعديل دوال الطلب وإضافة دالة `contactVia`

## كيفية الاختبار

1. افتح الموقع
2. اضغط على "اطلب الآن" لأي منتج
3. يجب أن يظهر modal مع 3 خيارات
4. اضغط على WhatsApp → يفتح WhatsApp مع الرسالة
5. اضغط على Telegram → يفتح Telegram مع الرسالة
6. اضغط على Instagram → يفتح صفحة Instagram
7. جرب تغيير اللغة وتحقق من الترجمات
8. جرب مع منتجات مختلفة (Adobe، Gamma، إلخ)

## المزايا

✅ **تجربة مستخدم أفضل**: العميل يختار الطريقة المفضلة
✅ **مرونة أكبر**: 3 خيارات بدلاً من واحد
✅ **تصميم جميل**: أزرار كبيرة وواضحة مع أيقونات
✅ **متعدد اللغات**: يدعم العربية والإنجليزية والفرنسية
✅ **responsive**: يعمل على جميع الأجهزة

## النتيجة
✅ Modal جميل وسهل الاستخدام
✅ 3 خيارات للتواصل (WhatsApp، Telegram، Instagram)
✅ رسائل مخصصة لكل منتج
✅ يدعم الثلاث لغات
✅ تصميم احترافي مع تأثيرات جميلة
