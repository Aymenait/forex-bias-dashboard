![alt text](image.png)# كيفية إضافة منتج جديد

## الخطوات المطلوبة:

### 1. إضافة المنتج في الصفحة الرئيسية (index.html)

أضف كارت المنتج الجديد في قسم `#products`:

```html
<div class="product-card fade-in">
    <div class="product-image" style="background-image: url('صورة-المنتج.gif');"></div>
    <h3>اسم المنتج</h3>
    
    <!-- Rating Display -->
    <div id="product-rating-container" style="display: none; ...">
        <div style="display: flex; gap: 2px;" id="product-stars">
            <span style="color: #fbbf24; font-size: 16px;">★</span>
            <!-- ... 5 نجوم -->
        </div>
        <span style="color: #9ca3af; font-size: 12px;">(<span id="product-review-count">0</span>)</span>
    </div>
    
    <p class="description">وصف المنتج</p>
    <div class="price-tag">السعر <span>د.ج</span></div>
    
    <!-- أزرار الدفع -->
    <div class="payment-methods-row">
        <!-- ... -->
    </div>
    
    <a href="product_landing.html" class="discover-btn">اكتشف المزيد</a>
    <button class="order-btn" data-product="اسم المنتج">اطلب الآن</button>
</div>
```

### 2. إنشاء صفحة Landing Page للمنتج

أنشئ ملف `product_landing.html` بنفس هيكل `trw_landing.html` أو `chatgpt_landing.html`

### 3. إضافة قسم Reviews في Landing Page

أضف قسم التقييمات مع Firebase collection خاص:

```html
<!-- Reviews Section -->
<section class="py-8 sm:py-12 px-4 max-w-6xl mx-auto relative z-10">
    <!-- نفس الهيكل تاع TRW -->
</section>
```

### 4. تحديث Firebase في index.html

أضف في script Firebase في آخر `index.html`:

```javascript
// Load Product reviews
async function loadProductReviews() {
    try {
        const querySnapshot = await getDocs(collection(db, 'product-reviews'));
        const reviews = [];
        querySnapshot.forEach((doc) => {
            reviews.push(doc.data());
        });

        const totalReviews = reviews.length;
        const ratingContainer = document.getElementById('product-rating-container');

        if (totalReviews > 0) {
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
            document.getElementById('product-review-count').textContent = totalReviews;
            updateStars('product-stars', avgRating);
            ratingContainer.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading Product reviews:', error);
    }
}

// استدعاء الدالة
window.addEventListener('DOMContentLoaded', () => {
    loadProductReviews(); // أضف هذا السطر
});
```

### 5. تحديث صفحة Reviews العامة (reviews-page.js)

أضف المنتج الجديد في `productInfo`:

```javascript
const productInfo = {
    // المنتجات الموجودة...
    
    'اسم المنتج الجديد': { 
        name: 'الاسم المختصر', 
        class: 'badge-product',  // اسم class للـ badge
        collection: 'product-reviews',  // اسم collection في Firebase
        filter: 'product'  // مفتاح الفلتر
    }
};
```

### 6. إضافة زر Filter في reviews.html

أضف زر جديد في قسم Filter Buttons:

```html
<button onclick="filterReviews('product')" class="filter-btn ...">
    اسم المنتج
</button>
```

### 7. إضافة CSS للـ Badge (في reviews.html)

أضف style للـ badge الجديد:

```css
.badge-product {
    background: linear-gradient(135deg, #لون1, #لون2);
    color: #fff;
}
```

### 8. إنشاء Firebase Collection

في Firebase Console:
1. اذهب إلى Firestore Database
2. أنشئ collection جديد باسم `product-reviews`
3. الحقول المطلوبة:
   - `name` (string): اسم العميل
   - `rating` (number): التقييم من 1-5
   - `comment` (string): التعليق
   - `platform` (string): المنصة
   - `image` (string): صورة base64 (اختياري)
   - `timestamp` (string): تاريخ التقييم
   - `product` (string): اسم المنتج

## ملاحظات مهمة:

- ✅ استخدم نفس Firebase project للكل
- ✅ كل منتج له collection خاص به
- ✅ النجوم تظهر تلقائياً في الصفحة الرئيسية كي يكون فيه reviews
- ✅ صفحة Reviews العامة تجمع كل التقييمات تلقائياً
- ✅ الفلترة تخدم ديناميكياً

## مثال كامل:

لإضافة منتج "Netflix Premium":

1. أضف في `productInfo`:
```javascript
'Netflix Premium': { 
    name: 'Netflix', 
    class: 'badge-netflix', 
    collection: 'netflix-reviews',
    filter: 'netflix'
}
```

2. أضف CSS:
```css
.badge-netflix {
    background: linear-gradient(135deg, #e50914, #b20710);
    color: #fff;
}
```

3. أضف زر Filter:
```html
<button onclick="filterReviews('netflix')" class="filter-btn ...">
    Netflix Premium
</button>
```

4. أنشئ `netflix_landing.html` مع قسم reviews
5. أضف الكارت في `index.html`
6. أضف `loadNetflixReviews()` في Firebase script

وخلاص! 🎉
