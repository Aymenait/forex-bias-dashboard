# 🌍 دليل مزامنة اللغات بين الصفحات

## كيف يعمل النظام؟

الموقع الآن يحفظ اختيار اللغة في `localStorage` ويستخدمها تلقائياً في كل الصفحات.

## الصفحات المدعومة

✅ **index.html** - الصفحة الرئيسية
✅ **reviews.html** - صفحة التقييمات  
✅ **chatgpt_landing.html** - صفحة ChatGPT
✅ **trw_landing.html** - صفحة The Real World

## كيفية الاستخدام

1. **اختر اللغة** في أي صفحة (العربية / English / Français)
2. **انتقل لصفحة أخرى** - ستجد نفس اللغة مفعلة تلقائياً
3. **اللغة محفوظة** حتى لو أغلقت المتصفح

## التفاصيل التقنية

### المفتاح المستخدم
```javascript
localStorage.setItem('preferredLanguage', 'en'); // ar, en, fr
```

### كيف يتم التهيئة؟

**في index.html و trw_landing.html:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== 'ar') {
        changeLanguage(savedLang);
    }
});
```

**في reviews.html:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'ar';
    changeLanguage(savedLang);
});
```

**في chatgpt_landing.html:**
```javascript
let currentLang = localStorage.getItem('preferredLanguage') || 'ar';
// ثم يتم تطبيقها عند تحميل الصفحة
switchLanguage(currentLang);
```

## اختبار النظام

1. افتح **index.html**
2. غير اللغة إلى **English**
3. اضغط على **⭐ Customer Reviews**
4. ستجد الصفحة بالإنجليزية تلقائياً ✅
5. ارجع واضغط على **ChatGPT Business**
6. ستجد الصفحة بالإنجليزية أيضاً ✅

## إضافة صفحة جديدة

إذا أردت إضافة صفحة جديدة بنظام الترجمة:

1. أضف أزرار اللغات:
```html
<button onclick="changeLanguage('ar')" data-lang="ar">العربية</button>
<button onclick="changeLanguage('en')" data-lang="en">English</button>
<button onclick="changeLanguage('fr')" data-lang="fr">Français</button>
```

2. أضف كود التهيئة:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'ar';
    changeLanguage(savedLang);
});
```

3. تأكد من حفظ اللغة عند التغيير:
```javascript
function changeLanguage(lang) {
    // ... your translation code ...
    localStorage.setItem('preferredLanguage', lang);
}
```

## ملاحظات مهمة

- ⚠️ **لا تستخدم أسماء مختلفة** للمفتاح في localStorage
- ✅ استخدم دائماً: `preferredLanguage`
- 🔄 اللغة الافتراضية هي العربية (`ar`)
- 💾 اللغة محفوظة حتى بعد إغلاق المتصفح

## استكشاف الأخطاء

### المشكلة: اللغة لا تتغير تلقائياً
**الحل:** تأكد من:
1. وجود كود التهيئة في `DOMContentLoaded`
2. استخدام نفس المفتاح `preferredLanguage`
3. تحميل ملف الترجمات قبل استخدامه

### المشكلة: اللغة تعود للعربية
**الحل:** تأكد من حفظ اللغة في localStorage:
```javascript
localStorage.setItem('preferredLanguage', lang);
```

---

**تم التحديث:** ديسمبر 2024
**الحالة:** ✅ يعمل بشكل كامل
