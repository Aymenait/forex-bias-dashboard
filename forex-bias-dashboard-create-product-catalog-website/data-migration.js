/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Data Migration Script - 3Ahub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * سكريبت ترحيل البيانات من index.html إلى Firebase products_v2 collection
 * يقرأ المنتجات الحالية ويحولها إلى الهيكل الجديد
 * 
 * Requirements: 1.1
 */

// ═══════════════════════════════════════════════════════════════════════════
// بيانات المنتجات الحالية من index.html
// ═══════════════════════════════════════════════════════════════════════════

/**
 * المنتجات الحالية المستخرجة من index.html
 * تم تحويلها إلى الهيكل الجديد المطلوب
 */
const CURRENT_PRODUCTS = [
    {
        id: 'trw',
        name: {
            ar: 'The Real World Account',
            en: 'The Real World Account',
            fr: 'Compte The Real World'
        },
        description: {
            ar: 'حساب مشترك للكورسات ومنصة The Real World، مع دعم فني وضمان كامل.',
            en: 'Shared account for courses and The Real World platform, with technical support and full guarantee.',
            fr: 'Compte partagé pour les cours et la plateforme The Real World, avec support technique et garantie complète.'
        },
        mediaUrl: 'https://i.imgur.com/hEiJhso.gif',
        mediaType: 'image',
        priceDZD: 3750,
        priceUSD: 15,
        availability: 'available',
        features: [
            {
                id: 'trw_f1',
                text: {
                    ar: 'دخول لجميع الكورسات الحالية',
                    en: 'Access to all current courses',
                    fr: 'Accès à tous les cours actuels'
                },
                order: 0
            },
            {
                id: 'trw_f2',
                text: {
                    ar: 'تحديثات دورية ومحتوى جديد',
                    en: 'Regular updates and new content',
                    fr: 'Mises à jour régulières et nouveau contenu'
                },
                order: 1
            },
            {
                id: 'trw_f3',
                text: {
                    ar: 'دعم فني عربي سريع',
                    en: 'Fast Arabic technical support',
                    fr: 'Support technique arabe rapide'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 0,
        isArchived: false,
        landingPage: 'trw_landing.html'
    },
    {
        id: 'adobe',
        name: {
            ar: 'Adobe Creative Cloud',
            en: 'Adobe Creative Cloud',
            fr: 'Adobe Creative Cloud'
        },
        description: {
            ar: 'اشتراك Adobe Creative Cloud يشمل أكثر من 20 تطبيقًا احترافيًا.',
            en: 'Adobe Creative Cloud subscription includes over 20 professional applications.',
            fr: 'L\'abonnement Adobe Creative Cloud comprend plus de 20 applications professionnelles.'
        },
        mediaUrl: 'https://i.imgur.com/my0lNcf.gif',
        mediaType: 'image',
        priceDZD: 1500,
        priceUSD: 6,
        availability: 'available',
        features: [
            {
                id: 'adobe_f1',
                text: {
                    ar: 'أكثر من 20 تطبيق احترافي',
                    en: 'Over 20 professional applications',
                    fr: 'Plus de 20 applications professionnelles'
                },
                order: 0
            },
            {
                id: 'adobe_f2',
                text: {
                    ar: 'تحديثات مجانية طوال فترة الاشتراك',
                    en: 'Free updates throughout subscription',
                    fr: 'Mises à jour gratuites pendant l\'abonnement'
                },
                order: 1
            },
            {
                id: 'adobe_f3',
                text: {
                    ar: 'دعم فني كامل',
                    en: 'Full technical support',
                    fr: 'Support technique complet'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [
            {
                id: 'adobe_shared_1m',
                name: {
                    ar: 'حساب مشترك - شهر واحد',
                    en: 'Shared Account - 1 Month',
                    fr: 'Compte Partagé - 1 Mois'
                },
                priceDZD: 1500,
                priceUSD: 6,
                availability: 'available',
                order: 0
            },
            {
                id: 'adobe_shared_2m',
                name: {
                    ar: 'حساب مشترك - شهرين',
                    en: 'Shared Account - 2 Months',
                    fr: 'Compte Partagé - 2 Mois'
                },
                priceDZD: 2200,
                priceUSD: 9,
                availability: 'available',
                order: 1
            },
            {
                id: 'adobe_shared_3m',
                name: {
                    ar: 'حساب مشترك - 3 أشهر',
                    en: 'Shared Account - 3 Months',
                    fr: 'Compte Partagé - 3 Mois'
                },
                priceDZD: 3000,
                priceUSD: 12,
                availability: 'available',
                order: 2
            },
            {
                id: 'adobe_personal_1m',
                name: {
                    ar: 'حساب شخصي (Keys) - شهر واحد',
                    en: 'Personal Account (Keys) - 1 Month',
                    fr: 'Compte Personnel (Keys) - 1 Mois'
                },
                priceDZD: 3000,
                priceUSD: 12,
                availability: 'available',
                order: 3
            }
        ],
        displayOrder: 1,
        isArchived: false
    },
    {
        id: 'chatgpt',
        name: {
            ar: 'ChatGPT Business',
            en: 'ChatGPT Business',
            fr: 'ChatGPT Business'
        },
        description: {
            ar: 'حسابات ChatGPT Business فردية مع كل مزايا الذكاء الاصطناعي المتقدمة.',
            en: 'Individual ChatGPT Business accounts with all advanced AI features.',
            fr: 'Comptes ChatGPT Business individuels avec toutes les fonctionnalités IA avancées.'
        },
        mediaUrl: 'https://i.imgur.com/FDZBdd9.gif',
        mediaType: 'image',
        priceDZD: 1200,
        priceUSD: 5,
        availability: 'available',
        features: [
            {
                id: 'chatgpt_f1',
                text: {
                    ar: 'وصول إلى GPT الأحدث',
                    en: 'Access to the latest GPT',
                    fr: 'Accès au dernier GPT'
                },
                order: 0
            },
            {
                id: 'chatgpt_f2',
                text: {
                    ar: 'مساحة عمل خاصة وآمنة',
                    en: 'Private and secure workspace',
                    fr: 'Espace de travail privé et sécurisé'
                },
                order: 1
            },
            {
                id: 'chatgpt_f3',
                text: {
                    ar: 'تكامل مع أدواتك المفضلة',
                    en: 'Integration with your favorite tools',
                    fr: 'Intégration avec vos outils préférés'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 2,
        isArchived: false,
        landingPage: 'chatgpt_landing.html'
    },

    {
        id: 'gamma',
        name: {
            ar: 'Gamma.AI',
            en: 'Gamma.AI',
            fr: 'Gamma.AI'
        },
        description: {
            ar: 'منصة ذكاء اصطناعي متقدمة لإنشاء العروض التقديمية والمستندات والمواقع بشكل احترافي.',
            en: 'Advanced AI platform for creating professional presentations, documents, and websites.',
            fr: 'Plateforme IA avancée pour créer des présentations, documents et sites web professionnels.'
        },
        mediaUrl: 'https://i.imgur.com/3d1bbb3.mp4',
        mediaType: 'video',
        priceDZD: 1500,
        priceUSD: 6,
        availability: 'available',
        features: [
            {
                id: 'gamma_f1',
                text: {
                    ar: 'إنشاء عروض تقديمية احترافية بالذكاء الاصطناعي',
                    en: 'Create professional presentations with AI',
                    fr: 'Créer des présentations professionnelles avec l\'IA'
                },
                order: 0
            },
            {
                id: 'gamma_f2',
                text: {
                    ar: 'تصميم مستندات ومواقع تفاعلية',
                    en: 'Design interactive documents and websites',
                    fr: 'Concevoir des documents et sites interactifs'
                },
                order: 1
            },
            {
                id: 'gamma_f3',
                text: {
                    ar: 'قوالب جاهزة وتخصيص كامل',
                    en: 'Ready templates and full customization',
                    fr: 'Modèles prêts et personnalisation complète'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [
            {
                id: 'gamma_shared',
                name: {
                    ar: 'حساب مشترك',
                    en: 'Shared Account',
                    fr: 'Compte Partagé'
                },
                priceDZD: 1500,
                priceUSD: 6,
                availability: 'available',
                order: 0
            },
            {
                id: 'gamma_personal',
                name: {
                    ar: 'حساب شخصي',
                    en: 'Personal Account',
                    fr: 'Compte Personnel'
                },
                priceDZD: 2500,
                priceUSD: 10,
                availability: 'available',
                order: 1
            }
        ],
        displayOrder: 3,
        isArchived: false,
        landingPage: 'gamma_landing.html'
    },
    {
        id: 'netflix',
        name: {
            ar: 'Netflix Premium',
            en: 'Netflix Premium',
            fr: 'Netflix Premium'
        },
        description: {
            ar: 'حساب مشترك مع بروفايل خاص - ضمان 4 أشهر كاملة',
            en: 'Shared account with private profile - 4 months full guarantee',
            fr: 'Compte partagé avec profil privé - Garantie complète de 4 mois'
        },
        mediaUrl: 'https://img.youtube.com/vi/GV3HUDMQ-F8/maxresdefault.jpg',
        mediaType: 'image',
        priceDZD: 1500,
        priceUSD: 6,
        availability: 'available',
        features: [
            {
                id: 'netflix_f1',
                text: {
                    ar: 'حساب مشترك - بروفايل خاص',
                    en: 'Shared account - Private profile',
                    fr: 'Compte partagé - Profil privé'
                },
                order: 0
            },
            {
                id: 'netflix_f2',
                text: {
                    ar: 'جودة 4K Ultra HD',
                    en: '4K Ultra HD quality',
                    fr: 'Qualité 4K Ultra HD'
                },
                order: 1
            },
            {
                id: 'netflix_f3',
                text: {
                    ar: 'يعمل في جميع أنحاء العالم مع VPN',
                    en: 'Works worldwide with VPN',
                    fr: 'Fonctionne dans le monde entier avec VPN'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 4,
        isArchived: false,
        landingPage: 'netflix_landing.html'
    },
    {
        id: 'tradingview',
        name: {
            ar: 'TradingView Premium',
            en: 'TradingView Premium',
            fr: 'TradingView Premium'
        },
        description: {
            ar: 'منصة تحليل فني احترافية للمتداولين مع مؤشرات متقدمة وبيانات في الوقت الفعلي.',
            en: 'Professional technical analysis platform for traders with advanced indicators and real-time data.',
            fr: 'Plateforme d\'analyse technique professionnelle pour traders avec indicateurs avancés et données en temps réel.'
        },
        mediaUrl: 'https://www.tradingview.com/static/images/logo-preview.png',
        mediaType: 'image',
        priceDZD: 1500,
        priceUSD: 6,
        availability: 'available',
        features: [
            {
                id: 'tradingview_f1',
                text: {
                    ar: 'مؤشرات متقدمة غير محدودة',
                    en: 'Unlimited advanced indicators',
                    fr: 'Indicateurs avancés illimités'
                },
                order: 0
            },
            {
                id: 'tradingview_f2',
                text: {
                    ar: 'بيانات في الوقت الفعلي',
                    en: 'Real-time data',
                    fr: 'Données en temps réel'
                },
                order: 1
            },
            {
                id: 'tradingview_f3',
                text: {
                    ar: 'تنبيهات مخصصة وأدوات رسم احترافية',
                    en: 'Custom alerts and professional drawing tools',
                    fr: 'Alertes personnalisées et outils de dessin professionnels'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 5,
        isArchived: false,
        landingPage: 'tradingview_landing.html'
    },
    {
        id: 'perplexity',
        name: {
            ar: 'Perplexity AI Pro',
            en: 'Perplexity AI Pro',
            fr: 'Perplexity AI Pro'
        },
        description: {
            ar: 'محرك بحث ذكي مدعوم بالذكاء الاصطناعي مع إجابات دقيقة ومصادر موثوقة.',
            en: 'AI-powered smart search engine with accurate answers and reliable sources.',
            fr: 'Moteur de recherche intelligent alimenté par l\'IA avec des réponses précises et des sources fiables.'
        },
        mediaUrl: 'https://i.imgur.com/mEy5oXF.mp4',
        mediaType: 'video',
        priceDZD: 800,
        priceUSD: 3.2,
        availability: 'available',
        features: [
            {
                id: 'perplexity_f1',
                text: {
                    ar: 'بحث ذكي بالذكاء الاصطناعي',
                    en: 'AI-powered smart search',
                    fr: 'Recherche intelligente par IA'
                },
                order: 0
            },
            {
                id: 'perplexity_f2',
                text: {
                    ar: 'إجابات مع مصادر موثوقة',
                    en: 'Answers with reliable sources',
                    fr: 'Réponses avec sources fiables'
                },
                order: 1
            },
            {
                id: 'perplexity_f3',
                text: {
                    ar: 'استخدام غير محدود للنماذج المتقدمة',
                    en: 'Unlimited use of advanced models',
                    fr: 'Utilisation illimitée des modèles avancés'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 6,
        isArchived: false,
        landingPage: 'perplexity_landing.html'
    },

    {
        id: 'canva',
        name: {
            ar: 'Canva Pro',
            en: 'Canva Pro',
            fr: 'Canva Pro'
        },
        description: {
            ar: 'اشتراك Canva Pro الكامل مع جميع المميزات الاحترافية للتصميم والإبداع.',
            en: 'Full Canva Pro subscription with all professional design and creative features.',
            fr: 'Abonnement Canva Pro complet avec toutes les fonctionnalités professionnelles de design et création.'
        },
        mediaUrl: 'https://i.imgur.com/DvPmjNv.mp4',
        mediaType: 'video',
        priceDZD: 600,
        priceUSD: 3,
        availability: 'available',
        features: [
            {
                id: 'canva_f1',
                text: {
                    ar: 'الوصول لجميع القوالب المميزة',
                    en: 'Access to all premium templates',
                    fr: 'Accès à tous les modèles premium'
                },
                order: 0
            },
            {
                id: 'canva_f2',
                text: {
                    ar: 'إزالة الخلفية بنقرة واحدة',
                    en: 'One-click background removal',
                    fr: 'Suppression de fond en un clic'
                },
                order: 1
            },
            {
                id: 'canva_f3',
                text: {
                    ar: '100GB تخزين سحابي',
                    en: '100GB cloud storage',
                    fr: '100GB de stockage cloud'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 7,
        isArchived: false,
        landingPage: 'canva_landing.html'
    },
    {
        id: 'capcut',
        name: {
            ar: 'CapCut Pro',
            en: 'CapCut Pro',
            fr: 'CapCut Pro'
        },
        description: {
            ar: 'محرر فيديو احترافي مع مميزات الذكاء الاصطناعي وأدوات التحرير المتقدمة.',
            en: 'Professional video editor with AI features and advanced editing tools.',
            fr: 'Éditeur vidéo professionnel avec fonctionnalités IA et outils d\'édition avancés.'
        },
        mediaUrl: 'https://i.imgur.com/ZpMzFGa.mp4',
        mediaType: 'video',
        priceDZD: 1200,
        priceUSD: 6,
        availability: 'available',
        features: [
            {
                id: 'capcut_f1',
                text: {
                    ar: 'تحرير فيديو بالذكاء الاصطناعي',
                    en: 'AI-powered video editing',
                    fr: 'Montage vidéo par IA'
                },
                order: 0
            },
            {
                id: 'capcut_f2',
                text: {
                    ar: 'إزالة الخلفية والمؤثرات المتقدمة',
                    en: 'Background removal and advanced effects',
                    fr: 'Suppression de fond et effets avancés'
                },
                order: 1
            },
            {
                id: 'capcut_f3',
                text: {
                    ar: 'تصدير بجودة 4K بدون علامة مائية',
                    en: '4K export without watermark',
                    fr: 'Export 4K sans filigrane'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [],
        displayOrder: 8,
        isArchived: false,
        landingPage: 'capcut_landing.html'
    },
    {
        id: 'cursor',
        name: {
            ar: 'Cursor AI',
            en: 'Cursor AI',
            fr: 'Cursor AI'
        },
        description: {
            ar: 'محرر أكواد ذكي مدعوم بالذكاء الاصطناعي.',
            en: 'AI-powered smart code editor.',
            fr: 'Éditeur de code intelligent alimenté par l\'IA.'
        },
        mediaUrl: 'https://cursor.com/favicon.svg',
        mediaType: 'image',
        priceDZD: 2500,
        priceUSD: 10,
        availability: 'coming_soon',
        features: [
            {
                id: 'cursor_f1',
                text: {
                    ar: 'إكمال تلقائي ذكي للكود',
                    en: 'Smart code auto-completion',
                    fr: 'Auto-complétion intelligente du code'
                },
                order: 0
            },
            {
                id: 'cursor_f2',
                text: {
                    ar: 'دعم متعدد اللغات البرمجية',
                    en: 'Multi-language support',
                    fr: 'Support multi-langages'
                },
                order: 1
            },
            {
                id: 'cursor_f3',
                text: {
                    ar: 'تصحيح وتحسين الكود بالذكاء الاصطناعي',
                    en: 'AI code correction and optimization',
                    fr: 'Correction et optimisation du code par IA'
                },
                order: 2
            }
        ],
        paymentMethods: {
            usdt: true,
            redotpay: true,
            baridimob: true
        },
        subOffers: [
            {
                id: 'cursor_7days',
                name: {
                    ar: '7 DAYS TRIAL',
                    en: '7 DAYS TRIAL',
                    fr: '7 JOURS D\'ESSAI'
                },
                priceDZD: 0,
                priceUSD: 0,
                availability: 'coming_soon',
                order: 0
            },
            {
                id: 'cursor_30days',
                name: {
                    ar: '30 D PRO SHARED',
                    en: '30 D PRO SHARED',
                    fr: '30 J PRO PARTAGÉ'
                },
                priceDZD: 2500,
                priceUSD: 10,
                availability: 'coming_soon',
                order: 1
            }
        ],
        displayOrder: 9,
        isArchived: false
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// دوال الترحيل - Migration Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الحصول على قائمة المنتجات للترحيل
 * @returns {Array} قائمة المنتجات
 */
function getProductsForMigration() {
    return CURRENT_PRODUCTS.map(product => ({
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
}

/**
 * ترحيل جميع المنتجات إلى Firebase
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules (doc, setDoc, serverTimestamp)
 * @returns {Promise<Object>} نتيجة الترحيل {success: number, failed: number, errors: Array}
 */
async function migrateAllProducts(db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    const { doc, setDoc, serverTimestamp } = firebaseModules;
    const products = getProductsForMigration();
    const results = {
        success: 0,
        failed: 0,
        errors: [],
        migratedIds: []
    };

    console.log('بدء ترحيل', products.length, 'منتج...');

    for (const product of products) {
        try {
            const productData = {
                name: product.name,
                description: product.description,
                mediaUrl: product.mediaUrl,
                mediaType: product.mediaType,
                priceDZD: product.priceDZD,
                priceUSD: product.priceUSD,
                availability: product.availability,
                features: product.features,
                paymentMethods: product.paymentMethods,
                subOffers: product.subOffers,
                displayOrder: product.displayOrder,
                isArchived: product.isArchived,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add optional landingPage if exists
            if (product.landingPage) {
                productData.landingPage = product.landingPage;
            }

            const docRef = doc(db, 'products_v2', product.id);
            await setDoc(docRef, productData);

            results.success++;
            results.migratedIds.push(product.id);
            console.log('✓ تم ترحيل:', product.id, '-', product.name.ar);

        } catch (error) {
            results.failed++;
            results.errors.push({
                productId: product.id,
                error: error.message
            });
            console.error('✗ فشل ترحيل:', product.id, '-', error.message);
        }
    }

    console.log('اكتمل الترحيل:', results.success, 'نجح,', results.failed, 'فشل');
    return results;
}

/**
 * ترحيل منتج واحد إلى Firebase
 * @param {string} productId - معرف المنتج للترحيل
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<boolean>} true إذا نجح الترحيل
 */
async function migrateProduct(productId, db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    const product = CURRENT_PRODUCTS.find(p => p.id === productId);
    if (!product) {
        throw new Error('المنتج غير موجود: ' + productId);
    }

    const { doc, setDoc, serverTimestamp } = firebaseModules;

    const productData = {
        name: product.name,
        description: product.description,
        mediaUrl: product.mediaUrl,
        mediaType: product.mediaType,
        priceDZD: product.priceDZD,
        priceUSD: product.priceUSD,
        availability: product.availability,
        features: product.features,
        paymentMethods: product.paymentMethods,
        subOffers: product.subOffers,
        displayOrder: product.displayOrder,
        isArchived: product.isArchived,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (product.landingPage) {
        productData.landingPage = product.landingPage;
    }

    const docRef = doc(db, 'products_v2', product.id);
    await setDoc(docRef, productData);

    console.log('تم ترحيل المنتج:', productId);
    return true;
}

/**
 * التحقق من وجود منتجات في Firebase
 * @param {Object} db - Firebase Firestore instance
 * @param {Object} firebaseModules - Firebase modules
 * @returns {Promise<Array>} قائمة معرفات المنتجات الموجودة
 */
async function checkExistingProducts(db, firebaseModules) {
    if (!db || !firebaseModules) {
        throw new Error('Firebase غير متاح');
    }

    const { collection, getDocs } = firebaseModules;
    const querySnapshot = await getDocs(collection(db, 'products_v2'));
    const existingIds = [];

    querySnapshot.forEach((docItem) => {
        existingIds.push(docItem.id);
    });

    return existingIds;
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير الوحدات - Exports
// ═══════════════════════════════════════════════════════════════════════════

// للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.DataMigration = {
        CURRENT_PRODUCTS,
        getProductsForMigration,
        migrateAllProducts,
        migrateProduct,
        checkExistingProducts
    };
}

// ES Module exports للاستخدام في Node.js (للاختبارات)
// يتم تجاهلها في المتصفح
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CURRENT_PRODUCTS,
        getProductsForMigration,
        migrateAllProducts,
        migrateProduct,
        checkExistingProducts
    };
}
