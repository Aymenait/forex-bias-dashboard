# 🔥 إعداد Firebase - خطوات مهمة

## ✅ تم إضافة Firebase للموقع بنجاح!

الآن يجب عليك تحديث قواعد الأمان في Firebase:

## 📋 الخطوات:

### 1. اذهب إلى Firebase Console
https://console.firebase.google.com/project/the-real-world-review/firestore

### 2. اضغط على "Rules" (القواعد)

### 3. استبدل القواعد الموجودة بهذا الكود:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if true;
      allow delete: if false; // Only admin can delete (from code)
      allow update: if false;
    }
  }
}
```

### 4. اضغط "Publish" (نشر)

---

## 🎯 ماذا تفعل هذه القواعد؟

- ✅ **القراءة**: أي شخص يمكنه رؤية التقييمات
- ✅ **الإضافة**: أي شخص يمكنه إضافة تقييم
- ❌ **الحذف**: فقط من خلال كود الموقع (محمي بكلمة مرور)
- ❌ **التعديل**: ممنوع تعديل التقييمات

---

## 🔐 الأمان:

- كلمة مرور الإدارة: **AYMEN2004**
- للدخول: اضغط 3 مرات على "⭐ تقييمات العملاء"

---

## ✨ الميزات الجديدة:

1. ✅ التقييمات تُحفظ في قاعدة بيانات Firebase
2. ✅ جميع الزوار يرون نفس التقييمات
3. ✅ التقييمات لا تُحذف عند مسح الكاش
4. ✅ تحديث فوري (Real-time)
5. ✅ آمن ومحمي

---

## 🚀 جاهز للاستخدام!

بعد تحديث القواعد، افتح الموقع وجرّب:
1. إضافة تقييم جديد
2. افتح الموقع من متصفح آخر - ستجد التقييم موجود!
3. للحذف: اضغط 3 مرات على العنوان وأدخل كلمة المرور

---

## 📊 مراقبة التقييمات:

يمكنك رؤية جميع التقييمات في Firebase Console:
https://console.firebase.google.com/project/the-real-world-review/firestore/data

---

## ⚠️ ملاحظة مهمة:

إذا كنت تستخدم "Test Mode" في Firestore، ستنتهي صلاحيته بعد 30 يوم.
يجب عليك تحديث القواعد قبل انتهاء المدة.
