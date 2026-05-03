# رسائل WhatsApp متعددة اللغات

## التحديث
تم تحديث جميع رسائل WhatsApp لتدعم ثلاث لغات (العربية، الإنجليزية، الفرنسية) بناءً على اللغة المختارة في الموقع.

## الدوال المحدثة

### 1. دالة `orderProduct()`
رسالة طلب المنتجات العامة (The Real World، ChatGPT، Netflix، Perplexity)

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

### 2. دالة `orderAdobe()`
رسالة طلب Adobe Creative Cloud (مع نوع الحساب)

**العربية:**
```
مرحباً 👋
أريد طلب: Adobe Creative Cloud - Shared/Personal

شكراً 🙏
```

**English:**
```
Hello 👋
I would like to order: Adobe Creative Cloud - Shared/Personal

Thank you 🙏
```

**Français:**
```
Bonjour 👋
Je voudrais commander: Adobe Creative Cloud - Shared/Personal

Merci 🙏
```

### 3. دالة `orderGamma()`
رسالة طلب Gamma.AI (مع نوع الحساب)

**العربية:**
```
مرحباً 👋
أريد طلب: Gamma.AI - Shared/Personal

شكراً 🙏
```

**English:**
```
Hello 👋
I would like to order: Gamma.AI - Shared/Personal

Thank you 🙏
```

**Français:**
```
Bonjour 👋
Je voudrais commander: Gamma.AI - Shared/Personal

Merci 🙏
```

### 4. دالة `confirmCryptoPayment()`
رسالة تأكيد الدفع بالكريبتو

**العربية:**
```
مرحباً 👋
قمت بالدفع بالكريبتو:

📦 المنتج: [اسم المنتج]
💰 المبلغ: [المبلغ] USDT
🔗 الشبكة: [TRC20/BEP20]

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك! 🙏
```

**English:**
```
Hello 👋
I have paid with crypto:

📦 Product: [Product Name]
💰 Amount: [Amount] USDT
🔗 Network: [TRC20/BEP20]

Please verify the payment and send the account to:
📧 Email: [Enter your email here]

Thank you! 🙏
```

**Français:**
```
Bonjour 👋
J'ai payé avec crypto:

📦 Produit: [Nom du produit]
💰 Montant: [Montant] USDT
🔗 Réseau: [TRC20/BEP20]

Veuillez vérifier le paiement et envoyer le compte à:
📧 Email: [Entrez votre email ici]

Merci! 🙏
```

### 5. دالة `confirmRedotPayPayment()`
رسالة تأكيد الدفع عبر RedotPay

**العربية:**
```
مرحباً 👋
قمت بالدفع عبر RedotPay:

📦 المنتج: [اسم المنتج]
💰 المبلغ: [المبلغ] USD
💳 RedotPay ID: 1117632168

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك! 🙏
```

**English:**
```
Hello 👋
I have paid via RedotPay:

📦 Product: [Product Name]
💰 Amount: [Amount] USD
💳 RedotPay ID: 1117632168

Please verify the payment and send the account to:
📧 Email: [Enter your email here]

Thank you! 🙏
```

**Français:**
```
Bonjour 👋
J'ai payé via RedotPay:

📦 Produit: [Nom du produit]
💰 Montant: [Montant] USD
💳 RedotPay ID: 1117632168

Veuillez vérifier le paiement et envoyer le compte à:
📧 Email: [Entrez votre email ici]

Merci! 🙏
```

### 6. دالة `confirmBaridiMobPayment()`
رسالة تأكيد الدفع عبر BaridiMob

**العربية:**
```
مرحباً 👋
قمت بالدفع عبر BaridiMob:

📦 المنتج: [اسم المنتج]
💰 المبلغ: [المبلغ] DZD
💳 RIP: 00799999002787548473

يرجى التحقق من الدفع وإرسال الحساب إلى:
📧 الإيميل: [أدخل إيميلك هنا]

شكراً لك! 🙏
```

**English:**
```
Hello 👋
I have paid via BaridiMob:

📦 Product: [Product Name]
💰 Amount: [Amount] DZD
💳 RIP: 00799999002787548473

Please verify the payment and send the account to:
📧 Email: [Enter your email here]

Thank you! 🙏
```

**Français:**
```
Bonjour 👋
J'ai payé via BaridiMob:

📦 Produit: [Nom du produit]
💰 Montant: [Montant] DZD
💳 RIP: 00799999002787548473

Veuillez vérifier le paiement et envoyer le compte à:
📧 Email: [Entrez votre email ici]

Merci! 🙏
```

### 7. دوال النسخ (Copy Functions)
تم تحديث نصوص "تم النسخ" في:
- `copyWalletAddress()`
- `copyRedotPayID()`
- `copyBaridiMobRIP()`

**النصوص:**
- العربية: "تم النسخ"
- English: "Copied"
- Français: "Copié"

## كيفية العمل

1. عندما يختار المستخدم لغة من قائمة اللغات في الموقع، يتم تحديث المتغير `currentLang`
2. عند الضغط على زر "اطلب الآن" أو تأكيد الدفع، يتم اختيار الرسالة المناسبة بناءً على `currentLang`
3. يتم فتح WhatsApp مع الرسالة بالغة المختارة

## الملفات المعدلة
- `script.js` - تحديث جميع دوال الطلب والدفع

## الاختبار

1. افتح الموقع
2. اختر لغة من قائمة اللغات (العربية / English / Français)
3. اضغط على "اطلب الآن" لأي منتج
4. تحقق من أن رسالة WhatsApp بنفس اللغة المختارة
5. جرب أيضاً أزرار الدفع (USDT، RedotPay، BaridiMob)

## النتيجة
✅ جميع رسائل WhatsApp تدعم الآن ثلاث لغات
✅ الرسالة تتغير تلقائياً حسب اللغة المختارة
✅ تجربة مستخدم أفضل للعملاء الدوليين
