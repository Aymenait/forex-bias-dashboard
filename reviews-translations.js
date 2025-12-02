// Reviews Page Translations
const reviewsTranslations = {
    ar: {
        'back.home': 'الرئيسية',
        'title': 'آراء عملائنا',
        'subtitle': 'تقييمات حقيقية من عملاء راضين عن خدماتنا',
        'stats.reviews': 'تقييم',
        'stats.average': 'متوسط التقييم',
        'stats.products': 'منتجات',
        'filter.all': 'الكل',
        'filter.trw': 'The Real World',
        'filter.chatgpt': 'ChatGPT Business',
        'filter.adobe': 'Adobe Creative Cloud',
        'loading': 'جاري تحميل التقييمات...',
        'no.reviews': 'لا توجد تقييمات بعد',
        'show.more': 'عرض المزيد',
        'platform.client': 'عميل',
        'date.today': 'اليوم',
        'date.yesterday': 'أمس',
        'date.days': 'منذ {0} أيام',
        'date.weeks': 'منذ {0} أسابيع',
        'date.months': 'منذ {0} شهر'
    },
    en: {
        'back.home': 'Home',
        'title': 'Customer Reviews',
        'subtitle': 'Real reviews from satisfied customers',
        'stats.reviews': 'Reviews',
        'stats.average': 'Average Rating',
        'stats.products': 'Products',
        'filter.all': 'All',
        'filter.trw': 'The Real World',
        'filter.chatgpt': 'ChatGPT Business',
        'filter.adobe': 'Adobe Creative Cloud',
        'loading': 'Loading reviews...',
        'no.reviews': 'No reviews yet',
        'show.more': 'Show More',
        'platform.client': 'Client',
        'date.today': 'Today',
        'date.yesterday': 'Yesterday',
        'date.days': '{0} days ago',
        'date.weeks': '{0} weeks ago',
        'date.months': '{0} months ago'
    },
    fr: {
        'back.home': 'Accueil',
        'title': 'Avis Clients',
        'subtitle': 'Avis réels de clients satisfaits',
        'stats.reviews': 'Avis',
        'stats.average': 'Note Moyenne',
        'stats.products': 'Produits',
        'filter.all': 'Tous',
        'filter.trw': 'The Real World',
        'filter.chatgpt': 'ChatGPT Business',
        'filter.adobe': 'Adobe Creative Cloud',
        'loading': 'Chargement des avis...',
        'no.reviews': 'Aucun avis pour le moment',
        'show.more': 'Voir Plus',
        'platform.client': 'Client',
        'date.today': 'Aujourd\'hui',
        'date.yesterday': 'Hier',
        'date.days': 'Il y a {0} jours',
        'date.weeks': 'Il y a {0} semaines',
        'date.months': 'Il y a {0} mois'
    }
};

// Current language
let currentLang = 'ar';

// Translate function
function translate(key) {
    return reviewsTranslations[currentLang][key] || key;
}

// Change language
function changeLanguage(lang) {
    currentLang = lang;
    
    // Update HTML lang and dir
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update all translatable elements
    updatePageTranslations();
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    // Save preference
    localStorage.setItem('preferredLanguage', lang);
}

// Update all page translations
function updatePageTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = translate(key);
    });
    
    // Reload reviews to update date format
    if (window.allReviews && window.allReviews.length > 0) {
        displayedReviews = 0;
        document.getElementById('reviews-container').innerHTML = '';
        displayReviews();
    }
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'ar';
    changeLanguage(savedLang);
});
