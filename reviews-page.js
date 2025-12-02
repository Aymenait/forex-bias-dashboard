// Reviews Page Script
let allReviews = [];
let displayedReviews = 0;
let currentFilter = 'all';
const reviewsPerPage = 9;

// Product mapping - Add new products here
const productInfo = {
    'The Real World Account': { 
        name: 'The Real World', 
        class: 'badge-trw', 
        collection: 'reviews',
        filter: 'trw'
    },
    'ChatGPT Business': { 
        name: 'ChatGPT Business', 
        class: 'badge-chatgpt', 
        collection: 'chatgpt-reviews',
        filter: 'chatgpt'
    },
    'Adobe Creative Cloud': { 
        name: 'Adobe CC', 
        class: 'badge-adobe', 
        collection: 'adobe-reviews',
        filter: 'adobe'
    }
    // To add a new product:
    // 'Product Name': { 
    //     name: 'Display Name', 
    //     class: 'badge-custom', 
    //     collection: 'firebase-collection-name',
    //     filter: 'filter-key'
    // }
};

window.addEventListener('firebaseReady', async function() {
    await loadAllReviews();
});

async function loadAllReviews() {
    const loading = document.getElementById('loading');
    const noReviews = document.getElementById('no-reviews');
    
    try {
        allReviews = [];
        
        // Dynamically load reviews from all products
        for (const [productName, info] of Object.entries(productInfo)) {
            const reviews = await loadFromCollection(info.collection, productName);
            allReviews.push(...reviews);
        }
        
        // Sort by timestamp (newest first)
        allReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        loading.style.display = 'none';
        
        if (allReviews.length === 0) {
            noReviews.classList.remove('hidden');
        } else {
            displayReviews();
            updateStats();
            updateProductCount();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        loading.style.display = 'none';
        noReviews.classList.remove('hidden');
    }
}

function updateProductCount() {
    const productCount = Object.keys(productInfo).length;
    const productCountElement = document.querySelector('.text-center .text-4xl.font-bold.text-white:last-of-type');
    if (productCountElement) {
        productCountElement.textContent = productCount;
    }
}

async function loadFromCollection(collectionName, productName) {
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const reviewsQuery = query(collection(window.db, collectionName), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(reviewsQuery);
        
        const reviews = [];
        querySnapshot.forEach((doc) => {
            reviews.push({
                id: doc.id,
                ...doc.data(),
                product: productName
            });
        });
        
        return reviews;
    } catch (error) {
        console.error(`Error loading ${collectionName}:`, error);
        return [];
    }
}

function displayReviews() {
    const container = document.getElementById('reviews-container');
    const showMoreContainer = document.getElementById('show-more-container');
    
    // Filter reviews dynamically
    const filteredReviews = currentFilter === 'all' 
        ? allReviews 
        : allReviews.filter(r => {
            const productName = getProductByFilter(currentFilter);
            return productName ? r.product === productName : true;
        });
    
    // Clear container if starting fresh
    if (displayedReviews === 0) {
        container.innerHTML = '';
    }
    
    // Get reviews to show
    const reviewsToShow = filteredReviews.slice(displayedReviews, displayedReviews + reviewsPerPage);
    
    reviewsToShow.forEach(review => {
        const card = createReviewCard(review);
        container.appendChild(card);
    });
    
    displayedReviews += reviewsToShow.length;
    
    // Show/hide "Show More" button
    if (displayedReviews >= filteredReviews.length) {
        showMoreContainer.style.display = 'none';
    } else {
        showMoreContainer.style.display = 'block';
    }
}

function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card bg-white rounded-2xl p-6 shadow-lg';
    
    const productClass = productInfo[review.product]?.class || 'badge-trw';
    const productName = productInfo[review.product]?.name || review.product;
    const initial = review.name.charAt(0).toUpperCase();
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    ${initial}
                </div>
                <div>
                    <h3 class="font-bold text-gray-800">${escapeHtml(review.name)}</h3>
                    <div class="text-yellow-400 text-sm">${stars}</div>
                </div>
            </div>
            <span class="product-badge ${productClass}">${productName}</span>
        </div>
        
        ${review.comment ? `<p class="text-gray-600 mb-3 leading-relaxed">${escapeHtml(review.comment)}</p>` : ''}
        
        ${review.image ? `
            <div class="mb-3">
                <img src="${review.image}" 
                     alt="Review image" 
                     class="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                     onclick="openImageModal('${review.image}')">
            </div>
        ` : ''}
        
        <div class="flex items-center justify-between text-sm text-gray-500">
            <span>${review.platform || translate('platform.client')}</span>
            <span>${formatDate(review.timestamp)}</span>
        </div>
    `;
    
    return card;
}

function updateStats() {
    const totalCount = allReviews.length;
    const avgRating = totalCount > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
        : 5.0;
    
    document.getElementById('total-reviews-count').textContent = totalCount;
    document.getElementById('average-rating').textContent = avgRating;
}

function filterReviews(filter) {
    currentFilter = filter;
    displayedReviews = 0;
    
    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-white', 'text-purple-600');
        btn.classList.add('bg-white/20', 'text-white');
    });
    
    event.target.classList.remove('bg-white/20', 'text-white');
    event.target.classList.add('active', 'bg-white', 'text-purple-600');
    
    // Clear and redisplay
    document.getElementById('reviews-container').innerHTML = '';
    displayReviews();
}

// Helper function to get product by filter key
function getProductByFilter(filterKey) {
    for (const [productName, info] of Object.entries(productInfo)) {
        if (info.filter === filterKey) {
            return productName;
        }
    }
    return null;
}

function loadMoreReviews() {
    displayReviews();
}

function openImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modalImg.src = imageSrc;
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return translate('date.today');
    if (diffDays === 1) return translate('date.yesterday');
    if (diffDays < 7) return translate('date.days').replace('{0}', diffDays);
    if (diffDays < 30) return translate('date.weeks').replace('{0}', Math.floor(diffDays / 7));
    return translate('date.months').replace('{0}', Math.floor(diffDays / 30));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
