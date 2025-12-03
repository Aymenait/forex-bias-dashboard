# إصلاح أزرار Order Now

## المشكلة
كانت أزرار "اطلب الآن" (Order Now) لا تعمل في جميع بطاقات المنتجات.

## السبب
1. دالة `orderAdobe()` كانت مفقودة من script.js
2. بعض الأزرار لم يكن لها event handlers صحيحة
3. الدوال لم تكن متاحة globally (window object)

## الحل المطبق

### 1. إضافة الدوال المفقودة في script.js
```javascript
// Order Adobe with selected type
function orderAdobe() {
    const activeBtn = document.querySelector('.adobe-type-btn.active');
    const type = activeBtn ? activeBtn.getAttribute('data-type') : 'shared';
    const productName = type === 'shared' ? 'Adobe Creative Cloud - Shared' : 'Adobe Creative Cloud - Personal';
    
    // Open WhatsApp
    const message = `مرحباً، أريد طلب ${productName}`;
    window.open(`https://wa.me/213782125821?text=${encodeURIComponent(message)}`, '_blank');
}

// Generic order function for products without special options
function orderProduct(productName) {
    const message = `مرحباً، أريد طلب ${productName}`;
    window.open(`https://wa.me/213782125821?text=${encodeURIComponent(message)}`, '_blank');
}

// Adobe Account Type Selection
function selectAdobeType(type) {
    // ... handles switching between shared/personal accounts
}
```

### 2. تحديث أزرار Order Now في index.html
تم إضافة `onclick` handlers لجميع الأزرار:

- **The Real World Account**: `onclick="orderProduct('The Real World Account')"`
- **Adobe Creative Cloud**: `onclick="orderAdobe()"` (يتعامل مع نوع الحساب)
- **ChatGPT Business**: `onclick="orderProduct('ChatGPT Business')"`
- **Gamma.AI**: `onclick="orderGamma()"` (يتعامل مع نوع الحساب)
- **Netflix Premium**: `onclick="orderProduct('Netflix Premium')"`
- **Perplexity AI Pro**: `onclick="orderProduct('Perplexity AI Pro')"`

### 3. جعل الدوال متاحة globally
```javascript
window.orderAdobe = orderAdobe;
window.orderGamma = orderGamma;
window.orderProduct = orderProduct;
window.selectAdobeType = selectAdobeType;
window.selectGammaType = selectGammaType;
```

### 4. حذف الكود المكرر
تم حذف دوال `selectAdobeType` و `orderAdobe` المكررة من نهاية index.html.

## كيفية الاختبار

1. افتح الموقع في المتصفح
2. جرب الضغط على زر "اطلب الآن" في كل بطاقة منتج
3. يجب أن يفتح WhatsApp مع رسالة تحتوي على اسم المنتج
4. للمنتجات التي لها خيارات (Adobe و Gamma):
   - اختر نوع الحساب (مشترك أو شخصي)
   - اضغط "اطلب الآن"
   - يجب أن تتضمن الرسالة النوع المختار

## الملفات المعدلة
- `script.js` - إضافة الدوال المفقودة وجعلها global
- `index.html` - تحديث أزرار Order Now وحذف الكود المكرر

## النتيجة
✅ جميع أزرار "اطلب الآن" تعمل الآن بشكل صحيح
✅ تفتح WhatsApp مع رسالة مخصصة لكل منتج
✅ المنتجات ذات الخيارات (Adobe و Gamma) تعمل بشكل صحيح
