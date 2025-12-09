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
let allProducts = [];          // جميع المنتجات
let allOrders = [];            // جميع الطلبات
let allCustomers = [];         // جميع العملاء
let allPurchases = [];         // جميع عمليات الشراء
let allExpenses = [];          // جميع المصاريف
let allSuppliers = [];         // جميع الموردين ومصادر السلع
let reviewToDelete = null;     // التقييم المراد حذفه
const DEFAULT_PASSWORD = 'admin123';  // كلمة المرور الافتراضية

// ═══════════════════════════════════════════════════════════════════════════
// سعر الدولار في السكوار (السوق السوداء) - Square Rate
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_USD_RATE = 230;  // السعر الافتراضي
let USD_TO_DZD_RATE = localStorage.getItem('usd_dzd_rate') 
    ? parseFloat(localStorage.getItem('usd_dzd_rate')) 
    : DEFAULT_USD_RATE;

/**
 * تحويل من دولار إلى دينار جزائري (سعر السكوار)
 */
function usdToDzd(usd) {
    return usd * USD_TO_DZD_RATE;
}

/**
 * تحويل من دينار جزائري إلى دولار (سعر السكوار)
 */
function dzdToUsd(dzd) {
    return dzd / USD_TO_DZD_RATE;
}

/**
 * تحديث سعر الدولار
 */
function updateUsdRate(newRate) {
    USD_TO_DZD_RATE = parseFloat(newRate) || DEFAULT_USD_RATE;
    localStorage.setItem('usd_dzd_rate', USD_TO_DZD_RATE);
    showToast(`✅ تم تحديث سعر الدولار: ${USD_TO_DZD_RATE} د.ج`);
    
    // تحديث العرض
    if (typeof loadAccountingData === 'function') loadAccountingData();
}

window.updateUsdRate = updateUsdRate;
window.usdToDzd = usdToDzd;
window.dzdToUsd = dzdToUsd;

// ═══════════════════════════════════════════════════════════════════════════
// فئات المصاريف - Expense Categories
// ═══════════════════════════════════════════════════════════════════════════
const EXPENSE_CATEGORIES = {
    business: {
        ads_facebook: { label: '📘 إعلانات Facebook', icon: '📘' },
        ads_instagram: { label: '📸 إعلانات Instagram', icon: '📸' },
        ads_tiktok: { label: '🎵 إعلانات TikTok', icon: '🎵' },
        ads_other: { label: '📢 إعلانات أخرى', icon: '📢' },
        tools: { label: '🛠️ أدوات وبرامج', icon: '🛠️' },
        hosting: { label: '🌐 استضافة ودومين', icon: '🌐' },
        fees: { label: '💳 عمولات ورسوم', icon: '💳' },
        internet: { label: '📶 إنترنت', icon: '📶' },
        phone: { label: '📱 هاتف للعمل', icon: '📱' },
        business_other: { label: '📋 أخرى (عمل)', icon: '📋' }
    },
    personal: {
        food: { label: '🍔 طعام وشراب', icon: '🍔' },
        clothes: { label: '👕 ملابس', icon: '👕' },
        transport: { label: '🚗 تنقل ومواصلات', icon: '🚗' },
        health: { label: '💊 صحة وأدوية', icon: '💊' },
        entertainment: { label: '🎮 ترفيه', icon: '🎮' },
        education: { label: '📚 تعليم وكورسات', icon: '📚' },
        bills: { label: '🏠 فواتير', icon: '🏠' },
        rent: { label: '🏠 إيجار', icon: '🏠' },
        personal_other: { label: '📋 أخرى (شخصي)', icon: '📋' }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// وظائف تسجيل البيع (يجب تعريفها مبكراً) - Sale Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة تسجيل البيع
 */
async function openSaleModal() {
    const modal = document.getElementById('sale-modal');
    const productSelect = document.getElementById('sale-product');
    
    if (!modal || !productSelect) {
        console.error('عناصر نافذة البيع غير موجودة');
        return;
    }
    
    // تحميل المنتجات إذا كانت فارغة
    if (allProducts.length === 0) {
        await loadProducts();
    }
    
    // ملء قائمة المنتجات
    productSelect.innerHTML = '<option value="">-- اختر المنتج --</option>';
    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.price_dzd} د.ج / $${product.price_usd})`;
        option.dataset.priceDzd = product.price_dzd;
        option.dataset.priceUsd = product.price_usd;
        productSelect.appendChild(option);
    });
    
    // إعادة تعيين النموذج
    const saleForm = document.getElementById('sale-form');
    if (saleForm) saleForm.reset();
    
    const quantityInput = document.getElementById('sale-quantity');
    if (quantityInput) quantityInput.value = 1;
    
    // تعيين التاريخ الحالي كافتراضي
    const dateInput = document.getElementById('sale-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة تسجيل البيع
 */
function closeSaleModal() {
    const modal = document.getElementById('sale-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * حفظ عملية البيع
 */
async function saveSale(event) {
    event.preventDefault();
    
    const productId = document.getElementById('sale-product').value;
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        showToast('يرجى اختيار منتج', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('sale-quantity').value) || 1;
    const currency = document.getElementById('sale-currency').value;
    const amount = parseFloat(document.getElementById('sale-amount').value);
    const saleDate = document.getElementById('sale-date').value;
    
    // إنشاء طلبات متعددة حسب الكمية
    try {
        const { addDoc, collection, serverTimestamp, Timestamp } = window.firebaseModules;
        
        // تحويل التاريخ المحدد إلى Timestamp
        const selectedDate = saleDate ? new Date(saleDate + 'T12:00:00') : new Date();
        
        for (let i = 0; i < quantity; i++) {
            const saleData = {
                productId: product.id,
                productName: product.name,
                customerName: document.getElementById('sale-customer-name').value || 'عميل',
                email: document.getElementById('sale-customer-contact').value || '',
                phone: document.getElementById('sale-customer-contact').value || '',
                amount: amount / quantity,
                currency: currency,
                paymentMethod: document.getElementById('sale-payment-method').value,
                notes: document.getElementById('sale-notes').value,
                status: 'delivered',
                source: 'manual',
                saleDate: saleDate || new Date().toISOString().split('T')[0],
                timestamp: serverTimestamp(),
                createdAt: selectedDate
            };
            
            await addDoc(collection(window.db, 'orders'), saleData);
        }
        
        // تحديث القائمة المحلية
        await loadOrders();
        
        // تحديث بيانات المحاسبة
        if (typeof displayAccountingTable === 'function') displayAccountingTable();
        if (typeof updateAccountingStats === 'function') updateAccountingStats();
        if (typeof updateProfitCharts === 'function') updateProfitCharts();
        if (typeof displaySuppliersSummary === 'function') displaySuppliersSummary();
        
        closeSaleModal();
        showToast(`✅ تم تسجيل ${quantity} عملية بيع بنجاح!`);
        logActivity('sale', 'created', `${product.name} x${quantity}`);
        
    } catch (error) {
        console.error('خطأ في حفظ البيع:', error);
        showToast('خطأ في حفظ البيع', 'error');
    }
}

/**
 * تحديث المبلغ تلقائياً عند اختيار المنتج
 */
function updateSaleAmount() {
    const productSelect = document.getElementById('sale-product');
    const amountInput = document.getElementById('sale-amount');
    const currencySelect = document.getElementById('sale-currency');
    const quantityInput = document.getElementById('sale-quantity');
    
    if (!productSelect || !amountInput || !currencySelect || !quantityInput) return;
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const quantity = parseInt(quantityInput.value) || 1;
    
    if (selectedOption && selectedOption.value) {
        const currency = currencySelect.value;
        if (currency === 'DZD') {
            amountInput.value = (parseFloat(selectedOption.dataset.priceDzd) || 0) * quantity;
        } else {
            amountInput.value = (parseFloat(selectedOption.dataset.priceUsd) || 0) * quantity;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// وظائف تسجيل الشراء من المورد - Purchase Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة تسجيل الشراء
 */
async function openPurchaseModal() {
    const modal = document.getElementById('purchase-modal');
    const productSelect = document.getElementById('purchase-product');
    
    if (!modal || !productSelect) {
        console.error('عناصر نافذة الشراء غير موجودة');
        return;
    }
    
    // تحميل المنتجات إذا كانت فارغة
    if (allProducts.length === 0) {
        await loadProducts();
    }
    
    // ملء قائمة المنتجات
    productSelect.innerHTML = '<option value="">-- اختر المنتج --</option>';
    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
    
    // إعادة تعيين النموذج
    const form = document.getElementById('purchase-form');
    if (form) form.reset();
    document.getElementById('purchase-quantity').value = 1;
    document.getElementById('purchase-total').value = '';
    
    // تعيين التاريخ الحالي كافتراضي
    const dateInput = document.getElementById('purchase-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة تسجيل الشراء
 */
function closePurchaseModal() {
    const modal = document.getElementById('purchase-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * تحديث إجمالي الشراء
 */
function updatePurchaseTotal() {
    const quantity = parseInt(document.getElementById('purchase-quantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('purchase-unit-price').value) || 0;
    const currency = document.getElementById('purchase-currency').value;
    const total = quantity * unitPrice;
    document.getElementById('purchase-total').value = `${total.toLocaleString()} ${currency}`;
}

/**
 * حفظ عملية الشراء
 */
async function savePurchase(event) {
    event.preventDefault();
    
    const productId = document.getElementById('purchase-product').value;
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        showToast('يرجى اختيار منتج', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('purchase-quantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('purchase-unit-price').value) || 0;
    const currency = document.getElementById('purchase-currency').value;
    const supplier = document.getElementById('purchase-supplier').value || 'غير محدد';
    const notes = document.getElementById('purchase-notes').value || '';
    const purchaseDate = document.getElementById('purchase-date').value;
    
    try {
        const { addDoc, collection, serverTimestamp } = window.firebaseModules;
        
        // تحويل التاريخ المحدد
        const selectedDate = purchaseDate ? new Date(purchaseDate + 'T12:00:00') : new Date();
        
        // حفظ عملية الشراء
        const purchaseData = {
            type: 'purchase',
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: quantity * unitPrice,
            currency: currency,
            supplier: supplier,
            notes: notes,
            purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
            timestamp: serverTimestamp(),
            createdAt: selectedDate
        };
        
        await addDoc(collection(window.db, 'purchases'), purchaseData);
        
        closePurchaseModal();
        showToast(`✅ تم تسجيل شراء ${quantity} × ${product.name}`);
        logActivity('purchase', 'created', `${product.name} x${quantity} من ${supplier}`);
        
        // تحديث بيانات المحاسبة
        loadAccountingData();
        
    } catch (error) {
        console.error('خطأ في حفظ الشراء:', error);
        showToast('خطأ في حفظ الشراء', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// وظائف المصاريف - Expense Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة تسجيل المصروف
 */
function openExpenseModal() {
    const modal = document.getElementById('expense-modal');
    const form = document.getElementById('expense-form');
    
    if (!modal) return;
    
    // إعادة تعيين النموذج
    if (form) form.reset();
    
    // تعيين التاريخ الحالي
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // تعيين نوع المصروف الافتراضي
    setExpenseType('business');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المصروف
 */
function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * تغيير نوع المصروف (عمل/شخصي)
 */
function setExpenseType(type) {
    const typeInput = document.getElementById('expense-type');
    const businessBtn = document.getElementById('expense-type-business');
    const personalBtn = document.getElementById('expense-type-personal');
    const categorySelect = document.getElementById('expense-category');
    
    if (typeInput) typeInput.value = type;
    
    if (type === 'business') {
        businessBtn.classList.add('border-orange-500', 'bg-orange-500/20', 'text-orange-400');
        businessBtn.classList.remove('border-gray-600', 'bg-transparent', 'text-gray-400');
        personalBtn.classList.remove('border-purple-500', 'bg-purple-500/20', 'text-purple-400');
        personalBtn.classList.add('border-gray-600', 'bg-transparent', 'text-gray-400');
        
        // تغيير الفئات
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="ads_facebook">📘 إعلانات Facebook</option>
                <option value="ads_instagram">📸 إعلانات Instagram</option>
                <option value="ads_tiktok">🎵 إعلانات TikTok</option>
                <option value="ads_other">📢 إعلانات أخرى</option>
                <option value="tools">🛠️ أدوات وبرامج</option>
                <option value="hosting">🌐 استضافة ودومين</option>
                <option value="fees">💳 عمولات ورسوم</option>
                <option value="internet">📶 إنترنت</option>
                <option value="phone">📱 هاتف للعمل</option>
                <option value="business_other">📋 أخرى (عمل)</option>
            `;
        }
    } else {
        personalBtn.classList.add('border-purple-500', 'bg-purple-500/20', 'text-purple-400');
        personalBtn.classList.remove('border-gray-600', 'bg-transparent', 'text-gray-400');
        businessBtn.classList.remove('border-orange-500', 'bg-orange-500/20', 'text-orange-400');
        businessBtn.classList.add('border-gray-600', 'bg-transparent', 'text-gray-400');
        
        // تغيير الفئات
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="food">🍔 طعام وشراب</option>
                <option value="clothes">👕 ملابس</option>
                <option value="transport">🚗 تنقل ومواصلات</option>
                <option value="health">💊 صحة وأدوية</option>
                <option value="entertainment">🎮 ترفيه</option>
                <option value="education">📚 تعليم وكورسات</option>
                <option value="bills">🏠 فواتير (كهرباء، ماء)</option>
                <option value="rent">🏠 إيجار</option>
                <option value="personal_other">📋 أخرى (شخصي)</option>
            `;
        }
    }
}

/**
 * حفظ المصروف
 */
async function saveExpense(event) {
    event.preventDefault();
    
    const type = document.getElementById('expense-type').value;
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const currency = document.getElementById('expense-currency').value;
    const description = document.getElementById('expense-description').value || '';
    const date = document.getElementById('expense-date').value;
    
    if (amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    
    try {
        const { addDoc, collection, serverTimestamp } = window.firebaseModules;
        
        const expenseData = {
            type: type,
            category: category,
            amount: amount,
            currency: currency,
            description: description,
            date: date || new Date().toISOString().split('T')[0],
            timestamp: serverTimestamp(),
            createdAt: new Date()
        };
        
        await addDoc(collection(window.db, 'expenses'), expenseData);
        
        closeExpenseModal();
        showToast('✅ تم تسجيل المصروف بنجاح');
        logActivity('expense', 'created', `${type}: ${amount} ${currency}`);
        
        // تحديث البيانات
        await loadExpenses();
        displayExpensesList();
        updateAccountingStats();
        
    } catch (error) {
        console.error('خطأ في حفظ المصروف:', error);
        showToast('خطأ في حفظ المصروف', 'error');
    }
}

/**
 * تحميل المصاريف من Firebase
 */
async function loadExpenses() {
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'expenses'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        allExpenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('تم تحميل', allExpenses.length, 'مصروف');
    } catch (error) {
        console.error('خطأ في تحميل المصاريف:', error);
        allExpenses = [];
    }
}

/**
 * عرض قائمة المصاريف
 */
function displayExpensesList() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredExpenses = filterExpensesByDate(allExpenses, dateFilter);
    
    const businessList = document.getElementById('business-expenses-list');
    const personalList = document.getElementById('personal-expenses-list');
    const businessTotal = document.getElementById('business-expenses-total');
    const personalTotal = document.getElementById('personal-expenses-total');
    
    const businessExpenses = filteredExpenses.filter(e => e.type === 'business');
    const personalExpenses = filteredExpenses.filter(e => e.type === 'personal');
    
    // حساب الإجماليات (تحويل USD إلى DZD بسعر السكوار)
    const businessSum = businessExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') return sum + usdToDzd(amount);
        return sum + amount;
    }, 0);
    const personalSum = personalExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') return sum + usdToDzd(amount);
        return sum + amount;
    }, 0);
    
    if (businessTotal) businessTotal.textContent = `${Math.round(businessSum).toLocaleString()} د.ج`;
    if (personalTotal) personalTotal.textContent = `${Math.round(personalSum).toLocaleString()} د.ج`;
    
    // عرض مصاريف العمل
    if (businessList) {
        if (businessExpenses.length === 0) {
            businessList.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">لا توجد مصاريف</p>';
        } else {
            businessList.innerHTML = businessExpenses.slice(0, 10).map(e => {
                const cat = EXPENSE_CATEGORIES.business[e.category] || { icon: '📋', label: e.category };
                return `
                    <div class="flex justify-between items-center p-2 rounded-lg bg-gray-800/50 text-sm">
                        <div class="flex items-center gap-2">
                            <span>${cat.icon}</span>
                            <span class="text-gray-300">${e.description || cat.label}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-orange-400 font-bold">${e.amount?.toLocaleString()} ${e.currency}</span>
                            <button onclick="deleteExpense('${e.id}')" class="text-red-400 hover:text-red-300 text-xs">✕</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // عرض المصاريف الشخصية
    if (personalList) {
        if (personalExpenses.length === 0) {
            personalList.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">لا توجد مصاريف</p>';
        } else {
            personalList.innerHTML = personalExpenses.slice(0, 10).map(e => {
                const cat = EXPENSE_CATEGORIES.personal[e.category] || { icon: '📋', label: e.category };
                return `
                    <div class="flex justify-between items-center p-2 rounded-lg bg-gray-800/50 text-sm">
                        <div class="flex items-center gap-2">
                            <span>${cat.icon}</span>
                            <span class="text-gray-300">${e.description || cat.label}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-purple-400 font-bold">${e.amount?.toLocaleString()} ${e.currency}</span>
                            <button onclick="deleteExpense('${e.id}')" class="text-red-400 hover:text-red-300 text-xs">✕</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

/**
 * فلترة المصاريف حسب التاريخ
 */
function filterExpensesByDate(expenses, filter) {
    if (filter === 'all') return expenses;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return expenses.filter(expense => {
        const expenseDate = expense.date ? new Date(expense.date) : 
            (expense.timestamp?.toDate ? expense.timestamp.toDate() : new Date());
        
        switch (filter) {
            case 'today':
                return expenseDate >= today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return expenseDate >= weekAgo;
            case 'month':
                return expenseDate.getMonth() === now.getMonth() && 
                       expenseDate.getFullYear() === now.getFullYear();
            case 'year':
                return expenseDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });
}

/**
 * حذف مصروف
 */
async function deleteExpense(expenseId) {
    if (!confirm('هل تريد حذف هذا المصروف؟')) return;
    
    try {
        const { deleteDoc, doc } = window.firebaseModules;
        await deleteDoc(doc(window.db, 'expenses', expenseId));
        
        showToast('✅ تم حذف المصروف');
        await loadExpenses();
        displayExpensesList();
        updateAccountingStats();
    } catch (error) {
        console.error('خطأ في حذف المصروف:', error);
        showToast('خطأ في حذف المصروف', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// التقرير الشهري - Monthly Report
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة التقرير الشهري
 */
function openMonthlyReportModal() {
    const modal = document.getElementById('monthly-report-modal');
    const monthSelect = document.getElementById('report-month');
    const yearSelect = document.getElementById('report-year');
    
    if (!modal) return;
    
    // تعيين الشهر والسنة الحالية
    const now = new Date();
    if (monthSelect) monthSelect.value = now.getMonth();
    
    // ملء قائمة السنوات
    if (yearSelect) {
        yearSelect.innerHTML = '';
        for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // توليد التقرير
    generateMonthlyReport();
}

/**
 * إغلاق نافذة التقرير الشهري
 */
function closeMonthlyReportModal() {
    const modal = document.getElementById('monthly-report-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * توليد التقرير الشهري
 */
async function generateMonthlyReport() {
    const month = parseInt(document.getElementById('report-month')?.value) || new Date().getMonth();
    const year = parseInt(document.getElementById('report-year')?.value) || new Date().getFullYear();
    
    // تحميل البيانات إذا لم تكن محملة
    if (allProducts.length === 0) await loadProducts();
    if (allOrders.length === 0) await loadOrders();
    if (allPurchases.length === 0) await loadPurchases();
    if (allExpenses.length === 0) await loadExpenses();
    
    // فلترة البيانات حسب الشهر
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const monthOrders = allOrders.filter(o => {
        const orderDate = o.timestamp?.toDate ? o.timestamp.toDate() : new Date(o.timestamp || o.createdAt);
        return orderDate >= startDate && orderDate <= endDate && (o.status === 'delivered' || o.status === 'confirmed');
    });
    
    const monthPurchases = allPurchases.filter(p => {
        const purchaseDate = p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp || p.createdAt);
        return purchaseDate >= startDate && purchaseDate <= endDate;
    });
    
    const monthExpenses = allExpenses.filter(e => {
        const expenseDate = e.date ? new Date(e.date) : 
            (e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.createdAt));
        return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    // حساب الإيرادات
    const revenue = monthOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    
    // حساب تكلفة المنتجات
    const productCost = monthPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    
    // حساب المصاريف (تحويل USD إلى DZD بسعر السكوار)
    const businessExpenses = monthExpenses.filter(e => e.type === 'business');
    const personalExpenses = monthExpenses.filter(e => e.type === 'personal');
    const businessExpSum = businessExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') return sum + usdToDzd(amount);
        return sum + amount;
    }, 0);
    const personalExpSum = personalExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') return sum + usdToDzd(amount);
        return sum + amount;
    }, 0);
    
    // حساب الأرباح
    const grossProfit = revenue - productCost;
    const netBusinessProfit = grossProfit - businessExpSum;
    const netTotal = netBusinessProfit - personalExpSum;
    
    // تحديث العناصر
    document.getElementById('report-revenue').textContent = `${revenue.toLocaleString()} د.ج`;
    document.getElementById('report-product-cost').textContent = `${productCost.toLocaleString()} د.ج`;
    document.getElementById('report-business-exp').textContent = `${businessExpSum.toLocaleString()} د.ج`;
    document.getElementById('report-personal-exp').textContent = `${personalExpSum.toLocaleString()} د.ج`;
    document.getElementById('report-gross-profit').textContent = `${grossProfit.toLocaleString()} د.ج`;
    document.getElementById('report-net-business').textContent = `${netBusinessProfit.toLocaleString()} د.ج`;
    document.getElementById('report-net-total').textContent = `${netTotal.toLocaleString()} د.ج`;
    document.getElementById('report-net-total').className = netTotal >= 0 ? 'text-2xl font-bold text-green-400' : 'text-2xl font-bold text-red-400';
    
    // تفاصيل المبيعات
    const salesBreakdown = document.getElementById('report-sales-breakdown');
    const salesByProduct = {};
    monthOrders.forEach(o => {
        const name = o.productName || 'غير محدد';
        if (!salesByProduct[name]) salesByProduct[name] = { count: 0, revenue: 0 };
        salesByProduct[name].count++;
        salesByProduct[name].revenue += parseFloat(o.amount) || 0;
    });
    
    if (Object.keys(salesByProduct).length === 0) {
        salesBreakdown.innerHTML = '<p class="text-gray-500 text-sm">لا توجد مبيعات</p>';
    } else {
        salesBreakdown.innerHTML = Object.entries(salesByProduct).map(([name, data]) => `
            <div class="flex justify-between text-sm py-1 border-b border-gray-700/50">
                <span class="text-gray-300">${name} (×${data.count})</span>
                <span class="text-green-400">${data.revenue.toLocaleString()} د.ج</span>
            </div>
        `).join('');
    }
    
    // تفاصيل المصاريف
    const expensesBreakdown = document.getElementById('report-expenses-breakdown');
    const expensesByCategory = {};
    monthExpenses.forEach(e => {
        const cat = EXPENSE_CATEGORIES[e.type]?.[e.category]?.label || e.category;
        if (!expensesByCategory[cat]) expensesByCategory[cat] = 0;
        expensesByCategory[cat] += e.amount || 0;
    });
    
    if (Object.keys(expensesByCategory).length === 0) {
        expensesBreakdown.innerHTML = '<p class="text-gray-500 text-sm">لا توجد مصاريف</p>';
    } else {
        expensesBreakdown.innerHTML = Object.entries(expensesByCategory).map(([cat, amount]) => `
            <div class="flex justify-between text-sm py-1 border-b border-gray-700/50">
                <span class="text-gray-300">${cat}</span>
                <span class="text-red-400">${amount.toLocaleString()} د.ج</span>
            </div>
        `).join('');
    }
    
    // رسم البيانات
    drawReportCharts(salesByProduct, expensesByCategory);
}

/**
 * رسم الرسوم البيانية للتقرير
 */
function drawReportCharts(salesData, expensesData) {
    // تدمير الرسوم القديمة
    if (window.reportRevenueChart) window.reportRevenueChart.destroy();
    if (window.reportExpensesChart) window.reportExpensesChart.destroy();
    
    const revenueCtx = document.getElementById('report-revenue-chart');
    const expensesCtx = document.getElementById('report-expenses-chart');
    
    if (revenueCtx && Object.keys(salesData).length > 0) {
        window.reportRevenueChart = new Chart(revenueCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(salesData),
                datasets: [{
                    data: Object.values(salesData).map(d => d.revenue),
                    backgroundColor: [
                        '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
                        '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 10 } } }
                }
            }
        });
    }
    
    if (expensesCtx && Object.keys(expensesData).length > 0) {
        window.reportExpensesChart = new Chart(expensesCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expensesData),
                datasets: [{
                    data: Object.values(expensesData),
                    backgroundColor: [
                        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
                        '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 10 } } }
                }
            }
        });
    }
}

// جعل وظائف البيع والشراء والمصاريف متاحة عالمياً فوراً
window.openSaleModal = openSaleModal;
window.closeSaleModal = closeSaleModal;
window.saveSale = saveSale;
window.updateSaleAmount = updateSaleAmount;
window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
window.savePurchase = savePurchase;
window.updatePurchaseTotal = updatePurchaseTotal;
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.saveExpense = saveExpense;
window.setExpenseType = setExpenseType;
window.deleteExpense = deleteExpense;
window.openMonthlyReportModal = openMonthlyReportModal;
window.closeMonthlyReportModal = closeMonthlyReportModal;
window.generateMonthlyReport = generateMonthlyReport;
window.deletePurchase = deletePurchase;
window.deleteSale = deleteSale;
window.displayTransactionsLog = displayTransactionsLog;

// ═══════════════════════════════════════════════════════════════════════════
// سجل العمليات - Transactions Log
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض سجل المشتريات والمبيعات
 */
function displayTransactionsLog() {
    displayPurchasesLog();
    displaySalesLog();
}

/**
 * عرض سجل المشتريات
 */
function displayPurchasesLog() {
    const container = document.getElementById('purchases-log');
    const countEl = document.getElementById('purchases-count');
    
    if (!container) return;
    
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredPurchases = filterOrdersByDate(allPurchases, dateFilter);
    
    if (countEl) countEl.textContent = `${filteredPurchases.length} عملية`;
    
    if (filteredPurchases.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">لا توجد عمليات شراء</p>';
        return;
    }
    
    container.innerHTML = filteredPurchases.slice(0, 20).map(p => {
        const date = p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.createdAt);
        const dateStr = date.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
        
        return `
            <div class="flex justify-between items-center p-2 rounded-lg bg-gray-800/50 text-sm">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-blue-300 font-bold">${p.productName || 'منتج'}</span>
                        <span class="text-gray-500 text-xs">×${p.quantity || 1}</span>
                    </div>
                    <div class="text-gray-500 text-xs">${p.supplier || ''} • ${dateStr}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-red-400 font-bold">${(p.totalPrice || 0).toLocaleString()} ${p.currency || 'DZD'}</span>
                    <button onclick="deletePurchase('${p.id}')" 
                        class="text-red-400 hover:text-white hover:bg-red-600 text-xs px-2 py-1 bg-red-600/30 rounded transition-all"
                        title="حذف">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * عرض سجل المبيعات
 */
function displaySalesLog() {
    const container = document.getElementById('sales-log');
    const countEl = document.getElementById('sales-count');
    
    if (!container) return;
    
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );
    
    if (countEl) countEl.textContent = `${filteredOrders.length} عملية`;
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">لا توجد عمليات بيع</p>';
        return;
    }
    
    container.innerHTML = filteredOrders.slice(0, 20).map(o => {
        const date = o.timestamp?.toDate ? o.timestamp.toDate() : new Date(o.createdAt);
        const dateStr = date.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
        
        return `
            <div class="flex justify-between items-center p-2 rounded-lg bg-gray-800/50 text-sm">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-green-300 font-bold">${o.productName || 'منتج'}</span>
                        ${o.source === 'manual' ? '<span class="text-xs text-yellow-400">يدوي</span>' : ''}
                    </div>
                    <div class="text-gray-500 text-xs">${o.customerName || 'عميل'} • ${dateStr}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-green-400 font-bold">${(parseFloat(o.amount) || 0).toLocaleString()} ${o.currency || 'DZD'}</span>
                    <button onclick="deleteSale('${o.id}')" 
                        class="text-red-400 hover:text-white hover:bg-red-600 text-xs px-2 py-1 bg-red-600/30 rounded transition-all"
                        title="حذف">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * حذف عملية شراء
 */
async function deletePurchase(purchaseId) {
    if (!confirm('هل تريد حذف عملية الشراء هذه؟')) return;
    
    try {
        const { deleteDoc, doc } = window.firebaseModules;
        await deleteDoc(doc(window.db, 'purchases', purchaseId));
        
        showToast('✅ تم حذف عملية الشراء');
        await loadPurchases();
        displayAccountingTable();
        updateAccountingStats();
        displayTransactionsLog();
    } catch (error) {
        console.error('خطأ في حذف عملية الشراء:', error);
        showToast('خطأ في الحذف', 'error');
    }
}

/**
 * حذف عملية بيع
 */
async function deleteSale(orderId) {
    if (!confirm('هل تريد حذف عملية البيع هذه؟')) return;
    
    try {
        const { deleteDoc, doc } = window.firebaseModules;
        await deleteDoc(doc(window.db, 'orders', orderId));
        
        showToast('✅ تم حذف عملية البيع');
        await loadOrders();
        displayAccountingTable();
        updateAccountingStats();
        displayTransactionsLog();
    } catch (error) {
        console.error('خطأ في حذف عملية البيع:', error);
        showToast('خطأ في الحذف', 'error');
    }
}

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
    try {
        const loginPage = document.getElementById('login-page');
        const dashboardPage = document.getElementById('dashboard-page');
        
        if (!loginPage || !dashboardPage) {
            console.error('عناصر الصفحة غير موجودة');
            return;
        }
        
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        
        console.log('تم عرض لوحة التحكم');
        
        // تحميل البيانات (مع معالجة الأخطاء)
        try {
            if (typeof loadReviews === 'function') loadReviews();
        } catch (error) {
            console.warn('خطأ في تحميل التقييمات:', error);
        }
        
        try {
            if (typeof loadProducts === 'function') loadProducts();
        } catch (error) {
            console.warn('خطأ في تحميل المنتجات:', error);
        }
        
        try {
            if (typeof loadOrders === 'function') loadOrders();
        } catch (error) {
            console.warn('خطأ في تحميل الطلبات:', error);
        }
        
        try {
            if (typeof loadCustomers === 'function') loadCustomers();
        } catch (error) {
            console.warn('خطأ في تحميل العملاء:', error);
        }
        
        try {
            if (typeof loadSecuritySettings === 'function') loadSecuritySettings();
        } catch (error) {
            console.warn('خطأ في تحميل إعدادات الأمان:', error);
        }
    } catch (error) {
        console.error('خطأ في عرض لوحة التحكم:', error);
        alert('حدث خطأ أثناء تحميل لوحة التحكم. يرجى تحديث الصفحة.');
    }
}

/**
 * جلب كلمة المرور من Firebase
 */
async function getAdminPasswordFromFirebase() {
    console.log('🔐 جاري جلب كلمة المرور...');
    
    try {
        // أولاً: محاولة جلب من Firebase
        if (window.db && window.firebaseModules && window.firebaseModules.getDoc) {
            const { doc, getDoc } = window.firebaseModules;
            const docRef = doc(window.db, 'settings', 'adminPassword');
            
            console.log('📡 جاري الاتصال بـ Firebase...');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const firebasePassword = docSnap.data().password;
                console.log('✅ تم جلب كلمة المرور من Firebase بنجاح');
                // تحديث النسخة المحلية
                localStorage.setItem('adminPassword', firebasePassword);
                return firebasePassword;
            } else {
                console.log('📭 لا توجد كلمة مرور في Firebase، جاري إنشاء واحدة...');
                // إذا لم توجد في Firebase، نحفظ المحلية أو الافتراضية هناك
                const localPassword = localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
                await saveAdminPasswordToFirebase(localPassword);
                return localPassword;
            }
        }
        
        // ثانياً: استخدام localStorage كبديل
        console.warn('⚠️ Firebase غير متاح، استخدام كلمة المرور المحلية');
        return localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
        
    } catch (error) {
        console.error('❌ خطأ في جلب كلمة المرور من Firebase:', error);
        return localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
    }
}

/**
 * حفظ كلمة المرور في Firebase
 */
async function saveAdminPasswordToFirebase(newPassword) {
    console.log('💾 جاري حفظ كلمة المرور الجديدة...');
    
    // دائماً نحفظ محلياً أولاً
    localStorage.setItem('adminPassword', newPassword);
    console.log('💿 تم حفظ كلمة المرور محلياً');
    
    try {
        if (!window.db || !window.firebaseModules || !window.firebaseModules.setDoc) {
            console.warn('⚠️ Firebase غير متاح، تم الحفظ محلياً فقط');
            return false;
        }
        
        const { doc, setDoc, serverTimestamp } = window.firebaseModules;
        const docRef = doc(window.db, 'settings', 'adminPassword');
        
        console.log('📡 جاري الحفظ في Firebase...');
        
        await setDoc(docRef, {
            password: newPassword,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('✅ تم حفظ كلمة المرور في Firebase بنجاح!');
        console.log('🔑 كلمة المرور الجديدة:', newPassword);
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ كلمة المرور في Firebase:', error);
        console.log('⚠️ كلمة المرور محفوظة محلياً فقط');
        return false;
    }
}

/**
 * معالجة تسجيل الدخول
 */
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const passwordInput = document.getElementById('admin-password');
        if (!passwordInput) {
            console.error('حقل كلمة المرور غير موجود');
            return;
        }
        
        const password = passwordInput.value;
        
        // جلب كلمة المرور من Firebase
        const savedPassword = await getAdminPasswordFromFirebase();
        
        console.log('محاولة تسجيل الدخول...');
        
        if (password === savedPassword) {
            // تسجيل الدخول بنجاح
            console.log('كلمة المرور صحيحة، تسجيل الدخول...');
            sessionStorage.setItem('adminLoggedIn', 'true');
            
            // وضع علامة المسؤول لاستثنائه من عداد الزوار
            localStorage.setItem('isAdmin', 'true');
            
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
            
            showDashboard();
            showToast('مرحباً بك! 👋');
            
            // تسجيل النشاط (مع معالجة الأخطاء)
            try {
                if (typeof logActivity === 'function') {
                    logActivity('security', 'login', 'Admin logged in successfully');
                }
            } catch (error) {
                console.warn('لا يمكن تسجيل النشاط:', error);
            }
        } else {
            // كلمة مرور خاطئة
            console.log('كلمة المرور خاطئة');
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.classList.remove('hidden');
            }
            
            passwordInput.classList.add('border-red-500');
            setTimeout(() => {
                passwordInput.classList.remove('border-red-500');
            }, 2000);
            
            // تسجيل النشاط (مع معالجة الأخطاء)
            try {
                if (typeof logActivity === 'function') {
                    logActivity('security', 'failed_login', 'Failed login attempt');
                }
            } catch (error) {
                console.warn('لا يمكن تسجيل النشاط:', error);
            }
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('حدث خطأ أثناء تسجيل الدخول. يرجى التحقق من Console للمزيد من التفاصيل.');
    }
}

/**
 * تسجيل الخروج
 */
function logout() {
    logActivity('security', 'logout', 'Admin logged out');
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
async function handleChangePassword(event) {
    event.preventDefault();
    
    console.log('🔄 بدء عملية تغيير كلمة المرور...');
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // جلب كلمة المرور الحالية من Firebase
    const savedPassword = await getAdminPasswordFromFirebase();
    console.log('📋 كلمة المرور المحفوظة:', savedPassword);
    
    // التحقق من كلمة المرور الحالية
    if (currentPassword !== savedPassword) {
        showToast('كلمة المرور الحالية غير صحيحة', 'error');
        console.log('❌ كلمة المرور الحالية خاطئة');
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
    
    // حفظ كلمة المرور الجديدة في Firebase
    const success = await saveAdminPasswordToFirebase(newPassword);
    
    // التحقق من نجاح الحفظ بقراءة كلمة المرور مرة أخرى
    const verifyPassword = await getAdminPasswordFromFirebase();
    console.log('🔍 التحقق - كلمة المرور بعد الحفظ:', verifyPassword);
    
    if (verifyPassword === newPassword) {
        console.log('✅ تم التحقق من نجاح تغيير كلمة المرور!');
    } else {
        console.error('⚠️ تحذير: كلمة المرور المحفوظة لا تتطابق مع الجديدة!');
    }
    
    // مسح الحقول
    document.getElementById('change-password-form').reset();
    
    if (success) {
        showToast('تم تغيير كلمة المرور بنجاح وحفظها في السحابة 🔑☁️');
    } else {
        showToast('تم تغيير كلمة المرور محلياً فقط (Firebase غير متاح) 🔑');
    }
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
    try {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        if (!toast || !toastMessage) {
            console.warn('عناصر Toast غير موجودة، استخدام console.log بدلاً منها');
            console.log(`[${type === 'error' ? '❌' : '✅'}] ${message}`);
            return;
        }
        
        toastMessage.textContent = message;
        
        // تغيير اللون حسب النوع
        toast.classList.remove('bg-green-600', 'bg-red-600');
        toast.classList.add(type === 'error' ? 'bg-red-600' : 'bg-green-600');
        
        // عرض الرسالة
        toast.classList.remove('translate-y-20', 'opacity-0');
        
        // إخفاء بعد 3 ثواني
        setTimeout(() => {
            if (toast) {
                toast.classList.add('translate-y-20', 'opacity-0');
            }
        }, 3000);
    } catch (error) {
        console.warn('خطأ في عرض Toast:', error);
        console.log(`[Toast] ${message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تهيئة الصفحة - Page Initialization
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ تم تحميل الصفحة');
    
    // تحقق من حالة تسجيل الدخول
    try {
        checkLoginStatus();
    } catch (error) {
        console.error('خطأ في checkLoginStatus:', error);
    }
    
    // إعداد نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('✅ تم ربط نموذج تسجيل الدخول');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('❌ نموذج تسجيل الدخول غير موجود!');
    }
    
    // إعداد نموذج تغيير كلمة المرور
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    // إعداد البحث والفلترة
    const searchReviewsEl = document.getElementById('search-reviews');
    const filterProductEl = document.getElementById('filter-product');
    if (searchReviewsEl) searchReviewsEl.addEventListener('input', searchReviews);
    if (filterProductEl) filterProductEl.addEventListener('change', searchReviews);
    
    // إعداد نماذج المنتجات
    const productForm = document.getElementById('product-form');
    if (productForm) productForm.addEventListener('submit', saveProduct);
    
    // إعداد البحث والفلترة في المنتجات
    const searchProductsEl = document.getElementById('search-products');
    const filterCategoryEl = document.getElementById('filter-category');
    const filterAvailabilityEl = document.getElementById('filter-availability');
    if (searchProductsEl) searchProductsEl.addEventListener('input', searchProducts);
    if (filterCategoryEl) filterCategoryEl.addEventListener('change', searchProducts);
    if (filterAvailabilityEl) filterAvailabilityEl.addEventListener('change', searchProducts);
    
    // إعداد معاينة صورة المنتج
    const productImageEl = document.getElementById('product-image');
    if (productImageEl) {
        productImageEl.addEventListener('input', updateImagePreview);
        productImageEl.addEventListener('change', updateImagePreview);
    }
    
    // إعداد نماذج أكواد الخصم
    const promoForm = document.getElementById('promo-form');
    if (promoForm) promoForm.addEventListener('submit', savePromoCode);
    
    // إعداد البحث في الطلبات
    const searchOrdersEl = document.getElementById('search-orders');
    const filterOrderStatusEl = document.getElementById('filter-order-status');
    if (searchOrdersEl) searchOrdersEl.addEventListener('input', searchOrders);
    if (filterOrderStatusEl) filterOrderStatusEl.addEventListener('change', searchOrders);
    
    // إعداد البحث في العملاء
    const searchCustomersEl = document.getElementById('search-customers');
    if (searchCustomersEl) searchCustomersEl.addEventListener('input', searchCustomers);
    
    // عرض تاريخ آخر تحديث
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleDateString('ar-DZ');
    
    // تحميل إعدادات الأمان
    loadSecuritySettings();
});

// انتظار تحميل Firebase
window.addEventListener('firebaseReady', () => {
    console.log('✅ Firebase جاهز');
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        loadReviews();
        loadProducts();
        loadOrders();
        loadIntegrationSettings();
    }
});

// تحميل المنتجات بعد تحميل الصفحة (حتى لو لم يكن Firebase جاهزاً)
window.addEventListener('load', () => {
    if (sessionStorage.getItem('adminLoggedIn') === 'true' && typeof PRODUCTS !== 'undefined') {
        // محاولة تحميل المنتجات من currency-config.js مباشرة
        setTimeout(() => {
            if (allProducts.length === 0) {
                console.log('محاولة تحميل المنتجات من currency-config.js...');
                loadProducts();
            }
        }, 500);
    }
});

/**
 * تحميل إعدادات التكاملات
 */
async function loadIntegrationSettings() {
    try {
        const { getDoc, doc } = window.firebaseModules;
        
        // تحميل إعدادات طرق الدفع
        const paymentDoc = await getDoc(doc(window.db, 'settings', 'paymentMethods'));
        if (paymentDoc.exists()) {
            const data = paymentDoc.data();
            if (document.getElementById('baridimob-rip')) {
                document.getElementById('baridimob-rip').value = data.baridimob?.rip || '00799999002787548473';
            }
            if (document.getElementById('redotpay-id')) {
                document.getElementById('redotpay-id').value = data.redotpay?.id || '1117632168';
            }
            if (document.getElementById('usdt-trc20')) {
                document.getElementById('usdt-trc20').value = data.usdt?.trc20 || 'TWTgY41LNFqZcgBiRCZYsSq6ooeCx8gus9';
            }
        }
        
        // تحميل معلومات التواصل
        const contactDoc = await getDoc(doc(window.db, 'settings', 'contactInfo'));
        if (contactDoc.exists()) {
            const data = contactDoc.data();
            if (document.getElementById('whatsapp-number')) {
                document.getElementById('whatsapp-number').value = data.whatsapp || '213782125821';
            }
            if (document.getElementById('telegram-username')) {
                document.getElementById('telegram-username').value = data.telegram || '';
            }
        }
        
        // تحميل إعدادات Meta Pixel
        const pixelDoc = await getDoc(doc(window.db, 'settings', 'metaPixel'));
        if (pixelDoc.exists()) {
            const data = pixelDoc.data();
            if (document.getElementById('meta-pixel-id')) {
                document.getElementById('meta-pixel-id').value = data.pixelId || '2046893892791206';
            }
            if (document.getElementById('meta-pixel-enabled')) {
                document.getElementById('meta-pixel-enabled').checked = data.enabled !== false;
            }
        }
    } catch (error) {
        console.warn('لا يمكن تحميل إعدادات التكاملات:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة المنتجات - Products Management
// ═══════════════════════════════════════════════════════════════════════════

// allProducts معرّف مسبقاً في المتغيرات العامة
let editingProductId = null;
let charts = {};

/**
 * تحميل المنتجات من Firebase أو currency-config.js
 */
async function loadProducts() {
    try {
        let productsFromFirebase = false;
        
        // محاولة تحميل من Firebase أولاً (إذا كان متاحاً)
        if (window.db && window.firebaseModules) {
            try {
                const { collection, getDocs, setDoc, doc } = window.firebaseModules;
                const querySnapshot = await getDocs(collection(window.db, 'products'));
                allProducts = [];
                querySnapshot.forEach((docItem) => {
                    allProducts.push({
                        id: docItem.id,
                        ...docItem.data()
                    });
                });
                
                if (allProducts.length > 0) {
                    productsFromFirebase = true;
                    console.log('تم تحميل', allProducts.length, 'منتج من Firebase');
                }
            } catch (error) {
                console.log('لا توجد منتجات في Firebase أو Firebase غير متاح:', error);
            }
        }
        
        // إذا لم تكن موجودة في Firebase، استخدم البيانات من currency-config.js
        if (!productsFromFirebase) {
            if (typeof PRODUCTS !== 'undefined' && PRODUCTS && Object.keys(PRODUCTS).length > 0) {
                console.log('استخدام بيانات المنتجات من currency-config.js');
                allProducts = Object.keys(PRODUCTS).map(key => ({
                    id: key,
                    ...PRODUCTS[key],
                    active: PRODUCTS[key].active !== false
                }));
                
                // حفظ المنتجات في Firebase للمرة الأولى (إذا كان Firebase متاحاً)
                if (window.db && window.firebaseModules && allProducts.length > 0) {
                    try {
                        const { setDoc, doc } = window.firebaseModules;
                        for (const product of allProducts) {
                            await setDoc(doc(window.db, 'products', product.id), {
                                id: product.id,
                                name: product.name,
                                price_dzd: product.price_dzd,
                                price_usd: product.price_usd,
                                description: product.description || {},
                                paymentMethods: product.paymentMethods || {},
                                active: product.active !== false,
                                createdAt: new Date()
                            }, { merge: true });
                        }
                        console.log('تم حفظ', allProducts.length, 'منتج في Firebase');
                    } catch (error) {
                        console.warn('لا يمكن حفظ المنتجات في Firebase:', error);
                    }
                }
            } else {
                // إذا لم يكن currency-config.js محمّلاً، أنشئ منتجات افتراضية
                console.warn('لا توجد بيانات منتجات متاحة. إنشاء منتجات افتراضية...');
                allProducts = [
                    {
                        id: 'trw',
                        name: 'The Real World Account',
                        price_dzd: 3750,
                        price_usd: 15,
                        description: { ar: 'حساب مشترك للكورسات ومنصة The Real World', en: 'Shared account', fr: 'Compte partagé' },
                        paymentMethods: { dzd: ['baridimob', 'crypto'], usd: ['binance', 'redotpay', 'crypto'] },
                        active: true
                    },
                    {
                        id: 'chatgpt',
                        name: 'ChatGPT Business',
                        price_dzd: 1200,
                        price_usd: 5,
                        description: { ar: 'حساب ChatGPT Business للاستخدام المشترك', en: 'ChatGPT Business shared account', fr: 'Compte ChatGPT Business partagé' },
                        paymentMethods: { dzd: ['baridimob', 'crypto'], usd: ['binance', 'redotpay', 'crypto'] },
                        active: true
                    },
                    {
                        id: 'adobe',
                        name: 'Adobe Creative Cloud',
                        price_dzd: 2500,
                        price_usd: 6,
                        description: { ar: 'حساب Adobe Creative Cloud مشترك', en: 'Adobe Creative Cloud shared account', fr: 'Compte Adobe Creative Cloud partagé' },
                        paymentMethods: { dzd: ['baridimob', 'crypto'], usd: ['binance', 'redotpay', 'crypto'] },
                        active: true
                    },
                    {
                        id: 'netflix',
                        name: 'Netflix Premium',
                        price_dzd: 1500,
                        price_usd: 6,
                        description: { ar: 'حساب Netflix Premium مشترك', en: 'Netflix Premium shared account', fr: 'Compte Netflix Premium partagé' },
                        paymentMethods: { dzd: ['baridimob', 'crypto'], usd: ['binance', 'redotpay', 'crypto'] },
                        active: true
                    },
                    {
                        id: 'tradingview',
                        name: 'TradingView Premium',
                        price_dzd: 1500,
                        price_usd: 6,
                        description: { ar: 'حساب TradingView Premium للتحليل المالي', en: 'TradingView Premium account', fr: 'Compte TradingView Premium' },
                        paymentMethods: { dzd: ['baridimob', 'crypto'], usd: ['binance', 'redotpay', 'crypto'] },
                        active: true
                    }
                ];
                console.log('تم إنشاء', allProducts.length, 'منتج افتراضي');
            }
        }
        
        console.log('إجمالي المنتجات:', allProducts.length);
        displayProductsTable();
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        // عرض رسالة خطأ في الجدول
        const tbody = document.getElementById('products-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-red-400">خطأ في تحميل المنتجات: ' + error.message + '</td></tr>';
        }
    }
}

/**
 * عرض جدول المنتجات
 */
function displayProductsTable(products = allProducts) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) {
        console.warn('products-table-body not found');
        return;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-400">لا توجد منتجات</td></tr>';
        return;
    }
    
    // تحديث الإحصائيات
    updateProductStats();
    
    // ترتيب المنتجات حسب order إذا موجود
    const sortedProducts = [...products].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    console.log('عرض المنتجات:', sortedProducts.length);
    tbody.innerHTML = sortedProducts.map((product, index) => {
        const categoryLabels = {
            subscriptions: 'اشتراكات',
            accounts: 'حسابات',
            tools: 'أدوات',
            courses: 'كورسات',
            other: 'أخرى'
        };
        
        // حساب عدد المبيعات لهذا المنتج
        const salesCount = allOrders.filter(o => 
            o.productName === product.name && 
            (o.status === 'delivered' || o.status === 'confirmed')
        ).length;
        
        return `
        <tr class="border-t border-gray-700 hover:bg-gray-700/50 transition-colors product-row" 
            draggable="true" 
            data-product-id="${product.id}"
            data-order="${product.order || index}">
            <!-- Drag Handle -->
            <td class="px-2 py-4 cursor-move text-gray-500 drag-handle">
                <span class="text-lg">⬍</span>
            </td>
            <!-- Image -->
            <td class="px-4 py-4">
                <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                    ${product.image ? 
                        `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='📦'">` : 
                        '<span class="text-2xl">📦</span>'
                    }
                </div>
            </td>
            <!-- Product Info -->
            <td class="px-4 py-4">
                <div class="font-bold">${escapeHtml(product.name || product.id)}</div>
                <div class="text-gray-400 text-xs">${escapeHtml(product.id)}</div>
                ${product.featured ? '<span class="text-yellow-400 text-xs">⭐ مميز</span>' : ''}
            </td>
            <!-- Category -->
            <td class="px-4 py-4">
                <span class="bg-gray-700 px-2 py-1 rounded text-xs">
                    ${categoryLabels[product.category] || 'أخرى'}
                </span>
            </td>
            <!-- Price -->
            <td class="px-4 py-4">
                <div class="space-y-1">
                    ${product.old_price_dzd ? `<span class="text-gray-500 line-through text-sm">${product.old_price_dzd} د.ج</span>` : ''}
                    <div class="font-bold" style="color: var(--accent);">${product.price_dzd || 0} د.ج</div>
                    <div class="text-gray-400 text-xs">$${product.price_usd || 0}</div>
                </div>
            </td>
            <!-- Stock -->
            <td class="px-4 py-4 text-center">
                ${product.stock !== undefined && product.stock !== null && product.stock !== '' ? 
                    `<span class="${product.stock <= 3 ? 'text-red-400' : 'text-green-400'}">${product.stock}</span>` : 
                    '<span class="text-gray-500">∞</span>'
                }
            </td>
            <!-- Availability Toggle (3 states: available, unavailable, coming_soon) -->
            <td class="px-4 py-4 text-center">
                <button onclick="toggleAvailability('${product.id}')" 
                    class="px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        getProductStatus(product) === 'available' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                        getProductStatus(product) === 'unavailable' ? 'bg-red-600 hover:bg-red-700 text-white' : 
                        'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }">
                    ${getProductStatus(product) === 'available' ? '✅ متوفر' : 
                      getProductStatus(product) === 'unavailable' ? '❌ غير متوفر' : 
                      '🔜 قريباً'}
                </button>
            </td>
            <!-- Active Status -->
            <td class="px-4 py-4 text-center">
                <button onclick="toggleActive('${product.id}')" 
                    class="w-12 h-6 rounded-full transition-all relative ${
                        product.active !== false ? 'bg-purple-600' : 'bg-gray-600'
                    }">
                    <span class="absolute top-1 ${product.active !== false ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-all"></span>
                </button>
            </td>
            <!-- Actions -->
            <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1 justify-center">
                    <button onclick="previewProduct('${product.id}')" 
                        class="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs transition-colors" title="معاينة">
                        👁️
                    </button>
                    <button onclick="editProduct('${product.id}')" 
                        class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors" title="تعديل">
                        ✏️
                    </button>
                    <button onclick="duplicateProduct('${product.id}')" 
                        class="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors" title="نسخ">
                        📋
                    </button>
                    <button onclick="openDeleteModal('${product.id}', 'product')" 
                        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    
    // إعداد Drag & Drop
    initProductDragDrop();
}

/**
 * تحديث إحصائيات المنتجات
 */
function updateProductStats() {
    const totalProducts = allProducts.length;
    const availableProducts = allProducts.filter(p => getProductStatus(p) === 'available').length;
    const unavailableProducts = allProducts.filter(p => getProductStatus(p) === 'unavailable').length;
    const comingSoonProducts = allProducts.filter(p => getProductStatus(p) === 'coming_soon').length;
    const totalSales = allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed').length;
    
    const statTotal = document.getElementById('stat-products-total');
    const statAvailable = document.getElementById('stat-products-available');
    const statUnavailable = document.getElementById('stat-products-unavailable');
    const statComingSoon = document.getElementById('stat-products-coming-soon');
    const statSales = document.getElementById('stat-products-sales');
    
    if (statTotal) statTotal.textContent = totalProducts;
    if (statAvailable) statAvailable.textContent = availableProducts;
    if (statUnavailable) statUnavailable.textContent = unavailableProducts;
    if (statComingSoon) statComingSoon.textContent = comingSoonProducts;
    if (statSales) statSales.textContent = totalSales;
}

/**
 * تبديل حالة التوفر بين ثلاث حالات: متوفر، غير متوفر، قريباً
 */
async function toggleAvailability(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // التنقل بين الحالات الثلاث: available -> unavailable -> coming_soon -> available
    let newStatus;
    const currentStatus = product.status || (product.available === false ? 'unavailable' : 'available');
    
    if (currentStatus === 'available') {
        newStatus = 'unavailable';
    } else if (currentStatus === 'unavailable') {
        newStatus = 'coming_soon';
    } else {
        newStatus = 'available';
    }
    
    const statusMessages = {
        available: '✅ المنتج الآن متوفر',
        unavailable: '❌ المنتج الآن غير متوفر',
        coming_soon: '🔜 المنتج قريباً'
    };
    
    try {
        const { updateDoc, doc } = window.firebaseModules;
        await updateDoc(doc(window.db, 'products', productId), {
            status: newStatus,
            available: newStatus === 'available' // للتوافق مع الكود القديم
        });
        
        product.status = newStatus;
        product.available = newStatus === 'available';
        displayProductsTable();
        showToast(statusMessages[newStatus]);
        logActivity('product', 'status_changed', `${product.name}: ${newStatus}`);
    } catch (error) {
        console.error('خطأ في تغيير حالة التوفر:', error);
        showToast('خطأ في تغيير حالة التوفر', 'error');
    }
}

/**
 * الحصول على حالة المنتج (للتوافق مع الكود القديم والجديد)
 */
function getProductStatus(product) {
    if (product.status) return product.status;
    return product.available === false ? 'unavailable' : 'available';
}

/**
 * تبديل حالة النشاط
 */
async function toggleActive(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const newActive = product.active === false ? true : false;
    
    try {
        const { updateDoc, doc } = window.firebaseModules;
        await updateDoc(doc(window.db, 'products', productId), {
            active: newActive
        });
        
        product.active = newActive;
        displayProductsTable();
        showToast(newActive ? '👁️ المنتج الآن مرئي' : '🙈 المنتج الآن مخفي');
        logActivity('product', 'active_changed', `${product.name}: ${newActive ? 'نشط' : 'غير نشط'}`);
    } catch (error) {
        console.error('خطأ في تغيير حالة النشاط:', error);
        showToast('خطأ في تغيير حالة النشاط', 'error');
    }
}

/**
 * نسخ منتج
 */
function duplicateProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // فتح نموذج جديد مع بيانات المنتج المنسوخ
    openProductModal(null);
    
    // ملء الحقول بالبيانات المنسوخة
    setTimeout(() => {
        document.getElementById('product-id').value = product.id + '_copy';
        document.getElementById('product-name').value = product.name + ' (نسخة)';
        document.getElementById('product-category').value = product.category || 'other';
        document.getElementById('product-price-dzd').value = product.price_dzd || 0;
        document.getElementById('product-price-usd').value = product.price_usd || 0;
        document.getElementById('product-old-price-dzd').value = product.old_price_dzd || '';
        document.getElementById('product-old-price-usd').value = product.old_price_usd || '';
        document.getElementById('product-cost-dzd').value = product.cost_dzd || '';
        document.getElementById('product-cost-usd').value = product.cost_usd || '';
        document.getElementById('product-supplier').value = product.supplier || '';
        document.getElementById('product-stock').value = product.stock || '';
        document.getElementById('product-image').value = product.image || '';
        document.getElementById('product-features').value = product.features || '';
        document.getElementById('product-whatsapp-msg').value = product.whatsappMsg || '';
        document.getElementById('product-desc-ar').value = product.description?.ar || '';
        document.getElementById('product-desc-en').value = product.description?.en || '';
        document.getElementById('product-desc-fr').value = product.description?.fr || '';
        document.getElementById('product-available').checked = product.available !== false;
        document.getElementById('product-active').checked = product.active !== false;
        document.getElementById('product-featured').checked = product.featured || false;
        
        // تحديث معاينة الصورة
        updateImagePreview();
    }, 100);
    
    showToast('📋 تم نسخ المنتج - عدّل المعرف والاسم ثم احفظ');
}

/**
 * معاينة المنتج
 */
function previewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('product-preview-modal');
    const content = document.getElementById('product-preview-content');
    
    const features = product.features ? product.features.split('\n').filter(f => f.trim()) : [];
    
    content.innerHTML = `
        <div class="text-center mb-4">
            ${product.image ? 
                `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-32 h-32 object-cover rounded-xl mx-auto" onerror="this.src='https://via.placeholder.com/128?text=📦'">` : 
                '<div class="w-32 h-32 bg-gray-700 rounded-xl mx-auto flex items-center justify-center text-5xl">📦</div>'
            }
        </div>
        <h4 class="text-xl font-bold text-center">${escapeHtml(product.name)}</h4>
        ${product.featured ? '<div class="text-center text-yellow-400">⭐ منتج مميز</div>' : ''}
        
        <div class="flex justify-center gap-4 my-4">
            <div class="text-center">
                ${product.old_price_dzd ? `<div class="text-gray-500 line-through text-sm">${product.old_price_dzd} د.ج</div>` : ''}
                <div class="text-2xl font-bold" style="color: var(--accent);">${product.price_dzd || 0} د.ج</div>
            </div>
            <div class="text-center">
                ${product.old_price_usd ? `<div class="text-gray-500 line-through text-sm">$${product.old_price_usd}</div>` : ''}
                <div class="text-2xl font-bold text-green-400">$${product.price_usd || 0}</div>
            </div>
        </div>
        
        <div class="flex justify-center gap-2 mb-4">
            <span class="px-3 py-1 rounded-full text-sm ${
                getProductStatus(product) === 'available' ? 'bg-green-600' : 
                getProductStatus(product) === 'unavailable' ? 'bg-red-600' : 
                'bg-yellow-600'
            }">
                ${getProductStatus(product) === 'available' ? '✅ متوفر' : 
                  getProductStatus(product) === 'unavailable' ? '❌ غير متوفر' : 
                  '🔜 قريباً'}
            </span>
            <span class="px-3 py-1 rounded-full text-sm ${product.active !== false ? 'bg-purple-600' : 'bg-gray-600'}">
                ${product.active !== false ? '👁️ مرئي' : '🙈 مخفي'}
            </span>
        </div>
        
        ${features.length > 0 ? `
            <div class="space-y-1 mb-4">
                <h5 class="font-bold text-sm text-gray-400">المميزات:</h5>
                ${features.map(f => `<div class="text-sm">${escapeHtml(f)}</div>`).join('')}
            </div>
        ` : ''}
        
        ${product.description?.ar ? `
            <div class="text-sm text-gray-400 text-center">${escapeHtml(product.description.ar)}</div>
        ` : ''}
        
        ${product.stock !== undefined && product.stock !== '' ? `
            <div class="text-center mt-4 text-sm">
                المخزون: <span class="${product.stock <= 3 ? 'text-red-400' : 'text-green-400'}">${product.stock}</span>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المعاينة
 */
function closePreviewModal() {
    const modal = document.getElementById('product-preview-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * البحث والفلترة في المنتجات
 */
function searchProducts() {
    const searchTerm = document.getElementById('search-products')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';
    const availabilityFilter = document.getElementById('filter-availability')?.value || 'all';
    
    let filtered = allProducts;
    
    // فلترة حسب البحث
    if (searchTerm) {
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchTerm)) ||
            (p.id && p.id.toLowerCase().includes(searchTerm))
        );
    }
    
    // فلترة حسب الفئة
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    // فلترة حسب التوفر (3 حالات)
    if (availabilityFilter === 'available') {
        filtered = filtered.filter(p => getProductStatus(p) === 'available');
    } else if (availabilityFilter === 'unavailable') {
        filtered = filtered.filter(p => getProductStatus(p) === 'unavailable');
    } else if (availabilityFilter === 'coming_soon') {
        filtered = filtered.filter(p => getProductStatus(p) === 'coming_soon');
    }
    
    displayProductsTable(filtered);
}

/**
 * تحديث معاينة الصورة
 */
function updateImagePreview() {
    const imageInput = document.getElementById('product-image');
    const preview = document.getElementById('product-image-preview');
    
    if (imageInput && preview) {
        const url = imageInput.value.trim();
        if (url) {
            preview.innerHTML = `<img src="${escapeHtml(url)}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'text-red-400 text-xs\\'>خطأ</span>'">`;
        } else {
            preview.innerHTML = '<span class="text-gray-400 text-xs">معاينة</span>';
        }
    }
}

/**
 * إعداد Drag & Drop للمنتجات
 */
function initProductDragDrop() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('.product-row');
    
    rows.forEach(row => {
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
    });
}

let draggedRow = null;

function handleDragStart(e) {
    draggedRow = this;
    this.classList.add('opacity-50');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('bg-purple-900/30');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('bg-purple-900/30');
    
    if (draggedRow !== this) {
        const tbody = document.getElementById('products-table-body');
        const rows = Array.from(tbody.querySelectorAll('.product-row'));
        const fromIndex = rows.indexOf(draggedRow);
        const toIndex = rows.indexOf(this);
        
        if (fromIndex < toIndex) {
            this.parentNode.insertBefore(draggedRow, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedRow, this);
        }
        
        // حفظ الترتيب الجديد
        saveProductOrder();
    }
}

function handleDragEnd(e) {
    this.classList.remove('opacity-50');
    document.querySelectorAll('.product-row').forEach(row => {
        row.classList.remove('bg-purple-900/30');
    });
}

/**
 * حفظ ترتيب المنتجات
 */
async function saveProductOrder() {
    const tbody = document.getElementById('products-table-body');
    const rows = tbody.querySelectorAll('.product-row');
    
    try {
        const { updateDoc, doc } = window.firebaseModules;
        
        for (let i = 0; i < rows.length; i++) {
            const productId = rows[i].dataset.productId;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                product.order = i;
                await updateDoc(doc(window.db, 'products', productId), { order: i });
            }
        }
        
        showToast('تم حفظ الترتيب الجديد ✅');
        logActivity('product', 'order_changed', 'Product order updated');
    } catch (error) {
        console.error('خطأ في حفظ الترتيب:', error);
        showToast('خطأ في حفظ الترتيب', 'error');
    }
}

/**
 * فتح نافذة إضافة/تعديل منتج
 */
function openProductModal(productId = null) {
    editingProductId = productId;
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');
    
    if (productId) {
        title.textContent = '✏️ تعديل المنتج';
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-id').disabled = true;
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-category').value = product.category || 'other';
            document.getElementById('product-price-dzd').value = product.price_dzd || 0;
            document.getElementById('product-price-usd').value = product.price_usd || 0;
            document.getElementById('product-old-price-dzd').value = product.old_price_dzd || '';
            document.getElementById('product-old-price-usd').value = product.old_price_usd || '';
            document.getElementById('product-cost-dzd').value = product.cost_dzd || '';
            document.getElementById('product-cost-usd').value = product.cost_usd || '';
            document.getElementById('product-supplier').value = product.supplier || '';
            document.getElementById('product-stock').value = product.stock !== undefined ? product.stock : '';
            document.getElementById('product-image').value = product.image || '';
            document.getElementById('product-features').value = product.features || '';
            document.getElementById('product-whatsapp-msg').value = product.whatsappMsg || '';
            document.getElementById('product-desc-ar').value = product.description?.ar || '';
            document.getElementById('product-desc-en').value = product.description?.en || '';
            document.getElementById('product-desc-fr').value = product.description?.fr || '';
            document.getElementById('product-available').checked = product.available !== false;
            document.getElementById('product-active').checked = product.active !== false;
            document.getElementById('product-featured').checked = product.featured || false;
            
            // تحديث معاينة الصورة
            updateImagePreview();
        }
    } else {
        title.textContent = '➕ إضافة منتج جديد';
        form.reset();
        document.getElementById('product-id').disabled = false;
        document.getElementById('product-available').checked = true;
        document.getElementById('product-active').checked = true;
        document.getElementById('product-image-preview').innerHTML = '<span class="text-gray-400 text-xs">معاينة</span>';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المنتج
 */
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    editingProductId = null;
    document.getElementById('product-form').reset();
    document.getElementById('product-image-preview').innerHTML = '<span class="text-gray-400 text-xs">معاينة</span>';
}

/**
 * تعديل منتج
 */
function editProduct(productId) {
    openProductModal(productId);
}

/**
 * حفظ منتج
 */
async function saveProduct(event) {
    event.preventDefault();
    
    const stockValue = document.getElementById('product-stock').value;
    const oldPriceDzd = document.getElementById('product-old-price-dzd').value;
    const oldPriceUsd = document.getElementById('product-old-price-usd').value;
    const costDzd = document.getElementById('product-cost-dzd').value;
    const costUsd = document.getElementById('product-cost-usd').value;
    const supplier = document.getElementById('product-supplier').value;
    
    const productData = {
        id: document.getElementById('product-id').value,
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price_dzd: parseFloat(document.getElementById('product-price-dzd').value),
        price_usd: parseFloat(document.getElementById('product-price-usd').value),
        old_price_dzd: oldPriceDzd ? parseFloat(oldPriceDzd) : null,
        old_price_usd: oldPriceUsd ? parseFloat(oldPriceUsd) : null,
        cost_dzd: costDzd ? parseFloat(costDzd) : null,
        cost_usd: costUsd ? parseFloat(costUsd) : null,
        supplier: supplier || null,
        stock: stockValue !== '' ? parseInt(stockValue) : null,
        image: document.getElementById('product-image').value,
        features: document.getElementById('product-features').value,
        whatsappMsg: document.getElementById('product-whatsapp-msg').value,
        description: {
            ar: document.getElementById('product-desc-ar').value,
            en: document.getElementById('product-desc-en').value,
            fr: document.getElementById('product-desc-fr').value
        },
        available: document.getElementById('product-available').checked,
        active: document.getElementById('product-active').checked,
        featured: document.getElementById('product-featured').checked,
        updatedAt: new Date()
    };
    
    // الحفاظ على الترتيب الحالي
    const existingProduct = allProducts.find(p => p.id === productData.id);
    if (existingProduct) {
        productData.order = existingProduct.order;
        productData.createdAt = existingProduct.createdAt;
    } else {
        productData.order = allProducts.length;
        productData.createdAt = new Date();
    }
    
    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, 'products', productData.id), productData);
        
        // تحديث القائمة المحلية
        const index = allProducts.findIndex(p => p.id === productData.id);
        if (index >= 0) {
            allProducts[index] = productData;
        } else {
            allProducts.push(productData);
        }
        
        displayProductsTable();
        closeProductModal();
        showToast('تم حفظ المنتج بنجاح ✅');
        logActivity('product', editingProductId ? 'updated' : 'created', productData.name);
    } catch (error) {
        console.error('خطأ في حفظ المنتج:', error);
        showToast('خطأ في حفظ المنتج', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الطلبات - Orders Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل الطلبات من Firebase
 */
async function loadOrders() {
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'orders'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allOrders = [];
        querySnapshot.forEach((doc) => {
            allOrders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayOrdersTable();
        updateOrderStats();
        loadCustomers(); // تحديث قائمة العملاء بعد تحميل الطلبات
        return Promise.resolve();
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        // إذا لم تكن هناك طلبات، اعرض رسالة
        const tbody = document.getElementById('orders-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">لا توجد طلبات</td></tr>';
        }
        return Promise.resolve();
    }
}

/**
 * عرض جدول الطلبات
 */
function displayOrdersTable(orders = allOrders) {
    const tbody = document.getElementById('orders-table-body');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">لا توجد طلبات</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const statusColors = {
            pending: 'bg-yellow-600',
            confirmed: 'bg-blue-600',
            delivered: 'bg-green-600',
            cancelled: 'bg-red-600'
        };
        
        const statusText = {
            pending: 'قيد الانتظار',
            confirmed: 'مؤكدة',
            delivered: 'تم التسليم',
            cancelled: 'ملغاة'
        };
        
        return `
            <tr class="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                <td class="px-6 py-4">#${order.id.substring(0, 8)}</td>
                <td class="px-6 py-4">${escapeHtml(order.productName || 'N/A')}</td>
                <td class="px-6 py-4">${escapeHtml(order.customerName || order.email || 'مجهول')}</td>
                <td class="px-6 py-4">${order.amount || 0} ${order.currency || 'DZD'}</td>
                <td class="px-6 py-4">${escapeHtml(order.paymentMethod || 'N/A')}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-sm ${statusColors[order.status] || 'bg-gray-600'}">
                        ${statusText[order.status] || order.status || 'غير محدد'}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-400">${formatDate(order.timestamp)}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex gap-2 justify-center">
                        <button onclick="viewOrderDetails('${order.id}')" 
                            class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
                            👁️ عرض
                        </button>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" 
                            class="bg-gray-700 border border-gray-600 rounded text-sm px-2 py-1">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>مؤكدة</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغاة</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * تحديث حالة الطلب
 */
async function updateOrderStatus(orderId, newStatus) {
    try {
        const { updateDoc, doc } = window.firebaseModules;
        await updateDoc(doc(window.db, 'orders', orderId), {
            status: newStatus,
            updatedAt: new Date()
        });
        
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
        }
        
        displayOrdersTable();
        showToast('تم تحديث حالة الطلب بنجاح ✅');
        logActivity('order', 'status_updated', `Order ${orderId}: ${newStatus}`);
    } catch (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        showToast('خطأ في تحديث حالة الطلب', 'error');
    }
}

/**
 * عرض تفاصيل الطلب
 */
async function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <strong>رقم الطلب:</strong> ${order.id}
            </div>
            <div>
                <strong>المنتج:</strong> ${escapeHtml(order.productName || 'N/A')}
            </div>
            <div>
                <strong>العميل:</strong> ${escapeHtml(order.customerName || 'مجهول')}
            </div>
            <div>
                <strong>البريد الإلكتروني:</strong> ${escapeHtml(order.email || 'N/A')}
            </div>
            <div>
                <strong>الهاتف:</strong> ${escapeHtml(order.phone || 'N/A')}
            </div>
            <div>
                <strong>المبلغ:</strong> ${order.amount || 0} ${order.currency || 'DZD'}
            </div>
            <div>
                <strong>طريقة الدفع:</strong> ${escapeHtml(order.paymentMethod || 'N/A')}
            </div>
            <div>
                <strong>الحالة:</strong> ${order.status || 'غير محدد'}
            </div>
            <div>
                <strong>التاريخ:</strong> ${formatDate(order.timestamp)}
            </div>
            ${order.notes ? `<div><strong>ملاحظات:</strong> ${escapeHtml(order.notes)}</div>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة تفاصيل الطلب
 */
function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * تحديث إحصائيات الطلبات
 */
function updateOrderStats() {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
        .filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    const avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
    
    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-total-revenue').textContent = totalRevenue.toFixed(2);
    document.getElementById('stat-avg-order').textContent = avgOrder;
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة العملاء - Customers Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل العملاء من الطلبات
 */
function loadCustomers() {
    // استخراج العملاء من الطلبات
    const customersMap = new Map();
    
    allOrders.forEach(order => {
        const email = order.email || 'unknown';
        if (!customersMap.has(email)) {
            customersMap.set(email, {
                email: email,
                name: order.customerName || 'مجهول',
                phone: order.phone || 'N/A',
                orders: [],
                totalSpent: 0,
                lastOrder: null
            });
        }
        
        const customer = customersMap.get(email);
        customer.orders.push(order);
        if (order.status === 'delivered' || order.status === 'confirmed') {
            customer.totalSpent += parseFloat(order.amount) || 0;
        }
        if (!customer.lastOrder || (order.timestamp && order.timestamp > customer.lastOrder)) {
            customer.lastOrder = order.timestamp;
        }
    });
    
    allCustomers = Array.from(customersMap.values());
    displayCustomersTable();
    document.getElementById('stat-total-customers').textContent = allCustomers.length;
}

/**
 * عرض جدول العملاء
 */
function displayCustomersTable(customers = allCustomers) {
    const tbody = document.getElementById('customers-table-body');
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا يوجد عملاء</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr class="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4">${escapeHtml(customer.name)}</td>
            <td class="px-6 py-4">${escapeHtml(customer.email)}</td>
            <td class="px-6 py-4">${escapeHtml(customer.phone)}</td>
            <td class="px-6 py-4">${customer.orders.length}</td>
            <td class="px-6 py-4">${customer.totalSpent.toFixed(2)}</td>
            <td class="px-6 py-4 text-gray-400">${formatDate(customer.lastOrder)}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="viewCustomerOrders('${customer.email}')" 
                    class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
                    👁️ عرض الطلبات
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * عرض طلبات العميل
 */
function viewCustomerOrders(email) {
    const customerOrders = allOrders.filter(o => o.email === email);
    if (customerOrders.length === 0) {
        showToast('لا توجد طلبات لهذا العميل', 'error');
        return;
    }
    
    showTab('orders');
    document.getElementById('search-orders').value = email;
    searchOrders();
}

// ═══════════════════════════════════════════════════════════════════════════
// التحليلات والإحصائيات - Analytics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحديث الرسوم البيانية
 */
function updateCharts() {
    updateSalesByProductChart();
    updateSalesByDateChart();
    updatePaymentMethodsChart();
}

/**
 * رسم بياني للمبيعات حسب المنتج
 */
function updateSalesByProductChart() {
    const ctx = document.getElementById('sales-by-product-chart');
    if (!ctx) return;
    
    const productSales = {};
    allOrders
        .filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .forEach(order => {
            const product = order.productName || 'غير محدد';
            productSales[product] = (productSales[product] || 0) + 1;
        });
    
    if (charts.salesByProduct) {
        charts.salesByProduct.destroy();
    }
    
    charts.salesByProduct = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(productSales),
            datasets: [{
                label: 'عدد المبيعات',
                data: Object.values(productSales),
                backgroundColor: 'rgba(255, 213, 111, 0.8)',
                borderColor: 'rgba(255, 213, 111, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * رسم بياني للمبيعات حسب التاريخ
 */
function updateSalesByDateChart() {
    const ctx = document.getElementById('sales-by-date-chart');
    if (!ctx) return;
    
    const dateSales = {};
    allOrders
        .filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .forEach(order => {
            if (order.timestamp) {
                const date = formatDate(order.timestamp);
                dateSales[date] = (dateSales[date] || 0) + 1;
            }
        });
    
    if (charts.salesByDate) {
        charts.salesByDate.destroy();
    }
    
    charts.salesByDate = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dateSales).sort(),
            datasets: [{
                label: 'المبيعات',
                data: Object.keys(dateSales).sort().map(date => dateSales[date]),
                borderColor: 'rgba(255, 213, 111, 1)',
                backgroundColor: 'rgba(255, 213, 111, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

/**
 * رسم بياني لطرق الدفع
 */
function updatePaymentMethodsChart() {
    const ctx = document.getElementById('payment-methods-chart');
    if (!ctx) return;
    
    const paymentMethods = {};
    allOrders
        .filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .forEach(order => {
            const method = order.paymentMethod || 'غير محدد';
            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        });
    
    if (charts.paymentMethods) {
        charts.paymentMethods.destroy();
    }
    
    charts.paymentMethods = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(paymentMethods),
            datasets: [{
                data: Object.values(paymentMethods),
                backgroundColor: [
                    'rgba(255, 213, 111, 0.8)',
                    'rgba(255, 179, 71, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة المحتوى - Content Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ الترجمة
 */
async function saveTranslation() {
    const lang = document.getElementById('translation-lang').value;
    const key = document.getElementById('translation-key').value;
    const value = document.getElementById('translation-value').value;
    
    if (!key || !value) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, 'translations', `${lang}_${key}`), {
            lang,
            key,
            value,
            updatedAt: new Date()
        });
        
        showToast('تم حفظ الترجمة بنجاح ✅');
        logActivity('content', 'translation_saved', `${lang}/${key}`);
    } catch (error) {
        console.error('خطأ في حفظ الترجمة:', error);
        showToast('خطأ في حفظ الترجمة', 'error');
    }
}

/**
 * حفظ المظهر
 */
function saveTheme() {
    const primaryColor = document.getElementById('primary-color').value;
    const secondaryColor = document.getElementById('secondary-color').value;
    
    localStorage.setItem('admin-primary-color', primaryColor);
    localStorage.setItem('admin-secondary-color', secondaryColor);
    
    // تطبيق الألوان
    document.documentElement.style.setProperty('--accent', primaryColor);
    document.documentElement.style.setProperty('--accent-strong', secondaryColor);
    
    showToast('تم حفظ المظهر بنجاح ✅');
    logActivity('content', 'theme_updated', 'Theme colors changed');
}

// ═══════════════════════════════════════════════════════════════════════════
// التكاملات - Integrations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ طرق الدفع
 */
async function savePaymentMethods() {
    const data = {
        baridimob: {
            rip: document.getElementById('baridimob-rip').value
        },
        redotpay: {
            id: document.getElementById('redotpay-id').value
        },
        usdt: {
            trc20: document.getElementById('usdt-trc20').value
        }
    };
    
    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, 'settings', 'paymentMethods'), data);
        showToast('تم حفظ طرق الدفع بنجاح ✅');
        logActivity('integration', 'payment_methods_updated', 'Payment methods saved');
    } catch (error) {
        console.error('خطأ في حفظ طرق الدفع:', error);
        showToast('خطأ في حفظ طرق الدفع', 'error');
    }
}

/**
 * حفظ معلومات التواصل
 */
async function saveContactInfo() {
    const data = {
        whatsapp: document.getElementById('whatsapp-number').value,
        telegram: document.getElementById('telegram-username').value
    };
    
    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, 'settings', 'contactInfo'), data);
        showToast('تم حفظ معلومات التواصل بنجاح ✅');
        logActivity('integration', 'contact_info_updated', 'Contact info saved');
    } catch (error) {
        console.error('خطأ في حفظ معلومات التواصل:', error);
        showToast('خطأ في حفظ معلومات التواصل', 'error');
    }
}

/**
 * حفظ إعدادات Meta Pixel
 */
async function saveMetaPixel() {
    const data = {
        pixelId: document.getElementById('meta-pixel-id').value,
        enabled: document.getElementById('meta-pixel-enabled').checked
    };
    
    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, 'settings', 'metaPixel'), data);
        showToast('تم حفظ إعدادات Meta Pixel بنجاح ✅');
        logActivity('integration', 'meta_pixel_updated', 'Meta Pixel settings saved');
    } catch (error) {
        console.error('خطأ في حفظ إعدادات Meta Pixel:', error);
        showToast('خطأ في حفظ إعدادات Meta Pixel', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// الأدوات - Tools
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تصدير البيانات
 */
async function backupData() {
    try {
        const { collection, getDocs } = window.firebaseModules;
        const collections = ['reviews', 'orders', 'products', 'settings'];
        const backup = {};
        
        for (const collName of collections) {
            try {
                const querySnapshot = await getDocs(collection(window.db, collName));
                backup[collName] = [];
                querySnapshot.forEach((doc) => {
                    backup[collName].push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            } catch (error) {
                console.warn(`لا يمكن الوصول إلى collection ${collName}:`, error);
            }
        }
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        showToast('تم تصدير البيانات بنجاح ✅');
        logActivity('tools', 'backup_created', 'Data backup exported');
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showToast('خطأ في تصدير البيانات', 'error');
    }
}

/**
 * استيراد البيانات
 */
document.getElementById('import-file')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const { setDoc, doc } = window.firebaseModules;
        
        for (const [collName, docs] of Object.entries(data)) {
            for (const docData of docs) {
                await setDoc(doc(window.db, collName, docData.id), docData);
            }
        }
        
        showToast('تم استيراد البيانات بنجاح ✅');
        logActivity('tools', 'data_imported', 'Data imported from backup');
        
        // إعادة تحميل البيانات
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            loadReviews();
            loadProducts();
            loadOrders();
        }
    } catch (error) {
        console.error('خطأ في استيراد البيانات:', error);
        showToast('خطأ في استيراد البيانات', 'error');
    }
});

/**
 * تفعيل/تعطيل وضع الصيانة
 */
function toggleMaintenanceMode() {
    const enabled = document.getElementById('maintenance-mode').checked;
    localStorage.setItem('maintenanceMode', enabled ? 'true' : 'false');
    showToast(enabled ? 'تم تفعيل وضع الصيانة ✅' : 'تم تعطيل وضع الصيانة ✅');
    logActivity('tools', 'maintenance_mode', enabled ? 'enabled' : 'disabled');
}

/**
 * فتح نافذة كود الخصم
 */
function openPromoCodeModal() {
    const modal = document.getElementById('promo-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة كود الخصم
 */
function closePromoModal() {
    const modal = document.getElementById('promo-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('promo-form').reset();
}

/**
 * حفظ كود الخصم
 */
async function savePromoCode(event) {
    event.preventDefault();
    
    const promoData = {
        code: document.getElementById('promo-code').value.toUpperCase(),
        discount: parseFloat(document.getElementById('promo-discount').value),
        expiry: document.getElementById('promo-expiry').value,
        maxUses: parseInt(document.getElementById('promo-max-uses').value) || null,
        createdAt: new Date()
    };
    
    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, 'promoCodes', promoData.code), promoData);
        showToast('تم حفظ كود الخصم بنجاح ✅');
        logActivity('tools', 'promo_code_created', promoData.code);
        closePromoModal();
    } catch (error) {
        console.error('خطأ في حفظ كود الخصم:', error);
        showToast('خطأ في حفظ كود الخصم', 'error');
    }
}

/**
 * تصدير التقارير
 */
function exportReports() {
    const csv = [
        ['نوع التقرير', 'التاريخ', 'البيانات'].join(','),
        ['الطلبات', new Date().toISOString(), allOrders.length].join(','),
        ['التقييمات', new Date().toISOString(), allReviews.length].join(','),
        ['المنتجات', new Date().toISOString(), allProducts.length].join(','),
        ['العملاء', new Date().toISOString(), allCustomers.length].join(',')
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast('تم تصدير التقرير بنجاح ✅');
    logActivity('tools', 'report_exported', 'CSV report exported');
}

// ═══════════════════════════════════════════════════════════════════════════
// الأمان والسجلات - Security & Logs
// ═══════════════════════════════════════════════════════════════════════════

let activityLog = [];

/**
 * تسجيل نشاط
 */
function logActivity(type, action, details) {
    const logEntry = {
        type,
        action,
        details,
        timestamp: new Date(),
        user: 'admin'
    };
    
    activityLog.unshift(logEntry);
    if (activityLog.length > 100) {
        activityLog = activityLog.slice(0, 100);
    }
    
    // حفظ في localStorage
    localStorage.setItem('activityLog', JSON.stringify(activityLog));
    
    // حفظ في Firebase
    try {
        const { addDoc, collection } = window.firebaseModules;
        addDoc(collection(window.db, 'activityLog'), logEntry);
    } catch (error) {
        console.warn('لا يمكن حفظ السجل في Firebase:', error);
    }
    
    // تحديث العرض إذا كان التبويب مفتوحاً
    if (document.getElementById('tab-security') && !document.getElementById('tab-security').classList.contains('hidden')) {
        displayActivityLog();
    }
}

/**
 * عرض سجل الأنشطة
 */
function displayActivityLog() {
    const container = document.getElementById('activity-log');
    if (!container) return;
    
    // تحميل من localStorage
    const saved = localStorage.getItem('activityLog');
    if (saved) {
        activityLog = JSON.parse(saved);
    }
    
    if (activityLog.length === 0) {
        container.innerHTML = '<p class="text-gray-400">لا توجد أنشطة مسجلة</p>';
        return;
    }
    
    container.innerHTML = activityLog.slice(0, 50).map(log => `
        <div class="flex items-start gap-3 p-3 rounded-lg" style="background: rgba(255, 255, 255, 0.05);">
            <div class="text-2xl">${getActivityIcon(log.type)}</div>
            <div class="flex-1">
                <div class="text-sm font-bold">${escapeHtml(log.action)}</div>
                <div class="text-xs text-gray-400">${escapeHtml(log.details || '')}</div>
                <div class="text-xs text-gray-500 mt-1">${formatDate(log.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

/**
 * الحصول على أيقونة النشاط
 */
function getActivityIcon(type) {
    const icons = {
        product: '📦',
        order: '🛒',
        review: '⭐',
        customer: '👥',
        content: '📝',
        integration: '🔗',
        tools: '🛠️',
        security: '🔒'
    };
    return icons[type] || '📋';
}

/**
 * حفظ إعدادات الأمان
 */
function saveSecuritySettings() {
    const settings = {
        autoLogout: document.getElementById('auto-logout').checked,
        sessionTimeout: parseInt(document.getElementById('session-timeout').value) || 60,
        logAllActivities: document.getElementById('log-all-activities').checked
    };
    
    localStorage.setItem('securitySettings', JSON.stringify(settings));
    showToast('تم حفظ إعدادات الأمان بنجاح ✅');
    logActivity('security', 'settings_updated', 'Security settings saved');
}

/**
 * البحث في الطلبات
 */
function searchOrders() {
    const searchTerm = document.getElementById('search-orders').value.toLowerCase();
    const statusFilter = document.getElementById('filter-order-status').value;
    
    let filtered = allOrders;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(o => 
            (o.id && o.id.toLowerCase().includes(searchTerm)) ||
            (o.productName && o.productName.toLowerCase().includes(searchTerm)) ||
            (o.customerName && o.customerName.toLowerCase().includes(searchTerm)) ||
            (o.email && o.email.toLowerCase().includes(searchTerm))
        );
    }
    
    displayOrdersTable(filtered);
}

/**
 * البحث في العملاء
 */
function searchCustomers() {
    const searchTerm = document.getElementById('search-customers').value.toLowerCase();
    
    if (!searchTerm) {
        displayCustomersTable();
        return;
    }
    
    const filtered = allCustomers.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm) ||
        c.phone.toLowerCase().includes(searchTerm)
    );
    
    displayCustomersTable(filtered);
}

// ═══════════════════════════════════════════════════════════════════════════
// تحديث وظائف الحذف
// ═══════════════════════════════════════════════════════════════════════════

let deleteType = 'review'; // 'review', 'product', etc.

/**
 * فتح نافذة الحذف (محدثة)
 */
function openDeleteModal(id, type = 'review') {
    reviewToDelete = id;
    deleteType = type;
    const modal = document.getElementById('delete-modal');
    const message = document.getElementById('delete-modal-message');
    
    const messages = {
        review: 'هل أنت متأكد من حذف هذا التقييم؟<br>لا يمكن التراجع عن هذا الإجراء.',
        product: 'هل أنت متأكد من حذف هذا المنتج؟<br>سيتم حذف جميع البيانات المرتبطة به.',
        order: 'هل أنت متأكد من حذف هذا الطلب؟<br>لا يمكن التراجع عن هذا الإجراء.'
    };
    
    message.innerHTML = messages[type] || messages.review;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * تأكيد الحذف (محدث)
 */
async function confirmDelete() {
    if (!reviewToDelete) return;
    
    try {
        const { deleteDoc, doc } = window.firebaseModules;
        
        if (deleteType === 'product') {
            await deleteDoc(doc(window.db, 'products', reviewToDelete));
            allProducts = allProducts.filter(p => p.id !== reviewToDelete);
            displayProductsTable();
            showToast('تم حذف المنتج بنجاح 🗑️');
            logActivity('product', 'deleted', reviewToDelete);
        } else if (deleteType === 'order') {
            await deleteDoc(doc(window.db, 'orders', reviewToDelete));
            allOrders = allOrders.filter(o => o.id !== reviewToDelete);
            displayOrdersTable();
            showToast('تم حذف الطلب بنجاح 🗑️');
            logActivity('order', 'deleted', reviewToDelete);
        } else {
            // حذف التقييم (الكود الأصلي)
            await deleteDoc(doc(window.db, 'reviews', reviewToDelete));
            allReviews = allReviews.filter(review => review.id !== reviewToDelete);
            updateStats();
            displayRecentReviews();
            displayReviewsTable();
            showToast('تم حذف التقييم بنجاح 🗑️');
            logActivity('review', 'deleted', reviewToDelete);
        }
        
        closeDeleteModal();
    } catch (error) {
        console.error('خطأ في الحذف:', error);
        showToast('خطأ في الحذف', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تحديث تهيئة الصفحة
// ═══════════════════════════════════════════════════════════════════════════

// تم تحديث showDashboard أعلاه

// تحديث showTab لتحميل البيانات عند فتح التبويبات
const originalShowTab = showTab;
showTab = function(tabName) {
    originalShowTab(tabName);
    
    // تحميل البيانات حسب التبويب
    setTimeout(() => {
        if (tabName === 'products') {
            console.log('تحميل المنتجات عند فتح التبويب...');
            loadProducts();
        } else if (tabName === 'orders') {
            loadOrders();
        } else if (tabName === 'customers') {
            loadCustomers();
        } else if (tabName === 'analytics') {
            // تأكد من تحميل الطلبات أولاً
            if (allOrders.length === 0) {
                loadOrders().then(() => {
                    updateCharts();
                });
            } else {
                updateCharts();
            }
        } else if (tabName === 'accounting') {
            // تحميل بيانات المحاسبة
            loadAccountingData();
        } else if (tabName === 'security') {
            displayActivityLog();
            updateSecurityStats();
        } else if (tabName === 'integrations') {
            loadIntegrationSettings();
        }
    }, 100);
};

/**
 * تحميل إعدادات الأمان
 */
function loadSecuritySettings() {
    try {
        const saved = localStorage.getItem('securitySettings');
        if (saved) {
            const settings = JSON.parse(saved);
            const autoLogoutEl = document.getElementById('auto-logout');
            const sessionTimeoutEl = document.getElementById('session-timeout');
            const logAllActivitiesEl = document.getElementById('log-all-activities');
            
            if (autoLogoutEl) autoLogoutEl.checked = settings.autoLogout !== false;
            if (sessionTimeoutEl) sessionTimeoutEl.value = settings.sessionTimeout || 60;
            if (logAllActivitiesEl) logAllActivitiesEl.checked = settings.logAllActivities !== false;
        }
    } catch (error) {
        console.warn('خطأ في تحميل إعدادات الأمان:', error);
    }
}

/**
 * تحديث إحصائيات الأمان
 */
function updateSecurityStats() {
    try {
        const saved = localStorage.getItem('activityLog');
        const logs = saved ? JSON.parse(saved) : [];
        const logins = logs.filter(l => l.action === 'login').length;
        const failedLogins = logs.filter(l => l.action === 'failed_login').length;
        
        const activeSessionsEl = document.getElementById('stat-active-sessions');
        const totalLoginsEl = document.getElementById('stat-total-logins');
        const failedLoginsEl = document.getElementById('stat-failed-logins');
        
        if (activeSessionsEl) activeSessionsEl.textContent = sessionStorage.getItem('adminLoggedIn') === 'true' ? 1 : 0;
        if (totalLoginsEl) totalLoginsEl.textContent = logins;
        if (failedLoginsEl) failedLoginsEl.textContent = failedLogins;
    } catch (error) {
        console.warn('خطأ في تحديث إحصائيات الأمان:', error);
    }
}

// جعل الوظائف متاحة عالمياً
window.logout = logout;
window.showTab = showTab;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.saveProduct = saveProduct;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.viewCustomerOrders = viewCustomerOrders;
window.saveTranslation = saveTranslation;
window.saveTheme = saveTheme;
window.savePaymentMethods = savePaymentMethods;
window.saveContactInfo = saveContactInfo;
window.saveMetaPixel = saveMetaPixel;
window.backupData = backupData;
window.toggleMaintenanceMode = toggleMaintenanceMode;
window.openPromoCodeModal = openPromoCodeModal;
window.closePromoModal = closePromoModal;
window.savePromoCode = savePromoCode;
window.exportReports = exportReports;
window.saveSecuritySettings = saveSecuritySettings;
window.searchOrders = searchOrders;
window.searchCustomers = searchCustomers;
window.handleLogin = handleLogin;
window.showDashboard = showDashboard;
window.showToast = showToast;

// وظائف المنتجات الجديدة
window.getProductStatus = getProductStatus;
window.toggleAvailability = toggleAvailability;
window.toggleActive = toggleActive;
window.duplicateProduct = duplicateProduct;
window.previewProduct = previewProduct;
window.closePreviewModal = closePreviewModal;
window.searchProducts = searchProducts;
window.updateImagePreview = updateImagePreview;

// ═══════════════════════════════════════════════════════════════════════════
// المحاسبة والأرباح - Accounting & Profits
// ═══════════════════════════════════════════════════════════════════════════

let accountingCharts = {};
let currentDateFilter = 'all';

/**
 * تحميل بيانات المحاسبة
 */
async function loadAccountingData() {
    try {
        // تعيين سعر الدولار في الحقل
        const usdRateInput = document.getElementById('usd-rate-input');
        if (usdRateInput) usdRateInput.value = USD_TO_DZD_RATE;
        
        // التأكد من تحميل المنتجات والطلبات
        if (allProducts.length === 0) {
            await loadProducts();
        }
        if (allOrders.length === 0) {
            await loadOrders();
        }
        
        // تحميل بيانات الشراء والمصاريف
        await loadPurchases();
        await loadExpenses();
        
        // عرض الجدول والإحصائيات
        displayAccountingTable();
        updateAccountingStats();
        updateProfitCharts();
        displaySuppliersSummary();
        displayExpensesList();
        displayTransactionsLog();
        
    } catch (error) {
        console.error('خطأ في تحميل بيانات المحاسبة:', error);
        showToast('خطأ في تحميل بيانات المحاسبة', 'error');
    }
}

/**
 * تحميل بيانات الشراء من Firebase
 */
async function loadPurchases() {
    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'purchases'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        allPurchases = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('تم تحميل', allPurchases.length, 'عملية شراء');
    } catch (error) {
        console.error('خطأ في تحميل بيانات الشراء:', error);
        allPurchases = [];
    }
}

/**
 * فلترة الطلبات حسب التاريخ
 */
function filterOrdersByDate(orders, filter) {
    if (filter === 'all') return orders;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
        if (!order.timestamp) return false;
        const orderDate = order.timestamp.toDate ? order.timestamp.toDate() : new Date(order.timestamp);
        
        switch (filter) {
            case 'today':
                return orderDate >= today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return orderDate >= monthAgo;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return orderDate >= yearAgo;
            case 'custom':
                const fromDate = document.getElementById('accounting-date-from')?.value;
                const toDate = document.getElementById('accounting-date-to')?.value;
                if (fromDate && toDate) {
                    const from = new Date(fromDate);
                    const to = new Date(toDate);
                    to.setHours(23, 59, 59);
                    return orderDate >= from && orderDate <= to;
                }
                return true;
            default:
                return true;
        }
    });
}

/**
 * حساب بيانات المحاسبة لكل منتج
 */
function calculateAccountingData() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );
    const filteredPurchases = filterOrdersByDate(allPurchases, dateFilter);
    
    return allProducts.map(product => {
        // بيانات المبيعات
        const productOrders = filteredOrders.filter(o => 
            o.productName === product.name || o.productId === product.id
        );
        const salesCount = productOrders.length;
        
        // بيانات الشراء
        const productPurchases = filteredPurchases.filter(p => 
            p.productName === product.name || p.productId === product.id
        );
        const purchasedQty = productPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
        
        // حساب تكلفة الشراء (تحويل USD إلى DZD بسعر السكوار)
        const purchaseCostDzd = productPurchases.reduce((sum, p) => {
            const amount = p.totalPrice || 0;
            if (p.currency === 'USD') {
                return sum + usdToDzd(amount); // تحويل بسعر السكوار
            }
            return sum + amount; // DZD مباشرة
        }, 0);
        const purchaseCostUsd = productPurchases.reduce((sum, p) => {
            const amount = p.totalPrice || 0;
            if (p.currency === 'USD') {
                return sum + amount;
            }
            return sum + dzdToUsd(amount); // تحويل بسعر السكوار
        }, 0);
        
        // الكمية المتبقية
        const remainingQty = purchasedQty - salesCount;
        
        // حساب الإيرادات (من المبيعات) - تحويل USD إلى DZD بسعر السكوار
        const revenueDzd = productOrders.reduce((sum, o) => {
            const amount = parseFloat(o.amount) || 0;
            if (o.currency === 'USD') {
                return sum + usdToDzd(amount); // تحويل بسعر السكوار
            }
            return sum + amount; // DZD مباشرة
        }, 0);
        
        const revenueUsd = productOrders.reduce((sum, o) => {
            const amount = parseFloat(o.amount) || 0;
            if (o.currency === 'USD') {
                return sum + amount;
            }
            return sum + dzdToUsd(amount); // تحويل بسعر السكوار
        }, 0);
        
        const totalRevenueDzd = revenueDzd || (salesCount * (product.price_dzd || 0));
        const totalRevenueUsd = revenueUsd || (salesCount * (product.price_usd || 0));
        
        // التكلفة الفعلية = إجمالي ما دفعته للمورد (وليس تكلفة الوحدة × المبيعات)
        // هذا مهم للحسابات المشتركة حيث تشتري حساب واحد وتبيعه لعدة أشخاص
        const totalCostDzd = purchaseCostDzd;
        const totalCostUsd = purchaseCostUsd;
        
        // تكلفة الوحدة (للعرض فقط)
        const costPerUnitDzd = purchasedQty > 0 ? (purchaseCostDzd / purchasedQty) : (product.cost_dzd || 0);
        const costPerUnitUsd = purchasedQty > 0 ? (purchaseCostUsd / purchasedQty) : (product.cost_usd || 0);
        
        // حساب الربح = الإيرادات - التكلفة الفعلية
        const profitDzd = totalRevenueDzd - totalCostDzd;
        const profitUsd = totalRevenueUsd - totalCostUsd;
        
        // هامش الربح
        const marginDzd = totalRevenueDzd > 0 ? ((profitDzd / totalRevenueDzd) * 100) : 0;
        const marginUsd = totalRevenueUsd > 0 ? ((profitUsd / totalRevenueUsd) * 100) : 0;
        
        return {
            id: product.id,
            name: product.name,
            supplier: product.supplier || 'غير محدد',
            // بيانات الشراء
            purchasedQty,
            purchaseCostDzd,
            purchaseCostUsd,
            costPerUnitDzd,
            costPerUnitUsd,
            // بيانات البيع
            salesCount,
            priceDzd: product.price_dzd || 0,
            priceUsd: product.price_usd || 0,
            revenueDzd: totalRevenueDzd,
            revenueUsd: totalRevenueUsd,
            // المخزون
            remainingQty,
            // الأرباح
            totalCostDzd,
            totalCostUsd,
            profitDzd,
            profitUsd,
            marginDzd,
            marginUsd,
            // التفاصيل
            orders: productOrders,
            purchases: productPurchases
        };
    });
}

/**
 * عرض جدول المحاسبة
 */
function displayAccountingTable() {
    const tbody = document.getElementById('accounting-table-body');
    if (!tbody) return;
    
    const data = calculateAccountingData();
    const currencyFilter = document.getElementById('accounting-currency')?.value || 'both';
    const showDzd = currencyFilter !== 'usd';
    const showUsd = currencyFilter !== 'dzd';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => {
        const profitClass = item.profitDzd >= 0 ? 'text-green-400' : 'text-red-400';
        const remainingClass = item.remainingQty > 0 ? 'text-yellow-400' : (item.remainingQty < 0 ? 'text-red-400' : 'text-gray-400');
        
        // تنسيق الأرقام
        const formatMoney = (dzd, usd) => {
            let html = '';
            if (showDzd && dzd > 0) html += `<div>${dzd.toLocaleString()} د.ج</div>`;
            if (showUsd && usd > 0) html += `<div class="text-xs text-gray-400">$${usd.toFixed(2)}</div>`;
            return html || '<span class="text-gray-500">-</span>';
        };
        
        return `
            <tr class="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                <td class="px-3 py-3">
                    <div class="font-bold text-sm">${escapeHtml(item.name)}</div>
                    <div class="text-gray-500 text-xs">${escapeHtml(item.supplier)}</div>
                </td>
                <td class="px-2 py-3 text-center">
                    <span class="bg-blue-600/30 text-blue-300 px-2 py-1 rounded font-bold">
                        ${item.purchasedQty}
                    </span>
                </td>
                <td class="px-2 py-3 text-center">
                    <span class="bg-green-600/30 text-green-300 px-2 py-1 rounded font-bold">
                        ${item.salesCount}
                    </span>
                </td>
                <td class="px-2 py-3 text-center">
                    <span class="${remainingClass} font-bold px-2 py-1 rounded ${item.remainingQty > 0 ? 'bg-yellow-600/20' : ''}">
                        ${item.remainingQty}
                    </span>
                </td>
                <td class="px-2 py-3 text-red-300 text-xs">
                    ${formatMoney(item.purchaseCostDzd, item.purchaseCostUsd)}
                </td>
                <td class="px-2 py-3 text-green-300 text-xs">
                    ${formatMoney(item.revenueDzd, item.revenueUsd)}
                </td>
                <td class="px-2 py-3">
                    <div class="${profitClass} font-bold text-sm">
                        ${showDzd ? `${item.profitDzd.toLocaleString()} د.ج` : `$${item.profitUsd.toFixed(2)}`}
                    </div>
                </td>
                <td class="px-2 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs ${item.marginDzd >= 20 ? 'bg-green-600/20 text-green-300' : item.marginDzd >= 0 ? 'bg-yellow-600/20 text-yellow-300' : 'bg-red-600/20 text-red-300'}">
                        ${item.marginDzd.toFixed(0)}%
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    // تحديث الإجماليات في footer
    updateAccountingFooter(data);
}

/**
 * تحديث إجماليات جدول المحاسبة
 */
function updateAccountingFooter(data) {
    const totals = data.reduce((acc, item) => {
        acc.purchased += item.purchasedQty;
        acc.sold += item.salesCount;
        acc.remaining += item.remainingQty;
        acc.costDzd += item.purchaseCostDzd;
        acc.costUsd += item.purchaseCostUsd;
        acc.revenueDzd += item.revenueDzd;
        acc.revenueUsd += item.revenueUsd;
        acc.profitDzd += item.profitDzd;
        acc.profitUsd += item.profitUsd;
        return acc;
    }, { purchased: 0, sold: 0, remaining: 0, costDzd: 0, costUsd: 0, revenueDzd: 0, revenueUsd: 0, profitDzd: 0, profitUsd: 0 });
    
    const avgMargin = totals.revenueDzd > 0 ? ((totals.profitDzd / totals.revenueDzd) * 100) : 0;
    
    const footerPurchased = document.getElementById('footer-total-purchased');
    const footerSold = document.getElementById('footer-total-sold');
    const footerRemaining = document.getElementById('footer-total-remaining');
    const footerCost = document.getElementById('footer-total-cost');
    const footerRevenue = document.getElementById('footer-total-revenue');
    const footerProfit = document.getElementById('footer-total-profit');
    const footerMargin = document.getElementById('footer-avg-margin');
    
    if (footerPurchased) footerPurchased.textContent = totals.purchased;
    if (footerSold) footerSold.textContent = totals.sold;
    if (footerRemaining) footerRemaining.innerHTML = `<span class="${totals.remaining >= 0 ? 'text-yellow-400' : 'text-red-400'}">${totals.remaining}</span>`;
    if (footerCost) footerCost.innerHTML = `${totals.costDzd.toLocaleString()} د.ج`;
    if (footerRevenue) footerRevenue.innerHTML = `${totals.revenueDzd.toLocaleString()} د.ج`;
    if (footerProfit) footerProfit.innerHTML = `<span class="${totals.profitDzd >= 0 ? 'text-green-400' : 'text-red-400'}">${totals.profitDzd.toLocaleString()} د.ج</span>`;
    if (footerMargin) footerMargin.innerHTML = `<span class="${avgMargin >= 20 ? 'text-green-400' : avgMargin >= 0 ? 'text-yellow-400' : 'text-red-400'}">${avgMargin.toFixed(0)}%</span>`;
}

/**
 * تحديث إحصائيات المحاسبة
 */
function updateAccountingStats() {
    const data = calculateAccountingData();
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    
    // حساب إجماليات المنتجات
    const totals = data.reduce((acc, item) => {
        acc.sales += item.salesCount;
        acc.revenueDzd += item.revenueDzd;
        acc.revenueUsd += item.revenueUsd;
        acc.costDzd += item.purchaseCostDzd;
        acc.costUsd += item.purchaseCostUsd;
        acc.profitDzd += item.profitDzd;
        acc.profitUsd += item.profitUsd;
        return acc;
    }, { sales: 0, revenueDzd: 0, revenueUsd: 0, costDzd: 0, costUsd: 0, profitDzd: 0, profitUsd: 0 });
    
    // حساب المصاريف (تحويل USD إلى DZD بسعر السكوار)
    const filteredExpenses = filterExpensesByDate(allExpenses, dateFilter);
    const businessExpenses = filteredExpenses.filter(e => e.type === 'business');
    const personalExpenses = filteredExpenses.filter(e => e.type === 'personal');
    const businessExpSum = businessExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') return sum + usdToDzd(amount);
        return sum + amount;
    }, 0);
    const personalExpSum = personalExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') return sum + usdToDzd(amount);
        return sum + amount;
    }, 0);
    
    // حساب الأرباح
    const grossProfit = totals.revenueDzd - totals.costDzd;  // ربح المنتجات
    const netBusinessProfit = grossProfit - businessExpSum;   // ربح العمل الصافي
    const netTotal = netBusinessProfit - personalExpSum;      // المتبقي بعد كل المصاريف
    
    const margin = totals.revenueDzd > 0 ? ((grossProfit / totals.revenueDzd) * 100) : 0;
    
    // تحديث البطاقات - الصف الأول
    const statRevenue = document.getElementById('stat-total-revenue-acc');
    const statCost = document.getElementById('stat-total-cost-acc');
    const statBusinessExp = document.getElementById('stat-business-expenses');
    const statPersonalExp = document.getElementById('stat-personal-expenses');
    
    if (statRevenue) statRevenue.textContent = `${Math.round(totals.revenueDzd).toLocaleString()} د.ج`;
    if (statCost) statCost.textContent = `${Math.round(totals.costDzd).toLocaleString()} د.ج`;
    if (statBusinessExp) statBusinessExp.textContent = `${Math.round(businessExpSum).toLocaleString()} د.ج`;
    if (statPersonalExp) statPersonalExp.textContent = `${Math.round(personalExpSum).toLocaleString()} د.ج`;
    
    // تحديث البطاقات - الصف الثاني
    const statGrossProfit = document.getElementById('stat-gross-profit');
    const statNetBusiness = document.getElementById('stat-net-business-profit');
    const statNetProfit = document.getElementById('stat-net-profit');
    const statMargin = document.getElementById('stat-profit-margin');
    
    if (statGrossProfit) {
        statGrossProfit.textContent = `${Math.round(grossProfit).toLocaleString()} د.ج`;
        statGrossProfit.className = `text-lg font-bold ${grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`;
    }
    if (statNetBusiness) {
        statNetBusiness.textContent = `${Math.round(netBusinessProfit).toLocaleString()} د.ج`;
        statNetBusiness.className = `text-lg font-bold ${netBusinessProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`;
    }
    if (statNetProfit) {
        statNetProfit.textContent = `${Math.round(netTotal).toLocaleString()} د.ج`;
        statNetProfit.className = `text-lg font-bold ${netTotal >= 0 ? '' : 'text-red-400'}`;
        if (netTotal >= 0) statNetProfit.style.color = 'var(--accent)';
    }
    if (statMargin) statMargin.textContent = `${margin.toFixed(1)}%`;
}

/**
 * تحديث الرسوم البيانية للأرباح
 */
function updateProfitCharts() {
    updateProfitOverTimeChart();
    updateProfitByProductChart();
}

/**
 * رسم بياني للأرباح عبر الزمن
 */
function updateProfitOverTimeChart() {
    const ctx = document.getElementById('profit-over-time-chart');
    if (!ctx) return;
    
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );
    
    // تجميع الأرباح حسب التاريخ
    const profitByDate = {};
    
    filteredOrders.forEach(order => {
        if (!order.timestamp) return;
        const date = formatDate(order.timestamp);
        const product = allProducts.find(p => p.name === order.productName || p.id === order.productId);
        
        if (!profitByDate[date]) {
            profitByDate[date] = { revenue: 0, cost: 0, profit: 0 };
        }
        
        const amount = parseFloat(order.amount) || (product?.price_dzd || 0);
        const cost = product?.cost_dzd || 0;
        
        profitByDate[date].revenue += amount;
        profitByDate[date].cost += cost;
        profitByDate[date].profit += (amount - cost);
    });
    
    const sortedDates = Object.keys(profitByDate).sort();
    
    if (accountingCharts.profitOverTime) {
        accountingCharts.profitOverTime.destroy();
    }
    
    accountingCharts.profitOverTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [
                {
                    label: 'الإيرادات',
                    data: sortedDates.map(date => profitByDate[date].revenue),
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'التكلفة',
                    data: sortedDates.map(date => profitByDate[date].cost),
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'الربح',
                    data: sortedDates.map(date => profitByDate[date].profit),
                    borderColor: 'rgba(255, 213, 111, 1)',
                    backgroundColor: 'rgba(255, 213, 111, 0.2)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

/**
 * رسم بياني لتوزيع الأرباح حسب المنتج
 */
function updateProfitByProductChart() {
    const ctx = document.getElementById('profit-by-product-chart');
    if (!ctx) return;
    
    const data = calculateAccountingData().filter(item => item.profitDzd !== 0);
    
    if (accountingCharts.profitByProduct) {
        accountingCharts.profitByProduct.destroy();
    }
    
    const colors = [
        'rgba(255, 213, 111, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(249, 115, 22, 0.8)'
    ];
    
    accountingCharts.profitByProduct = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => Math.abs(item.profitDzd)),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { 
                        color: '#9ca3af',
                        padding: 15,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

/**
 * عرض ملخص الموردين
 */
function displaySuppliersSummary() {
    const container = document.getElementById('suppliers-summary');
    if (!container) return;
    
    const data = calculateAccountingData();
    
    // تجميع حسب المورد
    const supplierStats = {};
    
    data.forEach(item => {
        const supplier = item.supplier || 'غير محدد';
        if (!supplierStats[supplier]) {
            supplierStats[supplier] = {
                products: 0,
                totalCostDzd: 0,
                totalCostUsd: 0,
                totalProfitDzd: 0,
                totalProfitUsd: 0,
                totalSales: 0
            };
        }
        supplierStats[supplier].products++;
        supplierStats[supplier].totalCostDzd += item.totalCostDzd;
        supplierStats[supplier].totalCostUsd += item.totalCostUsd;
        supplierStats[supplier].totalProfitDzd += item.profitDzd;
        supplierStats[supplier].totalProfitUsd += item.profitUsd;
        supplierStats[supplier].totalSales += item.salesCount;
    });
    
    if (Object.keys(supplierStats).length === 0) {
        container.innerHTML = '<p class="text-gray-400">لا يوجد موردين مسجلين</p>';
        return;
    }
    
    container.innerHTML = Object.entries(supplierStats).map(([supplier, stats]) => `
        <div class="p-4 rounded-lg" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-2xl">🏪</span>
                <h4 class="font-bold">${escapeHtml(supplier)}</h4>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-400">المنتجات:</span>
                    <span class="font-bold">${stats.products}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">المبيعات:</span>
                    <span class="font-bold text-blue-400">${stats.totalSales}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">التكلفة:</span>
                    <span class="text-red-400">${stats.totalCostDzd.toLocaleString()} د.ج</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">الربح:</span>
                    <span class="${stats.totalProfitDzd >= 0 ? 'text-green-400' : 'text-red-400'} font-bold">
                        ${stats.totalProfitDzd.toLocaleString()} د.ج
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * تصدير تقرير المحاسبة
 */
function exportAccountingReport() {
    const data = calculateAccountingData();
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    
    // إنشاء CSV
    const headers = ['المنتج', 'المورد', 'سعر الشراء (DZD)', 'سعر الشراء (USD)', 'سعر البيع (DZD)', 'سعر البيع (USD)', 'المبيعات', 'الإيرادات (DZD)', 'الإيرادات (USD)', 'التكلفة (DZD)', 'التكلفة (USD)', 'الربح (DZD)', 'الربح (USD)', 'هامش الربح'];
    
    const rows = data.map(item => [
        item.name,
        item.supplier,
        item.costDzd,
        item.costUsd,
        item.priceDzd,
        item.priceUsd,
        item.salesCount,
        item.revenueDzd,
        item.revenueUsd,
        item.totalCostDzd,
        item.totalCostUsd,
        item.profitDzd,
        item.profitUsd,
        `${item.marginDzd.toFixed(1)}%`
    ]);
    
    // حساب الإجماليات
    const totals = data.reduce((acc, item) => {
        acc.sales += item.salesCount;
        acc.revenueDzd += item.revenueDzd;
        acc.revenueUsd += item.revenueUsd;
        acc.costDzd += item.totalCostDzd;
        acc.costUsd += item.totalCostUsd;
        acc.profitDzd += item.profitDzd;
        acc.profitUsd += item.profitUsd;
        return acc;
    }, { sales: 0, revenueDzd: 0, revenueUsd: 0, costDzd: 0, costUsd: 0, profitDzd: 0, profitUsd: 0 });
    
    const avgMargin = totals.revenueDzd > 0 ? ((totals.profitDzd / totals.revenueDzd) * 100) : 0;
    
    rows.push(['الإجمالي', '', '', '', '', '', totals.sales, totals.revenueDzd, totals.revenueUsd, totals.costDzd, totals.costUsd, totals.profitDzd, totals.profitUsd, `${avgMargin.toFixed(1)}%`]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // تحميل الملف
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accounting-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast('تم تصدير تقرير المحاسبة بنجاح ✅');
    logActivity('accounting', 'report_exported', `Accounting report exported (${dateFilter})`);
}

/**
 * معالجة تغيير فلتر التاريخ
 */
function handleDateFilterChange() {
    const filter = document.getElementById('accounting-date-filter')?.value;
    const customRange = document.getElementById('custom-date-range');
    
    if (filter === 'custom') {
        customRange?.classList.remove('hidden');
    } else {
        customRange?.classList.add('hidden');
    }
    
    // تحديث البيانات
    displayAccountingTable();
    updateAccountingStats();
    updateProfitCharts();
    displaySuppliersSummary();
}

/**
 * تهيئة أحداث المحاسبة
 */
function initAccountingEvents() {
    const dateFilter = document.getElementById('accounting-date-filter');
    const currencyFilter = document.getElementById('accounting-currency');
    const dateFrom = document.getElementById('accounting-date-from');
    const dateTo = document.getElementById('accounting-date-to');
    
    if (dateFilter) dateFilter.addEventListener('change', handleDateFilterChange);
    if (currencyFilter) currencyFilter.addEventListener('change', () => displayAccountingTable());
    if (dateFrom) dateFrom.addEventListener('change', handleDateFilterChange);
    if (dateTo) dateTo.addEventListener('change', handleDateFilterChange);
}

// تهيئة المحاسبة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initAccountingEvents);

/**
 * تهيئة أحداث نموذج البيع
 */
function initSaleFormEvents() {
    const saleForm = document.getElementById('sale-form');
    const productSelect = document.getElementById('sale-product');
    const currencySelect = document.getElementById('sale-currency');
    const quantityInput = document.getElementById('sale-quantity');
    
    if (saleForm) saleForm.addEventListener('submit', saveSale);
    if (productSelect) productSelect.addEventListener('change', updateSaleAmount);
    if (currencySelect) currencySelect.addEventListener('change', updateSaleAmount);
    if (quantityInput) quantityInput.addEventListener('input', updateSaleAmount);
}

/**
 * تهيئة أحداث نموذج الشراء
 */
function initPurchaseFormEvents() {
    const purchaseForm = document.getElementById('purchase-form');
    const quantityInput = document.getElementById('purchase-quantity');
    const unitPriceInput = document.getElementById('purchase-unit-price');
    
    if (purchaseForm) purchaseForm.addEventListener('submit', savePurchase);
    if (quantityInput) quantityInput.addEventListener('input', updatePurchaseTotal);
    if (unitPriceInput) unitPriceInput.addEventListener('input', updatePurchaseTotal);
}

/**
 * تهيئة أحداث نموذج المصاريف
 */
function initExpenseFormEvents() {
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) expenseForm.addEventListener('submit', saveExpense);
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initSaleFormEvents();
    initPurchaseFormEvents();
    initExpenseFormEvents();
});

// وظائف المحاسبة المتاحة عالمياً
window.loadAccountingData = loadAccountingData;
window.displayAccountingTable = displayAccountingTable;
window.updateAccountingStats = updateAccountingStats;
window.updateProfitCharts = updateProfitCharts;
window.exportAccountingReport = exportAccountingReport;
window.handleDateFilterChange = handleDateFilterChange;

// ═══════════════════════════════════════════════════════════════════════════
// إحصائيات الزوار - Visitor Statistics
// ═══════════════════════════════════════════════════════════════════════════

let allVisitors = [];
let visitorsDailyChart = null;
let visitorsDeviceChart = null;

/**
 * تحميل إحصائيات الزوار من Firebase
 */
async function loadVisitorStats() {
    try {
        if (!window.db || !window.firebaseModules) {
            console.warn('⚠️ Firebase غير متاح');
            showToast('Firebase غير متاح', 'error');
            return;
        }

        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'visitors'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allVisitors = [];
        querySnapshot.forEach(doc => {
            allVisitors.push({ id: doc.id, ...doc.data() });
        });

        console.log(`📊 تم تحميل ${allVisitors.length} زيارة`);
        
        updateVisitorStats();
        updateVisitorCharts();
        
        showToast(`✅ تم تحميل إحصائيات ${allVisitors.length} زيارة`, 'success');
    } catch (error) {
        console.error('خطأ في تحميل إحصائيات الزوار:', error);
        showToast('خطأ في تحميل إحصائيات الزوار', 'error');
    }
}

/**
 * تحديث إحصائيات الزوار (يومي، أسبوعي، شهري)
 */
function updateVisitorStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // بداية الأسبوع (الأحد)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // بداية الشهر
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // حساب الزوار
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    allVisitors.forEach(visitor => {
        let visitorDate;
        
        // التعامل مع التاريخ بأشكال مختلفة
        if (visitor.date) {
            visitorDate = new Date(visitor.date);
        } else if (visitor.timestamp && visitor.timestamp.toDate) {
            visitorDate = visitor.timestamp.toDate();
        } else if (visitor.timestamp) {
            visitorDate = new Date(visitor.timestamp);
        } else {
            return;
        }

        const visitorDateStr = visitorDate.toISOString().split('T')[0];
        
        // زوار اليوم
        if (visitorDateStr === today) {
            todayCount++;
        }
        
        // زوار الأسبوع
        if (visitorDate >= startOfWeek) {
            weekCount++;
        }
        
        // زوار الشهر
        if (visitorDate >= startOfMonth) {
            monthCount++;
        }
    });

    // تحديث العناصر في الواجهة
    const todayEl = document.getElementById('visitors-today');
    const weekEl = document.getElementById('visitors-week');
    const monthEl = document.getElementById('visitors-month');
    const totalEl = document.getElementById('visitors-total');

    if (todayEl) todayEl.textContent = todayCount.toLocaleString('ar-DZ');
    if (weekEl) weekEl.textContent = weekCount.toLocaleString('ar-DZ');
    if (monthEl) monthEl.textContent = monthCount.toLocaleString('ar-DZ');
    if (totalEl) totalEl.textContent = allVisitors.length.toLocaleString('ar-DZ');
}

/**
 * تحديث الرسوم البيانية للزوار
 */
function updateVisitorCharts() {
    updateDailyVisitorsChart();
    updateDeviceChart();
}

/**
 * رسم بياني للزوار اليومي (آخر 7 أيام)
 */
function updateDailyVisitorsChart() {
    const canvas = document.getElementById('visitors-daily-chart');
    if (!canvas) return;

    // تدمير الرسم البياني القديم إن وجد
    if (visitorsDailyChart) {
        visitorsDailyChart.destroy();
    }

    // إعداد البيانات لآخر 7 أيام
    const days = [];
    const counts = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // اسم اليوم بالعربية
        const dayName = date.toLocaleDateString('ar-DZ', { weekday: 'short' });
        days.push(dayName);

        // عدد الزوار في هذا اليوم
        const count = allVisitors.filter(v => {
            if (v.date) return v.date === dateStr;
            if (v.timestamp && v.timestamp.toDate) {
                return v.timestamp.toDate().toISOString().split('T')[0] === dateStr;
            }
            return false;
        }).length;
        
        counts.push(count);
    }

    // إنشاء الرسم البياني
    const ctx = canvas.getContext('2d');
    visitorsDailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'عدد الزوار',
                data: counts,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(147, 51, 234, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(249, 115, 22, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(14, 165, 233, 0.7)',
                    'rgba(168, 85, 247, 0.7)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(147, 51, 234, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(14, 165, 233, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * رسم بياني لنوع الجهاز (موبايل vs ديسكتوب)
 */
function updateDeviceChart() {
    const canvas = document.getElementById('visitors-device-chart');
    if (!canvas) return;

    // تدمير الرسم البياني القديم إن وجد
    if (visitorsDeviceChart) {
        visitorsDeviceChart.destroy();
    }

    // حساب عدد زوار الموبايل والديسكتوب
    let mobileCount = 0;
    let desktopCount = 0;

    allVisitors.forEach(visitor => {
        if (visitor.isMobile) {
            mobileCount++;
        } else {
            desktopCount++;
        }
    });

    // إنشاء الرسم البياني
    const ctx = canvas.getContext('2d');
    visitorsDeviceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['📱 موبايل', '💻 ديسكتوب'],
            datasets: [{
                data: [mobileCount, desktopCount],
                backgroundColor: [
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderColor: [
                    'rgba(147, 51, 234, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        font: {
                            size: 14
                        },
                        padding: 20
                    }
                }
            }
        }
    });
}

// تحميل إحصائيات الزوار عند فتح تبويب التحليلات
const originalShowTabForVisitors = window.showTab;
window.showTab = function(tabName) {
    originalShowTabForVisitors(tabName);
    
    // تحميل إحصائيات الزوار عند فتح تبويب التحليلات
    if (tabName === 'analytics' && allVisitors.length === 0) {
        loadVisitorStats();
    }
};

// جعل وظائف الزوار متاحة عالمياً
window.loadVisitorStats = loadVisitorStats;
window.updateVisitorStats = updateVisitorStats;
window.updateVisitorCharts = updateVisitorCharts;

// ═══════════════════════════════════════════════════════════════════════════
// وظائف الموردين ومصادر السلع - Suppliers Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل الموردين من Firebase
 */
async function loadSuppliers() {
    try {
        if (!window.db || !window.firebaseModules) {
            console.warn('⚠️ Firebase غير متاح');
            return;
        }

        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'suppliers'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allSuppliers = [];
        querySnapshot.forEach(doc => {
            allSuppliers.push({ id: doc.id, ...doc.data() });
        });

        console.log(`📦 تم تحميل ${allSuppliers.length} مورد`);
        
        displaySuppliersTable();
        updateSuppliersStats();
        
    } catch (error) {
        console.error('خطأ في تحميل الموردين:', error);
        showToast('خطأ في تحميل الموردين', 'error');
    }
}

/**
 * عرض جدول الموردين
 */
function displaySuppliersTable() {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return;

    if (allSuppliers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-8 text-gray-400">
                    <div class="text-4xl mb-2">📦</div>
                    لا يوجد موردين مسجلين حتى الآن
                    <br><small>اضغط على "إضافة مورد/مصدر جديد" للبدء</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allSuppliers.map(supplier => `
        <tr class="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
            <td class="p-4">
                <div class="font-bold text-amber-400">${supplier.productName || '-'}</div>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded text-xs" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa;">
                    🌍 ${supplier.source || '-'}
                </span>
            </td>
            <td class="p-4 text-gray-300">${supplier.supplierName || '-'}</td>
            <td class="p-4">
                <span class="font-bold text-green-400">
                    ${supplier.purchasePrice ? supplier.purchasePrice.toLocaleString() : '0'} ${supplier.currency || 'USD'}
                </span>
            </td>
            <td class="p-4 text-gray-400 text-sm">${supplier.contact || '-'}</td>
            <td class="p-4 text-gray-400 text-sm max-w-xs truncate" title="${supplier.notes || ''}">${supplier.notes || '-'}</td>
            <td class="p-4 text-center">
                <div class="flex gap-2 justify-center">
                    <button onclick="editSupplier('${supplier.id}')" 
                        class="px-3 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-sm transition-all"
                        title="تعديل">✏️</button>
                    <button onclick="deleteSupplier('${supplier.id}')" 
                        class="px-3 py-1 bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white rounded text-sm transition-all"
                        title="حذف">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * تحديث إحصائيات الموردين
 */
function updateSuppliersStats() {
    // إجمالي الموردين
    const totalCount = document.getElementById('total-suppliers-count');
    if (totalCount) totalCount.textContent = allSuppliers.length;

    // عدد المصادر المختلفة
    const uniqueSources = new Set(allSuppliers.map(s => s.source).filter(Boolean));
    const sourcesCount = document.getElementById('total-sources-count');
    if (sourcesCount) sourcesCount.textContent = uniqueSources.size;

    // عدد المنتجات المسجلة
    const uniqueProducts = new Set(allSuppliers.map(s => s.productName).filter(Boolean));
    const productsCount = document.getElementById('total-products-suppliers');
    if (productsCount) productsCount.textContent = uniqueProducts.size;
}

/**
 * فتح نافذة إضافة مورد
 */
function openSupplierModal() {
    const modal = document.getElementById('supplier-modal');
    const form = document.getElementById('supplier-form');
    
    if (!modal) return;
    
    // إعادة تعيين النموذج
    if (form) form.reset();
    document.getElementById('supplier-id').value = '';
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المورد
 */
function closeSupplierModal() {
    const modal = document.getElementById('supplier-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * تعديل مورد موجود
 */
function editSupplier(supplierId) {
    const supplier = allSuppliers.find(s => s.id === supplierId);
    if (!supplier) {
        showToast('لم يتم العثور على المورد', 'error');
        return;
    }

    // ملء النموذج بالبيانات
    document.getElementById('supplier-id').value = supplier.id;
    document.getElementById('supplier-product-name').value = supplier.productName || '';
    document.getElementById('supplier-source').value = supplier.source || '';
    document.getElementById('supplier-name').value = supplier.supplierName || '';
    document.getElementById('supplier-price').value = supplier.purchasePrice || '';
    document.getElementById('supplier-currency').value = supplier.currency || 'USD';
    document.getElementById('supplier-contact').value = supplier.contact || '';
    document.getElementById('supplier-notes').value = supplier.notes || '';

    // فتح النافذة
    const modal = document.getElementById('supplier-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * حفظ المورد (إضافة أو تعديل)
 */
async function saveSupplier(event) {
    event.preventDefault();
    
    const supplierId = document.getElementById('supplier-id').value;
    const productName = document.getElementById('supplier-product-name').value.trim();
    const source = document.getElementById('supplier-source').value.trim();
    const supplierName = document.getElementById('supplier-name').value.trim();
    const purchasePrice = parseFloat(document.getElementById('supplier-price').value) || 0;
    const currency = document.getElementById('supplier-currency').value;
    const contact = document.getElementById('supplier-contact').value.trim();
    const notes = document.getElementById('supplier-notes').value.trim();

    if (!productName || !source) {
        showToast('يرجى ملء الحقول المطلوبة', 'error');
        return;
    }

    try {
        const { addDoc, updateDoc, doc, collection, serverTimestamp } = window.firebaseModules;

        const supplierData = {
            productName,
            source,
            supplierName,
            purchasePrice,
            currency,
            contact,
            notes,
            updatedAt: serverTimestamp()
        };

        if (supplierId) {
            // تعديل مورد موجود
            const docRef = doc(window.db, 'suppliers', supplierId);
            await updateDoc(docRef, supplierData);
            showToast('✅ تم تحديث المورد بنجاح');
            logActivity('supplier', 'updated', productName);
        } else {
            // إضافة مورد جديد
            supplierData.timestamp = serverTimestamp();
            await addDoc(collection(window.db, 'suppliers'), supplierData);
            showToast('✅ تم إضافة المورد بنجاح');
            logActivity('supplier', 'created', productName);
        }

        closeSupplierModal();
        await loadSuppliers();

    } catch (error) {
        console.error('خطأ في حفظ المورد:', error);
        showToast('خطأ في حفظ المورد', 'error');
    }
}

/**
 * حذف مورد
 */
async function deleteSupplier(supplierId) {
    const supplier = allSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    if (!confirm(`هل أنت متأكد من حذف "${supplier.productName}"؟`)) {
        return;
    }

    try {
        const { deleteDoc, doc } = window.firebaseModules;
        await deleteDoc(doc(window.db, 'suppliers', supplierId));
        
        showToast('✅ تم حذف المورد بنجاح');
        logActivity('supplier', 'deleted', supplier.productName);
        
        await loadSuppliers();

    } catch (error) {
        console.error('خطأ في حذف المورد:', error);
        showToast('خطأ في حذف المورد', 'error');
    }
}

// تحميل الموردين عند فتح تبويب الموردين
const originalShowTabForSuppliers = window.showTab;
window.showTab = function(tabName) {
    originalShowTabForSuppliers(tabName);
    
    // تحميل الموردين عند فتح تبويب الموردين
    if (tabName === 'suppliers' && allSuppliers.length === 0) {
        loadSuppliers();
    }
};

// جعل وظائف الموردين متاحة عالمياً
window.loadSuppliers = loadSuppliers;
window.openSupplierModal = openSupplierModal;
window.closeSupplierModal = closeSupplierModal;
window.saveSupplier = saveSupplier;
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;

