# قالب صفحات المنتجات الموحد

## الاستخدام

جميع صفحات Landing Pages يجب أن تستخدم `landing-pages.css` بدلاً من Tailwind أو CSS مخصص.

## البنية الأساسية

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اسم المنتج - 3Ahub</title>
    
    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- CSS الموحد -->
    <link rel="stylesheet" href="landing-pages.css">
    
    <!-- Particles.js -->
    <script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
</head>
<body class="product-[PRODUCT_NAME]">
    <!-- Particles -->
    <div id="particles-js"></div>
    
    <!-- Navigation -->
    <nav class="landing-nav">
        <div class="landing-nav-content">
            <a href="index.html" class="back-home-btn">
                ← الرئيسية
            </a>
            <div class="lang-switcher">
                <button class="lang-btn active" data-lang="ar">العربية</button>
                <button class="lang-btn" data-lang="en">English</button>
                <button class="lang-btn" data-lang="fr">Français</button>
            </div>
        </div>
    </nav>
    
    <!-- Hero Section -->
    <section class="landing-hero">
        <img src="[LOGO_URL]" alt="[PRODUCT_NAME]" class="product-logo">
        <h1 data-i18n="hero.title">اسم المنتج</h1>
        <p class="subtitle" data-i18n="hero.subtitle">وصف المنتج</p>
        <p class="price" data-i18n="hero.price">السعر</p>
        
        <!-- Payment Methods -->
        <div class="payment-methods">
            <div class="payment-method-btn">
                <div class="payment-icon" style="background: #dc2626;">
                    <span>Redot</span>
                </div>
                <span class="payment-label">RedotPay</span>
            </div>
            <!-- المزيد من طرق الدفع -->
        </div>
        
        <!-- CTA Button -->
        <a href="https://wa.me/213782125821" class="cta-button pulse" data-i18n="cta.button">
            اطلب الآن عبر WhatsApp
        </a>
    </section>
    
    <!-- Features Section -->
    <section class="features-section">
        <h2 style="text-align: center; font-size: 2rem; margin-bottom: 20px;" data-i18n="features.title">المميزات</h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3 class="feature-title">ميزة 1</h3>
                <p class="feature-desc">وصف الميزة</p>
            </div>
            <!-- المزيد من المميزات -->
        </div>
    </section>
    
    <!-- Scripts -->
    <script>
        // Initialize particles
        particlesJS('particles-js', {
            particles: {
                number: { value: 50 },
                color: { value: '#ffd56f' },
                // ... config
            }
        });
    </script>
</body>
</html>
```

## ألوان المنتجات

- **ChatGPT**: `product-chatgpt` - أخضر `#10a37f`
- **Adobe**: `product-adobe` - أحمر `#ff0000`
- **TRW**: `product-trw` - أخضر فاتح `#39ff14`
- **Netflix**: `product-netflix` - أحمر `#e50914`
- **TradingView**: `product-tradingview` - أزرق `#2962FF`
- **Perplexity**: `product-perplexity` - أزرق فاتح `#1FB6FF`

## الملفات المحدثة

- ✅ `landing-pages.css` - CSS موحد لجميع صفحات المنتجات
- ⏳ `chatgpt_landing.html` - سيتم تحديثه لاحقاً
- ⏳ `trw_landing.html` - سيتم تحديثه لاحقاً
- ⏳ `netflix_landing.html` - سيتم تحديثه لاحقاً
