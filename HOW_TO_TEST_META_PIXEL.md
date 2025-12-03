# كيف تختبر Meta Pixel وتشوف البيانات 🔍

## الجزء الأول: كيف تعرف أن الكود يشتغل؟

### ✅ الطريقة 1: Meta Pixel Helper (الأسهل والأسرع)

#### الخطوة 1: تثبيت الإضافة
1. افتح متصفح **Google Chrome**
2. اذهب إلى: https://chrome.google.com/webstore
3. ابحث عن: **"Meta Pixel Helper"** أو **"Facebook Pixel Helper"**
4. اضغط **"Add to Chrome"** أو **"إضافة إلى Chrome"**
5. اضغط **"Add Extension"**

#### الخطوة 2: اختبار الموقع
1. افتح موقعك: **marketalgeriaa.com**
2. انظر في أعلى المتصفح على اليمين
3. ستجد أيقونة **</>** (Meta Pixel Helper)
4. اضغط عليها

#### الخطوة 3: ماذا يجب أن ترى؟

**✅ عند دخول الموقع:**
```
✓ PageView
  Pixel ID: 2046893892791206
  Status: Active
```

**✅ عند الضغط على زر الدفع:**
1. اختر أي منتج (مثلاً ChatGPT Business)
2. اضغط على زر الدفع (USDT أو BaridiMob)
3. في نافذة الدفع، اضغط "تأكيد الطلب" أو "Confirm Payment"
4. افتح Meta Pixel Helper مرة أخرى

**يجب أن ترى:**
```
✓ Purchase
  Pixel ID: 2046893892791206
  Value: 1200 (أو السعر الفعلي)
  Currency: DZD (أو USD)
  Content Name: ChatGPT Business
  Status: Active
```

#### 🎯 إذا رأيت هذا = الكود يشتغل 100% ✅

---

### ✅ الطريقة 2: Facebook Events Manager (للتفاصيل الكاملة)

#### الخطوة 1: الدخول إلى Events Manager
1. اذهب إلى: https://business.facebook.com/events_manager2
2. سجل دخول بحسابك على Facebook
3. اختر الـ Pixel بتاعك (رقم: **2046893892791206**)

#### الخطوة 2: تفعيل Test Events
1. في القائمة اليسرى، اضغط على **"Test Events"**
2. ستفتح صفحة فيها مربع أخضر
3. اترك هذه الصفحة مفتوحة

#### الخطوة 3: اختبار الموقع
1. افتح تاب جديد
2. ادخل على موقعك
3. جرب عملية شراء وهمية:
   - اختر منتج
   - اضغط على زر الدفع
   - اضغط "تأكيد الطلب"

#### الخطوة 4: شاهد النتائج
ارجع لصفحة Test Events، يجب أن ترى:

```
🟢 PageView
   Time: Just now
   Browser: Chrome
   
🟢 Purchase
   Time: Just now
   Value: 1200
   Currency: DZD
   Product: ChatGPT Business
```

#### 🎯 إذا رأيت الـ Events تظهر مباشرة = الكود يشتغل ممتاز! ✅

---

### ✅ الطريقة 3: Console في المتصفح (للمحترفين)

1. افتح موقعك
2. اضغط **F12** على الكيبورد
3. اذهب إلى تاب **"Console"**
4. اكتب: `fbq`
5. اضغط **Enter**

**يجب أن ترى:**
```javascript
ƒ fbq() { [native code] }
```

**هذا يعني الـ Pixel محمل صح ✅**

---

## الجزء الثاني: كيف تشوف الأشخاص اللي اشتروا أكثر؟

### 📊 الطريقة 1: Facebook Events Manager (البيانات الأساسية)

#### الخطوة 1: الدخول للـ Dashboard
1. اذهب إلى: https://business.facebook.com/events_manager2
2. اختر الـ Pixel بتاعك
3. ستشوف Dashboard فيه:

#### ما ستراه:
```
📈 Overview (نظرة عامة)
├── Total Events: 150 (إجمالي الأحداث)
├── PageView: 120 (زيارات الصفحة)
├── Purchase: 30 (عمليات الشراء)
└── Value: 90,000 DZD (إجمالي المبيعات)
```

#### الخطوة 2: تفاصيل المبيعات
1. اضغط على **"Purchase"** في القائمة
2. ستشوف جدول فيه:
   - **Date**: تاريخ كل عملية شراء
   - **Value**: قيمة كل عملية
   - **Currency**: العملة (DZD أو USD)
   - **Content Name**: اسم المنتج

#### مثال:
```
Date          | Value  | Currency | Product
------------- | ------ | -------- | -------------------
Dec 3, 2025   | 1200   | DZD      | ChatGPT Business
Dec 3, 2025   | 3750   | DZD      | The Real World
Dec 3, 2025   | 15     | USD      | ChatGPT Business
```

---

### 📊 الطريقة 2: Facebook Ads Manager (التحليل المتقدم)

#### الخطوة 1: الدخول إلى Ads Manager
1. اذهب إلى: https://business.facebook.com/adsmanager
2. اضغط على **"Columns"** في الأعلى
3. اختر **"Customize Columns"**

#### الخطوة 2: إضافة أعمدة التحليل
اختر هذه الأعمدة:
- ✅ **Purchases** (عدد المبيعات)
- ✅ **Purchase Conversion Value** (قيمة المبيعات)
- ✅ **Cost per Purchase** (تكلفة كل عملية شراء)
- ✅ **ROAS** (العائد على الإنفاق الإعلاني)

#### الخطوة 3: تحليل البيانات
ستشوف جدول مثل هذا:

```
Campaign      | Purchases | Value    | Cost/Purchase | ROAS
------------- | --------- | -------- | ------------- | ----
ChatGPT Ads   | 15        | 18,000   | 200 DZD       | 9.0x
Adobe Ads     | 10        | 30,000   | 300 DZD       | 10.0x
TRW Ads       | 8         | 30,000   | 400 DZD       | 7.5x
```

**التفسير:**
- **ChatGPT Ads**: باع 15 مرة، كل عملية شراء كلفتك 200 دج
- **Adobe Ads**: باع 10 مرات، أفضل ROAS (عائد أعلى)
- **TRW Ads**: باع 8 مرات، تكلفة أعلى شوية

---

### 📊 الطريقة 3: Breakdown (التفصيل حسب الفئات)

#### في Ads Manager:
1. اضغط على **"Breakdown"**
2. اختر واحد من:

#### أ) حسب المنتج (Content Name)
```
Product              | Purchases | Value
-------------------- | --------- | --------
ChatGPT Business     | 20        | 24,000
Adobe Creative Cloud | 15        | 45,000
The Real World       | 10        | 37,500
```
**👆 هنا تعرف أي منتج يبيع أكثر!**

#### ب) حسب العمر (Age)
```
Age Group | Purchases | Value
--------- | --------- | --------
18-24     | 15        | 18,000
25-34     | 20        | 60,000  ← الأكثر شراءً
35-44     | 10        | 28,500
```
**👆 هنا تعرف أي فئة عمرية تشتري أكثر!**

#### ج) حسب الجنس (Gender)
```
Gender | Purchases | Value
------ | --------- | --------
Male   | 30        | 90,000  ← الرجال يشترون أكثر
Female | 15        | 16,500
```

#### د) حسب المكان (Region)
```
Region  | Purchases | Value
------- | --------- | --------
Algiers | 25        | 75,000  ← العاصمة الأكثر
Oran    | 10        | 30,000
Annaba  | 5         | 15,000
```

---

### 📊 الطريقة 4: Facebook Analytics (التحليل العميق)

#### الخطوة 1: إنشاء Custom Report
1. في Events Manager، اضغط **"Reports"**
2. اضغط **"Create Custom Report"**
3. اختر:
   - **Event**: Purchase
   - **Breakdown**: Content Name (اسم المنتج)
   - **Date Range**: Last 30 Days

#### الخطوة 2: إضافة Metrics
اختر:
- Total Purchase Value (إجمالي قيمة المبيعات)
- Purchase Count (عدد المبيعات)
- Average Purchase Value (متوسط قيمة الشراء)

#### النتيجة:
```
Product              | Count | Total Value | Avg Value
-------------------- | ----- | ----------- | ---------
ChatGPT Business     | 50    | 60,000 DZD  | 1,200 DZD
Adobe Creative Cloud | 30    | 90,000 DZD  | 3,000 DZD
The Real World       | 25    | 93,750 DZD  | 3,750 DZD
Gamma.AI             | 15    | 18,000 DZD  | 1,200 DZD
```

**👆 من هنا تعرف:**
- أي منتج يبيع أكثر (Count)
- أي منتج يجيب فلوس أكثر (Total Value)
- أي منتج سعره أعلى (Avg Value)

---

## 🎯 ملخص سريع: كيف تعرف الأشخاص اللي يشتروا أكثر؟

### 1️⃣ حسب المنتج
**Ads Manager → Breakdown → Content Name**
- تشوف أي منتج يبيع أكثر

### 2️⃣ حسب العمر
**Ads Manager → Breakdown → Age**
- تشوف أي فئة عمرية تشتري أكثر

### 3️⃣ حسب الجنس
**Ads Manager → Breakdown → Gender**
- تشوف الرجال ولا النساء يشتروا أكثر

### 4️⃣ حسب المكان
**Ads Manager → Breakdown → Region**
- تشوف أي ولاية تشتري أكثر

### 5️⃣ حسب الجهاز
**Ads Manager → Breakdown → Device**
- تشوف الناس تشتري من الموبايل ولا الكمبيوتر

---

## 💡 نصائح مهمة

### ⚠️ ملاحظة 1: البيانات تحتاج وقت
- أول 24 ساعة: بيانات قليلة
- بعد أسبوع: بيانات أوضح
- بعد شهر: بيانات دقيقة جداً

### ⚠️ ملاحظة 2: الخصوصية
- Facebook لا يعطيك أسماء الأشخاص
- فقط بيانات عامة (عمر، جنس، مكان)
- هذا لحماية خصوصية العملاء

### ⚠️ ملاحظة 3: الحد الأدنى للبيانات
- تحتاج على الأقل 50 تحويل في 7 أيام
- بعدها Facebook يبدأ يعطيك تحليلات متقدمة

---

## 🚀 الخطوات العملية الآن

### 1. اختبر الـ Pixel (5 دقائق)
- ثبت Meta Pixel Helper
- افتح موقعك
- جرب عملية شراء
- تأكد أن الـ Events تظهر

### 2. انتظر البيانات (24-48 ساعة)
- شغل إعلانات
- اجمع زوار
- دع Facebook يجمع بيانات

### 3. راجع التحليلات (يومياً)
- افتح Events Manager
- شوف عدد المبيعات
- شوف أي منتج يبيع أكثر
- حسن إعلاناتك بناءً على البيانات

---

## ✅ Checklist سريع

- [ ] ثبتت Meta Pixel Helper
- [ ] اختبرت الموقع وشفت PageView
- [ ] جربت عملية شراء وشفت Purchase Event
- [ ] دخلت Events Manager وشفت البيانات
- [ ] عرفت كيف أشوف Breakdown حسب المنتج
- [ ] عرفت كيف أشوف Breakdown حسب العمر والجنس
- [ ] جاهز لتشغيل إعلانات Sales!

---

**تذكر**: البيانات = قوة! كل ما جمعت بيانات أكثر، كل ما إعلاناتك تكون أذكى وأرخص! 📊🚀
