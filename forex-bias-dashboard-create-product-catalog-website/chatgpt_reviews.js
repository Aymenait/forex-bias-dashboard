// ChatGPT Business Reviews System
let allReviews = [];
let displayedReviews = 0;
const reviewsPerPage = 6;

// Wait for Firebase to be ready
window.addEventListener('firebaseReady', function() {
    loadReviews();
});

// Star rating functionality
document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('rating-value');
    
    const ratingTexts = {
        1: '⭐ سيء',
        2: '⭐⭐ مقبول',
        3: '⭐⭐⭐ جيد',
        4: '⭐⭐⭐⭐ ممتاز',
        5: '⭐⭐⭐⭐⭐ رائع!'
    };

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            ratingValue.value = rating;
            
            // Update stars with inline styles
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#fbbf24'; // Yellow/Gold
                } else {
                    s.style.color = '#4b5563'; // Gray
                }
            });

            // Show rating text
            const ratingText = document.getElementById('rating-text');
            if (ratingText) {
                ratingText.textContent = ratingTexts[rating];
            }
        });

        // Add hover effect to show preview
        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.transform = 'scale(1.1)';
                } else {
                    s.style.transform = 'scale(1)';
                }
            });
        });

        star.addEventListener('mouseleave', function() {
            stars.forEach(s => {
                s.style.transform = 'scale(1)';
            });
        });
    });

    // Image preview
    const imageInput = document.getElementById('review-image');
    const imageName = document.getElementById('image-name');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            imageName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', function() {
        imageInput.value = '';
        imageName.textContent = '';
        imagePreview.classList.add('hidden');
        previewImg.src = '';
    });

    // Form submission
    const reviewForm = document.getElementById('review-form');
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitReview();
    });

    // Show more button
    const showMoreBtn = document.getElementById('show-more-btn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            displayMoreReviews();
        });
    }
});

async function submitReview() {
    const name = document.getElementById('reviewer-name').value.trim();
    const platform = document.getElementById('platform').value;
    const rating = parseInt(document.getElementById('rating-value').value);
    const comment = document.getElementById('review-comment').value.trim();
    const imageInput = document.getElementById('review-image');

    if (!name || !platform || !rating) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    const submitBtn = document.querySelector('#review-form button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    try {
        let imageBase64 = null;
        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            imageBase64 = await fileToBase64(file);
        }

        const reviewData = {
            name: name,
            platform: platform,
            rating: rating,
            comment: comment || '',
            image: imageBase64,
            timestamp: new Date().toISOString(),
            product: 'ChatGPT Business'
        };

        // Use the same Firebase as TRW but different collection
        const { collection, addDoc } = window.firebaseModules;
        await addDoc(collection(window.db, 'chatgpt-reviews'), reviewData);

        // Send email notification
        await sendEmailNotification(reviewData);

        alert('شكراً لك! تم إضافة تقييمك بنجاح ✅');
        
        // Reset form
        document.getElementById('review-form').reset();
        document.getElementById('rating-value').value = '';
        document.querySelectorAll('.star').forEach(s => {
            s.classList.remove('text-yellow-400');
            s.classList.add('text-gray-600');
        });
        document.getElementById('image-preview').classList.add('hidden');
        document.getElementById('image-name').textContent = '';

        // Reload reviews
        await loadReviews();
    } catch (error) {
        console.error('Error adding review:', error);
        alert('حدث خطأ أثناء إضافة التقييم. الرجاء المحاولة مرة أخرى.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال التقييم';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function sendEmailNotification(reviewData) {
    try {
        await emailjs.send('service_rvvvqxh', 'template_rvvvqxh', {
            product: 'ChatGPT Business',
            reviewer_name: reviewData.name,
            platform: reviewData.platform,
            rating: '⭐'.repeat(reviewData.rating),
            comment: reviewData.comment || 'لا يوجد تعليق',
            has_image: reviewData.image ? 'نعم' : 'لا'
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

async function loadReviews() {
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const reviewsQuery = query(collection(window.db, 'chatgpt-reviews'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(reviewsQuery);
        
        allReviews = [];
        querySnapshot.forEach((doc) => {
            allReviews.push({ id: doc.id, ...doc.data() });
        });

        displayedReviews = 0;
        document.getElementById('reviews-container').innerHTML = '';
        displayMoreReviews();
        updateStats();
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function displayMoreReviews() {
    const container = document.getElementById('reviews-container');
    const showMoreContainer = document.getElementById('show-more-container');
    
    const reviewsToShow = allReviews.slice(displayedReviews, displayedReviews + reviewsPerPage);
    
    reviewsToShow.forEach(review => {
        const reviewCard = createReviewCard(review);
        container.appendChild(reviewCard);
    });
    
    displayedReviews += reviewsToShow.length;
    
    if (displayedReviews >= allReviews.length) {
        showMoreContainer.style.display = 'none';
    } else {
        showMoreContainer.style.display = 'block';
    }
}

function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'bg-[#111]/80 border border-[#10a37f]/30 rounded-xl p-4 hover:border-[#10a37f] transition-all';
    
    const initial = review.name.charAt(0).toUpperCase();
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    card.innerHTML = `
        <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 bg-[#10a37f] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                ${initial}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-white font-bold text-sm truncate">${escapeHtml(review.name)}</h3>
                    <span class="text-xs text-gray-500 whitespace-nowrap">${formatDate(review.timestamp)}</span>
                </div>
                <div class="flex items-center gap-2 mb-1">
                    <div class="text-yellow-400 text-sm">${stars}</div>
                    <span class="text-xs text-gray-400">${review.platform}</span>
                </div>
            </div>
        </div>
        ${review.comment ? `<p class="text-gray-300 text-xs leading-relaxed mb-3">${escapeHtml(review.comment)}</p>` : ''}
        ${review.image ? `
            <div class="mt-3">
                <img src="${review.image}" 
                     alt="Review image" 
                     class="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                     onclick="openImageModal('${review.image}')">
            </div>
        ` : ''}
    `;
    
    return card;
}

function updateStats() {
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 5.0;
    
    document.getElementById('total-reviews').textContent = totalReviews;
    
    const avgStars = document.getElementById('average-stars');
    const fullStars = Math.floor(avgRating);
    avgStars.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = i < fullStars ? 'text-yellow-400 text-xl' : 'text-gray-600 text-xl';
        star.textContent = '★';
        avgStars.appendChild(star);
    }
}

function openImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    modal.style.display = 'flex';
    modalImg.src = imageSrc;
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    return `منذ ${Math.floor(diffDays / 30)} شهر`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const imageModal = document.getElementById('image-modal');
    if (event.target === imageModal) {
        closeImageModal();
    }
};
