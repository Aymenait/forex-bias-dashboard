# 📡 Products API - حل مشكلة الأسعار المتغيرة

## 🎯 المشكلة

الأسعار في الموقع **تتغير باستمرار**، و الـ Instagram Bot يحتاج **أسعار محدثة دائماً**.

---

## ✅ الحل

**Products API** - يقرا الأسعار مباشرة من `currency-config.js`!

---

## 🚀 كيفاش يخدم

### **1. الموقع (marketalgeria.store)**
```
currency-config.js  ← الأسعار الحقيقية
        ↓
products-api.js     ← يقرا الأسعار
        ↓
api-server.js       ← يعطي API
        ↓
/api/products       ← Endpoint
```

### **2. Instagram Bot**
```
كل 5 دقائق → يقرا من /api/products
                ↓
            يحدث الأسعار تلقائياً!
```

---

## 📊 API Endpoints

### **1. Get All Products**
```
GET https://marketalgeria.store/api/products
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "netflix",
        "name": "Netflix Premium",
        "price_dzd": 600,
        "price_usd": 2.5,
        "description": "حساب Netflix Premium مشترك",
        "durations": [...]
      }
    ],
    "payment_methods": [...],
    "last_updated": "2026-01-27T15:30:00.000Z"
  }
}
```

### **2. Get Single Product**
```
GET https://marketalgeria.store/api/products/netflix
```

### **3. Search Products**
```
GET https://marketalgeria.store/api/products/search?q=netflix
```

---

## 🔄 كيفاش تحدث السعر

### **الطريقة القديمة (مش مليحة):**
```
1. تبدل السعر في currency-config.js
2. تبدل السعر في Instagram Bot ← مشكلة!
3. تبدل السعر في products-data.json ← مشكلة!
```

### **الطريقة الجديدة (ذكية!):**
```
1. تبدل السعر في currency-config.js فقط!
2. الـ API يقرا تلقائياً ✅
3. Instagram Bot يحدث تلقائياً ✅
```

---

## 💡 مثال

### **تبدل سعر Netflix من 600 DA لـ 700 DA:**

**1. في `currency-config.js`:**
```javascript
'netflix': {
    price_dzd: 700,  // ← غيرت هنا فقط!
    price_usd: 3,
    // ...
}
```

**2. Instagram Bot يقرا تلقائياً:**
```
Bot: "Netflix Premium عندنا بـ 700 DA" ✅
```

---

## 🧪 Test الـ API

### **في Terminal:**
```bash
# شغل الـ API Server
node api-server.js

# في terminal آخر، test:
curl http://localhost:3000/api/products
```

### **في المتصفح:**
```
http://localhost:3000/api/products
```

---

## 🚀 Deploy على Render.com

### **1. نفس الـ server للـ API و Instagram Bot:**
```
render.com
    ↓
api-server.js  ← يعطي /api/products
    +
instagram-bot.js ← يقرا من /api/products
```

### **2. Always-On:**
```
Cron-Job.org → ping كل 10 دقائق
                ↓
            الـ API مايناماش أبداً!
```

---

## ✅ المزايا

1. **سعر واحد فقط** - تبدل في مكان واحد
2. **تحديث تلقائي** - Instagram Bot يحدث لوحدو
3. **مجاني 100%** - Render.com مجاني
4. **سهل الصيانة** - ما تحتاجش تعدل في أماكن كثيرة

---

## 📝 Next Steps

1. ✅ Products API جاهز
2. 🔄 Instagram Bot يقرا منو (قادم)
3. 🔄 Deploy على Render.com (قادم)

---

**آخر تحديث:** 27 يناير 2026
