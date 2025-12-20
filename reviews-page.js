// Reviews Page JavaScript
// Note: currentLang is defined in reviews-translations.js

let allReviews = [];
let displayedReviews = 0;
const reviewsPerPage = 12;
let currentFilter = 'all';
let selectedImageBase64 = null; // لتخزين الصورة المحددة

// Open Add Review Modal
window.openAddReviewModal = function() {
    const modal = document.getElementById('add-review-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.classList.add('flex');
    }
};

// Close Add Review Modal
window.closeAddReviewModal = function() {
    const modal = document.getElementById('add-review-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('show');
        modal.classList.remove('flex');
        
        // Reset form
        const form = document.getElementById('add-review-form');
        if (form) form.reset();
        
        // Reset rating
        const ratingInput = document.getElementById('review-rating');
        if (ratingInput) ratingInput.value = '';
        
        // Reset stars
        document.querySelectorAll('.star-input').forEach(star => {
            star.textContent = '☆';
            star.style.color = 'var(--text-secondary)';
            star.classList.remove('text-yellow-400');
            star.classList.add('text-gray-300');
        });
        
        // Reset image
        removeSelectedImage();
    }
}

// إزالة الصورة المحددة
window.removeSelectedImage = function() {
    selectedImageBase64 = null;
    const imageInput = document.getElementById('review-image');
    const previewContainer = document.getElementById('image-preview-container');
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    
    if (imageInput) imageInput.value = '';
    if (preview) preview.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
}

// معالجة اختيار الصورة
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        alert(currentLang === 'ar' ? 'الرجاء اختيار صورة فقط' : 
              currentLang === 'fr' ? 'Veuillez sélectionner une image uniquement' : 
              'Please select an image only');
        return;
    }
    
    // التحقق من حجم الملف (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        alert(currentLang === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 2MB' : 
              currentLang === 'fr' ? 'La taille de l\'image doit être inférieure à 2 Mo' : 
              'Image size must be less than 2MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImageBase64 = e.target.result;
        
        const previewContainer = document.getElementById('image-preview-container');
        const placeholder = document.getElementById('image-upload-placeholder');
        const preview = document.getElementById('image-preview');
        
        if (preview) preview.src = selectedImageBase64;
        if (previewContainer) previewContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Close modal when clicking on backdrop
window.closeAddReviewModalOnBackdrop = function(event) {
    if (event.target.id === 'add-review-modal') {
        window.closeAddReviewModal();
    }
};

// Initialize star rating
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reviews page loaded');
    
    // إضافة مستمع لحقل الصورة
    const imageInput = document.getElementById('review-image');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelect);
    }
    
    // Add event listener to Add Review button
    const addReviewBtn = document.getElementById('add-review-btn');
    console.log('Add Review Button:', addReviewBtn);
    
    if (addReviewBtn) {
        console.log('Adding click event listener to button');
        addReviewBtn.addEventListener('click', function() {
            console.log('Button clicked!');
            window.openAddReviewModal();
        });
    } else {
        console.error('Add Review Button not found!');
    }
    
    const starInputs = document.querySelectorAll('.star-input');
    
    starInputs.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            document.getElementById('review-rating').value = rating;
            
            // Update star display
            starInputs.forEach((s, index) => {
                if (index < rating) {
                    s.textContent = '★';
                    s.classList.remove('text-gray-300');
                    s.classList.add('text-yellow-400');
                } else {
                    s.textContent = '☆';
                    s.classList.remove('text-yellow-400');
                    s.classList.add('text-gray-300');
                }
            });
        });
        
        // Hover effect
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            starInputs.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('text-yellow-400');
                }
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('review-rating').value) || 0;
            starInputs.forEach((s, index) => {
                if (index >= currentRating) {
                    s.classList.remove('text-yellow-400');
                    s.classList.add('text-gray-300');
                }
            });
        });
    });
    
    // Handle form submission
    const form = document.getElementById('add-review-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check 24-hour limit
            const lastReviewTime = localStorage.getItem('lastReviewTime');
            if (lastReviewTime) {
                const timeDiff = Date.now() - parseInt(lastReviewTime);
                const hoursRemaining = Math.ceil((24 * 60 * 60 * 1000 - timeDiff) / (60 * 60 * 1000));
                
                if (timeDiff < 24 * 60 * 60 * 1000) {
                    const msg = currentLang === 'ar' 
                        ? `يمكنك إضافة تعليق واحد فقط كل 24 ساعة. يرجى الانتظار ${hoursRemaining} ساعة.`
                        : currentLang === 'fr' 
                        ? `Vous ne pouvez ajouter qu'un avis toutes les 24 heures. Veuillez attendre ${hoursRemaining} heure(s).`
                        : `You can only add one review every 24 hours. Please wait ${hoursRemaining} hour(s).`;
                    alert(msg);
                    return;
                }
            }
            
            const name = document.getElementById('review-name').value;
            const product = document.getElementById('review-product').value;
            const source = document.getElementById('review-source').value;
            const rating = parseInt(document.getElementById('review-rating').value);
            const comment = document.getElementById('review-comment').value;
            
            if (!rating) {
                alert(currentLang === 'ar' ? 'الرجاء اختيار التقييم' : currentLang === 'fr' ? 'Veuillez sélectionner une note' : 'Please select a rating');
                return;
            }
            
            if (!source) {
                alert(currentLang === 'ar' ? 'الرجاء اختيار من أين عرفت عنا' : currentLang === 'fr' ? 'Veuillez sélectionner comment vous nous avez trouvé' : 'Please select how you found us');
                return;
            }
            
            try {
                if (window.db && window.firebaseModules) {
                    const { collection, addDoc, serverTimestamp } = window.firebaseModules;
                    
                    let collectionName = 'reviews';
                    if (product.includes('ChatGPT')) collectionName = 'chatgpt-reviews';
                    else if (product.includes('Adobe')) collectionName = 'adobe-reviews';
                    else if (product.includes('Gamma')) collectionName = 'gamma-reviews';
                    else if (product.includes('Canva')) collectionName = 'canva-reviews';
                    else if (product.includes('CapCut')) collectionName = 'capcut-reviews';
                    else if (product.includes('Netflix')) collectionName = 'netflix-reviews';
                    else if (product.includes('Perplexity')) collectionName = 'perplexity-reviews';
                    else if (product.includes('TradingView')) collectionName = 'tradingview-reviews';
                    else if (product.includes('Cursor')) collectionName = 'cursor-reviews';
                    
                    const reviewData = {
                        name: name,
                        platform: source,
                        product: product,
                        rating: rating,
                        comment: comment,
                        source: source,
                        timestamp: serverTimestamp(),
                        approved: false,
                        image: selectedImageBase64 || null
                    };
                    
                    await addDoc(collection(window.db, collectionName), reviewData);
                    
                    // Reset image after submit
                    selectedImageBase64 = null;
                    
                    // Save timestamp to localStorage for 24-hour limit
                    localStorage.setItem('lastReviewTime', Date.now().toString());
                    
                    const successMsg = currentLang === 'ar' ? 'شكراً! تم إرسال تقييمك بنجاح. سيتم مراجعته قريباً.' : 
                                       currentLang === 'fr' ? 'Merci! Votre avis a été soumis avec succès. Il sera examiné bientôt.' :
                                       'Thank you! Your review has been submitted successfully. It will be reviewed soon.';
                    alert(successMsg);
                    
                    window.closeAddReviewModal();
                    
                    // Reload reviews
                    setTimeout(() => {
                        loadReviews();
                    }, 1000);
                } else {
                    throw new Error('Firebase not ready');
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                const errorMsg = currentLang === 'ar' ? 'حدث خطأ. الرجاء المحاولة مرة أخرى.' :
                                currentLang === 'fr' ? 'Une erreur s\'est produite. Veuillez réessayer.' :
                                'An error occurred. Please try again.';
                alert(errorMsg);
            }
        });
    }
    
    // Load reviews on page load
    loadReviews();
});

// Load reviews from Firebase
async function loadReviews() {
    console.log('🔄 بدء تحميل التعليقات...');
    const loading = document.getElementById('loading');
    const container = document.getElementById('reviews-container');
    const noReviews = document.getElementById('no-reviews');
    
    if (loading) loading.classList.remove('hidden');
    
    try {
        if (!window.db || !window.firebaseModules) {
            console.log('⏳ انتظار Firebase...');
            await new Promise(resolve => {
                const timeout = setTimeout(() => {
                    console.log('⚠️ Firebase timeout');
                    resolve();
                }, 5000);
                
                window.addEventListener('firebaseReady', () => {
                    console.log('✅ Firebase جاهز');
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
        }

        allReviews = [];
        
        if (window.db && window.firebaseModules) {
            console.log('📚 تحميل من Firebase...');
            const { collection, getDocs, query: firebaseQuery, orderBy: firebaseOrderBy, limit: firebaseLimit } = window.firebaseModules;
            
            const collections = [
                'reviews', 
                'chatgpt-reviews', 
                'adobe-reviews',
                'gamma-reviews',
                'canva-reviews',
                'capcut-reviews',
                'netflix-reviews',
                'perplexity-reviews',
                'tradingview-reviews',
                'cursor-reviews'
            ];
            
            // Load all collections in parallel for better performance
            
            const collectionPromises = collections.map(async (collectionName) => {
                try {
                    // Use query with orderBy and limit for better performance
                    const q = firebaseQuery(
                        collection(window.db, collectionName),
                        firebaseOrderBy('timestamp', 'desc'),
                        firebaseLimit(100) // Limit to 100 reviews per collection for faster loading
                    );
                    const querySnapshot = await getDocs(q);
                    const reviews = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.rating && data.name) {
                            // معالجة التاريخ بشكل صحيح
                            let reviewTimestamp = null;
                            if (data.timestamp) {
                                if (data.timestamp.toDate) {
                                    reviewTimestamp = data.timestamp.toDate();
                                } else if (data.timestamp.seconds) {
                                    reviewTimestamp = new Date(data.timestamp.seconds * 1000);
                                } else if (typeof data.timestamp === 'string') {
                                    reviewTimestamp = new Date(data.timestamp);
                                }
                            } else if (data.date) {
                                reviewTimestamp = new Date(data.date);
                            } else if (data.createdAt) {
                                if (data.createdAt.toDate) {
                                    reviewTimestamp = data.createdAt.toDate();
                                } else {
                                    reviewTimestamp = new Date(data.createdAt);
                                }
                            }
                            
                            reviews.push({
                                id: doc.id,
                                name: data.name,
                                product: data.product || collectionName.replace('-reviews', ''),
                                rating: data.rating,
                                comment: data.comment || '',
                                platform: data.platform || data.source || 'Unknown',
                                timestamp: reviewTimestamp,
                                image: data.image || null
                            });
                        }
                    });
                    return reviews;
                } catch (err) {
                    // If query fails (e.g., no index), try without orderBy
                    try {
                        const querySnapshot = await getDocs(collection(window.db, collectionName));
                        const reviews = [];
                        querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            if (data.rating && data.name) {
                                // معالجة التاريخ بشكل صحيح
                                let reviewTimestamp = null;
                                if (data.timestamp) {
                                    if (data.timestamp.toDate) {
                                        reviewTimestamp = data.timestamp.toDate();
                                    } else if (data.timestamp.seconds) {
                                        reviewTimestamp = new Date(data.timestamp.seconds * 1000);
                                    } else if (typeof data.timestamp === 'string') {
                                        reviewTimestamp = new Date(data.timestamp);
                                    }
                                } else if (data.date) {
                                    reviewTimestamp = new Date(data.date);
                                } else if (data.createdAt) {
                                    if (data.createdAt.toDate) {
                                        reviewTimestamp = data.createdAt.toDate();
                                    } else {
                                        reviewTimestamp = new Date(data.createdAt);
                                    }
                                }
                                
                                reviews.push({
                                    id: doc.id,
                                    name: data.name,
                                    product: data.product || collectionName.replace('-reviews', ''),
                                    rating: data.rating,
                                    comment: data.comment || '',
                                    platform: data.platform || data.source || 'Unknown',
                                    timestamp: reviewTimestamp,
                                    image: data.image || null
                                });
                            }
                        });
                        return reviews;
                    } catch (err2) {
                        console.log(`Collection ${collectionName} not found:`, err2.message);
                        return [];
                    }
                }
            });
            
            // Wait for all collections to load in parallel
            const results = await Promise.all(collectionPromises);
            allReviews = results.flat();
        }
        
        // Sort by date (newest first)
        allReviews.sort((a, b) => b.timestamp - a.timestamp);
        
        // Format dates based on current language
        formatReviewDates();
        
        // Update stats
        updateStats();
        
        // Display reviews
        displayedReviews = 0;
        container.innerHTML = '';
        displayReviews();
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    } finally {
        loading.classList.add('hidden');
    }
}

// Update statistics
function updateStats() {
    const totalCount = document.getElementById('total-reviews-count');
    const avgRating = document.getElementById('average-rating');
    
    if (allReviews.length > 0) {
        const average = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        totalCount.textContent = allReviews.length;
        avgRating.textContent = average.toFixed(1);
    } else {
        totalCount.textContent = '0';
        avgRating.textContent = '5.0';
    }
    
    // Update giveaway eligible participants
    if (typeof updateEligibleParticipants === 'function') {
        updateEligibleParticipants(allReviews);
    }
    
    // إعادة المحاولة بعد ثانية في حال لم تكن إعدادات المسابقة محملة بعد
    setTimeout(() => {
        if (typeof updateEligibleParticipants === 'function' && typeof GIVEAWAY_ACTIVE !== 'undefined' && GIVEAWAY_ACTIVE) {
            updateEligibleParticipants(allReviews);
        }
    }, 2000);
}

// Display reviews
function displayReviews() {
    const container = document.getElementById('reviews-container');
    const showMoreContainer = document.getElementById('show-more-container');
    const noReviews = document.getElementById('no-reviews');
    
    let filteredReviews = allReviews;
    
    if (currentFilter !== 'all') {
        filteredReviews = allReviews.filter(r => {
            const product = r.product.toLowerCase();
            if (currentFilter === 'trw') return product.includes('real world');
            if (currentFilter === 'chatgpt') return product.includes('chatgpt');
            if (currentFilter === 'adobe') return product.includes('adobe');
            if (currentFilter === 'gamma') return product.includes('gamma');
            if (currentFilter === 'netflix') return product.includes('netflix');
            if (currentFilter === 'perplexity') return product.includes('perplexity');
            if (currentFilter === 'tradingview') return product.includes('tradingview');
            if (currentFilter === 'canva') return product.includes('canva');
            if (currentFilter === 'capcut') return product.includes('capcut');
            if (currentFilter === 'cursor') return product.includes('cursor');
            return true;
        });
    }
    
    if (filteredReviews.length === 0) {
        noReviews.classList.remove('hidden');
        showMoreContainer.style.display = 'none';
        return;
    }
    
    noReviews.classList.add('hidden');
    
    const reviewsToShow = filteredReviews.slice(displayedReviews, displayedReviews + reviewsPerPage);
    
    reviewsToShow.forEach(review => {
        const card = createReviewCard(review);
        container.appendChild(card);
    });
    
    displayedReviews += reviewsToShow.length;
    
    if (displayedReviews < filteredReviews.length) {
        showMoreContainer.style.display = 'block';
    } else {
        showMoreContainer.style.display = 'none';
    }
}

// Create professional star icon
function createStarIcon(filled = true) {
    if (filled) {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`;
    } else {
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`;
    }
}

// Create review card
function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    
    // Create professional stars
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += createStarIcon(i <= review.rating);
    }
    
    const productBadge = getProductBadge(review.product);
    
    card.innerHTML = `
        <div class="review-header">
            <div>
                <h3 class="review-name">${escapeHtml(review.name)}</h3>
                <div class="review-rating">${starsHTML}</div>
            </div>
            ${productBadge}
        </div>
        <p class="review-comment">${escapeHtml(review.comment)}</p>
        ${review.image ? `<img src="${review.image}" alt="Review" class="review-image" onclick="openImageModal('${review.image}')">` : ''}
        <div class="review-meta">
            <span>📍 ${escapeHtml(review.platform)}</span>
            <span>📅 ${review.date}</span>
        </div>
    `;
    
    return card;
}

// Get product badge
function getProductBadge(product) {
    const productLower = product.toLowerCase();
    if (productLower.includes('real world')) {
        return '<span class="product-badge badge-trw">The Real World</span>';
    } else if (productLower.includes('chatgpt')) {
        return '<span class="product-badge badge-chatgpt">ChatGPT</span>';
    } else if (productLower.includes('adobe')) {
        return '<span class="product-badge badge-adobe">Adobe</span>';
    } else if (productLower.includes('gamma')) {
        return '<span class="product-badge badge-gamma">Gamma.AI</span>';
    } else if (productLower.includes('netflix')) {
        return '<span class="product-badge badge-netflix">Netflix</span>';
    } else if (productLower.includes('perplexity')) {
        return '<span class="product-badge badge-perplexity">Perplexity</span>';
    } else if (productLower.includes('tradingview')) {
        return '<span class="product-badge badge-tradingview">TradingView</span>';
    } else if (productLower.includes('canva')) {
        return '<span class="product-badge badge-canva">Canva</span>';
    } else if (productLower.includes('capcut')) {
        return '<span class="product-badge badge-capcut">CapCut</span>';
    }
    return `<span class="product-badge" style="background: #667eea; color: white;">${escapeHtml(product)}</span>`;
}

// Filter reviews
window.filterReviews = function(filter) {
    currentFilter = filter;
    displayedReviews = 0;
    
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-white', 'text-purple-600');
        btn.classList.add('bg-white/20', 'text-white');
    });
    
    event.target.classList.remove('bg-white/20', 'text-white');
    event.target.classList.add('active', 'bg-white', 'text-purple-600');
    
    displayReviews();
}

// Load more reviews
window.loadMoreReviews = function() {
    displayReviews();
};

// Open image modal
window.openImageModal = function(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imageSrc;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Close image modal
window.closeImageModal = function() {
    const modal = document.getElementById('image-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

// Format review dates based on current language
function formatReviewDates() {
    const lang = currentLang || 'ar';
    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US';
    
    allReviews.forEach(review => {
        if (review.timestamp && review.timestamp instanceof Date && !isNaN(review.timestamp)) {
            review.date = review.timestamp.toLocaleDateString(locale, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } else if (review.timestamp) {
            // محاولة تحويل التاريخ
            const date = new Date(review.timestamp);
            if (!isNaN(date)) {
                review.date = date.toLocaleDateString(locale, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            } else {
                review.date = ''; // لا يوجد تاريخ صالح
            }
        } else {
            review.date = ''; // لا يوجد تاريخ
        }
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Change language - Use the one from reviews-translations.js
// This function extends the base changeLanguage with reviews-specific updates
const baseChangeLanguage = window.changeLanguage;
window.changeLanguage = function(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    localStorage.setItem('preferredLanguage', lang);
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
    
    // Update direction
    if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = reviewsTranslations[lang] ? reviewsTranslations[lang][key] : null;
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Reload reviews to update date format
    if (window.allReviews && window.allReviews.length > 0) {
        // Update date format for all reviews
        formatReviewDates();
        
        displayedReviews = 0;
        document.getElementById('reviews-container').innerHTML = '';
        displayReviews();
    }
}
