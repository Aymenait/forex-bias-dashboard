/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Dashboard - Market Algeriaa
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * هذا الملف يحتوي على كل وظائف لوحة التحكم:
 * - تسجيل الدخول والخروج
 * - عرض الإحصائيات
 * - إدارة التقييمات (عرض، بحث، حذف)
 * - تغيير كلمة المرور
 */

// ═══════════════════════════════════════════════════════════════════════════
// المتغيرات العامة - Global Variables
// ═══════════════════════════════════════════════════════════════════════════

let allReviews = [];           // جميع التقييمات
let reviewToDelete = null;     // التقييم المراد حذفه
const DEFAULT_PASSWORD = 'admin123';  // كلمة المرور الافتراضية

// ═══════════════════════════════════════════════════════════════════════════
// تسجيل الدخول - Login Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * التحقق من حالة تسجيل الدخول عند تحميل الصفحة
 */
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLoginPage();
    }
}

/**
 * عرض صفحة تسجيل الدخول
 */
function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('dashboard-page').classList.add('hidden');
}

/**
 * عرض لوحة التحكم
 */
function showDashboard() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    
    // تحميل البيانات
    loadReviews();
}

/**
 * معالجة تسجيل الدخول
 */
function handleLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('admin-password').value;
    const savedPassword = localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
    
    if (password === savedPassword) {
        // تسجيل الدخول بنجاح
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('login-error').classList.add('hidden');
        showDashboard();
        showToast('مرحباً بك! 👋');
    } else {
        // كلمة مرور خاطئة
        document.getElementById('login-error').classList.remove('hidden');
        document.getElementById('admin-password').classList.add('border-red-500');
        setTimeout(() => {
            document.getElementById('admin-password').classList.remove('border-red-500');
        }, 2000);
    }
}

/**
 * تسجيل الخروج
 */
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    showLoginPage();
    showToast('تم تسجيل الخروج');
}

// ═══════════════════════════════════════════════════════════════════════════
// التبويبات - Tabs Navigation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض تبويب معين
 */
function showTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // إزالة الحالة النشطة من جميع الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-purple-500', 'text-purple-400');
        btn.classList.add('border-transparent');
    });
    
    // عرض التبويب المحدد
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // تفعيل الزر المحدد
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-purple-500', 'text-purple-400');
        activeBtn.classList.remove('border-transparent');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تحميل وعرض التقييمات - Load & Display Reviews
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل التقييمات من Firebase
 */
async function loadReviews() {
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        
        // جلب التقييمات مرتبة حسب التاريخ
        const q = query(collection(window.db, 'reviews'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allReviews = [];
        querySnapshot.forEach((doc) => {
            allReviews.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // تحديث الإحصائيات
        updateStats();
        
        // عرض آخر التقييمات
        displayRecentReviews();
        
        // عرض جدول التقييمات
        displayReviewsTable();
        
    } catch (error) {
        console.error('خطأ في تحميل التقييمات:', error);
        showToast('خطأ في تحميل البيانات', 'error');
    }
}

/**
 * تحديث الإحصائيات
 */
function updateStats() {
    // إجمالي التقييمات
    document.getElementById('stat-total-reviews').textContent = allReviews.length;
    
    // متوسط التقييم
    if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 5), 0);
        const average = (totalRating / allReviews.length).toFixed(1);
        document.getElementById('stat-average').textContent = average;
    }
    
    // تقييمات اليوم
    const today = new Date().toDateString();
    const todayReviews = allReviews.filter(review => {
        if (review.timestamp) {
            const reviewDate = review.timestamp.toDate ? review.timestamp.toDate() : new Date(review.timestamp);
            return reviewDate.toDateString() === today;
        }
        return false;
    });
    document.getElementById('stat-today').textContent = todayReviews.length;
    
    // عدد التقييمات في الجدول
    document.getElementById('reviews-count').textContent = allReviews.length;
}

/**
 * عرض آخر التقييمات في الصفحة الرئيسية
 */
function displayRecentReviews() {
    const container = document.getElementById('recent-reviews');
    const recentReviews = allReviews.slice(0, 5);
    
    if (recentReviews.length === 0) {
        container.innerHTML = '<p class="text-gray-400">لا توجد تقييمات بعد</p>';
        return;
    }
    
    container.innerHTML = recentReviews.map(review => `
        <div class="flex items-center justify-between bg-gray-700 rounded-lg p-4">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                    ${review.name ? review.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <div class="font-bold">${escapeHtml(review.name || 'مجهول')}</div>
                    <div class="text-gray-400 text-sm">${escapeHtml(review.product || 'N/A')}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-yellow-400">${'⭐'.repeat(review.rating || 5)}</div>
                <div class="text-gray-400 text-sm">${formatDate(review.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

/**
 * عرض جدول التقييمات
 */
function displayReviewsTable(reviews = allReviews) {
    const tbody = document.getElementById('reviews-table-body');
    
    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد تقييمات</td></tr>';
        return;
    }
    
    tbody.innerHTML = reviews.map(review => `
        <tr class="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        ${review.name ? review.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span>${escapeHtml(review.name || 'مجهول')}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="bg-gray-700 px-2 py-1 rounded text-sm">${escapeHtml(review.product || 'N/A')}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-yellow-400">${'⭐'.repeat(review.rating || 5)}</span>
            </td>
            <td class="px-6 py-4 max-w-xs">
                <p class="truncate" title="${escapeHtml(review.comment || '')}">${escapeHtml(review.comment || 'بدون تعليق')}</p>
            </td>
            <td class="px-6 py-4">
                <span class="text-gray-400">${escapeHtml(review.source || 'N/A')}</span>
            </td>
            <td class="px-6 py-4 text-gray-400">
                ${formatDate(review.timestamp)}
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="openDeleteModal('${review.id}')" 
                    class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors">
                    🗑️ حذف
                </button>
            </td>
        </tr>
    `).join('');
    
    // تحديث عدد التقييمات
    document.getElementById('reviews-count').textContent = reviews.length;
}

// ═══════════════════════════════════════════════════════════════════════════
// البحث والفلترة - Search & Filter
// ═══════════════════════════════════════════════════════════════════════════

/**
 * البحث في التقييمات
 */
function searchReviews() {
    const searchTerm = document.getElementById('search-reviews').value.toLowerCase();
    const productFilter = document.getElementById('filter-product').value;
    
    let filteredReviews = allReviews;
    
    // فلترة حسب المنتج
    if (productFilter !== 'all') {
        filteredReviews = filteredReviews.filter(review => review.product === productFilter);
    }
    
    // فلترة حسب البحث
    if (searchTerm) {
        filteredReviews = filteredReviews.filter(review => 
            (review.name && review.name.toLowerCase().includes(searchTerm)) ||
            (review.comment && review.comment.toLowerCase().includes(searchTerm)) ||
            (review.source && review.source.toLowerCase().includes(searchTerm))
        );
    }
    
    displayReviewsTable(filteredReviews);
}

// ═══════════════════════════════════════════════════════════════════════════
// حذف التقييمات - Delete Reviews
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة تأكيد الحذف
 */
function openDeleteModal(reviewId) {
    reviewToDelete = reviewId;
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة تأكيد الحذف
 */
function closeDeleteModal() {
    reviewToDelete = null;
    const modal = document.getElementById('delete-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * تأكيد حذف التقييم
 */
async function confirmDelete() {
    if (!reviewToDelete) return;
    
    try {
        const { deleteDoc, doc } = window.firebaseModules;
        
        // حذف من Firebase
        await deleteDoc(doc(window.db, 'reviews', reviewToDelete));
        
        // تحديث القائمة المحلية
        allReviews = allReviews.filter(review => review.id !== reviewToDelete);
        
        // تحديث العرض
        updateStats();
        displayRecentReviews();
        displayReviewsTable();
        
        // إغلاق النافذة
        closeDeleteModal();
        
        showToast('تم حذف التقييم بنجاح 🗑️');
        
    } catch (error) {
        console.error('خطأ في حذف التقييم:', error);
        showToast('خطأ في حذف التقييم', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تغيير كلمة المرور - Change Password
// ═══════════════════════════════════════════════════════════════════════════

/**
 * معالجة تغيير كلمة المرور
 */
function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    const savedPassword = localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
    
    // التحقق من كلمة المرور الحالية
    if (currentPassword !== savedPassword) {
        showToast('كلمة المرور الحالية غير صحيحة', 'error');
        return;
    }
    
    // التحقق من تطابق كلمتي المرور الجديدتين
    if (newPassword !== confirmPassword) {
        showToast('كلمتا المرور الجديدتان غير متطابقتين', 'error');
        return;
    }
    
    // التحقق من طول كلمة المرور
    if (newPassword.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // حفظ كلمة المرور الجديدة
    localStorage.setItem('adminPassword', newPassword);
    
    // مسح الحقول
    document.getElementById('change-password-form').reset();
    
    showToast('تم تغيير كلمة المرور بنجاح 🔑');
}

// ═══════════════════════════════════════════════════════════════════════════
// وظائف مساعدة - Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تنسيق التاريخ
 */
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'N/A';
    }
}

/**
 * تنظيف النص من HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * عرض رسالة Toast
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    // تغيير اللون حسب النوع
    toast.classList.remove('bg-green-600', 'bg-red-600');
    toast.classList.add(type === 'error' ? 'bg-red-600' : 'bg-green-600');
    
    // عرض الرسالة
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// تهيئة الصفحة - Page Initialization
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // تحقق من حالة تسجيل الدخول
    checkLoginStatus();
    
    // إعداد نموذج تسجيل الدخول
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // إعداد نموذج تغيير كلمة المرور
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
    
    // إعداد البحث والفلترة
    document.getElementById('search-reviews').addEventListener('input', searchReviews);
    document.getElementById('filter-product').addEventListener('change', searchReviews);
    
    // عرض تاريخ آخر تحديث
    document.getElementById('last-update').textContent = new Date().toLocaleDateString('ar-DZ');
});

// انتظار تحميل Firebase
window.addEventListener('firebaseReady', () => {
    console.log('✅ Firebase جاهز');
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        loadReviews();
    }
});

// جعل الوظائف متاحة عالمياً
window.logout = logout;
window.showTab = showTab;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;

