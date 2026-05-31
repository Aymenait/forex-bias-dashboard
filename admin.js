/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Dashboard - 3Ahub
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
let allResellers = [];         // جميع الموزعين
let allLeads = [];             // جميع الزبائن المهتمين
let allTransactions = [];      // سجل التهم (للخزينة)
let allDebtors = [];           // جميع المديونين
let startingCapital = 0;       // رأس المال الأساسي
let reviewToDelete = null;     // التقييم المراد حذفه
let isAdminLoginInProgress = false;
let adminPasswordSource = 'firebase';
const DEFAULT_PASSWORD = 'admin123';  // كلمة المرور الافتراضية

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'allProducts', {
        get: () => allProducts,
        set: (value) => {
            allProducts = Array.isArray(value) ? value : [];
        },
        configurable: true
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// سعر الدولار في السكوار (السوق السوداء) - Square Rate
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_USD_RATE = 250;  // السعر الافتراضي
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
// وظائف مساعدة للفلترة - Helper Filter Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فلترة الطلبات حسب التاريخ
 */
function filterOrdersByDate(orders, dateFilter) {
    if (dateFilter === 'all') return orders;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    return orders.filter(order => {
        const rawDate = order.timestamp || order.saleDate || order.createdAt;
        const orderDate = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
        if (Number.isNaN(orderDate.getTime())) return false;

        switch (dateFilter) {
            case 'today':
                return orderDate >= today;
            case 'week':
                return orderDate >= weekAgo;
            case 'month':
                return orderDate >= monthAgo;
            case 'year':
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
 * تحميل المعاملات (سجل المحفظة)
 */
async function loadTransactionsInitial() {
    if (!window.db || !window.firebaseModules) return;

    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'transactions'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        allTransactions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firebase Timestamp to JS Date if needed
            if (data.createdAt?.toDate) {
                data.createdAt = data.createdAt.toDate();
            }
            allTransactions.push({ id: doc.id, ...data });
        });

        console.log(`✅ تم تحميل ${allTransactions.length} معاملة`);
    } catch (error) {
        console.error('خطأ في تحميل المعاملات:', error);
        allTransactions = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة رأس المال - Capital Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة ضبط رأس المال
 */
function openCapitalModal() {
    const modal = document.getElementById('capital-modal');
    const input = document.getElementById('input-starting-capital');
    const currentValue = document.getElementById('capital-current-value');
    const confirmCheckbox = document.getElementById('confirm-capital-change');
    const saveBtn = document.getElementById('capital-save-btn');
    if (modal) {
        if (input) input.value = startingCapital || '';
        if (currentValue) currentValue.textContent = `${Math.round(startingCapital).toLocaleString()} د.ج`;
        if (confirmCheckbox) confirmCheckbox.checked = false;
        if (saveBtn) saveBtn.disabled = true;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * إغلاق نافذة ضبط رأس المال
 */
function closeCapitalModal() {
    const modal = document.getElementById('capital-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * حفظ رأس المال في Firebase
 */
async function saveStartingCapital(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('input-starting-capital');
    const confirmCheckbox = document.getElementById('confirm-capital-change');
    const amount = parseFloat(input?.value) || 0;
    const previousAmount = Number(startingCapital) || 0;

    if (!confirmCheckbox?.checked) {
        showToast('يرجى تأكيد رغبتك في تغيير رأس المال أولاً', 'warning');
        return;
    }

    if (amount < 0) {
        showToast('رأس المال لا يمكن أن يكون سالباً', 'error');
        return;
    }

    if (amount === previousAmount) {
        showToast('لا يوجد تغيير في رأس المال', 'info');
        closeCapitalModal();
        return;
    }

    const confirmed = confirm(
        `هل أنت متأكد من تغيير رأس المال؟\n\n` +
        `القيمة الحالية: ${previousAmount.toLocaleString()} د.ج\n` +
        `القيمة الجديدة: ${amount.toLocaleString()} د.ج\n\n` +
        `سيتم إعادة حساب الخزينة ورأس المال الصافي بناءً على هذه القيمة.` +
        `\nلن يتم حذف أو تعديل أمانات الموزعين.`
    );

    if (!confirmed) return;

    try {
        if (window.db && window.firebaseModules) {
            const { doc, setDoc } = window.firebaseModules;
            await setDoc(doc(window.db, 'settings', 'capital'), {
                startingCapital: amount,
                updatedAt: new Date().toISOString()
            });
        }

        startingCapital = amount;
        localStorage.setItem('startingCapital', amount.toString());

        closeCapitalModal();
        showToast(`✅ تم حفظ رأس المال: ${amount.toLocaleString()} د.ج`);

        // تحديث العرض
        updateCapitalDisplay();

    } catch (error) {
        console.error('خطأ في حفظ رأس المال:', error);
        showToast('❌ خطأ في حفظ رأس المال', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// تسوية الرصيد الفعلي - Reconcile actual cash on hand
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة تسوية الرصيد: تعرض الخزينة المحسوبة وتطلب الرصيد الفعلي.
 */
function openReconcileModal() {
    const snapshot = computeTreasurySnapshot();
    const modal = document.getElementById('reconcile-modal');
    if (!modal) return;

    const computedEl = document.getElementById('reconcile-computed-value');
    const input = document.getElementById('reconcile-actual-input');
    const diffBox = document.getElementById('reconcile-diff-box');

    if (computedEl) computedEl.textContent = `${Math.round(snapshot.currentTreasury).toLocaleString()} د.ج`;
    if (input) input.value = '';
    if (diffBox) diffBox.innerHTML = '';

    // حفظ الخزينة المحسوبة على النافذة لاستعمالها عند الحفظ
    modal.dataset.computed = String(Math.round(snapshot.currentTreasury));

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeReconcileModal() {
    const modal = document.getElementById('reconcile-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * معاينة الفرق أثناء الكتابة.
 */
function previewReconcileDiff() {
    const modal = document.getElementById('reconcile-modal');
    const diffBox = document.getElementById('reconcile-diff-box');
    if (!modal || !diffBox) return;

    const computed = parseFloat(modal.dataset.computed) || 0;
    const actualRaw = document.getElementById('reconcile-actual-input')?.value;
    if (actualRaw === '' || actualRaw == null) { diffBox.innerHTML = ''; return; }

    const actual = parseFloat(actualRaw) || 0;
    const diff = computed - actual; // موجب = نقص (مصاريف غير مسجلة)، سالب = فائض

    if (Math.abs(diff) < 1) {
        diffBox.innerHTML = `<span class="text-green-400">✅ الرصيد مطابق، لا حاجة لتسوية.</span>`;
    } else if (diff > 0) {
        diffBox.innerHTML = `<span class="text-red-400">🔻 نقص قدره <strong>${Math.round(diff).toLocaleString()} د.ج</strong> — سيُسجَّل كمصروف عمل (مصاريف غير مسجّلة) لتنزيل الخزينة للواقع.</span>`;
    } else {
        diffBox.innerHTML = `<span class="text-green-400">🔺 فائض قدره <strong>${Math.round(Math.abs(diff)).toLocaleString()} د.ج</strong> — سيُضاف إلى رأس المال الأساسي لرفع الخزينة للواقع.</span>`;
    }
}

/**
 * تنفيذ التسوية: يجعل الخزينة تساوي الرصيد الفعلي تمامًا عبر قيد متوازن.
 *  - نقص (الخزينة > الفعلي): يُسجّل مصروف عمل بقيمة الفرق.
 *  - فائض (الخزينة < الفعلي): يُضاف الفرق إلى رأس المال الأساسي.
 */
async function saveReconciliation(event) {
    if (event) event.preventDefault();

    if (!window.db || !window.firebaseModules) {
        showToast('Firebase غير جاهز', 'error');
        return;
    }

    const modal = document.getElementById('reconcile-modal');
    const computed = parseFloat(modal?.dataset.computed) || 0;
    const actualRaw = document.getElementById('reconcile-actual-input')?.value;

    if (actualRaw === '' || actualRaw == null) {
        showToast('يرجى إدخال الرصيد الفعلي', 'error');
        return;
    }

    const actual = parseFloat(actualRaw);
    if (!Number.isFinite(actual) || actual < 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }

    const diff = Math.round(computed - actual);

    if (Math.abs(diff) < 1) {
        showToast('الرصيد مطابق بالفعل، لا حاجة لتسوية', 'info');
        closeReconcileModal();
        return;
    }

    const confirmed = confirm(
        `تأكيد تسوية الرصيد؟\n\n` +
        `الخزينة المحسوبة: ${computed.toLocaleString()} د.ج\n` +
        `الرصيد الفعلي: ${actual.toLocaleString()} د.ج\n` +
        (diff > 0
            ? `سيُسجَّل مصروف "تسوية" بقيمة ${diff.toLocaleString()} د.ج.`
            : `سيُضاف ${Math.abs(diff).toLocaleString()} د.ج إلى رأس المال الأساسي.`)
    );
    if (!confirmed) return;

    try {
        const today = new Date().toISOString().split('T')[0];

        if (diff > 0) {
            // نقص → مصروف عمل بقيمة الفرق (مصاريف غير مسجّلة)
            const { addDoc, collection, serverTimestamp } = window.firebaseModules;
            await addDoc(collection(window.db, 'expenses'), {
                type: 'business',
                category: 'reconciliation',
                isAdjustment: true,
                amount: diff,
                currency: 'DZD',
                exchangeRate: USD_TO_DZD_RATE,
                description: `تسوية رصيد: مصاريف غير مسجّلة (تطابق الخزينة مع ${actual.toLocaleString()} د.ج)`,
                date: today,
                timestamp: serverTimestamp(),
                createdAt: new Date()
            });
            await loadExpenses();
            logActivity('accounting', 'reconcile', `Shortfall adjustment ${diff} DZD (actual ${actual})`);
        } else {
            // فائض → زيادة رأس المال الأساسي بقيمة الفرق
            const addition = Math.abs(diff);
            const newCapital = (Number(startingCapital) || 0) + addition;
            const { doc, setDoc } = window.firebaseModules;
            await setDoc(doc(window.db, 'settings', 'capital'), {
                startingCapital: newCapital,
                updatedAt: new Date().toISOString()
            });
            startingCapital = newCapital;
            localStorage.setItem('startingCapital', newCapital.toString());
            logActivity('accounting', 'reconcile', `Surplus added to capital ${addition} DZD (actual ${actual})`);
        }

        invalidateAccountingCache();
        closeReconcileModal();
        showToast('✅ تمت تسوية الرصيد بنجاح');

        // إعادة تحميل وعرض كل شيء
        displayAccountingTable();
        updateAccountingStats();
        updateProfitCharts();
        displayExpensesList();
        updateCapitalDisplay();

    } catch (error) {
        console.error('خطأ في تسوية الرصيد:', error);
        showToast('❌ خطأ في تسوية الرصيد', 'error');
    }
}

/**
 * تحميل رأس المال من Firebase
 */
async function loadStartingCapital() {
    try {
        // محاولة التحميل من Firebase
        if (window.db && window.firebaseModules) {
            const { doc, getDoc } = window.firebaseModules;
            const docSnap = await getDoc(doc(window.db, 'settings', 'capital'));
            if (docSnap.exists()) {
                startingCapital = docSnap.data().startingCapital || 0;
                localStorage.setItem('startingCapital', startingCapital.toString());
                return;
            }
        }

        // الرجوع إلى localStorage
        startingCapital = parseFloat(localStorage.getItem('startingCapital')) || 0;

    } catch (error) {
        console.error('خطأ في تحميل رأس المال:', error);
        startingCapital = parseFloat(localStorage.getItem('startingCapital')) || 0;
    }
}

/**
 * حساب إجمالي التزامات الموزعين (أرصدة المحافظ)
 */
function calculateTotalLiabilities() {
    if (!allResellers || !Array.isArray(allResellers)) return 0;

    return allResellers.reduce((sum, reseller) => {
        const balance = parseFloat(reseller.walletBalance) || 0;
        return balance > 0 ? sum + balance : sum;
    }, 0);
}

function calculateTotalResellerDebts() {
    if (!allResellers || !Array.isArray(allResellers)) return 0;

    return allResellers.reduce((sum, reseller) => {
        const balance = parseFloat(reseller.walletBalance) || 0;
        return balance < 0 ? sum + Math.abs(balance) : sum;
    }, 0);
}

/**
 * تحديث عرض رأس المال والرصيد الحالي
 * الحساب المباشر من البيانات بدون الاعتماد على أي شيء آخر
 */
/**
 * حساب لقطة الخزينة الكاملة (تراكمي، غير مفلتر بالتاريخ).
 * مصدر واحد للمعادلة يُستعمل في العرض وفي تسوية الرصيد.
 */
function computeTreasurySnapshot() {
    // 1. الإيرادات والتكلفة من الطلبات المكتملة فقط
    let totalRevenue = 0;
    let totalCost = 0;
    allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed').forEach(order => {
        totalRevenue += getOrderRevenueDzd(order);
        totalCost += getOrderCostDzd(order);
    });

    // 2. المصاريف (كلها)
    let totalExpenses = 0;
    allExpenses.forEach(e => {
        let amount = parseFloat(e.amount) || 0;
        if (e.currency === 'USD') amount *= (e.exchangeRate || USD_TO_DZD_RATE);
        totalExpenses += amount;
    });

    // 3. أمانات/ديون الموزعين
    const totalLiabilities = calculateTotalLiabilities();
    const totalResellerDebts = calculateTotalResellerDebts();

    // 4. رأس مالك الصافي = البداية + الربح الصافي
    const netProfit = totalRevenue - totalCost - totalExpenses;
    const netOwnCapital = startingCapital + netProfit;

    // 5. الخزينة = رأس مالك + أمانات الموزعين
    const currentTreasury = netOwnCapital + totalLiabilities;

    return { totalRevenue, totalCost, totalExpenses, totalLiabilities, totalResellerDebts, netProfit, netOwnCapital, currentTreasury };
}

function updateCapitalDisplay() {
    const { totalRevenue, totalCost, totalExpenses, totalLiabilities, totalResellerDebts, netProfit, netOwnCapital, currentTreasury } = computeTreasurySnapshot();

    // تحديث العناصر
    const balanceEl = document.getElementById('stat-current-balance');
    const startingEl = document.getElementById('stat-starting-capital-display');
    const badgeEl = document.getElementById('capital-performance-badge');
    const liabilitiesEls = [
        document.getElementById('stat-reseller-liabilities'),
        document.getElementById('stat-reseller-liabilities-card')
    ].filter(Boolean);
    const netOwnCapitalEls = [
        document.getElementById('stat-net-own-capital'),
        document.getElementById('stat-net-own-capital-card')
    ].filter(Boolean);
    const resellerDebtsEl = document.getElementById('stat-reseller-debts-card');

    if (balanceEl) {
        balanceEl.textContent = formatAccountingMoney(currentTreasury);
        balanceEl.style.color = currentTreasury >= startingCapital ? 'var(--accent)' : '#ef4444';
    }

    if (startingEl) startingEl.textContent = formatAccountingMoney(startingCapital);
    liabilitiesEls.forEach(el => {
        el.textContent = formatAccountingMoney(totalLiabilities);
    });
    netOwnCapitalEls.forEach(el => {
        el.textContent = formatAccountingMoney(netOwnCapital);
    });
    if (resellerDebtsEl) resellerDebtsEl.textContent = formatAccountingMoney(totalResellerDebts);

    // إضافة زر الإصلاح إذا كان هناك فرق في الحساب (اختياري)
    const actionContainer = document.querySelector('.khazina-actions') || document.querySelector('.flex.gap-3.mb-6');
    if (actionContainer && !document.getElementById('btn-fix-costs')) {
        const fixBtn = document.createElement('button');
        fixBtn.id = 'btn-fix-costs';
        fixBtn.className = 'px-4 py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600 hover:text-white transition text-sm font-bold flex items-center gap-2';
        fixBtn.innerHTML = '🪄 إصلاح التكاليف';
        fixBtn.onclick = fixOldOrdersCost;
        actionContainer.appendChild(fixBtn);
    }

    if (badgeEl) {
        const perf = startingCapital > 0 ? ((netOwnCapital - startingCapital) / startingCapital * 100) : 0;
        if (perf >= 0) {
            badgeEl.textContent = "↑ +" + perf.toFixed(1) + "% ربح";
            badgeEl.className = 'px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400';
        } else {
            badgeEl.textContent = "↓ " + perf.toFixed(1) + "% خسارة";
            badgeEl.className = 'px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400';
        }
    }

    // طباعة للتشخيص
    console.log('💰 Capital Update:', {
        startingCapital,
        totalRevenue: Math.round(totalRevenue),
        totalCost: Math.round(totalCost),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        netOwnCapital: Math.round(netOwnCapital),
        totalLiabilities: Math.round(totalLiabilities),
        currentTreasury: Math.round(currentTreasury)
    });
}



function calculateTotalFinancials() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';

    // 1. حساب المبيعات والتكاليف من كل الطلبات
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => (o.status === 'delivered' || o.status === 'confirmed')),
        dateFilter
    );

    let totalRevenue = 0, totalCogs = 0;

    filteredOrders.forEach(order => {
        totalRevenue += getOrderRevenueDzd(order);
        totalCogs += getOrderCostDzd(order);
    });

    // 2. المصاريف
    const filteredExpenses = filterExpensesByDate(allExpenses, dateFilter);
    let totalExpenses = 0;
    filteredExpenses.forEach(e => {
        let amount = parseFloat(e.amount) || 0;
        if (e.currency === 'USD') amount *= (e.exchangeRate || USD_TO_DZD_RATE);
        totalExpenses += amount;
    });

    return {
        totalRevenue,
        totalCogs,
        totalExpenses
    };
}

function getOrderRevenueDzd(order) {
    // سعر البيع المسجّل (sold_price) هو المصدر الموثوق إذا كان أكبر من صفر
    const soldPrice = parseFloat(order?.sold_price);
    if (Number.isFinite(soldPrice) && soldPrice > 0) {
        return soldPrice;
    }
    // وإلا نرجع لمبلغ الطلب مع تحويل العملة عند اللزوم
    let amount = parseFloat(order?.amount) || 0;
    if (order?.currency === 'USD') {
        amount *= (order.exchangeRate || USD_TO_DZD_RATE);
    }
    return amount;
}

// ═══════════════════════════════════════════════════════════════════════════
// مساعدات عرض العملة في لوحة المحاسبة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * وضع العملة الحالي في لوحة المحاسبة (both / dzd / usd)
 */
function getAccountingCurrencyMode() {
    return document.getElementById('accounting-currency')?.value || 'both';
}

/**
 * تنسيق مبلغ (مخزّن بالـ DZD) حسب فلتر العملة المختار.
 * المصدر الموثوق دائماً هو DZD، ويُحوَّل إلى USD بالسعر الحالي عند الحاجة.
 */
function formatAccountingMoney(dzd) {
    const value = Number(dzd) || 0;
    if (getAccountingCurrencyMode() === 'usd') {
        const rate = USD_TO_DZD_RATE || 1;
        return `$${(value / rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return `${Math.round(value).toLocaleString()} د.ج`;
}

function getOrderCostDzd(order) {
    let cost = parseFloat(order?.cost_price ?? order?.costPrice) || 0;
    if (cost > 0) return cost;

    const product = allProducts.find(p => matchesProductRecord(order, p));
    return getProductCostDZD(product);
}

function getOrderDate(order) {
    if (order?.createdAt?.toDate) return order.createdAt.toDate();
    if (order?.timestamp?.toDate) return order.timestamp.toDate();
    return new Date(order?.saleDate || order?.createdAt || order?.timestamp || Date.now());
}

// ═══════════════════════════════════════════════════════════════════════════
// إعادة ضبط الحسابات - Reset Accounting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة إعادة ضبط الحسابات
 */
function openResetAccountingModal() {
    const modal = document.getElementById('reset-accounting-modal');
    const checkbox = document.getElementById('confirm-reset-checkbox');
    const btn = document.getElementById('reset-confirm-btn');

    if (modal) {
        if (checkbox) checkbox.checked = false;
        if (btn) btn.disabled = true;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * إغلاق نافذة إعادة ضبط الحسابات
 */
function closeResetAccountingModal() {
    const modal = document.getElementById('reset-accounting-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * تأكيد إعادة ضبط الحسابات وحذف كل البيانات
 */
async function confirmResetAccounting() {
    try {
        showToast('⏳ جاري حذف البيانات...', 'info');

        if (window.db && window.firebaseModules) {
            const { collection, getDocs, deleteDoc, doc } = window.firebaseModules;

            // حذف المشتريات
            const purchasesSnap = await getDocs(collection(window.db, 'purchases'));
            for (const docSnap of purchasesSnap.docs) {
                await deleteDoc(doc(window.db, 'purchases', docSnap.id));
            }

            // حذف المبيعات/الطلبات
            const ordersSnap = await getDocs(collection(window.db, 'orders'));
            for (const docSnap of ordersSnap.docs) {
                await deleteDoc(doc(window.db, 'orders', docSnap.id));
            }

            // حذف المصاريف
            const expensesSnap = await getDocs(collection(window.db, 'expenses'));
            for (const docSnap of expensesSnap.docs) {
                await deleteDoc(doc(window.db, 'expenses', docSnap.id));
            }

            // حذف المعاملات (إيداعات، استرجاعات، إلخ)
            const transactionsSnap = await getDocs(collection(window.db, 'transactions'));
            for (const docSnap of transactionsSnap.docs) {
                await deleteDoc(doc(window.db, 'transactions', docSnap.id));
            }
        }

        // مسح البيانات المحلية
        allPurchases = [];
        allOrders = [];
        allExpenses = [];
        allTransactions = [];

        closeResetAccountingModal();
        showToast('✅ تم حذف جميع البيانات بنجاح. يمكنك البدء من جديد!');

        // إعادة تحميل الصفحة
        loadAccountingData();
        updateCapitalDisplay();

    } catch (error) {
        console.error('خطأ في إعادة ضبط الحسابات:', error);
        showToast('❌ خطأ في حذف البيانات: ' + error.message, 'error');
    }
}

/**
 * تنظيف المعاملات اليتيمة (من موزعين محذوفين)
 */
async function cleanOrphanTransactions() {
    if (!window.db || !window.firebaseModules) return;

    try {
        const { collection, getDocs, deleteDoc, doc } = window.firebaseModules;
        const transactionsSnap = await getDocs(collection(window.db, 'transactions'));

        let deletedCount = 0;
        for (const docSnap of transactionsSnap.docs) {
            const t = docSnap.data();
            // تحقق إذا كان الموزع موجوداً
            if (t.resellerId && !allResellers.find(r => r.id === t.resellerId)) {
                await deleteDoc(doc(window.db, 'transactions', docSnap.id));
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            showToast(`🧹 تم حذف ${deletedCount} معاملة يتيمة`, 'success');
            loadAccountingData();
        } else {
            showToast('✅ لا توجد معاملات يتيمة', 'info');
        }
    } catch (error) {
        console.error('Error cleaning orphan transactions:', error);
    }
}

/**
 * حذف كل المعاملات (للتنظيف الطارئ)
 */
async function purgeAllTransactions() {
    if (!confirm('⚠️ هل أنت متأكد من حذف كل سجلات المعاملات؟')) return;

    try {
        const { collection, getDocs, deleteDoc, doc } = window.firebaseModules;
        const transactionsSnap = await getDocs(collection(window.db, 'transactions'));

        for (const docSnap of transactionsSnap.docs) {
            await deleteDoc(doc(window.db, 'transactions', docSnap.id));
        }

        allTransactions = [];
        showToast('✅ تم حذف كل المعاملات', 'success');
        updateCapitalDisplay();
    } catch (error) {
        console.error('Error purging transactions:', error);
    }
}

/**
 * طباعة تحليل الحسابات للتشخيص
 */
function debugFinancials() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed');

    let totalRevenue = 0, totalCogs = 0;
    console.log('=== DEBUG FINANCIALS ===');
    console.log('Starting Capital:', startingCapital);
    console.log('All Orders (delivered/confirmed):', filteredOrders.length);

    filteredOrders.forEach((order, i) => {
        let amount = parseFloat(order.sold_price || order.amount) || 0;
        if (order.currency === 'USD' && !order.sold_price) {
            amount *= (order.exchangeRate || USD_TO_DZD_RATE);
        }

        let cost = parseFloat(order.cost_price || order.costPrice) || 0;
        if (cost === 0) {
            const product = allProducts.find(p => matchesProductRecord(order, p));
            cost = getProductCostDZD(product);
        }

        totalRevenue += amount;
        totalCogs += cost;

        console.log(`Order ${i + 1}: ${order.productName} | Revenue: ${amount} | Cost: ${cost} | Source: ${order.source || 'direct'}`);
    });

    const filteredExpenses = allExpenses;
    let totalExpenses = 0;
    filteredExpenses.forEach(e => {
        let amount = parseFloat(e.amount) || 0;
        if (e.currency === 'USD') amount *= (e.exchangeRate || USD_TO_DZD_RATE);
        totalExpenses += amount;
    });

    console.log('---');
    console.log('Total Revenue:', totalRevenue);
    console.log('Total COGS:', totalCogs);
    console.log('Total Expenses:', totalExpenses);
    console.log('Net Profit:', totalRevenue - totalCogs - totalExpenses);
    console.log('Expected Net Capital:', startingCapital + (totalRevenue - totalCogs - totalExpenses));
    console.log('=== END DEBUG ===');

    return {
        startingCapital,
        totalRevenue,
        totalCogs,
        totalExpenses,
        netProfit: totalRevenue - totalCogs - totalExpenses,
        expectedNetCapital: startingCapital + (totalRevenue - totalCogs - totalExpenses)
    };
}

/**
 * إصلاح الطلبات القديمة التي ليس لديها تكلفة مسجلة
 */
async function fixOldOrdersCost() {
    if (!window.db || !window.firebaseModules) {
        showToast('Firebase غير جاهز', 'error');
        return;
    }

    try {
        const { doc, updateDoc } = window.firebaseModules;
        let fixedCount = 0;
        let totalMissingCost = 0;

        console.log('🔧 بدء إصلاح الطلبات القديمة...');
        console.log('عدد الطلبات:', allOrders.length);
        console.log('عدد المنتجات:', allProducts.length);

        for (const order of allOrders) {
            const currentCost = parseFloat(order.cost_price || order.costPrice) || 0;

            if (currentCost === 0) {
                // البحث عن المنتج
                const product = allProducts.find(p => matchesProductRecord(order, p));
                const productCost = getProductCostDZD(product);

                console.log(`📦 ${order.productName}: تكلفة حالية=${currentCost}, من المنتج=${productCost}`);

                if (productCost > 0) {
                    // تحديث الطلب في Firebase
                    await updateDoc(doc(window.db, 'orders', order.id), {
                        cost_price: productCost
                    });

                    fixedCount++;
                    totalMissingCost += productCost;
                    console.log(`✅ تم إصلاح: ${order.productName} - التكلفة: ${productCost}`);
                }
            }
        }

        if (fixedCount > 0) {
            showToast(`✅ تم إصلاح ${fixedCount} طلب، إجمالي التكلفة المضافة: ${totalMissingCost.toLocaleString()} د.ج`);

            // إعادة تحميل البيانات
            await loadOrders();
            updateCapitalDisplay();
        } else {
            showToast('✅ جميع الطلبات لديها تكلفة مسجلة', 'info');
        }

        console.log('🔧 انتهى الإصلاح:', { fixedCount, totalMissingCost });

    } catch (error) {
        console.error('خطأ في إصلاح الطلبات:', error);
        showToast('خطأ في إصلاح الطلبات: ' + error.message, 'error');
    }
}

// تصدير الوظائف
window.openCapitalModal = openCapitalModal;
window.closeCapitalModal = closeCapitalModal;
window.saveStartingCapital = saveStartingCapital;
window.openReconcileModal = openReconcileModal;
window.closeReconcileModal = closeReconcileModal;
window.previewReconcileDiff = previewReconcileDiff;
window.saveReconciliation = saveReconciliation;
window.computeTreasurySnapshot = computeTreasurySnapshot;
window.loadStartingCapital = loadStartingCapital;
window.updateCapitalDisplay = updateCapitalDisplay;
window.openResetAccountingModal = openResetAccountingModal;
window.closeResetAccountingModal = closeResetAccountingModal;
window.confirmResetAccounting = confirmResetAccounting;
window.cleanOrphanTransactions = cleanOrphanTransactions;
window.purgeAllTransactions = purgeAllTransactions;
window.debugFinancials = debugFinancials;
window.fixOldOrdersCost = fixOldOrdersCost;

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
        const productName = getProductDisplayName(product);
        const priceDzd = getProductPriceDZD(product);
        const priceUsd = getProductPriceUSD(product);
        const costDzd = getProductCostDZD(product);
        if (product.durations && Object.keys(product.durations).length > 0) {
            // إضافة كل مدة كخيار منفصل
            Object.entries(product.durations).forEach(([durationKey, price]) => {
                const option = document.createElement('option');
                option.value = `${product.id}_${durationKey}`;
                option.textContent = `${productName} - ${durationKey} (${price.dzd} د.ج / $${price.usd})`;
                option.dataset.productId = product.id;
                option.dataset.productName = `${productName} - ${durationKey}`;
                option.dataset.priceDzd = price.dzd;
                option.dataset.priceUsd = price.usd;
                // Add cost price (from duration if exists, otherwise from product default)
                option.dataset.costDzd = price.cost_dzd || price.costDZD || costDzd || 0;
                productSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${productName} (${priceDzd} د.ج / $${priceUsd})`;
            option.dataset.productId = product.id;
            option.dataset.productName = productName;
            option.dataset.priceDzd = priceDzd;
            option.dataset.priceUsd = priceUsd;
            option.dataset.costDzd = costDzd || 0;
            productSelect.appendChild(option);
        }
    });

    // إعادة تعيين النموذج
    const saleForm = document.getElementById('sale-form');
    if (saleForm) saleForm.reset();

    const quantityInput = document.getElementById('sale-quantity');
    if (quantityInput) quantityInput.value = 1;

    // تعيين التاريخ الحالي كافتراضي
    const dateInput = document.getElementById('sale-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    // Reset cost price and profit preview
    const costPriceInput = document.getElementById('sale-cost-price');
    if (costPriceInput) costPriceInput.value = '';

    const profitPreview = document.getElementById('sale-profit-preview');
    if (profitPreview) profitPreview.textContent = '-- د.ج';

    // Add event listener for product selection to auto-fill cost and price
    productSelect.onchange = function () {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.dataset.costDzd) {
            const costPrice = parseFloat(selectedOption.dataset.costDzd) || 0;
            const costInput = document.getElementById('sale-cost-price');
            const amountInput = document.getElementById('sale-amount');
            const currencySelect = document.getElementById('sale-currency');

            // Auto-fill cost price
            if (costInput && costPrice > 0) {
                costInput.value = costPrice;
            }

            // Auto-fill selling price based on currency
            if (amountInput && currencySelect) {
                const currency = currencySelect.value;
                if (currency === 'DZD' && selectedOption.dataset.priceDzd) {
                    amountInput.value = selectedOption.dataset.priceDzd;
                } else if (currency === 'USD' && selectedOption.dataset.priceUsd) {
                    amountInput.value = selectedOption.dataset.priceUsd;
                }
            }

            updateProfitPreview();
        }
    };

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
 * تحديث معاينة الربح المتوقع
 */
function updateProfitPreview() {
    const sellingPrice = parseFloat(document.getElementById('sale-amount')?.value) || 0;
    const costPrice = parseFloat(document.getElementById('sale-cost-price')?.value) || 0;
    const currency = document.getElementById('sale-currency')?.value || 'DZD';
    const quantity = parseInt(document.getElementById('sale-quantity')?.value) || 1;
    const profitPreview = document.getElementById('sale-profit-preview');

    if (!profitPreview) return;

    // Convert selling price to DZD if in USD
    let sellingPriceDZD = sellingPrice;
    if (currency === 'USD') {
        sellingPriceDZD = sellingPrice * USD_TO_DZD_RATE;
    }

    // Calculate profit
    const totalProfit = (sellingPriceDZD - costPrice) * quantity;

    // Update display with color based on profit
    if (sellingPrice > 0 || costPrice > 0) {
        if (totalProfit >= 0) {
            profitPreview.textContent = `+${totalProfit.toLocaleString()} د.ج`;
            profitPreview.className = 'w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-sm text-green-400 font-bold flex items-center';
        } else {
            profitPreview.textContent = `${totalProfit.toLocaleString()} د.ج`;
            profitPreview.className = 'w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-sm text-red-400 font-bold flex items-center';
        }
    } else {
        profitPreview.textContent = '-- د.ج';
        profitPreview.className = 'w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-sm text-gray-400 font-bold flex items-center';
    }
}

// Export the function
window.updateProfitPreview = updateProfitPreview;

/**
 * حفظ عملية البيع
 */
async function saveSale(event) {
    event.preventDefault();

    const productOption = document.getElementById('sale-product').options[document.getElementById('sale-product').selectedIndex];
    const productId = productOption ? productOption.dataset.productId : null;
    const productName = productOption ? productOption.dataset.productName : null;

    if (!productId) {
        showToast('يرجى اختيار منتج', 'error');
        return;
    }

    const quantity = parseInt(document.getElementById('sale-quantity').value) || 1;
    const currency = document.getElementById('sale-currency').value;
    const amount = parseFloat(document.getElementById('sale-amount').value);
    const saleDate = document.getElementById('sale-date').value;
    const saleType = document.getElementById('sale-type')?.value || 'direct';

    // Reseller Validation
    let resellerId = null;
    let resellerName = '';

    if (saleType === 'wholesale') {
        const resellerSelect = document.getElementById('sale-reseller-select');
        resellerId = resellerSelect.value;
        if (!resellerId) {
            showToast('يرجى اختيار الموزع', 'error');
            return;
        }

        // Find Reseller logic
        const reseller = allResellers.find(r => r.id === resellerId);
        if (!reseller) {
            showToast('الموزع غير موجود', 'error');
            return;
        }

        resellerName = reseller.name;

        // Check Balance (Need to convert currency if price is USD but wallet in DZD)
        // Assuming Wallet is always DZD.
        let totalAmountDZD = amount;
        if (currency === 'USD') {
            totalAmountDZD = amount * USD_TO_DZD_RATE;
        }

        if ((reseller.walletBalance || 0) < totalAmountDZD) {
            showToast(`رصيد الموزع غير كافٍ! (المطلوب: ${totalAmountDZD.toLocaleString()} د.ج)`, 'error');
            return;
        }

        if (!confirm(`خصم ${totalAmountDZD.toLocaleString()} د.ج من رصيد ${reseller.name}؟`)) {
            return;
        }
    }

    // إنشاء طلبات متعددة حسب الكمية
    try {
        const { addDoc, collection, serverTimestamp, doc, updateDoc, increment } = window.firebaseModules;

        // تحويل التاريخ المحدد إلى Timestamp
        const selectedDate = saleDate ? new Date(saleDate + 'T12:00:00') : new Date();

        // 1. If Wholesale, Deduct from Wallet and record transaction
        if (saleType === 'wholesale' && resellerId) {
            let totalAmountDZD = amount;
            if (currency === 'USD') totalAmountDZD = amount * USD_TO_DZD_RATE;

            await updateDoc(doc(window.db, 'resellers', resellerId), {
                walletBalance: increment(-totalAmountDZD),
                totalSales: increment(quantity),
                lastPurchaseAt: serverTimestamp()
            });

            // Record transaction for wallet history
            await addDoc(collection(window.db, 'transactions'), {
                type: 'wallet_purchase',
                resellerId: resellerId,
                resellerName: resellerName,
                amount: -totalAmountDZD,
                productName: productName,
                quantity: quantity,
                notes: `شراء ${quantity}x ${productName}`,
                createdAt: selectedDate
            });
        }

        for (let i = 0; i < quantity; i++) {
            // Get cost price from input field or fallback to product default
            const costPriceInput = document.getElementById('sale-cost-price');
            let costPrice = parseFloat(costPriceInput?.value) || 0;

            // If no cost entered, try to get from product
            if (costPrice === 0) {
                const product = allProducts.find(p => p.id === productId || matchesProductRecord({ productId, productName }, p));
                costPrice = getProductCostDZD(product);
                if (costPrice === 0) {
                    console.warn(`⚠️ No cost price found for product: ${productName}. Using 0.`);
                }
            }

            // Calculate sold price in DZD
            let soldPriceDZD = amount / quantity;
            if (currency === 'USD') {
                soldPriceDZD = soldPriceDZD * USD_TO_DZD_RATE;
            }

            // Calculate net profit
            const netProfit = soldPriceDZD - costPrice;

            const saleData = {
                productId: productId,
                productName: productName,
                customerName: saleType === 'wholesale' ? resellerName : (document.getElementById('sale-customer-name').value || 'عميل'),
                email: saleType === 'wholesale' ? '' : (document.getElementById('sale-customer-contact').value || ''),
                phone: saleType === 'wholesale' ? '' : (document.getElementById('sale-customer-contact').value || ''),
                resellerId: saleType === 'wholesale' ? resellerId : null,
                amount: amount / quantity, // Price per unit (in original currency)
                currency: currency,
                exchangeRate: USD_TO_DZD_RATE, // حفظ سعر الصرف الحالي
                cost_price: costPrice, // تكلفة المنتج بالدينار
                sold_price: soldPriceDZD, // سعر البيع بالدينار
                net_profit: netProfit, // صافي الربح
                paymentMethod: saleType === 'wholesale' ? 'wallet' : document.getElementById('sale-payment-method').value,
                notes: document.getElementById('sale-notes').value,
                status: 'delivered', // Wholesale is instant delivery usually
                source: saleType === 'wholesale' ? 'wholesale' : 'manual',
                saleDate: saleDate || new Date().toISOString().split('T')[0],
                timestamp: serverTimestamp(),
                createdAt: selectedDate
            };

            await addDoc(collection(window.db, 'orders'), saleData);
        }

        // تحديث القائمة المحلية
        await loadOrders();
        if (saleType === 'wholesale') await loadResellers(); // Update balance UI

        // تحديث بيانات المحاسبة
        if (typeof displayAccountingTable === 'function') displayAccountingTable();
        if (typeof updateAccountingStats === 'function') updateAccountingStats();
        if (typeof updateProfitCharts === 'function') updateProfitCharts();
        if (typeof updateProfitSourceChart === 'function') updateProfitSourceChart(); // New Chart
        if (typeof displaySuppliersSummary === 'function') displaySuppliersSummary();

        closeSaleModal();
        showToast(`✅ تم تسجيل ${quantity} عملية بيع بنجاح!`);
        logActivity('sale', 'created', `${productName} x${quantity} (${saleType})`);

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
        const productName = getProductDisplayName(product);
        option.value = product.id;
        option.textContent = productName;
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
            productName: getProductDisplayName(product),
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: quantity * unitPrice,
            currency: currency,
            exchangeRate: USD_TO_DZD_RATE, // حفظ سعر الصرف الحالي
            supplier: supplier,
            notes: notes,
            purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
            timestamp: serverTimestamp(),
            createdAt: selectedDate
        };

        await addDoc(collection(window.db, 'purchases'), purchaseData);

        closePurchaseModal();
        showToast(`✅ تم تسجيل شراء ${quantity} × ${getProductDisplayName(product)}`);
        logActivity('purchase', 'created', `${getProductDisplayName(product)} x${quantity} من ${supplier}`);

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
            exchangeRate: USD_TO_DZD_RATE, // حفظ سعر الصرف الحالي
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
    if (!window.firebaseModules) {
        console.log('⏳ Firebase غير جاهز لتحميل المصاريف');
        return;
    }
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

    // حساب الإيرادات (مع تحويل العملة)
    const revenue = monthOrders.reduce((sum, o) => {
        const amount = parseFloat(o.amount) || 0;
        if (o.currency === 'USD') {
            const rate = o.exchangeRate || USD_TO_DZD_RATE;
            return sum + (amount * rate);
        }
        return sum + amount;
    }, 0);

    // حساب تكلفة المنتجات (مع تحويل العملة)
    const productCost = monthPurchases.reduce((sum, p) => {
        const amount = p.totalPrice || 0;
        if (p.currency === 'USD') {
            const rate = p.exchangeRate || USD_TO_DZD_RATE;
            return sum + (amount * rate);
        }
        return sum + amount;
    }, 0);

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

        let amount = parseFloat(o.amount) || 0;
        if (o.currency === 'USD') {
            const rate = o.exchangeRate || USD_TO_DZD_RATE;
            amount = amount * rate;
        }
        salesByProduct[name].revenue += amount;
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

        let amount = e.amount || 0;
        if (e.currency === 'USD') {
            const rate = e.exchangeRate || USD_TO_DZD_RATE;
            amount = amount * rate;
        }
        expensesByCategory[cat] += amount;
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
        const dateStr = date.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' });

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
        const dateStr = date.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' });

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
 * حذف عملية بيع (مع استرجاع المبالغ للموزعين)
 */
async function deleteSale(orderId) {
    if (!confirm('هل تريد حذف عملية البيع هذه؟ استرجاع المال للموزع سيتم تلقائياً إذا كان الشراء بالمحفظة.')) return;

    try {
        const { deleteDoc, doc, updateDoc, increment, addDoc, collection } = window.firebaseModules;

        // جلب بيانات الطلب قبل الحذف للقيام بعملية الاسترجاع
        const order = allOrders.find(o => o.id === orderId);

        if (order && (order.paymentMethod === 'wallet' || order.source === 'wholesale') && order.resellerId) {
            // 1. إعادة المال لمحفظة الموزع (سعر البيع كاملاً)
            let refundAmount = parseFloat(order.sold_price || order.amount) || 0;

            // تحويل للعملة المحلية إذا كان مسجلاً بالدولار وليس لديه sold_price محسوب
            if (order.currency === 'USD' && !order.sold_price) {
                refundAmount *= (order.exchangeRate || USD_TO_DZD_RATE);
            }

            await updateDoc(doc(window.db, 'resellers', order.resellerId), {
                walletBalance: increment(refundAmount),
                totalSales: increment(-1)
            });

            // 2. تسجيل عملية استرجاع في سجل المعاملات
            await addDoc(collection(window.db, 'transactions'), {
                type: 'refund',
                resellerId: order.resellerId,
                amount: refundAmount,
                productName: order.productName,
                notes: `استرجاع مبلغ طلب محذوف #${orderId.substring(0, 8)}`,
                createdAt: new Date().toISOString()
            });

            console.log(`✅ Refunded ${refundAmount} to reseller ${order.resellerId}`);
        }

        // 3. حذف الطلب من قاعدة البيانات
        // ملاحظة: حذف الطلب سيؤدي تلقائياً لإعادة "التكلفة" إلى الخزينة 
        // لأن دالة calculateTotalFinancials لن تجد هذا الطلب ولن تطرح تكلفته من رأس المال.
        await deleteDoc(doc(window.db, 'orders', orderId));

        showToast('✅ تم حذف الطلب واسترجاع المبالغ بنجاح');

        // تحديث كافة البيانات والواجهات
        await loadOrders();
        if (typeof loadResellers === 'function') await loadResellers();
        if (typeof displayAccountingTable === 'function') displayAccountingTable();
        if (typeof updateAccountingStats === 'function') updateAccountingStats();
        if (typeof displayTransactionsLog === 'function') displayTransactionsLog();
        if (typeof updateCapitalDisplay === 'function') updateCapitalDisplay();

    } catch (error) {
        console.error('خطأ في حذف عملية البيع والاسترجاع:', error);
        showToast('خطأ في عملية الحذف والاسترجاع', 'error');
    }
}

// تصدير دوال الحذف للاستخدام من HTML
window.deletePurchase = deletePurchase;
window.deleteSale = deleteSale;
window.deleteExpense = deleteExpense;

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
async function showDashboard() {
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

        // تحميل البيانات (مع معالجة الأخطاء) - فقط إذا كان Firebase جاهزاً
        if (window.firebaseModules) {
            // Load independent data in parallel
            try {
                if (typeof loadReviews === 'function') loadReviews();
            } catch (error) { console.warn('خطأ في تحميل التقييمات:', error); }

            try {
                if (typeof loadProducts === 'function') loadProducts();
            } catch (error) { console.warn('خطأ في تحميل المنتجات:', error); }

            try {
                if (typeof loadOrders === 'function') loadOrders();
            } catch (error) { console.warn('خطأ في تحميل الطلبات:', error); }

            try {
                if (typeof loadCustomers === 'function') loadCustomers();
            } catch (error) { console.warn('خطأ في تحميل العملاء:', error); }

            try {
                if (typeof loadSecuritySettings === 'function') loadSecuritySettings();
            } catch (error) { console.warn('خطأ في تحميل إعدادات الأمان:', error); }

            try {
                if (typeof loadMaintenanceSettings === 'function') loadMaintenanceSettings();
            } catch (error) { console.warn('Error loading maintenance settings:', error); }

            // CRITICAL: Load Resellers & Transactions FIRST for Accounting
            try {
                // Load Resellers (for Liabilities calculation)
                if (typeof loadResellers === 'function') {
                    await loadResellers();
                    console.log('✅ تم تحميل الموزعين لغرض المحاسبة');
                }

                // Load Transactions (for Net Cash Flow/Khazina Total)
                if (typeof loadTransactions === 'function') {
                    await loadTransactions();
                    console.log('✅ تم تحميل سجل المعاملات لغرض المحاسبة');
                }
            } catch (error) { console.warn('خطأ في تحميل بيانات المحاسبة:', error); }

            // loadStartingCapital calls updateCapitalDisplay()
            // Now allResellers and allTransactions are populated, so calculations will be correct.
            try {
                if (typeof loadStartingCapital === 'function') loadStartingCapital();
            } catch (error) { console.warn('خطأ في تحميل رأس المال:', error); }
        } else {
            console.log('⏳ في انتظار جاهزية Firebase لتحميل البيانات...');
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
                adminPasswordSource = 'firebase';
                console.log('✅ تم جلب كلمة المرور من Firebase بنجاح');
                // تحديث النسخة المحلية
                localStorage.setItem('adminPassword', firebasePassword);
                return firebasePassword;
            } else {
                console.log('📭 لا توجد كلمة مرور في Firebase، جاري إنشاء واحدة...');
                // إذا لم توجد في Firebase، نحفظ المحلية أو الافتراضية هناك
                const localPassword = localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
                await saveAdminPasswordToFirebase(localPassword);
                adminPasswordSource = 'local';
                return localPassword;
            }
        }

        // ثانياً: استخدام localStorage كبديل
        console.warn('⚠️ Firebase غير متاح، استخدام كلمة المرور المحلية');
        adminPasswordSource = 'local';
        return localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;

    } catch (error) {
        console.error('❌ خطأ في جلب كلمة المرور من Firebase:', error);
        adminPasswordSource = 'local_error';
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
function setLoginError(message = '', type = 'error') {
    const errorElement = document.getElementById('login-error');
    if (!errorElement) return;

    if (!message) {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
        return;
    }

    errorElement.textContent = message;
    errorElement.style.color = type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-danger)';
    errorElement.classList.remove('hidden');
}

function setLoginLoading(isLoading) {
    const loginForm = document.getElementById('login-form');
    const submitButton = loginForm?.querySelector('button[type="submit"]');
    const passwordInput = document.getElementById('admin-password');

    if (passwordInput) passwordInput.disabled = isLoading;
    if (!submitButton) return;

    if (!submitButton.dataset.defaultHtml) {
        submitButton.dataset.defaultHtml = submitButton.innerHTML;
    }

    submitButton.disabled = isLoading;
    submitButton.style.opacity = isLoading ? '0.75' : '';
    submitButton.style.cursor = isLoading ? 'wait' : '';
    submitButton.innerHTML = isLoading ? 'جاري التحقق...' : submitButton.dataset.defaultHtml;
}

async function handleLogin(event) {
    event.preventDefault();

    if (isAdminLoginInProgress) return;
    isAdminLoginInProgress = true;
    setLoginLoading(true);
    setLoginError('');

    try {
        const passwordInput = document.getElementById('admin-password');
        if (!passwordInput) {
            console.error('حقل كلمة المرور غير موجود');
            return;
        }

        const password = passwordInput.value;
        if (!password) {
            setLoginError('أدخل كلمة المرور أولاً.');
            passwordInput.focus();
            return;
        }

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
handleLogin = async function handleLoginWithState(event) {
    event.preventDefault();

    if (isAdminLoginInProgress) return;
    isAdminLoginInProgress = true;
    setLoginLoading(true);
    setLoginError('');

    try {
        const passwordInput = document.getElementById('admin-password');
        if (!passwordInput) {
            setLoginError('تعذر العثور على حقل كلمة المرور. حدّث الصفحة وحاول مرة أخرى.');
            return;
        }

        const password = passwordInput.value;
        if (!password) {
            setLoginError('أدخل كلمة المرور أولاً.');
            passwordInput.focus();
            return;
        }

        const savedPassword = await getAdminPasswordFromFirebase();
        if (password === savedPassword) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('isAdmin', 'true');
            setLoginError('');
            showDashboard();

            if (adminPasswordSource !== 'firebase') {
                showToast('تم الدخول باستخدام كلمة المرور المحفوظة محلياً لأن Firebase غير متاح حالياً', 'warning');
            }
            showToast('مرحباً بك!');

            try {
                if (typeof logActivity === 'function') {
                    logActivity('security', 'login', 'Admin logged in successfully');
                }
            } catch (error) {
                console.warn('Unable to log login activity:', error);
            }
            return;
        }

        setLoginError('كلمة المرور غير صحيحة.');
        passwordInput.classList.add('border-red-500');
        setTimeout(() => passwordInput.classList.remove('border-red-500'), 2000);

        try {
            if (typeof logActivity === 'function') {
                logActivity('security', 'failed_login', 'Failed login attempt');
            }
        } catch (error) {
            console.warn('Unable to log failed login activity:', error);
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        setLoginError('حدث خطأ أثناء تسجيل الدخول. تحقق من الاتصال أو حدّث الصفحة.');
    } finally {
        isAdminLoginInProgress = false;
        setLoginLoading(false);
    }
};

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
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // تفعيل الزر المحدد
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-purple-500', 'text-purple-400');
        activeBtn.classList.remove('border-transparent');
    }

    // وظائف اختيارية عند عرض تبويب معين
    if (tabName === 'live-pricing') {
        renderLivePricingList();
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
 * فتح نافذة تأكيد الحذف - تم نقلها لأسفل مع دعم أنواع متعددة
 */
// function openDeleteModal moved to line ~3428 with multi-type support

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
 * تأكيد حذف التقييم - تم نقلها لأسفل مع دعم أنواع متعددة
 */
// async function confirmDelete moved to line ~3444 with multi-type support

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
        return date.toLocaleDateString('fr-DZ', {
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

// Initialize immediately
initAdminPage();

// Signal when Firebase is ready
if (!window.firebaseModules) {
    window.addEventListener('firebaseReady', () => {
        console.log('✅ Firebase Loaded after init');
        // Re-run checks that depend on Firebase if needed
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            console.log('🔄 إعادة تحميل البيانات...');
            // We can just call showDashboard again, it has the logic now
            showDashboard();
        }
    });
}


function initAdminPage() {
    console.log('✅ تم تحميل الصفحة (Firebase Ready)');

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
    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleDateString('fr-DZ');

    // تحميل إعدادات الأمان
    loadSecuritySettings();
}

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
async function loadMaintenanceSettings() {
    const maintenanceToggle = document.getElementById('maintenance-mode');
    if (!maintenanceToggle) return;

    try {
        if (!window.db || !window.firebaseModules || !window.firebaseModules.getDoc) {
            maintenanceToggle.checked = localStorage.getItem('maintenanceMode') === 'true';
            return;
        }

        const { doc, getDoc } = window.firebaseModules;
        const maintenanceDoc = await getDoc(doc(window.db, 'settings', 'maintenance'));

        if (maintenanceDoc.exists()) {
            const data = maintenanceDoc.data();
            maintenanceToggle.checked = data.enabled === true;
            localStorage.setItem('maintenanceMode', data.enabled === true ? 'true' : 'false');
        } else {
            maintenanceToggle.checked = false;
            localStorage.setItem('maintenanceMode', 'false');
        }
    } catch (error) {
        console.warn('Unable to load maintenance settings:', error);
        maintenanceToggle.checked = localStorage.getItem('maintenanceMode') === 'true';
    }
}

let editingProductId = null;
let charts = {};
const ADMIN_PRODUCTS_COLLECTION_NAME = 'products_v2';
const LEGACY_PRODUCTS_COLLECTION_NAME = 'products';
const DELETED_PRODUCTS_COLLECTION_NAME = 'deleted_products';
const ADMIN_PRODUCT_DEBUG = true;
const REQUIRED_ADMIN_PRODUCT_IDS = [];

function adminProductDebug(label, payload) {
    if (!ADMIN_PRODUCT_DEBUG) return;
    if (payload === undefined) {
        console.log(`[admin-products] ${label}`);
        return;
    }
    console.log(`[admin-products] ${label}`, payload);
}

function summarizeProductForDebug(product) {
    if (!product) return null;
    return {
        id: product.id,
        name: getProductDisplayName(product),
        active: product.active,
        isArchived: product.isArchived,
        availability: getProductStatus(product),
        displayOrder: getProductOrder(product),
        subOffers: getProductSubOffers(product).length
    };
}

function getProductDisplayName(product) {
    if (!product) return '';
    return getLocalizedText(product.name) ||
        getLocalizedText(product.name_translations) ||
        getLocalizedText(product.title) ||
        product.id ||
        '';
}

function getLocalizedText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return String(value);
    return value.ar || value.en || value.fr || value.name || value.label || '';
}

function normalizeProductMatchText(value) {
    return getLocalizedText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getProductNameCandidates(product) {
    const candidates = [
        product?.id,
        product?.productId,
        getProductDisplayName(product),
        product?.name,
        product?.name_translations,
        product?.title
    ];

    if (product?.name && typeof product.name === 'object') {
        candidates.push(product.name.ar, product.name.en, product.name.fr);
    }
    if (product?.name_translations && typeof product.name_translations === 'object') {
        candidates.push(product.name_translations.ar, product.name_translations.en, product.name_translations.fr);
    }

    return [...new Set(candidates.map(normalizeProductMatchText).filter(Boolean))];
}

function matchesProductRecord(record, product) {
    if (!record || !product) return false;
    if (record.productId && product.id && String(record.productId) === String(product.id)) return true;

    const recordCandidates = [
        record.productName,
        record.product,
        record.name,
        record.productTitle
    ].map(normalizeProductMatchText).filter(Boolean);

    if (recordCandidates.length === 0) return false;

    const productCandidates = getProductNameCandidates(product);
    return recordCandidates.some(recordName =>
        productCandidates.some(productName =>
            recordName === productName ||
            recordName.includes(productName) ||
            productName.includes(recordName)
        )
    );
}

function getProductPriceDZD(product) {
    return Number(product?.priceDZD ?? product?.price_dzd ?? 0) || 0;
}

function getProductPriceUSD(product) {
    return Number(product?.priceUSD ?? product?.price_usd ?? 0) || 0;
}

function getProductCostDZD(product) {
    return Number(product?.costDZD ?? product?.cost_dzd ?? product?.costPrice ?? 0) || 0;
}

function getProductCostUSD(product) {
    return Number(product?.costUSD ?? product?.cost_usd ?? 0) || 0;
}

function getProductImage(product) {
    const directImage = product?.mediaUrl || product?.image || product?.thumbnail || product?.imageUrl || '';
    if (directImage) return directImage;

    const fallbackImages = {
        'trw': 'https://i.imgur.com/hEiJhso.gif',
        'chatgpt': 'https://i.imgur.com/FDZBdd9.gif',
        'claude': 'https://i.pinimg.com/1200x/e9/cc/43/e9cc4340e938f878b3b178fbf8ec9cce.jpg',
        'adobe': 'https://i.pinimg.com/1200x/ac/29/4c/ac294c4a7fb6ec4932b5b435260b53bc.jpg',
        'gamma': 'https://i.imgur.com/FDZBdd9.gif',
        'super-grok': 'https://i.pinimg.com/1200x/33/d7/e6/33d7e60098a9677bee53218fbe775b53.jpg',
        'netflix': 'https://i.pinimg.com/originals/67/9d/aa/679daac8c726277e809c6413a650c547.gif',
        'canva': 'https://i.pinimg.com/736x/71/8b/41/718b41945aab84bd2276c762266931d0.jpg',
        'capcut': 'https://i.pinimg.com/1200x/38/e3/08/38e308732b87069ed50893423f09ca4b.jpg',
        'tradingview': 'https://i.pinimg.com/736x/8c/63/a5/8c63a5c7d9d6e826b281b01dea6bd5da.jpg',
        'cursor': 'https://i.pinimg.com/736x/29/f9/48/29f9488bd27d42debcfbddb33c1c79d7.jpg',
        'scispace': 'https://i.pinimg.com/736x/06/b7/27/06b727adf3807349c0bf07bf2fd404a4.jpg',
        'duolingo': 'https://i.pinimg.com/originals/98/59/12/98591272861e66a02eecf5dae0450c73.gif',
        'lovable': 'https://i.pinimg.com/1200x/cd/d4/69/cdd469e94eb529ae307f9b5d56e8da96.jpg',
        'google-ai': 'https://i.pinimg.com/736x/c2/5b/dd/c25bdda8e7d4eb27bcb2f4d411441d92.jpg',
        'hma-vpn': 'https://i.pinimg.com/736x/8d/73/1d/8d731d64d3580276bb1d257080f4f48d.jpg',
        'alight-motion': 'https://i.pinimg.com/originals/ad/8b/2c/ad8b2cf5e7b44514ab71b9fd9666ec16.jpg',
        'perplexity': 'https://i.imgur.com/mEy5oXF.mp4',
        'microsoft-office': 'https://i.pinimg.com/736x/3c/0d/b2/3c0db24fec715f86cc3e167892f88e2f.jpg',
        'primevideo': 'https://i.pinimg.com/736x/d6/f8/99/d6f899a7367b4a55c6503d6c1e3cb6ea.jpg',
        'crunchyroll': 'https://i.pinimg.com/736x/45/f5/5e/45f55ec8cbb2cc9d48c1fb8ad62f6758.jpg'
    };

    return fallbackImages[product?.id] || '';
}

function isVideoMedia(url = '') {
    return String(url).toLowerCase().includes('.mp4');
}

function normalizeDeletedProductKey(value = '') {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getProductDeleteKeys(productOrId, fallbackName = '') {
    const values = new Set();

    if (typeof productOrId === 'object' && productOrId) {
        values.add(productOrId.id);
        values.add(productOrId.productId);
    } else {
        values.add(productOrId);
    }

    values.add(fallbackName);

    const keys = new Set();
    values.forEach((value) => {
        if (!value) return;
        const raw = String(value).trim();
        const normalized = normalizeDeletedProductKey(raw);
        if (raw) keys.add(raw);
        if (normalized) keys.add(normalized);
    });

    return keys;
}

function isProductDeleted(productOrId, deletedProductIds, fallbackName = '') {
    if (!deletedProductIds || deletedProductIds.size === 0) return false;
    return Array.from(getProductDeleteKeys(productOrId, fallbackName)).some(key => deletedProductIds.has(key));
}

async function loadDeletedProductIds() {
    if (!window.db || !window.firebaseModules) return new Set();

    try {
        const { collection, getDocs } = window.firebaseModules;
        const snapshot = await getDocs(collection(window.db, DELETED_PRODUCTS_COLLECTION_NAME));
        const deletedIds = new Set();

        snapshot.docs.forEach((docItem) => {
            const data = docItem.data ? docItem.data() : {};
            const deletedProductId = data.productId || docItem.id;
            getProductDeleteKeys(deletedProductId).forEach(key => deletedIds.add(key));
        });

        return deletedIds;
    } catch (error) {
        console.warn('Unable to load deleted products list:', error);
        return new Set();
    }
}

async function markProductAsDeleted(productId) {
    if (!productId || !window.db || !window.firebaseModules) return;

    const { doc, setDoc } = window.firebaseModules;
    const deletedKey = normalizeDeletedProductKey(productId);
    await setDoc(doc(window.db, DELETED_PRODUCTS_COLLECTION_NAME, productId), {
        productId,
        deletedKey,
        normalizedId: deletedKey,
        deletedAt: new Date(),
        preventAutoRestore: true
    }, { merge: true });

}

async function clearDeletedProductMarker(productId) {
    if (!productId || !window.db || !window.firebaseModules) return;

    try {
        const { doc, deleteDoc } = window.firebaseModules;
        await deleteDoc(doc(window.db, DELETED_PRODUCTS_COLLECTION_NAME, productId));
        const deletedKey = normalizeDeletedProductKey(productId);
        if (deletedKey && deletedKey !== productId) {
            await deleteDoc(doc(window.db, DELETED_PRODUCTS_COLLECTION_NAME, deletedKey));
        }
    } catch (error) {
        console.warn('Unable to clear deleted product marker:', error);
    }
}

function getProductOrder(product) {
    return Number(product?.displayOrder ?? product?.order ?? 0) || 0;
}

function isHomepageVisibleProduct(product) {
    return Boolean(product) && product.active !== false && product.isArchived !== true;
}

function getHomepageVisibleProducts(products = allProducts) {
    return products
        .filter(isHomepageVisibleProduct)
        .sort((a, b) => {
            const orderDiff = getProductOrder(a) - getProductOrder(b);
            if (orderDiff !== 0) return orderDiff;
            return String(a.id || '').localeCompare(String(b.id || ''));
        });
}

/**
 * Produits affichés dans le tableau admin (tous les produits gérables).
 * Ne pas réutiliser le filtre homepage ici : active:false / isArchived:true
 * doivent rester éditables dans l'admin.
 */
function getAdminTableProducts(products = allProducts) {
    return products
        .filter(product => Boolean(product))
        .sort((a, b) => {
            const orderDiff = getProductOrder(a) - getProductOrder(b);
            if (orderDiff !== 0) return orderDiff;
            return String(a.id || '').localeCompare(String(b.id || ''));
        });
}

function findProductById(productId) {
    const canonicalId = resolveCanonicalProductId(productId);
    return allProducts.find(product =>
        product.id === canonicalId ||
        product.id === productId ||
        resolveCanonicalProductId(product.id, getProductDisplayName(product)) === canonicalId
    );
}

async function ensureRequiredAdminProductsVisible(productMap, missingLocalProducts, deletedProductIds) {
    for (const canonicalId of REQUIRED_ADMIN_PRODUCT_IDS) {
        const deleteKeys = getProductDeleteKeys(canonicalId);
        const isBlocked = Array.from(deleteKeys).some(key => deletedProductIds.has(key));
        if (isBlocked) {
            adminProductDebug(`Removing deleted_products block for required product: ${canonicalId}`, Array.from(deleteKeys));
            await clearDeletedProductMarker(canonicalId);
            deleteKeys.forEach(key => deletedProductIds.delete(key));
        }

        const existing = productMap.get(canonicalId);
        if (!existing) continue;

        if (existing.active === false || existing.isArchived === true) {
            const restored = {
                ...existing,
                id: canonicalId,
                active: true,
                isArchived: false,
                availability: getProductStatus(existing) === 'unavailable'
                    ? existing.availability || 'unavailable'
                    : (existing.availability || existing.status || 'available')
            };
            productMap.set(canonicalId, restored);
            if (!missingLocalProducts.some(product => product.id === canonicalId)) {
                missingLocalProducts.push(restored);
            }
            adminProductDebug(`Restored hidden required product for admin + Firebase`, summarizeProductForDebug(restored));
        }
    }
}

function getProductSubOffers(product) {
    if (Array.isArray(product?.subOffers) && product.subOffers.length > 0) {
        return product.subOffers;
    }
    return normalizeDurationsToSubOffers(product?.durations);
}

function productHasMissingCatalogDetails(product) {
    if (product?.source === 'firebase') return false;
    return !getProductDisplayName(product) ||
        getProductPriceDZD(product) <= 0 ||
        getProductPriceUSD(product) <= 0 ||
        !getProductImage(product);
}

function mergeProductCatalogDetails(baseProduct, catalogProduct) {
    if (!baseProduct) return catalogProduct;
    if (!catalogProduct) return baseProduct;

    const baseIsFirebase = baseProduct.source === 'firebase';
    const merged = { ...catalogProduct, ...baseProduct };
    const baseName = getProductDisplayName(baseProduct);
    const catalogName = getProductDisplayName(catalogProduct);
    const baseNameLooksLikeId = baseName &&
        String(baseName).toLowerCase() === String(baseProduct.id || '').toLowerCase();

    merged.name = (!baseName || baseNameLooksLikeId) ? catalogProduct.name : baseProduct.name;
    merged.description = baseProduct.description || catalogProduct.description;
    merged.mediaUrl = baseProduct.mediaUrl || baseProduct.image || catalogProduct.mediaUrl || catalogProduct.image || '';
    merged.image = baseProduct.image || baseProduct.mediaUrl || catalogProduct.image || catalogProduct.mediaUrl || '';
    merged.category = baseProduct.category || catalogProduct.category || 'other';
    merged.priceDZD = getProductPriceDZD(baseProduct) || getProductPriceDZD(catalogProduct);
    merged.priceUSD = getProductPriceUSD(baseProduct) || getProductPriceUSD(catalogProduct);
    merged.price_dzd = merged.priceDZD;
    merged.price_usd = merged.priceUSD;

    if (baseIsFirebase) {
        merged.subOffers = getProductSubOffers(baseProduct);
        merged.durations = baseProduct.durations || {};
        if (Number.isFinite(baseProduct.displayOrder)) {
            merged.displayOrder = baseProduct.displayOrder;
            merged.order = baseProduct.displayOrder;
        }
    } else {
        merged.durations = baseProduct.durations || catalogProduct.durations || {};
        merged.subOffers = getProductSubOffers(baseProduct).length > 0
            ? getProductSubOffers(baseProduct)
            : getProductSubOffers(catalogProduct);
    }
    merged.active = baseProduct.active !== false;
    merged.source = baseProduct.source || catalogProduct.source || 'merged';

    return merged;
}

function normalizeProductIdSlug(value = '') {
    if (window.ProductIdUtils?.normalizeProductIdSlug) {
        return window.ProductIdUtils.normalizeProductIdSlug(value);
    }
    return String(value || '')
        .toLowerCase()
        .replace(/^product-/, '')
        .replace(/-card$/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function resolveCanonicalProductId(rawId = '', fallbackName = '') {
    if (window.ProductIdUtils?.resolveCanonicalProductId) {
        return window.ProductIdUtils.resolveCanonicalProductId(rawId, fallbackName);
    }
    return normalizeProductIdSlug(rawId) || normalizeProductIdSlug(fallbackName);
}

function buildProductFromLocalCatalog(catalogKey, catalogProduct) {
    const catalogEntry = catalogProduct || {};
    const catalogName = typeof catalogEntry.name === 'string'
        ? { ar: catalogEntry.name, en: catalogEntry.name, fr: catalogEntry.name }
        : (catalogEntry.name || { ar: catalogKey, en: catalogKey, fr: catalogKey });

    return {
        id: catalogKey,
        ...catalogEntry,
        name: catalogName,
        description: catalogEntry.description || { ar: '', en: '', fr: '' },
        mediaUrl: catalogEntry.mediaUrl || catalogEntry.image || '',
        image: catalogEntry.mediaUrl || catalogEntry.image || '',
        priceDZD: getProductPriceDZD(catalogEntry),
        priceUSD: getProductPriceUSD(catalogEntry),
        price_dzd: getProductPriceDZD(catalogEntry),
        price_usd: getProductPriceUSD(catalogEntry),
        durations: catalogEntry.durations || {},
        subOffers: getProductSubOffers(catalogEntry).length > 0
            ? getProductSubOffers(catalogEntry)
            : normalizeDurationsToSubOffers(catalogEntry.durations || {}),
        displayOrder: Number(catalogEntry.displayOrder ?? catalogEntry.order ?? 9999),
        order: Number(catalogEntry.displayOrder ?? catalogEntry.order ?? 9999),
        availability: catalogEntry.availability ||
            (catalogEntry.available === false ? 'unavailable' : 'available'),
        active: catalogEntry.active !== false,
        isArchived: catalogEntry.isArchived === true,
        source: 'local-catalog'
    };
}

function getHomepageProductId(card, fallbackName = '') {
    const rawId = card.dataset.productId || card.id || fallbackName;
    return resolveCanonicalProductId(rawId, fallbackName);
}

function extractBackgroundImageUrl(styleValue = '') {
    const match = String(styleValue).match(/url\(["']?([^"')]+)["']?\)/i);
    return match ? match[1] : '';
}

async function discoverHomepageProducts() {
    try {
        const response = await fetch('index.html', { cache: 'no-store' });
        if (!response.ok) return [];

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return Array.from(doc.querySelectorAll('.product-grid .product-card')).map((card, index) => {
            const title = card.querySelector('h3')?.textContent?.trim() || '';
            const id = getHomepageProductId(card, title);
            if (!id || !title) return null;

            const firstPrice = card.querySelector('.price-tag');
            const mediaNode = card.querySelector('.product-image');
            const videoNode = card.querySelector('video source');
            const mediaUrl = videoNode?.getAttribute('src') ||
                extractBackgroundImageUrl(mediaNode?.getAttribute('style')) ||
                '';
            const durationButtons = Array.from(card.querySelectorAll('[data-duration], [data-type], [data-plan], [data-offer]'));
            const durations = {};

            durationButtons.forEach((button) => {
                const durationId = button.dataset.duration || button.dataset.type || button.dataset.plan || button.dataset.offer;
                if (!durationId) return;
                const priceDZD = Number(button.dataset.priceDzd || button.dataset.price || 0);
                const priceUSD = Number(button.dataset.priceUsd || 0);
                durations[durationId] = {
                    dzd: priceDZD,
                    usd: priceUSD,
                    available: !button.disabled
                };
            });

            return {
                id,
                name: { ar: title, en: title, fr: title },
                description: {
                    ar: card.querySelector('.description')?.textContent?.trim() || '',
                    en: '',
                    fr: ''
                },
                category: card.dataset.category || 'other',
                mediaUrl,
                mediaType: mediaUrl.includes('.mp4') ? 'video' : 'image',
                priceDZD: Number(firstPrice?.dataset.priceDzd || firstPrice?.textContent?.replace(/[^\d.]/g, '') || 0),
                priceUSD: Number(firstPrice?.dataset.priceUsd || 0),
                durations,
                subOffers: normalizeDurationsToSubOffers(durations),
                displayOrder: index,
                order: index,
                active: true,
                isArchived: false,
                source: 'homepage'
            };
        }).filter(Boolean);
    } catch (error) {
        console.warn('Unable to discover homepage products:', error);
        return [];
    }
}

function generateProductIdFromName(name) {
    const baseName = typeof name === 'object'
        ? (name.en || name.ar || name.fr || '')
        : String(name || '');
    const slug = baseName
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '');

    return slug || `product-${Date.now()}`;
}

function normalizeDurationsToSubOffers(durations = {}) {
    if (!durations || typeof durations !== 'object') return [];

    const durationLabels = {
        pro: { ar: 'Claude Pro', en: 'Claude Pro', fr: 'Claude Pro' },
        api: { ar: 'Claude Code API', en: 'Claude Code API', fr: 'Claude Code API' },
        '7days': { ar: '7 أيام', en: '7 Days', fr: '7 jours' },
        '1month': { ar: 'شهر واحد', en: '1 Month', fr: '1 mois' },
        '1month-upgrade': { ar: 'ترقية حساب', en: 'Account Upgrade', fr: 'Mise à niveau' },
        '3months': { ar: '3 أشهر', en: '3 Months', fr: '3 mois' },
        '6months': { ar: '6 أشهر', en: '6 Months', fr: '6 mois' },
        '1year': { ar: 'سنة كاملة', en: '1 Year', fr: '1 an' },
        '2years': { ar: 'سنتان', en: '2 Years', fr: '2 ans' },
        standard: { ar: 'عرض قياسي', en: 'Standard', fr: 'Standard' }
    };

    return Object.entries(durations).map(([id, prices]) => ({
        id,
        name: durationLabels[id] || { ar: id, en: id, fr: id },
        priceDZD: Number(prices?.dzd ?? prices?.priceDZD ?? 0) || 0,
        priceUSD: Number(prices?.usd ?? prices?.priceUSD ?? 0) || 0,
        availability: prices?.available === false ? 'unavailable' : 'available'
    }));
}

function normalizeAdminProductForV2(productData, existingProduct = null) {
    const nameTranslations = productData.name_translations ||
        (typeof productData.name === 'object' ? productData.name : { ar: productData.name || '', en: '', fr: '' });
    const description = typeof productData.description === 'object'
        ? productData.description
        : { ar: productData.description || '', en: '', fr: '' };
    const availability = productData.availability || productData.status ||
        (productData.available === false ? 'unavailable' : 'available');

    return {
        ...productData,
        id: productData.id || existingProduct?.id || generateProductIdFromName(nameTranslations),
        name: {
            ar: nameTranslations.ar || getProductDisplayName(existingProduct) || productData.id,
            en: nameTranslations.en || '',
            fr: nameTranslations.fr || ''
        },
        description,
        mediaUrl: productData.mediaUrl || productData.image || '',
        mediaType: productData.mediaType || 'image',
        priceDZD: getProductPriceDZD(productData),
        priceUSD: getProductPriceUSD(productData),
        availability,
        available: availability === 'available',
        status: availability,
        displayOrder: getProductOrder(productData),
        order: getProductOrder(productData),
        subOffers: Array.isArray(productData.subOffers) && productData.subOffers.length > 0
            ? productData.subOffers
            : normalizeDurationsToSubOffers(productData.durations),
        landingPage: productData.landingPage || existingProduct?.landingPage || '',
        isArchived: Boolean(productData.isArchived),
        active: productData.active !== false,
        updatedAt: new Date(),
        createdAt: existingProduct?.createdAt || productData.createdAt || new Date()
    };
}

/**
 * تحميل المنتجات من Firebase أو currency-config.js
 */
async function loadProducts() {
    console.log('🔄 جاري تحميل المنتجات...');
    adminProductDebug('loadProducts() started');
    try {
        const productMap = new Map();
        let productsFromFirebase = false;
        const missingLocalProducts = [];
        const skippedDeleted = [];
        const skippedFilters = [];
        const firestoreRaw = [];
        const deletedProductIds = await loadDeletedProductIds();

        adminProductDebug('deleted_products keys', Array.from(deletedProductIds));

        // 1. التحميل من Firebase
        if (window.db && window.firebaseModules) {
            try {
                const { collection, getDocs } = window.firebaseModules;
                const querySnapshot = await getDocs(collection(window.db, ADMIN_PRODUCTS_COLLECTION_NAME));

                querySnapshot.forEach((docItem) => {
                    const data = docItem.data();
                    const canonicalId = resolveCanonicalProductId(
                        docItem.id,
                        getProductDisplayName({ id: docItem.id, ...data })
                    );

                    firestoreRaw.push({
                        docId: docItem.id,
                        canonicalId,
                        ...summarizeProductForDebug({ id: canonicalId, ...data })
                    });

                    if (isProductDeleted({ id: docItem.id, ...data }, deletedProductIds)) {
                        skippedDeleted.push({ stage: 'firestore', docId: docItem.id, canonicalId });
                        return;
                    }
                    if (isProductDeleted({ id: canonicalId, ...data }, deletedProductIds)) {
                        skippedDeleted.push({ stage: 'firestore-canonical', docId: docItem.id, canonicalId });
                        return;
                    }

                    const firebaseProduct = {
                        id: canonicalId,
                        ...data,
                        source: 'firebase',
                        legacyDocId: docItem.id !== canonicalId ? docItem.id : undefined
                    };

                    if (productMap.has(canonicalId)) {
                        productMap.set(
                            canonicalId,
                            mergeProductCatalogDetails(productMap.get(canonicalId), firebaseProduct)
                        );
                    } else {
                        productMap.set(canonicalId, firebaseProduct);
                    }
                });

                adminProductDebug('Firestore products_v2 loaded', firestoreRaw);
                adminProductDebug('Firestore capcut entries', firestoreRaw.filter(item =>
                    /capcut/i.test(item.docId) || /capcut/i.test(item.canonicalId) || /capcut/i.test(item.name || '')
                ));
                adminProductDebug('Firestore lovable entries', firestoreRaw.filter(item =>
                    /lovable/i.test(item.docId) || /lovable/i.test(item.canonicalId) || /lovable/i.test(item.name || '')
                ));

                if (productMap.size > 0) {
                    productsFromFirebase = true;
                    console.log(`✅ تم تحميل ${productMap.size} منتج من Firebase`);
                }
            } catch (fbError) {
                console.warn('⚠️ تعذر التحميل من Firebase، سيتم استخدام البيانات المحلية:', fbError);
                adminProductDebug('Firestore load failed', fbError);
            }
        }

        // 2. Toujours aligner l'admin et Firebase sur le catalogue local + l'accueil.
        // Les produits visibles sur la page d'accueil doivent aussi être administrables.
        if (typeof PRODUCTS !== 'undefined' && PRODUCTS) {
            const catalogKeys = Object.keys(PRODUCTS);
            adminProductDebug('currency-config PRODUCTS keys', catalogKeys);
            adminProductDebug('currency-config capcut', summarizeProductForDebug(buildProductFromLocalCatalog('capcut', PRODUCTS.capcut)));
            adminProductDebug('currency-config lovable', summarizeProductForDebug(buildProductFromLocalCatalog('lovable', PRODUCTS.lovable)));

            catalogKeys.forEach(key => {
                if (isProductDeleted({ id: key, ...PRODUCTS[key] }, deletedProductIds)) {
                    skippedDeleted.push({ stage: 'catalog', id: key });
                    return;
                }

                const canonicalKey = resolveCanonicalProductId(key);
                const localProduct = buildProductFromLocalCatalog(canonicalKey, {
                    ...PRODUCTS[key],
                    id: canonicalKey
                });

                if (!productMap.has(canonicalKey)) {
                    // المنتج غير موجود في Firebase - لا نضيفه تلقائياً
                    // يجب إضافة المنتجات يدوياً من الأدمن فقط
                    adminProductDebug('Catalog product missing from Firebase, skipped (no auto-sync):', canonicalKey);
                    return;
                }

                const existingProduct = productMap.get(canonicalKey);
                const mergedProduct = mergeProductCatalogDetails(existingProduct, localProduct);
                if (REQUIRED_ADMIN_PRODUCT_IDS.includes(canonicalKey)) {
                    mergedProduct.active = true;
                    mergedProduct.isArchived = false;
                    if (!mergedProduct.category) {
                        mergedProduct.category = localProduct.category || (canonicalKey === 'capcut' ? 'design' : 'ai');
                    }
                }
                productMap.set(canonicalKey, mergedProduct);

                if (productHasMissingCatalogDetails(existingProduct)) {
                    missingLocalProducts.push(mergedProduct);
                    console.log('Enriched Firebase product from local catalog:', canonicalKey);
                }
            });
        }

        const homepageProducts = await discoverHomepageProducts();
        homepageProducts.forEach((homepageProduct) => {
            if (isProductDeleted(homepageProduct, deletedProductIds)) return;

            const canonicalId = resolveCanonicalProductId(
                homepageProduct.id,
                getProductDisplayName(homepageProduct)
            );
            const normalizedHomepage = {
                ...homepageProduct,
                id: canonicalId,
                subOffers: getProductSubOffers(homepageProduct).length > 0
                    ? getProductSubOffers(homepageProduct)
                    : normalizeDurationsToSubOffers(homepageProduct.durations || {})
            };

            if (!productMap.has(canonicalId)) {
                // المنتج موجود في الصفحة لكن ليس في Firebase - لا نضيفه تلقائياً
                adminProductDebug('Homepage product missing from Firebase, skipped (no auto-sync):', canonicalId);
                return;
            }

            const existingProduct = productMap.get(canonicalId);
            const mergedProduct = mergeProductCatalogDetails(existingProduct, normalizedHomepage);
            productMap.set(canonicalId, mergedProduct);
            if (productHasMissingCatalogDetails(existingProduct)) {
                missingLocalProducts.push(mergedProduct);
                console.log('Enriched Firebase product from homepage card:', canonicalId);
            }
        });

        await ensureRequiredAdminProductsVisible(productMap, missingLocalProducts, deletedProductIds);

        // تحويل الخريطة إلى مصفوفة
        allProducts = Array.from(productMap.values());

        // 3. ترتيب المنتجات
        allProducts.sort((a, b) => getProductOrder(a) - getProductOrder(b));

        const homepageVisible = getHomepageVisibleProducts();
        const adminVisible = getAdminTableProducts();
        const hiddenFromHomepage = allProducts.filter(product => !isHomepageVisibleProduct(product));

        adminProductDebug('Merged allProducts', allProducts.map(summarizeProductForDebug));
        adminProductDebug('Skipped because deleted_products', skippedDeleted);
        adminProductDebug('Hidden from homepage filter (active:false or isArchived:true)', hiddenFromHomepage.map(summarizeProductForDebug));
        adminProductDebug('CapCut in allProducts', summarizeProductForDebug(allProducts.find(product => product.id === 'capcut')));
        adminProductDebug('Lovable in allProducts', summarizeProductForDebug(allProducts.find(product => product.id === 'lovable')));
        adminProductDebug('Counts', {
            allProducts: allProducts.length,
            homepageVisible: homepageVisible.length,
            adminTable: adminVisible.length,
            queuedForSync: missingLocalProducts.length
        });

        console.log(`📊 إجمالي المنتجات الجاهزة: ${allProducts.length}`);

        // مزامنة المنتجات المحلية إلى Firebase معطلة - الأدمن هو المصدر الوحيد للمنتجات
        // لمنع إعادة ظهور المنتجات المحذوفة تلقائياً
        // if (window.db && window.firebaseModules && missingLocalProducts.length > 0) {
        //     await syncProductsToFirebase(missingLocalProducts);
        // }

        // تحديث الجدول المعروض après sync
        if (typeof displayProductsTable === 'function') {
            displayProductsTable();
        }

    } catch (error) {
        console.error('❌ خطأ فادح في loadProducts:', error);
        adminProductDebug('loadProducts() failed', error);
        showToast('خطأ في تحميل المنتجات', 'error');
    }
}

/**
 * دالة مساعدة لمزامنة المنتجات إلى Firebase
 */
async function syncProductsToFirebase(productsToSync = allProducts) {
    if (!window.db || !window.firebaseModules) return;

    console.log('📤 جاري مزامنة المنتجات مع السحابة...');
    try {
        const { setDoc, doc } = window.firebaseModules;
        const deletedProductIds = await loadDeletedProductIds();

        const syncedIds = new Set();
        for (const product of productsToSync) {
            if (isProductDeleted(product, deletedProductIds)) continue;
            if (product.source === 'firebase' || product.source === 'merged') continue;

            const canonicalId = resolveCanonicalProductId(product.id, getProductDisplayName(product));
            if (syncedIds.has(canonicalId)) continue;
            syncedIds.add(canonicalId);

            const productForV2 = normalizeAdminProductForV2({
                ...product,
                id: canonicalId,
                priceDZD: getProductPriceDZD(product),
                priceUSD: getProductPriceUSD(product),
                displayOrder: getProductOrder(product),
                availability: getProductStatus(product),
                active: REQUIRED_ADMIN_PRODUCT_IDS.includes(canonicalId) ? true : product.active !== false,
                isArchived: REQUIRED_ADMIN_PRODUCT_IDS.includes(canonicalId) ? false : Boolean(product.isArchived)
            }, product);

            await setDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, canonicalId), productForV2, { merge: true });
            await setDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, canonicalId), {
                id: canonicalId,
                name: getProductDisplayName(productForV2),
                price_dzd: productForV2.priceDZD,
                price_usd: productForV2.priceUSD,
                priceDZD: productForV2.priceDZD,
                priceUSD: productForV2.priceUSD,
                availability: productForV2.availability,
                status: productForV2.availability,
                available: productForV2.availability === 'available',
                durations: product.durations || {},
                description: product.description || {},
                paymentMethods: product.paymentMethods || {},
                active: product.active !== false,
                updatedAt: new Date()
            }, { merge: true });
        }
        console.log('✅ تم الانتهاء من المزامنة');
    } catch (error) {
        console.error('❌ فشل المزامنة:', error);
    }
}

/**
 * عرض جدول المنتجات
 */
function displayProductsTable(products = getAdminTableProducts()) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) {
        console.warn('products-table-body not found');
        return;
    }

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8 text-gray-400">لا توجد منتجات</td></tr>';
        adminProductDebug('displayProductsTable() rendered 0 rows');
        return;
    }

    // تحديث الإحصائيات
    updateProductStats();

    const sortedProducts = getAdminTableProducts(products);
    const homepageOnlyHidden = allProducts.filter(product =>
        !isHomepageVisibleProduct(product) &&
        sortedProducts.some(visible => visible.id === product.id)
    );

    adminProductDebug('displayProductsTable() input products', products.map(summarizeProductForDebug));
    adminProductDebug('displayProductsTable() rows rendered', sortedProducts.map(summarizeProductForDebug));
    adminProductDebug('Previously hidden by homepage filter but now shown in admin', homepageOnlyHidden.map(summarizeProductForDebug));
    adminProductDebug('CapCut rendered in admin table', sortedProducts.some(product => product.id === 'capcut'));
    adminProductDebug('Lovable rendered in admin table', sortedProducts.some(product => product.id === 'lovable'));

    console.log('عرض المنتجات:', sortedProducts.length);
    tbody.innerHTML = sortedProducts.map((product, index) => {
        const categoryLabels = {
            subscriptions: 'Subscriptions',
            accounts: 'Accounts',
            tools: 'Tools',
            courses: 'Courses',
            other: 'Other'
        };
        const productName = getProductDisplayName(product);
        const productImage = getProductImage(product);
        const priceDZD = getProductPriceDZD(product);
        const priceUSD = getProductPriceUSD(product);
        const subOffers = getProductSubOffers(product);
        const availableSubOffers = subOffers.filter(offer => (offer.availability || 'available') === 'available').length;

        const salesCount = allOrders.filter(o =>
            o.productName === productName &&
            (o.status === 'delivered' || o.status === 'confirmed')
        ).length;

        return `
        <tr class="border-t border-gray-700 hover:bg-gray-700/50 transition-colors product-row" 
            draggable="true" 
            data-product-id="${product.id}"
            data-order="${getProductOrder(product) || index}">
            <!-- Drag Handle -->
            <td class="px-2 py-4 cursor-move text-gray-500 drag-handle">
                <span class="text-lg">⬍</span>
            </td>
            <!-- Image -->
            <td class="px-4 py-4">
                <div class="admin-product-thumb w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                    ${productImage ?
                (isVideoMedia(productImage) ?
                    `<video src="${escapeHtml(productImage)}" muted playsinline preload="metadata" class="w-full h-full object-cover"></video>` :
                    `<img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}" class="w-full h-full object-cover" onerror="this.parentElement.classList.add('image-error'); this.parentElement.innerHTML='<span>بدون صورة</span>'">`) :
                '<span class="text-2xl">📦</span>'
            }
                </div>
            </td>
            <!-- Product Info -->
            <td class="px-4 py-4">
                <div class="font-bold">${escapeHtml(productName || product.id)}</div>
                <div class="text-gray-400 text-xs">${escapeHtml(product.id)}</div>
                ${product.active === false || product.isArchived === true ? '<span class="text-orange-400 text-xs">مخفي من الصفحة الرئيسية</span>' : ''}
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
                    <input type="number" min="0" step="1" value="${priceDZD}" onchange="updateProductPrice('${product.id}', 'DZD', this.value)" class="w-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm font-bold" style="color: var(--accent);">
                    <input type="number" min="0" step="0.01" value="${priceUSD}" onchange="updateProductPrice('${product.id}', 'USD', this.value)" class="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300">
                </div>
            </td>
            <!-- Sub Offers -->
            <td class="px-4 py-4">
                <button onclick="manageProductOffers('${product.id}')"
                    class="admin-offers-chip ${subOffers.length ? 'has-offers' : ''}">
                    <span class="admin-offers-count">${subOffers.length}</span>
                    <span>عروض فرعية</span>
                    ${subOffers.length ? `<small>${availableSubOffers} متوفر</small>` : '<small>أضف الآن</small>'}
                </button>
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
                    class="px-3 py-2 rounded-lg text-sm font-bold transition-all ${getProductStatus(product) === 'available' ? 'bg-green-600 hover:bg-green-700 text-white' :
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
                    class="w-12 h-6 rounded-full transition-all relative ${product.active !== false ? 'bg-purple-600' : 'bg-gray-600'
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

function manageProductOffers(productId) {
    openProductModal(productId);
    setTimeout(() => {
        const section = document.getElementById('product-suboffers-section');
        section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        section?.classList.add('admin-section-pulse');
        setTimeout(() => section?.classList.remove('admin-section-pulse'), 1400);
    }, 150);
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

async function updateProductPrice(productId, currency, rawValue) {
    const product = findProductById(productId);
    if (!product) return;

    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
        showToast('السعر غير صالح', 'error');
        displayProductsTable();
        return;
    }

    if (currency === 'DZD') {
        product.priceDZD = value;
        product.price_dzd = value;
    } else {
        product.priceUSD = value;
        product.price_usd = value;
    }

    try {
        const { setDoc, doc } = window.firebaseModules;
        const updatePayload = {
            priceDZD: getProductPriceDZD(product),
            priceUSD: getProductPriceUSD(product),
            price_dzd: getProductPriceDZD(product),
            price_usd: getProductPriceUSD(product),
            updatedAt: new Date()
        };
        await setDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, productId), updatePayload, { merge: true });
        await setDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, productId), updatePayload, { merge: true });
        showToast('تم تحديث السعر بنجاح ✅');
    } catch (error) {
        console.error('خطأ في تحديث السعر:', error);
        showToast('خطأ في تحديث السعر', 'error');
    }
}

/**
 * تبديل حالة التوفر بين ثلاث حالات: متوفر، غير متوفر، قريباً
 */
async function toggleAvailability(productId) {
    const product = findProductById(productId);
    if (!product) return;

    // التنقل بين الحالات الثلاث: available -> unavailable -> coming_soon -> available
    let newStatus;
    const currentStatus = getProductStatus(product);

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
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, productId), {
            availability: newStatus,
            status: newStatus,
            available: newStatus === 'available',
            updatedAt: new Date()
        }, { merge: true });
        await setDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, productId), {
            availability: newStatus,
            status: newStatus,
            available: newStatus === 'available',
            updatedAt: new Date()
        }, { merge: true });

        product.availability = newStatus;
        product.status = newStatus;
        product.available = newStatus === 'available';
        displayProductsTable();
        showToast(statusMessages[newStatus]);
        logActivity('product', 'status_changed', `${getProductDisplayName(product)}: ${newStatus}`);
    } catch (error) {
        console.error('خطأ في تغيير حالة التوفر:', error);
        showToast('خطأ في تغيير حالة التوفر', 'error');
    }
}

/**
 * الحصول على حالة المنتج (للتوافق مع الكود القديم والجديد)
 */
function getProductStatus(product) {
    if (product.availability) return product.availability;
    if (product.status) return product.status;
    return product.available === false ? 'unavailable' : 'available';
}

/**
 * تبديل حالة النشاط
 */
async function toggleActive(productId) {
    const product = findProductById(productId);
    if (!product) return;

    const newActive = product.active === false ? true : false;

    try {
        const { setDoc, doc } = window.firebaseModules;
        await setDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, productId), {
            active: newActive,
            isArchived: !newActive,
            updatedAt: new Date()
        }, { merge: true });
        await setDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, productId), {
            active: newActive,
            updatedAt: new Date()
        }, { merge: true });

        product.active = newActive;
        displayProductsTable();
        showToast(newActive ? '👁️ المنتج الآن مرئي' : '🙈 المنتج الآن مخفي');
        logActivity('product', 'active_changed', `${getProductDisplayName(product)}: ${newActive ? 'نشط' : 'غير نشط'}`);
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
        document.getElementById('product-name').value = getProductDisplayName(product) + ' (نسخة)';
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
    const product = findProductById(productId);
    if (!product) return;

    const modal = document.getElementById('product-preview-modal');
    const content = document.getElementById('product-preview-content');

    const productName = getProductDisplayName(product);
    const productImage = getProductImage(product);
    const priceDZD = getProductPriceDZD(product);
    const priceUSD = getProductPriceUSD(product);
    const features = Array.isArray(product.features)
        ? product.features.map(f => f.text?.ar || f.text || f).filter(Boolean)
        : (product.features ? String(product.features).split('\n').filter(f => f.trim()) : []);

    content.innerHTML = `
        <div class="text-center mb-4">
            ${productImage ?
            `<img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}" class="w-32 h-32 object-cover rounded-xl mx-auto" onerror="this.src='https://via.placeholder.com/128?text=📦'">` :
            '<div class="w-32 h-32 bg-gray-700 rounded-xl mx-auto flex items-center justify-center text-5xl">📦</div>'
        }
        </div>
        <h4 class="text-xl font-bold text-center">${escapeHtml(productName)}</h4>
        ${product.featured ? '<div class="text-center text-yellow-400">⭐ منتج مميز</div>' : ''}
        
        <div class="flex justify-center gap-4 my-4">
            <div class="text-center">
                ${product.old_price_dzd ? `<div class="text-gray-500 line-through text-sm">${product.old_price_dzd} د.ج</div>` : ''}
                <div class="text-2xl font-bold" style="color: var(--accent);">${priceDZD} د.ج</div>
            </div>
            <div class="text-center">
                ${product.old_price_usd ? `<div class="text-gray-500 line-through text-sm">$${product.old_price_usd}</div>` : ''}
                <div class="text-2xl font-bold text-green-400">$${priceUSD}</div>
            </div>
        </div>
        
        <div class="flex justify-center gap-2 mb-4">
            <span class="px-3 py-1 rounded-full text-sm ${getProductStatus(product) === 'available' ? 'bg-green-600' :
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

    let filtered = getAdminTableProducts();

    // فلترة حسب البحث
    if (searchTerm) {
        filtered = filtered.filter(p =>
            (getProductDisplayName(p).toLowerCase().includes(searchTerm)) ||
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
        const { setDoc, doc } = window.firebaseModules;

        for (let i = 0; i < rows.length; i++) {
            const productId = rows[i].dataset.productId;
            const product = findProductById(productId);
            if (!product) continue;

            const canonicalId = resolveCanonicalProductId(product.id, getProductDisplayName(product));
            const sortOrder = Number(i);

            product.order = sortOrder;
            product.displayOrder = sortOrder;

            const orderPayload = {
                id: canonicalId,
                order: sortOrder,
                displayOrder: sortOrder,
                updatedAt: new Date()
            };

            await setDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, canonicalId), orderPayload, { merge: true });
            await setDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, canonicalId), orderPayload, { merge: true });
            adminProductDebug(`Saved drag order for ${canonicalId}`, orderPayload);
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
 * تستخدم الواجهة المحسنة من admin-product-ui.js
 */
function openProductModal(productId = null) {
    editingProductId = productId;
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');

    // Use enhanced UI if available
    if (typeof window.openProductModalV2 === 'function') {
        window.openProductModalV2(productId);
        return;
    }

    // Fallback to legacy behavior
    if (productId) {
        title.textContent = '✏️ تعديل المنتج';
        const product = findProductById(productId);
        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-id').disabled = true;

            // Handle multilingual names
            const nameAr = document.getElementById('product-name-ar');
            const nameEn = document.getElementById('product-name-en');
            const nameFr = document.getElementById('product-name-fr');
            const nameLegacy = document.getElementById('product-name');

            if (nameAr && typeof product.name === 'object') {
                nameAr.value = product.name.ar || '';
                if (nameEn) nameEn.value = product.name.en || '';
                if (nameFr) nameFr.value = product.name.fr || '';
            } else if (nameLegacy) {
                nameLegacy.value = product.name || '';
            }

            document.getElementById('product-category').value = product.category || 'other';
            document.getElementById('product-price-dzd').value = product.price_dzd || product.priceDZD || 0;
            document.getElementById('product-price-usd').value = product.price_usd || product.priceUSD || 0;

            const oldPriceDzd = document.getElementById('product-old-price-dzd');
            const oldPriceUsd = document.getElementById('product-old-price-usd');
            if (oldPriceDzd) oldPriceDzd.value = product.old_price_dzd || '';
            if (oldPriceUsd) oldPriceUsd.value = product.old_price_usd || '';

            const costDzd = document.getElementById('product-cost-dzd');
            const costUsd = document.getElementById('product-cost-usd');
            const supplier = document.getElementById('product-supplier');
            if (costDzd) costDzd.value = product.cost_dzd || '';
            if (costUsd) costUsd.value = product.cost_usd || '';
            if (supplier) supplier.value = product.supplier || '';

            const stock = document.getElementById('product-stock');
            if (stock) stock.value = product.stock !== undefined ? product.stock : '';

            // Handle media URL
            const mediaUrl = document.getElementById('product-media-url');
            const imageLegacy = document.getElementById('product-image');
            if (mediaUrl) mediaUrl.value = product.mediaUrl || product.image || '';
            if (imageLegacy) imageLegacy.value = product.mediaUrl || product.image || '';

            const features = document.getElementById('product-features');
            if (features) features.value = product.features || '';

            const whatsappMsg = document.getElementById('product-whatsapp-msg');
            if (whatsappMsg) whatsappMsg.value = product.whatsappMsg || product.whatsapp_msg || '';

            const descAr = document.getElementById('product-desc-ar');
            const descEn = document.getElementById('product-desc-en');
            const descFr = document.getElementById('product-desc-fr');
            if (descAr) descAr.value = product.description?.ar || '';
            if (descEn) descEn.value = product.description?.en || '';
            if (descFr) descFr.value = product.description?.fr || '';

            // Handle availability status
            const availability = product.availability || product.status ||
                (product.available === false ? 'unavailable' : 'available');
            const availabilityRadio = document.querySelector(`input[name="product-availability"][value="${availability}"]`);
            if (availabilityRadio) availabilityRadio.checked = true;

            const productActive = document.getElementById('product-active');
            const productFeatured = document.getElementById('product-featured');
            if (productActive) productActive.checked = product.active !== false;
            if (productFeatured) productFeatured.checked = product.featured || false;

            // تحديث معاينة الصورة
            if (typeof previewProductMedia === 'function') {
                previewProductMedia();
            } else {
                updateImagePreview();
            }
        }
    } else {
        title.textContent = '➕ إضافة منتج جديد';
        form.reset();
        const productId = document.getElementById('product-id');
        if (productId) productId.disabled = false;

        const productActive = document.getElementById('product-active');
        if (productActive) productActive.checked = true;

        const availableRadio = document.querySelector('input[name="product-availability"][value="available"]');
        if (availableRadio) availableRadio.checked = true;

        const imagePreview = document.getElementById('product-image-preview');
        const mediaPreview = document.getElementById('product-media-preview');
        if (imagePreview) imagePreview.innerHTML = '<span class="text-gray-400 text-xs">معاينة</span>';
        if (mediaPreview) mediaPreview.innerHTML = '<span class="text-gray-400">معاينة الوسائط</span>';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * إغلاق نافذة المنتج
 */
function closeProductModal() {
    // Use enhanced UI if available
    if (typeof window.closeProductModalV2 === 'function') {
        window.closeProductModalV2();
        return;
    }

    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    editingProductId = null;
    const form = document.getElementById('product-form');
    if (form) form.reset();

    const imagePreview = document.getElementById('product-image-preview');
    const mediaPreview = document.getElementById('product-media-preview');
    if (imagePreview) imagePreview.innerHTML = '<span class="text-gray-400 text-xs">معاينة</span>';
    if (mediaPreview) mediaPreview.innerHTML = '<span class="text-gray-400">معاينة الوسائط</span>';
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

    // Use enhanced form data collection if available
    let productData;
    if (typeof window.collectProductFormData === 'function') {
        productData = window.collectProductFormData();

        // Validate using enhanced validation
        if (typeof window.validateProductFormData === 'function') {
            const validation = window.validateProductFormData(productData);
            if (!validation.valid) {
                showToast(validation.errors.join('\n'), 'error');
                return;
            }
        }

        // Convert to legacy format for backward compatibility
        productData = {
            id: productData.id || document.getElementById('product-id')?.value,
            name: productData.name?.ar || productData.name,
            name_translations: productData.name,
            category: productData.category,
            price_dzd: productData.priceDZD,
            price_usd: productData.priceUSD,
            priceDZD: productData.priceDZD,
            priceUSD: productData.priceUSD,
            old_price_dzd: productData.old_price_dzd,
            old_price_usd: productData.old_price_usd,
            cost_dzd: productData.cost_dzd,
            cost_usd: productData.cost_usd,
            supplier: productData.supplier,
            stock: productData.stock,
            image: productData.mediaUrl,
            mediaUrl: productData.mediaUrl,
            mediaType: productData.mediaType,
            features: productData.features,
            paymentMethods: productData.paymentMethods,
            subOffers: productData.subOffers,
            whatsappMsg: productData.whatsapp_msg,
            whatsapp_msg: productData.whatsapp_msg,
            description: productData.description,
            availability: productData.availability,
            available: productData.availability === 'available',
            status: productData.availability,
            active: productData.active,
            featured: productData.featured,
            isArchived: productData.isArchived,
            displayOrder: productData.displayOrder,
            updatedAt: new Date()
        };
    } else {
        // Legacy form data collection
        const stockValue = document.getElementById('product-stock')?.value;
        const oldPriceDzd = document.getElementById('product-old-price-dzd')?.value;
        const oldPriceUsd = document.getElementById('product-old-price-usd')?.value;
        const costDzd = document.getElementById('product-cost-dzd')?.value;
        const costUsd = document.getElementById('product-cost-usd')?.value;
        const supplier = document.getElementById('product-supplier')?.value;

        // Get name from multilingual fields or legacy field
        const nameAr = document.getElementById('product-name-ar')?.value;
        const nameEn = document.getElementById('product-name-en')?.value;
        const nameFr = document.getElementById('product-name-fr')?.value;
        const nameLegacy = document.getElementById('product-name')?.value;

        const name = nameAr || nameLegacy || '';

        // Get availability from radio buttons or checkbox
        const availabilityRadio = document.querySelector('input[name="product-availability"]:checked');
        const availableCheckbox = document.getElementById('product-available');
        const availability = availabilityRadio?.value || (availableCheckbox?.checked ? 'available' : 'unavailable');

        // Get media URL from new or legacy field
        const mediaUrl = document.getElementById('product-media-url')?.value || document.getElementById('product-image')?.value || '';

        productData = {
            id: document.getElementById('product-id')?.value,
            name: name,
            name_translations: { ar: nameAr || name, en: nameEn || '', fr: nameFr || '' },
            category: document.getElementById('product-category')?.value,
            price_dzd: parseFloat(document.getElementById('product-price-dzd')?.value) || 0,
            price_usd: parseFloat(document.getElementById('product-price-usd')?.value) || 0,
            priceDZD: parseFloat(document.getElementById('product-price-dzd')?.value) || 0,
            priceUSD: parseFloat(document.getElementById('product-price-usd')?.value) || 0,
            old_price_dzd: oldPriceDzd ? parseFloat(oldPriceDzd) : null,
            old_price_usd: oldPriceUsd ? parseFloat(oldPriceUsd) : null,
            cost_dzd: costDzd ? parseFloat(costDzd) : null,
            cost_usd: costUsd ? parseFloat(costUsd) : null,
            supplier: supplier || null,
            stock: stockValue !== '' ? parseInt(stockValue) : null,
            image: mediaUrl,
            mediaUrl: mediaUrl,
            mediaType: typeof detectMediaType === 'function' ? detectMediaType(mediaUrl) : 'image',
            features: document.getElementById('product-features')?.value,
            whatsappMsg: document.getElementById('product-whatsapp-msg')?.value,
            whatsapp_msg: document.getElementById('product-whatsapp-msg')?.value,
            description: {
                ar: document.getElementById('product-desc-ar')?.value || '',
                en: document.getElementById('product-desc-en')?.value || '',
                fr: document.getElementById('product-desc-fr')?.value || ''
            },
            availability: availability,
            available: availability === 'available',
            status: availability,
            active: document.getElementById('product-active')?.checked !== false,
            featured: document.getElementById('product-featured')?.checked || false,
            isArchived: document.getElementById('product-archived')?.checked || false,
            updatedAt: new Date()
        };
    }

    // الحفاظ على الترتيب الحالي
    const existingProduct = allProducts.find(p => p.id === productData.id);
    const productForV2 = normalizeAdminProductForV2(productData, existingProduct);
    if (existingProduct) {
        productForV2.order = getProductOrder(existingProduct);
        productForV2.displayOrder = getProductOrder(existingProduct);
        productForV2.createdAt = existingProduct.createdAt;
    } else {
        productForV2.order = allProducts.length;
        productForV2.displayOrder = allProducts.length;
        productForV2.createdAt = new Date();
    }

    try {
        const { setDoc, doc } = window.firebaseModules;
        await clearDeletedProductMarker(productForV2.id);

        await setDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, productForV2.id), productForV2);
        await setDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, productForV2.id), {
            ...productForV2,
            name: getProductDisplayName(productForV2),
            price_dzd: productForV2.priceDZD,
            price_usd: productForV2.priceUSD
        });

        // تحديث القائمة المحلية
        const index = allProducts.findIndex(p => p.id === productForV2.id);
        if (index >= 0) {
            allProducts[index] = productForV2;
        } else {
            allProducts.push(productForV2);
        }

        displayProductsTable();
        closeProductModal();
        showToast('تم حفظ المنتج بنجاح ✅');
        logActivity('product', editingProductId ? 'updated' : 'created', getProductDisplayName(productForV2));
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
    if (!window.firebaseModules) {
        console.log('⏳ Firebase غير جاهز لتحميل الطلبات');
        return Promise.resolve();
    }
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
        const collections = ['reviews', 'orders', 'products_v2', 'products', 'settings'];
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
document.getElementById('import-file')?.addEventListener('change', async function (e) {
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
async function toggleMaintenanceMode() {
    const enabled = document.getElementById('maintenance-mode').checked;
    localStorage.setItem('maintenanceMode', enabled ? 'true' : 'false');

    try {
        if (!window.db || !window.firebaseModules || !window.firebaseModules.setDoc) {
            showToast('Firebase غير متاح، تم حفظ وضع الصيانة محلياً فقط', 'error');
            return;
        }

        const { doc, setDoc, serverTimestamp } = window.firebaseModules;
        await setDoc(doc(window.db, 'settings', 'maintenance'), {
            enabled,
            message: 'The website is currently under maintenance. Please check back soon.',
            updatedAt: serverTimestamp()
        }, { merge: true });

        showToast(enabled ? 'تم تفعيل وضع الصيانة ✅' : 'تم تعطيل وضع الصيانة ✅');
        logActivity('tools', 'maintenance_mode', enabled ? 'enabled' : 'disabled');
    } catch (error) {
        console.error('خطأ في حفظ وضع الصيانة:', error);
        showToast('خطأ في حفظ وضع الصيانة', 'error');
    }
}

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
            await markProductAsDeleted(reviewToDelete);
            await deleteDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, reviewToDelete));
            await deleteDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, reviewToDelete));
            allProducts = allProducts.filter(p => !isProductDeleted(p, new Set(Array.from(getProductDeleteKeys(reviewToDelete)))));
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
showTab = function (tabName) {
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
    if (!window.firebaseModules) {
        console.log('⏳ Firebase غير جاهز لتحميل بيانات المحاسبة');
        return;
    }
    try {
        // إبطال أي بيانات محاسبة مخزّنة مؤقتاً قبل إعادة التحميل
        invalidateAccountingCache();

        // تعيين سعر الدولار في الحقل
        const usdRateInput = document.getElementById('usd-rate-input');
        if (usdRateInput) usdRateInput.value = USD_TO_DZD_RATE;

        // تحميل رأس المال
        await loadStartingCapital();

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

        // تحديث عرض رأس المال والرصيد
        updateCapitalDisplay();

    } catch (error) {
        console.error('خطأ في تحميل بيانات المحاسبة:', error);
        showToast('خطأ في تحميل بيانات المحاسبة', 'error');
    }
}

/**
 * تحميل بيانات الشراء من Firebase
 */
async function loadPurchases() {
    if (!window.firebaseModules) {
        console.log('⏳ Firebase غير جاهز لتحميل بيانات الشراء');
        return;
    }
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
 * حساب بيانات المحاسبة لكل منتج (مع تخزين مؤقت لتفادي إعادة الحساب)
 *
 * كانت هذه الدالة تُستدعى 3 مرات أو أكثر في كل تحديث (الجدول + الإحصائيات +
 * الرسوم) وتمرّ في كل مرة على كل المنتجات × كل الطلبات. أصبحت الآن غلافاً
 * يخزّن النتيجة حسب توقيع المدخلات (الفلتر + أطوال المصفوفات + سعر الصرف)
 * ويعيد حسابها فقط عند تغيّر أي منها.
 */
let _accountingDataCache = null;
let _accountingDataCacheKey = '';

function getAccountingCacheKey() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const from = document.getElementById('accounting-date-from')?.value || '';
    const to = document.getElementById('accounting-date-to')?.value || '';
    return [dateFilter, from, to, allProducts.length, allOrders.length, allPurchases.length, USD_TO_DZD_RATE].join('|');
}

function invalidateAccountingCache() {
    _accountingDataCache = null;
    _accountingDataCacheKey = '';
}

function calculateAccountingData() {
    const key = getAccountingCacheKey();
    if (_accountingDataCache && _accountingDataCacheKey === key) {
        return _accountingDataCache;
    }
    _accountingDataCache = computeAccountingData();
    _accountingDataCacheKey = key;
    return _accountingDataCache;
}

function computeAccountingData() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );
    const filteredPurchases = filterOrdersByDate(allPurchases, dateFilter);

    return allProducts.map(product => {
        const productName = getProductDisplayName(product);
        const priceDzd = getProductPriceDZD(product);
        const priceUsd = getProductPriceUSD(product);
        const costDzd = getProductCostDZD(product);
        const costUsd = getProductCostUSD(product);
        // بيانات المبيعات
        const productOrders = filteredOrders.filter(o => matchesProductRecord(o, product));
        const salesCount = productOrders.length;

        // بيانات الشراء اليدوي (للرجوع إليها)
        const productPurchases = filteredPurchases.filter(p => matchesProductRecord(p, product));
        const purchasedQty = productPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

        // حساب الإيرادات (من المبيعات)
        const revenueDzd = productOrders.reduce((sum, o) => sum + getOrderRevenueDzd(o), 0);

        const revenueUsd = productOrders.reduce((sum, o) => {
            const amount = parseFloat(o.amount) || 0;
            if (o.currency === 'USD') {
                return sum + amount;
            }
            return sum + dzdToUsd(amount);
        }, 0);

        const totalRevenueDzd = revenueDzd || (salesCount * priceDzd);
        const totalRevenueUsd = revenueUsd || (salesCount * priceUsd);

        // ★★★ التكلفة الفعلية = مجموع cost_price من كل طلب ★★★
        const missingCostCount = productOrders.filter(o => {
            const rawCost = parseFloat(o.cost_price ?? o.costPrice) || 0;
            return rawCost <= 0;
        }).length;

        const totalCostDzd = productOrders.reduce((sum, o) => sum + getOrderCostDzd(o), 0);

        const totalCostUsd = productOrders.reduce((sum, o) => {
            let cost = parseFloat(o.cost_price || o.costPrice) || 0;
            if (cost === 0) {
                cost = costUsd || 0;
            }
            if (o.currency !== 'USD') {
                cost = dzdToUsd(cost);
            }
            return sum + cost;
        }, 0);


        // الكمية المتبقية
        const remainingQty = purchasedQty - salesCount;

        // تكلفة الوحدة (للعرض فقط)
        const costPerUnitDzd = salesCount > 0 ? (totalCostDzd / salesCount) : costDzd;
        const costPerUnitUsd = salesCount > 0 ? (totalCostUsd / salesCount) : costUsd;

        // حساب الربح = الإيرادات - التكلفة الفعلية
        const profitDzd = totalRevenueDzd - totalCostDzd;
        const profitUsd = totalRevenueUsd - totalCostUsd;

        // هامش الربح
        const marginDzd = totalRevenueDzd > 0 ? ((profitDzd / totalRevenueDzd) * 100) : 0;
        const marginUsd = totalRevenueUsd > 0 ? ((profitUsd / totalRevenueUsd) * 100) : 0;

        return {
            id: product.id,
            name: productName,
            supplier: product.supplier || 'غير محدد',
            // بيانات الشراء
            purchasedQty,
            purchaseCostDzd: totalCostDzd,
            purchaseCostUsd: totalCostUsd,
            costDzd: costPerUnitDzd,
            costUsd: costPerUnitUsd,
            costPerUnitDzd,
            costPerUnitUsd,
            // بيانات البيع
            salesCount,
            priceDzd,
            priceUsd,
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
            missingCostCount,
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
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-400">لا توجد بيانات</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        const profitClass = item.profitDzd >= 0 ? 'text-green-400' : 'text-red-400';
        const remainingClass = item.remainingQty > 0 ? 'text-yellow-400' : (item.remainingQty < 0 ? 'text-red-400' : 'text-gray-400');
        const hasMissingCost = item.missingCostCount > 0;
        const hasWeakMargin = item.salesCount > 0 && item.marginDzd < 15;
        const hasLoss = item.profitDzd < 0;
        const statusBadges = [];

        if (hasMissingCost) {
            statusBadges.push(`<span class="accounting-status-badge danger">تكلفة ناقصة ${item.missingCostCount}</span>`);
        }
        if (hasLoss) {
            statusBadges.push('<span class="accounting-status-badge danger">خسارة</span>');
        } else if (hasWeakMargin) {
            statusBadges.push('<span class="accounting-status-badge warning">هامش ضعيف</span>');
        }
        if (statusBadges.length === 0) {
            statusBadges.push('<span class="accounting-status-badge good">سليم</span>');
        }

        // تنسيق الأرقام
        const formatMoney = (dzd, usd) => {
            let html = '';
            if (showDzd && dzd > 0) html += `<div>${dzd.toLocaleString()} د.ج</div>`;
            if (showUsd && usd > 0) html += `<div class="text-xs text-gray-400">$${usd.toFixed(2)}</div>`;
            return html || '<span class="text-gray-500">-</span>';
        };

        return `
            <tr class="accounting-data-row border-t border-gray-700 hover:bg-gray-700/50 transition-colors ${hasMissingCost || hasLoss ? 'needs-attention' : ''}">
                <td class="px-3 py-3" data-label="المنتج">
                    <div class="font-bold text-sm">${escapeHtml(item.name)}</div>
                    <div class="text-gray-500 text-xs">${escapeHtml(item.supplier)}</div>
                </td>
                <td class="px-2 py-3 text-center" data-label="مشتراة">
                    <span class="bg-blue-600/30 text-blue-300 px-2 py-1 rounded font-bold">
                        ${item.purchasedQty}
                    </span>
                </td>
                <td class="px-2 py-3 text-center" data-label="مباعة">
                    <span class="bg-green-600/30 text-green-300 px-2 py-1 rounded font-bold">
                        ${item.salesCount}
                    </span>
                </td>
                <td class="px-2 py-3 text-center" data-label="متبقي">
                    <span class="${remainingClass} font-bold px-2 py-1 rounded ${item.remainingQty > 0 ? 'bg-yellow-600/20' : ''}">
                        ${item.remainingQty}
                    </span>
                </td>
                <td class="px-2 py-3 text-red-300 text-xs" data-label="التكلفة">
                    ${formatMoney(item.purchaseCostDzd, item.purchaseCostUsd)}
                </td>
                <td class="px-2 py-3 text-green-300 text-xs" data-label="الإيرادات">
                    ${formatMoney(item.revenueDzd, item.revenueUsd)}
                </td>
                <td class="px-2 py-3" data-label="الربح">
                    <div class="${profitClass} font-bold text-sm">
                        ${showDzd ? `${item.profitDzd.toLocaleString()} د.ج` : `$${item.profitUsd.toFixed(2)}`}
                    </div>
                </td>
                <td class="px-2 py-3 text-center" data-label="الهامش">
                    <span class="px-2 py-1 rounded text-xs ${item.marginDzd >= 20 ? 'bg-green-600/20 text-green-300' : item.marginDzd >= 0 ? 'bg-yellow-600/20 text-yellow-300' : 'bg-red-600/20 text-red-300'}">
                        ${item.marginDzd.toFixed(0)}%
                    </span>
                </td>
                <td class="px-2 py-3 text-center" data-label="الحالة">
                    <div class="accounting-status-stack">${statusBadges.join('')}</div>
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
        acc.missingCost += item.missingCostCount || 0;
        return acc;
    }, { purchased: 0, sold: 0, remaining: 0, costDzd: 0, costUsd: 0, revenueDzd: 0, revenueUsd: 0, profitDzd: 0, profitUsd: 0, missingCost: 0 });

    const avgMargin = totals.revenueDzd > 0 ? ((totals.profitDzd / totals.revenueDzd) * 100) : 0;

    const footerPurchased = document.getElementById('footer-total-purchased');
    const footerSold = document.getElementById('footer-total-sold');
    const footerRemaining = document.getElementById('footer-total-remaining');
    const footerCost = document.getElementById('footer-total-cost');
    const footerRevenue = document.getElementById('footer-total-revenue');
    const footerProfit = document.getElementById('footer-total-profit');
    const footerMargin = document.getElementById('footer-avg-margin');
    const footerQuality = document.getElementById('footer-quality-summary');
    const tableHealth = document.getElementById('accounting-table-health');

    if (footerPurchased) footerPurchased.textContent = totals.purchased;
    if (footerSold) footerSold.textContent = totals.sold;
    if (footerRemaining) footerRemaining.innerHTML = `<span class="${totals.remaining >= 0 ? 'text-yellow-400' : 'text-red-400'}">${totals.remaining}</span>`;
    if (footerCost) footerCost.innerHTML = `${totals.costDzd.toLocaleString()} د.ج`;
    if (footerRevenue) footerRevenue.innerHTML = `${totals.revenueDzd.toLocaleString()} د.ج`;
    if (footerProfit) footerProfit.innerHTML = `<span class="${totals.profitDzd >= 0 ? 'text-green-400' : 'text-red-400'}">${totals.profitDzd.toLocaleString()} د.ج</span>`;
    if (footerMargin) footerMargin.innerHTML = `<span class="${avgMargin >= 20 ? 'text-green-400' : avgMargin >= 0 ? 'text-yellow-400' : 'text-red-400'}">${avgMargin.toFixed(0)}%</span>`;
    if (footerQuality) {
        footerQuality.innerHTML = totals.missingCost > 0
            ? `<span class="accounting-status-badge danger">${totals.missingCost} تكلفة ناقصة</span>`
            : '<span class="accounting-status-badge good">سليم</span>';
    }
    if (tableHealth) {
        tableHealth.textContent = totals.missingCost > 0 ? `${totals.missingCost} طلب يحتاج تكلفة` : 'كل التكاليف مسجلة';
        tableHealth.className = `accounting-health-pill ${totals.missingCost > 0 ? 'danger' : 'good'}`;
    }
}

/**
 * حساب نوافذ الفترة الحالية والفترة السابقة المماثلة حسب الفلتر.
 * يرجع null للفلاتر التي لا يمكن مقارنتها (all / custom).
 */
function getPeriodComparisonWindows(filter) {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
        case 'today': {
            const prevStart = new Date(today.getTime() - dayMs);
            return { currStart: today, currEnd: now, prevStart, prevEnd: today, label: 'أمس' };
        }
        case 'week': {
            const currStart = new Date(today.getTime() - 7 * dayMs);
            const prevStart = new Date(today.getTime() - 14 * dayMs);
            return { currStart, currEnd: now, prevStart, prevEnd: currStart, label: 'الأسبوع السابق' };
        }
        case 'month': {
            const currStart = new Date(today.getTime() - 30 * dayMs);
            const prevStart = new Date(today.getTime() - 60 * dayMs);
            return { currStart, currEnd: now, prevStart, prevEnd: currStart, label: 'الشهر السابق' };
        }
        case 'year': {
            const currStart = new Date(today); currStart.setFullYear(currStart.getFullYear() - 1);
            const prevStart = new Date(today); prevStart.setFullYear(prevStart.getFullYear() - 2);
            return { currStart, currEnd: now, prevStart, prevEnd: currStart, label: 'السنة السابقة' };
        }
        default:
            return null; // all / custom
    }
}

/**
 * صافي "المتبقي" (الإيرادات - التكلفة - المصاريف) داخل نافذة زمنية محددة.
 */
function computeNetTotalInWindow(start, end) {
    let net = 0;
    allOrders
        .filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .forEach(order => {
            const d = getOrderDate(order);
            if (Number.isNaN(d.getTime()) || d < start || d >= end) return;
            net += getOrderRevenueDzd(order) - getOrderCostDzd(order);
        });
    (allExpenses || []).forEach(e => {
        const d = getAccountingExpenseDate(e);
        if (Number.isNaN(d.getTime()) || d < start || d >= end) return;
        let amount = parseFloat(e.amount) || 0;
        if (e.currency === 'USD') amount *= (e.exchangeRate || USD_TO_DZD_RATE);
        net -= amount;
    });
    return net;
}

/**
 * تحديث شارة المقارنة بالفترة السابقة على بطاقة "المتبقي".
 */
function updatePeriodComparison(filter, currentNet) {
    const el = document.getElementById('stat-net-profit-comparison');
    if (!el) return;

    const windows = getPeriodComparisonWindows(filter);
    if (!windows) {
        el.textContent = '';
        el.className = 'text-[10px] mt-1';
        return;
    }

    const prevNet = computeNetTotalInWindow(windows.prevStart, windows.prevEnd);
    if (prevNet === 0) {
        el.textContent = `لا توجد بيانات لـ${windows.label} للمقارنة`;
        el.className = 'text-[10px] mt-1 text-gray-500';
        return;
    }

    const delta = ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
    const up = delta >= 0;
    el.textContent = `${up ? '▲' : '▼'} ${up ? '+' : ''}${delta.toFixed(1)}% مقارنة بـ${windows.label}`;
    el.className = `text-[10px] mt-1 font-bold ${up ? 'text-green-400' : 'text-red-400'}`;
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
        if (e.currency === 'USD') {
            const rate = e.exchangeRate || USD_TO_DZD_RATE;
            return sum + (amount * rate);
        }
        return sum + amount;
    }, 0);
    const personalExpSum = personalExpenses.reduce((sum, e) => {
        const amount = e.amount || 0;
        if (e.currency === 'USD') {
            const rate = e.exchangeRate || USD_TO_DZD_RATE;
            return sum + (amount * rate);
        }
        return sum + amount;
    }, 0);

    // حساب الأرباح
    const grossProfit = totals.revenueDzd - totals.costDzd;  // ربح المنتجات
    const netBusinessProfit = grossProfit - businessExpSum;   // ربح العمل الصافي
    const netTotal = netBusinessProfit - personalExpSum;      // المتبقي بعد كل المصاريف

    const margin = totals.revenueDzd > 0 ? ((grossProfit / totals.revenueDzd) * 100) : 0;
    const soldProducts = data.filter(item => item.salesCount > 0);
    const topProfitProduct = soldProducts.reduce((best, item) => {
        if (!best || item.profitDzd > best.profitDzd) return item;
        return best;
    }, null);
    const weakestMarginProduct = soldProducts.reduce((weakest, item) => {
        if (!weakest || item.marginDzd < weakest.marginDzd) return item;
        return weakest;
    }, null);

    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );
    const missingCostOrders = filteredOrders.filter(order => {
        const rawCost = parseFloat(order.cost_price ?? order.costPrice) || 0;
        return rawCost <= 0;
    }).length;
    const averageOrderProfit = filteredOrders.length > 0 ? grossProfit / filteredOrders.length : 0;
    const sourceProfits = filteredOrders.reduce((acc, order) => {
        const profit = getOrderRevenueDzd(order) - getOrderCostDzd(order);
        if (order.source === 'wholesale') acc.wholesale += profit;
        else acc.retail += profit;
        return acc;
    }, { wholesale: 0, retail: 0 });
    const positiveSourceProfit = Math.max(sourceProfits.wholesale, 0) + Math.max(sourceProfits.retail, 0);
    const wholesaleShare = positiveSourceProfit > 0 ? (Math.max(sourceProfits.wholesale, 0) / positiveSourceProfit) * 100 : 0;
    const retailShare = positiveSourceProfit > 0 ? (Math.max(sourceProfits.retail, 0) / positiveSourceProfit) * 100 : 0;

    // تحديث البطاقات - الصف الأول
    const statRevenue = document.getElementById('stat-total-revenue-acc');
    const statCost = document.getElementById('stat-total-cost-acc');
    const statBusinessExp = document.getElementById('stat-business-expenses');
    const statPersonalExp = document.getElementById('stat-personal-expenses');

    if (statRevenue) statRevenue.textContent = formatAccountingMoney(totals.revenueDzd);
    if (statCost) statCost.textContent = formatAccountingMoney(totals.costDzd);
    if (statBusinessExp) statBusinessExp.textContent = formatAccountingMoney(businessExpSum);
    if (statPersonalExp) statPersonalExp.textContent = formatAccountingMoney(personalExpSum);

    // تحديث البطاقات - الصف الثاني
    const statGrossProfit = document.getElementById('stat-gross-profit');
    const statNetBusiness = document.getElementById('stat-net-business-profit');
    const statNetProfit = document.getElementById('stat-net-profit');
    const statMargin = document.getElementById('stat-profit-margin');

    if (statGrossProfit) {
        statGrossProfit.textContent = formatAccountingMoney(grossProfit);
        statGrossProfit.className = `text-lg font-bold ${grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`;
    }
    if (statNetBusiness) {
        statNetBusiness.textContent = formatAccountingMoney(netBusinessProfit);
        statNetBusiness.className = `text-lg font-bold ${netBusinessProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`;
    }
    if (statNetProfit) {
        statNetProfit.textContent = formatAccountingMoney(netTotal);
        statNetProfit.className = `text-lg font-bold ${netTotal >= 0 ? '' : 'text-red-400'}`;
        if (netTotal >= 0) statNetProfit.style.color = 'var(--accent)';
    }

    // مقارنة "المتبقي" بالفترة السابقة (±%)
    updatePeriodComparison(dateFilter, netTotal);
    if (statMargin) statMargin.textContent = `${margin.toFixed(1)}%`;

    const topProductEl = document.getElementById('stat-top-profit-product');
    const topValueEl = document.getElementById('stat-top-profit-value');
    const weakestProductEl = document.getElementById('stat-weakest-margin-product');
    const weakestValueEl = document.getElementById('stat-weakest-margin-value');
    const missingCostEl = document.getElementById('stat-missing-cost-orders');
    const averageProfitEl = document.getElementById('stat-average-order-profit');
    const wholesaleShareEl = document.getElementById('stat-wholesale-profit-share');
    const retailShareEl = document.getElementById('stat-retail-profit-share');

    if (topProductEl) topProductEl.textContent = topProfitProduct ? topProfitProduct.name : '-';
    if (topValueEl) topValueEl.textContent = topProfitProduct ? formatAccountingMoney(topProfitProduct.profitDzd) : formatAccountingMoney(0);
    if (weakestProductEl) weakestProductEl.textContent = weakestMarginProduct ? weakestMarginProduct.name : '-';
    if (weakestValueEl) weakestValueEl.textContent = weakestMarginProduct ? `${weakestMarginProduct.marginDzd.toFixed(1)}%` : '0%';
    if (missingCostEl) {
        missingCostEl.textContent = missingCostOrders.toLocaleString();
        missingCostEl.className = `insight-value ${missingCostOrders > 0 ? 'text-red-400' : 'text-green-400'}`;
    }
    if (averageProfitEl) averageProfitEl.textContent = formatAccountingMoney(averageOrderProfit);
    if (wholesaleShareEl) wholesaleShareEl.textContent = `${wholesaleShare.toFixed(0)}%`;
    if (retailShareEl) retailShareEl.textContent = `التجزئة ${retailShare.toFixed(0)}%`;
}

/**
 * تحديث الرسوم البيانية للأرباح
 */
function updateProfitCharts() {
    updateProfitOverTimeChart();
    updateProfitByProductChart();
}

function getAccountingChartDateInfo(date, filter, pointCount) {
    const useMonthly = filter === 'all' || filter === 'year' || pointCount > 90;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (useMonthly) {
        return {
            key: `${year}-${month}`,
            label: date.toLocaleDateString('fr-DZ', { year: 'numeric', month: 'short' })
        };
    }

    return {
        key: `${year}-${month}-${day}`,
        label: formatDate(date)
    };
}

function getAccountingExpenseDate(expense) {
    if (expense?.date) return new Date(expense.date);
    if (expense?.timestamp?.toDate) return expense.timestamp.toDate();
    if (expense?.createdAt?.toDate) return expense.createdAt.toDate();
    return new Date(expense?.createdAt || Date.now());
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

    const validOrderDates = filteredOrders
        .map(order => getOrderDate(order))
        .filter(date => !Number.isNaN(date.getTime()));
    const useMonthly = dateFilter === 'all' || dateFilter === 'year' || validOrderDates.length > 90;
    const profitByDate = {};

    filteredOrders.forEach(order => {
        const dateObj = getOrderDate(order);
        if (Number.isNaN(dateObj.getTime())) return;
        const dateInfo = getAccountingChartDateInfo(dateObj, dateFilter, validOrderDates.length);

        if (!profitByDate[dateInfo.key]) {
            profitByDate[dateInfo.key] = { label: dateInfo.label, revenue: 0, cost: 0, profit: 0 };
        }

        const amount = getOrderRevenueDzd(order);
        const cost = getOrderCostDzd(order);

        profitByDate[dateInfo.key].revenue += amount;
        profitByDate[dateInfo.key].cost += cost;
        profitByDate[dateInfo.key].profit += (amount - cost);
    });

    // خصم المصاريف من الأرباح اليومية
    const dateFilterValue = document.getElementById('accounting-date-filter')?.value || 'all';
    const expenseList = filterExpensesByDate(allExpenses, dateFilterValue);

    // فلترة المصاريف التي لها تاريخ صالح فقط
    const validExpenses = expenseList.filter(e => e.date || e.timestamp);

    // إضافة المصاريف للرسم البياني
    validExpenses.forEach(e => {
        const eDate = getAccountingExpenseDate(e);
        if (Number.isNaN(eDate.getTime())) return;
        const dateInfo = getAccountingChartDateInfo(eDate, dateFilter, useMonthly ? 91 : validOrderDates.length);

        if (!profitByDate[dateInfo.key]) {
            profitByDate[dateInfo.key] = { label: dateInfo.label, revenue: 0, cost: 0, profit: 0 };
        }

        let amount = e.amount || 0;
        if (e.currency === 'USD') {
            const rate = e.exchangeRate || USD_TO_DZD_RATE;
            amount = amount * rate;
        }

        profitByDate[dateInfo.key].cost += amount;
        profitByDate[dateInfo.key].profit -= amount;
    });

    // ترتيب التواريخ زمنياً
    const sortedDates = Object.keys(profitByDate).sort();

    if (accountingCharts.profitOverTime) {
        accountingCharts.profitOverTime.destroy();
    }

    accountingCharts.profitOverTime = new Chart(ctx, {
        type: 'line',
        data: {
            // تحويل التواريخ من ISO إلى التنسيق المقروء باستخدام دالة formatDate الموجودة
            labels: sortedDates.map(date => profitByDate[date].label),
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
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af', boxWidth: 10, font: { size: 10 } }
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

    const data = calculateAccountingData()
        .filter(item => item.profitDzd > 0)
        .sort((a, b) => b.profitDzd - a.profitDzd)
        .slice(0, 8);

    if (accountingCharts.profitByProduct) {
        accountingCharts.profitByProduct.destroy();
    }

    accountingCharts.profitByProduct = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.length > 0 ? data.map(item => item.name) : ['لا توجد أرباح موجبة'],
            datasets: [{
                label: 'الربح',
                data: data.length > 0 ? data.map(item => Math.round(item.profitDzd)) : [0],
                backgroundColor: data.length > 0 ? 'rgba(34, 197, 94, 0.72)' : 'rgba(148, 163, 184, 0.24)',
                borderColor: data.length > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(148, 163, 184, 0.35)',
                borderWidth: 1,
                borderRadius: 6,
                barThickness: data.length > 0 ? 14 : 10
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw.toLocaleString()} د.ج`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        callback: value => Number(value).toLocaleString()
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { color: '#cbd5e1', font: { size: 10 } },
                    grid: { display: false }
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
    if (currencyFilter) currencyFilter.addEventListener('change', () => {
        // تغيير العملة يجب أن يحدّث البطاقات والرسوم وليس الجدول فقط
        displayAccountingTable();
        updateAccountingStats();
        updateCapitalDisplay();
        updateProfitCharts();
    });
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

/**
 * تهيئة أحداث نماذج المديونين
 * Initialize debtor form events
 * Requirements: 1.2, 2.3, 2.4, 3.2
 */
function initDebtorFormEvents() {
    // 11.1 - Form submit handlers
    const debtorForm = document.getElementById('debtor-form');
    if (debtorForm) {
        debtorForm.addEventListener('submit', saveDebtor);
    }

    // Payment button handler
    const paymentButton = document.querySelector('#debtor-payment-section button[type="button"]');
    if (paymentButton) {
        paymentButton.addEventListener('click', recordDebtorPayment);
    }

    // 11.2 - Filter event handlers
    const searchDebtorsInput = document.getElementById('search-debtors');
    if (searchDebtorsInput) {
        searchDebtorsInput.addEventListener('input', function (e) {
            filterDebtorsBySearch(e.target.value);
        });
    }

    const statusFilterSelect = document.getElementById('filter-debtor-status');
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', function (e) {
            filterDebtorsByStatus(e.target.value);
        });
    }

    console.log('✅ تم تهيئة أحداث نماذج المديونين');
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initSaleFormEvents();
    initPurchaseFormEvents();
    initExpenseFormEvents();
    initDebtorFormEvents();
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
        const dayName = date.toLocaleDateString('fr-DZ', { weekday: 'short' });
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
window.showTab = function (tabName) {
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
window.showTab = function (tabName) {
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


// ═══════════════════════════════════════════════════════════════════════════
// وظائف إدارة المديونين - Debtors Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل المديونين من Firebase
 * Requirements: 2.1
 */
async function loadDebtors() {
    try {
        if (!window.db || !window.firebaseModules) {
            console.warn('⚠️ Firebase غير متاح');
            return;
        }

        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'debtors'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        allDebtors = [];
        querySnapshot.forEach(doc => {
            allDebtors.push({ id: doc.id, ...doc.data() });
        });

        console.log(`💳 تم تحميل ${allDebtors.length} مدين`);

        displayDebtorsTable();
        updateDebtorStats();

    } catch (error) {
        console.error('خطأ في تحميل المديونين:', error);
        showToast('خطأ في تحميل المديونين', 'error');
    }
}

/**
 * التحقق من صحة نموذج المدين
 * Requirements: 1.3
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateDebtorForm() {
    const errors = [];

    const name = document.getElementById('debtor-name')?.value?.trim();
    const amount = parseFloat(document.getElementById('debtor-amount')?.value);

    // التحقق من الاسم (مطلوب)
    if (!name || name.length === 0) {
        errors.push('اسم المدين مطلوب');
    }

    // التحقق من المبلغ (مطلوب وأكبر من صفر)
    if (isNaN(amount) || amount <= 0) {
        errors.push('المبلغ يجب أن يكون أكبر من صفر');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// تحميل المديونين عند فتح تبويب المديونين
const originalShowTabForDebtors = window.showTab;
window.showTab = function (tabName) {
    originalShowTabForDebtors(tabName);

    // تحميل المديونين عند فتح تبويب المديونين
    if (tabName === 'debtors' && allDebtors.length === 0) {
        loadDebtors();
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// وظائف CRUD للمديونين - Debtors CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حفظ مدين جديد
 * Requirements: 1.2, 1.4
 * @param {Event} event - حدث النموذج
 */
async function saveDebtor(event) {
    event.preventDefault();

    // التحقق من صحة النموذج
    const validation = validateDebtorForm();
    if (!validation.isValid) {
        showToast(validation.errors.join('\n'), 'error');
        return;
    }

    // التحقق من Firebase
    if (!window.db || !window.firebaseModules) {
        showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
        return;
    }

    const debtorId = document.getElementById('debtor-id')?.value;

    // إذا كان هناك ID، فهذا تعديل وليس إضافة
    if (debtorId) {
        const updateData = {
            name: document.getElementById('debtor-name').value.trim(),
            phone: document.getElementById('debtor-phone')?.value?.trim() || '',
            productId: document.getElementById('debtor-product')?.value || '',
            productName: document.getElementById('debtor-product')?.options[document.getElementById('debtor-product')?.selectedIndex]?.text || '',
            amountOwed: parseFloat(document.getElementById('debtor-amount').value),
            currency: document.getElementById('debtor-currency')?.value || 'DZD',
            notes: document.getElementById('debtor-notes')?.value?.trim() || ''
        };
        await updateDebtor(debtorId, updateData);
        return;
    }

    try {
        const { addDoc, collection, serverTimestamp } = window.firebaseModules;

        // جمع بيانات المدين
        const productSelect = document.getElementById('debtor-product');
        const debtorData = {
            name: document.getElementById('debtor-name').value.trim(),
            phone: document.getElementById('debtor-phone')?.value?.trim() || '',
            productId: productSelect?.value || '',
            productName: productSelect?.options[productSelect?.selectedIndex]?.text || '',
            amountOwed: parseFloat(document.getElementById('debtor-amount').value),
            amountPaid: 0,
            currency: document.getElementById('debtor-currency')?.value || 'DZD',
            status: 'pending',
            notes: document.getElementById('debtor-notes')?.value?.trim() || '',
            createdAt: serverTimestamp(),
            updatedAt: null,
            paidAt: null
        };

        // حفظ في Firebase
        await addDoc(collection(window.db, 'debtors'), debtorData);

        // إغلاق النافذة وتحديث العرض
        closeDebtorModal();
        showToast('✅ تم إضافة المدين بنجاح');
        logActivity('debtor', 'created', debtorData.name);

        // إعادة تحميل البيانات
        await loadDebtors();

    } catch (error) {
        console.error('خطأ في حفظ المدين:', error);
        showToast('خطأ في حفظ المدين', 'error');
    }
}

/**
 * تحديث بيانات مدين
 * Requirements: 3.4
 * @param {string} id - معرف المدين
 * @param {Object} data - البيانات المحدثة
 */
async function updateDebtor(id, data) {
    if (!id) {
        showToast('معرف المدين غير صالح', 'error');
        return;
    }

    if (!window.db || !window.firebaseModules) {
        showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
        return;
    }

    try {
        const { doc, updateDoc, serverTimestamp } = window.firebaseModules;

        // إضافة timestamp التحديث
        const updateData = {
            ...data,
            updatedAt: serverTimestamp()
        };

        // تحديث في Firebase
        await updateDoc(doc(window.db, 'debtors', id), updateData);

        // إغلاق النافذة وتحديث العرض
        closeDebtorModal();
        showToast('✅ تم تحديث بيانات المدين');
        logActivity('debtor', 'updated', data.name || id);

        // إعادة تحميل البيانات
        await loadDebtors();

    } catch (error) {
        console.error('خطأ في تحديث المدين:', error);
        showToast('خطأ في تحديث المدين', 'error');
    }
}

/**
 * حذف مدين
 * Requirements: 4.1, 4.2, 4.3
 * @param {string} id - معرف المدين
 */
async function deleteDebtor(id) {
    if (!id) {
        showToast('معرف المدين غير صالح', 'error');
        return;
    }

    // عرض نافذة التأكيد (Requirements: 4.1)
    const confirmed = confirm('هل أنت متأكد من حذف هذا المدين؟\nلا يمكن التراجع عن هذا الإجراء.');

    // إلغاء الحذف إذا لم يؤكد المستخدم (Requirements: 4.3)
    if (!confirmed) {
        return;
    }

    if (!window.db || !window.firebaseModules) {
        showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
        return;
    }

    try {
        const { doc, deleteDoc } = window.firebaseModules;

        // الحصول على اسم المدين للسجل
        const debtor = allDebtors.find(d => d.id === id);
        const debtorName = debtor?.name || id;

        // حذف من Firebase (Requirements: 4.2)
        await deleteDoc(doc(window.db, 'debtors', id));

        showToast('✅ تم حذف المدين');
        logActivity('debtor', 'deleted', debtorName);

        // إعادة تحميل البيانات
        await loadDebtors();

    } catch (error) {
        console.error('خطأ في حذف المدين:', error);
        showToast('خطأ في حذف المدين', 'error');
    }
}

/**
 * تسجيل دفعة للمدين
 * Requirements: 3.2, 3.3
 * @param {string} id - معرف المدين
 * @param {number} amount - مبلغ الدفعة
 */
async function recordPayment(id, amount) {
    if (!id) {
        showToast('معرف المدين غير صالح', 'error');
        return;
    }

    // التحقق من المبلغ
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        showToast('المبلغ يجب أن يكون أكبر من صفر', 'error');
        return;
    }

    if (!window.db || !window.firebaseModules) {
        showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
        return;
    }

    // البحث عن المدين
    const debtor = allDebtors.find(d => d.id === id);
    if (!debtor) {
        showToast('المدين غير موجود', 'error');
        return;
    }

    // حساب المبلغ المتبقي
    const currentPaid = parseFloat(debtor.amountPaid) || 0;
    const amountOwed = parseFloat(debtor.amountOwed) || 0;
    const remainingAmount = amountOwed - currentPaid;

    // التحقق من أن الدفعة لا تتجاوز المتبقي
    if (paymentAmount > remainingAmount) {
        showToast('المبلغ المدفوع أكبر من المتبقي', 'error');
        return;
    }

    try {
        const { doc, updateDoc, serverTimestamp } = window.firebaseModules;

        // حساب المبلغ المدفوع الجديد
        const newAmountPaid = currentPaid + paymentAmount;

        // تحديد الحالة الجديدة
        // استخدام epsilon للتعامل مع مشاكل دقة الأرقام العشرية
        const epsilon = 0.0001;
        let newStatus;
        let paidAt = null;

        if (newAmountPaid >= amountOwed - epsilon) {
            // دفع كامل (Requirements: 3.3)
            newStatus = 'paid';
            paidAt = serverTimestamp();
        } else {
            // دفع جزئي (Requirements: 3.2)
            newStatus = 'partial';
        }

        // تحديث البيانات في Firebase
        const updateData = {
            amountPaid: newAmountPaid,
            status: newStatus,
            updatedAt: serverTimestamp()
        };

        // إضافة تاريخ الدفع الكامل إذا تم الدفع بالكامل
        if (paidAt) {
            updateData.paidAt = paidAt;
        }

        await updateDoc(doc(window.db, 'debtors', id), updateData);

        // رسالة النجاح
        const statusMessage = newStatus === 'paid' ? 'تم الدفع بالكامل ✅' : 'تم تسجيل الدفعة الجزئية';
        showToast(`💰 ${statusMessage}`);
        logActivity('debtor', 'payment', `${debtor.name}: ${paymentAmount} ${debtor.currency}`);

        // إغلاق النافذة وإعادة تحميل البيانات
        closeDebtorModal();
        await loadDebtors();

    } catch (error) {
        console.error('خطأ في تسجيل الدفعة:', error);
        showToast('خطأ في تسجيل الدفعة', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// وظائف عرض المديونين - Display Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب مؤشر عمر الدين
 * Requirements: 5.1, 5.2
 * @param {Date|Object} createdAt - تاريخ إنشاء الدين
 * @param {string} status - حالة الدين
 * @returns {string} - 'critical' | 'warning' | 'normal'
 */
function getDebtAgeIndicator(createdAt, status) {
    // إذا كان الدين مدفوعاً، لا حاجة لمؤشر
    if (status === 'paid') {
        return 'normal';
    }

    // تحويل التاريخ إلى كائن Date
    let debtDate;
    if (createdAt?.toDate) {
        debtDate = createdAt.toDate();
    } else if (createdAt instanceof Date) {
        debtDate = createdAt;
    } else if (createdAt) {
        debtDate = new Date(createdAt);
    } else {
        return 'normal';
    }

    // حساب عدد الأيام منذ إنشاء الدين
    const now = new Date();
    const diffTime = now.getTime() - debtDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // تحديد المؤشر بناءً على العمر
    if (diffDays > 30) {
        return 'critical';
    } else if (diffDays > 7) {
        return 'warning';
    }
    return 'normal';
}

/**
 * فلترة المديونين بالبحث (الاسم أو الهاتف)
 * Requirements: 2.3
 * @param {string} term - مصطلح البحث
 */
function filterDebtorsBySearch(term) {
    // تحديث عرض الجدول (سيقرأ قيمة البحث من الحقل)
    displayDebtorsTable();
}

/**
 * فلترة المديونين بالحالة
 * Requirements: 2.4
 * @param {string} status - الحالة المطلوبة (all, pending, partial, paid)
 */
function filterDebtorsByStatus(status) {
    // تحديث عرض الجدول (سيقرأ قيمة الفلتر من القائمة)
    displayDebtorsTable();
}

/**
 * ترتيب المديونين: غير المدفوعين أولاً (الأقدم أولاً)، ثم المدفوعين
 * Requirements: 5.3
 * @param {Array} debtors - مصفوفة المديونين
 * @returns {Array} - المصفوفة مرتبة
 */
function sortDebtors(debtors) {
    return [...debtors].sort((a, b) => {
        // المدفوعين في النهاية
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (a.status !== 'paid' && b.status === 'paid') return -1;

        // ترتيب غير المدفوعين بالتاريخ (الأقدم أولاً)
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateA - dateB;
    });
}

/**
 * عرض جدول المديونين
 * Requirements: 2.1, 5.1, 5.2
 */
function displayDebtorsTable() {
    const tableBody = document.getElementById('debtors-table-body');
    if (!tableBody) {
        console.error('عنصر جدول المديونين غير موجود');
        return;
    }

    // الحصول على قيم الفلترة (استخدام IDs الصحيحة من HTML)
    const searchTerm = document.getElementById('search-debtors')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filter-debtor-status')?.value || 'all';

    // فلترة المديونين
    let filteredDebtors = allDebtors.filter(debtor => {
        // فلترة بالبحث (الاسم أو الهاتف) - case-insensitive
        const matchesSearch = !searchTerm ||
            (debtor.name?.toLowerCase().includes(searchTerm)) ||
            (debtor.phone?.toLowerCase().includes(searchTerm));

        // فلترة بالحالة
        const matchesStatus = statusFilter === 'all' || debtor.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // ترتيب المديونين باستخدام الدالة المخصصة
    filteredDebtors = sortDebtors(filteredDebtors);

    // إذا لم يكن هناك مديونين
    if (filteredDebtors.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-400">
                    ${searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد مديونين'}
                </td>
            </tr>
        `;
        return;
    }

    // بناء صفوف الجدول
    tableBody.innerHTML = filteredDebtors.map(debtor => {
        const ageIndicator = getDebtAgeIndicator(debtor.createdAt, debtor.status);
        const remainingAmount = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);

        // تحديد لون الصف بناءً على المؤشر
        let rowClass = '';
        let indicatorBadge = '';
        if (ageIndicator === 'critical') {
            rowClass = 'bg-red-500/10 border-r-4 border-red-500';
            indicatorBadge = '<span class="inline-block px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 mr-2">⚠️ متأخر جداً</span>';
        } else if (ageIndicator === 'warning') {
            rowClass = 'bg-orange-500/10 border-r-4 border-orange-500';
            indicatorBadge = '<span class="inline-block px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400 mr-2">⏰ متأخر</span>';
        }

        // تحديد لون الحالة
        let statusBadge = '';
        switch (debtor.status) {
            case 'pending':
                statusBadge = '<span class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">مستحق</span>';
                break;
            case 'partial':
                statusBadge = '<span class="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">جزئي</span>';
                break;
            case 'paid':
                statusBadge = '<span class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">مدفوع</span>';
                break;
            default:
                statusBadge = '<span class="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">غير محدد</span>';
        }

        // تنسيق التاريخ
        let dateStr = '-';
        if (debtor.createdAt) {
            const date = debtor.createdAt?.toDate ? debtor.createdAt.toDate() : new Date(debtor.createdAt);
            dateStr = date.toLocaleDateString('fr-DZ');
        }

        // تنسيق المبلغ
        const currencySymbol = debtor.currency === 'USD' ? '$' : 'د.ج';
        const amountDisplay = debtor.status === 'paid'
            ? `<span class="text-green-400">${debtor.amountOwed?.toLocaleString()} ${currencySymbol}</span>`
            : `<span class="text-red-400">${remainingAmount.toLocaleString()} ${currencySymbol}</span>`;

        return `
            <tr class="${rowClass} hover:bg-white/5 transition-colors">
                <td class="px-4 py-3">
                    ${indicatorBadge}
                    <span class="font-medium text-white">${debtor.name || '-'}</span>
                </td>
                <td class="px-4 py-3 text-gray-300">${debtor.phone || '-'}</td>
                <td class="px-4 py-3 text-gray-300">${debtor.productName || '-'}</td>
                <td class="px-4 py-3">${amountDisplay}</td>
                <td class="px-4 py-3">${statusBadge}</td>
                <td class="px-4 py-3 text-gray-400 text-sm">${dateStr}</td>
                <td class="px-4 py-3">
                    <div class="flex gap-2">
                        ${debtor.status !== 'paid' ? `
                            <button onclick="openDebtorModal('${debtor.id}')" 
                                class="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                title="تعديل">
                                ✏️
                            </button>
                            <button onclick="quickPayment('${debtor.id}')" 
                                class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                title="تسجيل دفعة">
                                💰
                            </button>
                        ` : ''}
                        <button onclick="deleteDebtor('${debtor.id}')" 
                            class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="حذف">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * تسجيل دفعة سريعة (فتح نافذة الدفع)
 * @param {string} debtorId - معرف المدين
 */
function quickPayment(debtorId) {
    const debtor = allDebtors.find(d => d.id === debtorId);
    if (!debtor) {
        showToast('المدين غير موجود', 'error');
        return;
    }

    const remainingAmount = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);
    const currencySymbol = debtor.currency === 'USD' ? '$' : 'د.ج';

    // طلب المبلغ من المستخدم
    const paymentStr = prompt(`أدخل مبلغ الدفعة لـ ${debtor.name}\nالمتبقي: ${remainingAmount.toLocaleString()} ${currencySymbol}`);

    if (paymentStr === null) return; // المستخدم ألغى

    const paymentAmount = parseFloat(paymentStr);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }

    // تسجيل الدفعة
    recordPayment(debtorId, paymentAmount);
}

/**
 * تحديث إحصائيات المديونين
 * Requirements: 2.2
 */
function updateDebtorStats() {
    // حساب إجمالي الديون المستحقة (المتبقية)
    let totalDebtDZD = 0;
    let totalDebtUSD = 0;
    let debtorsCount = 0;
    let overdueCount = 0;

    allDebtors.forEach(debtor => {
        // تجاهل المديونين المدفوعين بالكامل
        if (debtor.status === 'paid') return;

        // حساب المبلغ المتبقي
        const remainingAmount = (debtor.amountOwed || 0) - (debtor.amountPaid || 0);

        // إضافة للإجمالي حسب العملة
        if (debtor.currency === 'USD') {
            totalDebtUSD += remainingAmount;
        } else {
            totalDebtDZD += remainingAmount;
        }

        // عد المديونين غير المدفوعين
        debtorsCount++;

        // عد الديون المتأخرة (أكثر من 7 أيام)
        const ageIndicator = getDebtAgeIndicator(debtor.createdAt, debtor.status);
        if (ageIndicator === 'warning' || ageIndicator === 'critical') {
            overdueCount++;
        }
    });

    // تحويل USD إلى DZD للعرض الموحد (باستخدام سعر السكوار)
    const totalDebtInDZD = totalDebtDZD + (totalDebtUSD * USD_TO_DZD_RATE);

    // تحديث عناصر الإحصائيات في الصفحة
    const totalDebtElement = document.getElementById('stat-total-debt');
    const debtorsCountElement = document.getElementById('stat-debtors-count');
    const overdueCountElement = document.getElementById('stat-overdue-count');

    if (totalDebtElement) {
        // عرض المبلغ بالدينار مع إضافة الدولار إذا وجد
        let displayText = `${Math.round(totalDebtInDZD).toLocaleString()} د.ج`;
        if (totalDebtUSD > 0) {
            displayText += ` (${totalDebtUSD.toLocaleString()} $)`;
        }
        totalDebtElement.textContent = displayText;
    }

    if (debtorsCountElement) {
        debtorsCountElement.textContent = debtorsCount.toString();
    }

    if (overdueCountElement) {
        overdueCountElement.textContent = overdueCount.toString();
    }
}

/**
 * فتح نافذة إضافة/تعديل مدين
 * Open debtor modal for add/edit
 * Requirements: 1.1, 3.1
 * @param {string} [debtorId] - معرف المدين للتعديل (اختياري)
 */
async function openDebtorModal(debtorId) {
    const modal = document.getElementById('debtor-modal');
    const modalTitle = document.getElementById('debtor-modal-title');
    const form = document.getElementById('debtor-form');
    const productSelect = document.getElementById('debtor-product');
    const paymentSection = document.getElementById('debtor-payment-section');
    const debtorIdInput = document.getElementById('debtor-id');

    if (!modal) {
        console.error('عنصر نافذة المدين غير موجود');
        return;
    }

    // تحميل المنتجات إذا كانت فارغة
    if (allProducts.length === 0) {
        await loadProducts();
    }

    // ملء قائمة المنتجات
    if (productSelect) {
        productSelect.innerHTML = '<option value="">-- اختر المنتج --</option>';
        allProducts.forEach(product => {
            const option = document.createElement('option');
            const productName = getProductDisplayName(product);
            const priceDzd = getProductPriceDZD(product);
            const priceUsd = getProductPriceUSD(product);
            option.value = product.id;
            option.textContent = `${productName} (${priceDzd} د.ج / $${priceUsd})`;
            option.dataset.productName = productName;
            productSelect.appendChild(option);
        });
    }

    // إعادة تعيين النموذج
    if (form) form.reset();
    if (debtorIdInput) debtorIdInput.value = '';

    // إخفاء قسم الدفع افتراضياً
    if (paymentSection) paymentSection.classList.add('hidden');

    // تحديد وضع الإضافة أو التعديل
    if (debtorId) {
        // وضع التعديل - تحميل بيانات المدين
        const debtor = allDebtors.find(d => d.id === debtorId);

        if (!debtor) {
            showToast('المدين غير موجود', 'error');
            return;
        }

        // تحديث عنوان النافذة
        if (modalTitle) modalTitle.textContent = '✏️ تعديل بيانات المدين';

        // ملء الحقول ببيانات المدين
        if (debtorIdInput) debtorIdInput.value = debtor.id;

        const nameInput = document.getElementById('debtor-name');
        const phoneInput = document.getElementById('debtor-phone');
        const amountInput = document.getElementById('debtor-amount');
        const currencySelect = document.getElementById('debtor-currency');
        const notesInput = document.getElementById('debtor-notes');

        if (nameInput) nameInput.value = debtor.name || '';
        if (phoneInput) phoneInput.value = debtor.phone || '';
        if (amountInput) amountInput.value = debtor.amountOwed || 0;
        if (currencySelect) currencySelect.value = debtor.currency || 'DZD';
        if (notesInput) notesInput.value = debtor.notes || '';

        // تحديد المنتج إذا كان موجوداً
        if (productSelect && debtor.productId) {
            productSelect.value = debtor.productId;
        }

        // إظهار قسم الدفع إذا كان الدين غير مدفوع بالكامل
        if (paymentSection && debtor.status !== 'paid') {
            paymentSection.classList.remove('hidden');

            // حساب المبلغ المتبقي
            const amountPaid = debtor.amountPaid || 0;
            const amountOwed = debtor.amountOwed || 0;
            const remaining = amountOwed - amountPaid;
            const currency = debtor.currency || 'DZD';

            const remainingDisplay = document.getElementById('debtor-remaining-amount');
            const paidDisplay = document.getElementById('debtor-paid-amount');

            if (remainingDisplay) {
                remainingDisplay.textContent = `${remaining.toLocaleString()} ${currency}`;
            }
            if (paidDisplay) {
                paidDisplay.textContent = `${amountPaid.toLocaleString()} ${currency}`;
            }
        }
    } else {
        // وضع الإضافة
        if (modalTitle) modalTitle.textContent = '💳 إضافة مدين جديد';
    }

    // إظهار النافذة
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // التركيز على حقل الاسم
    const nameInput = document.getElementById('debtor-name');
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
}

/**
 * إغلاق نافذة المدين
 * Close debtor modal
 * Requirements: 1.1
 */
function closeDebtorModal() {
    const modal = document.getElementById('debtor-modal');
    const form = document.getElementById('debtor-form');
    const paymentSection = document.getElementById('debtor-payment-section');
    const paymentAmountInput = document.getElementById('debtor-payment-amount');

    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // إعادة تعيين النموذج
    if (form) form.reset();

    // إخفاء قسم الدفع
    if (paymentSection) paymentSection.classList.add('hidden');

    // مسح حقل الدفعة
    if (paymentAmountInput) paymentAmountInput.value = '';

    // إعادة تعيين معرف المدين
    const debtorIdInput = document.getElementById('debtor-id');
    if (debtorIdInput) debtorIdInput.value = '';
}

/**
 * تسجيل دفعة من نافذة التعديل
 * Record payment from edit modal
 * Requirements: 3.2, 3.3
 */
async function recordDebtorPayment() {
    const debtorId = document.getElementById('debtor-id')?.value;
    const paymentAmountInput = document.getElementById('debtor-payment-amount');
    const paymentAmount = parseFloat(paymentAmountInput?.value) || 0;

    if (!debtorId) {
        showToast('معرف المدين غير صالح', 'error');
        return;
    }

    if (paymentAmount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }

    // استخدام وظيفة recordPayment الموجودة
    await recordPayment(debtorId, paymentAmount);

    // مسح حقل الدفعة
    if (paymentAmountInput) paymentAmountInput.value = '';

    // تحديث عرض المبالغ في النافذة
    const debtor = allDebtors.find(d => d.id === debtorId);
    if (debtor) {
        const amountPaid = debtor.amountPaid || 0;
        const amountOwed = debtor.amountOwed || 0;
        const remaining = amountOwed - amountPaid;
        const currency = debtor.currency || 'DZD';

        const remainingDisplay = document.getElementById('debtor-remaining-amount');
        const paidDisplay = document.getElementById('debtor-paid-amount');

        if (remainingDisplay) {
            remainingDisplay.textContent = `${remaining.toLocaleString()} ${currency}`;
        }
        if (paidDisplay) {
            paidDisplay.textContent = `${amountPaid.toLocaleString()} ${currency}`;
        }

        // إغلاق النافذة إذا تم الدفع بالكامل
        if (debtor.status === 'paid') {
            closeDebtorModal();
        }
    }
}

// جعل وظائف المديونين متاحة عالمياً
// 11.3 - Export functions to window object
window.loadDebtors = loadDebtors;
window.validateDebtorForm = validateDebtorForm;
window.saveDebtor = saveDebtor;
window.updateDebtor = updateDebtor;
window.deleteDebtor = deleteDebtor;
window.recordPayment = recordPayment;
window.getDebtAgeIndicator = getDebtAgeIndicator;
window.displayDebtorsTable = displayDebtorsTable;
window.quickPayment = quickPayment;
window.updateDebtorStats = updateDebtorStats;
window.filterDebtorsBySearch = filterDebtorsBySearch;
window.filterDebtorsByStatus = filterDebtorsByStatus;
window.sortDebtors = sortDebtors;
window.openDebtorModal = openDebtorModal;
window.closeDebtorModal = closeDebtorModal;
window.recordDebtorPayment = recordDebtorPayment;
window.initDebtorFormEvents = initDebtorFormEvents;


// ═══════════════════════════════════════════════════════════════════════════
// 🎁 إدارة المسابقات (Giveaway) - Giveaway Management
// ═══════════════════════════════════════════════════════════════════════════

let giveawaySettings = null;
let giveawayParticipants = [];
let giveawayWinners = [];

// تعريف الوظائف مسبقاً لتجنب أخطاء undefined
window.loadGiveawaySettings = loadGiveawaySettings;
window.saveGiveawaySettings = saveGiveawaySettings;
window.loadGiveawayParticipants = loadGiveawayParticipants;
window.loadGiveawayWinners = loadGiveawayWinners;
window.pickGiveawayWinner = pickGiveawayWinner;
window.toggleGiveaway = toggleGiveaway;
window.setGiveawayDuration = setGiveawayDuration;
window.resetGiveawayForm = resetGiveawayForm;

/**
 * تحميل إعدادات المسابقة من Firebase
 */
async function loadGiveawaySettings() {
    try {
        if (!window.db || !window.firebaseModules) {
            console.warn('⚠️ Firebase غير متاح');
            return;
        }

        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const docRef = doc(window.db, 'settings', 'giveaway');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            giveawaySettings = docSnap.data();
            console.log('✅ تم تحميل إعدادات المسابقة:', giveawaySettings);
        } else {
            // إعدادات افتراضية
            giveawaySettings = {
                active: false,
                prize: 'ChatGPT Business',
                duration: '1 شهر',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
        }

        updateGiveawayUI();
        loadGiveawayParticipants();
        loadGiveawayWinners();

    } catch (error) {
        console.error('خطأ في تحميل إعدادات المسابقة:', error);
    }
}

/**
 * حفظ إعدادات المسابقة في Firebase
 */
async function saveGiveawaySettings(settings) {
    try {
        if (!window.db) {
            showToast('Firebase غير متاح', 'error');
            return false;
        }

        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await setDoc(doc(window.db, 'settings', 'giveaway'), settings);

        giveawaySettings = settings;
        showToast('✅ تم حفظ إعدادات المسابقة بنجاح!', 'success');
        updateGiveawayUI();

        return true;
    } catch (error) {
        console.error('خطأ في حفظ إعدادات المسابقة:', error);
        showToast('خطأ في حفظ الإعدادات', 'error');
        return false;
    }
}

/**
 * تحديث واجهة المسابقة
 */
function updateGiveawayUI() {
    if (!giveawaySettings) return;

    // تحديث حالة التفعيل
    const activeBadge = document.getElementById('giveaway-active-badge');
    const toggleBtn = document.getElementById('btn-toggle-giveaway');
    const pickWinnerBtn = document.getElementById('btn-pick-winner');
    const activeCheckbox = document.getElementById('giveaway-active');

    if (giveawaySettings.active) {
        if (activeBadge) {
            activeBadge.textContent = '✅ مفعلة';
            activeBadge.style.background = 'rgba(34, 197, 94, 0.2)';
            activeBadge.style.color = '#22c55e';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = '⏸️ إيقاف المسابقة';
            toggleBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            toggleBtn.style.color = '#ef4444';
        }
        if (pickWinnerBtn) pickWinnerBtn.disabled = false;
        if (activeCheckbox) activeCheckbox.checked = true;
    } else {
        if (activeBadge) {
            activeBadge.textContent = '❌ غير مفعلة';
            activeBadge.style.background = 'rgba(239, 68, 68, 0.2)';
            activeBadge.style.color = '#ef4444';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = '▶️ تفعيل المسابقة';
            toggleBtn.style.background = 'rgba(34, 197, 94, 0.2)';
            toggleBtn.style.color = '#22c55e';
        }
        if (pickWinnerBtn) pickWinnerBtn.disabled = true;
        if (activeCheckbox) activeCheckbox.checked = false;
    }

    // تحديث معلومات الجائزة
    const prizeDisplay = document.getElementById('giveaway-prize-display');
    if (prizeDisplay) {
        prizeDisplay.textContent = giveawaySettings.prize + ' (' + giveawaySettings.duration + ')';
    }

    // تحديث تاريخ السحب
    const endDateDisplay = document.getElementById('giveaway-end-date-display');
    if (endDateDisplay && giveawaySettings.endDate) {
        const endDate = new Date(giveawaySettings.endDate);
        endDateDisplay.textContent = endDate.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // تحديث الوقت المتبقي
    updateGiveawayTimeRemaining();

    // تحديث النموذج
    const prizeSelect = document.getElementById('giveaway-prize');
    const durationSelect = document.getElementById('giveaway-duration');
    const startDateInput = document.getElementById('giveaway-start-date');
    const endDateInput = document.getElementById('giveaway-end-date');

    if (prizeSelect) prizeSelect.value = giveawaySettings.prize || 'ChatGPT Business';
    if (durationSelect) durationSelect.value = giveawaySettings.duration || '1 شهر';

    if (startDateInput && giveawaySettings.startDate) {
        startDateInput.value = new Date(giveawaySettings.startDate).toISOString().slice(0, 16);
    }
    if (endDateInput && giveawaySettings.endDate) {
        endDateInput.value = new Date(giveawaySettings.endDate).toISOString().slice(0, 16);
    }
}

/**
 * تحديث الوقت المتبقي
 */
function updateGiveawayTimeRemaining() {
    const timeDisplay = document.getElementById('giveaway-time-remaining');
    if (!timeDisplay || !giveawaySettings || !giveawaySettings.endDate) return;

    const now = new Date();
    const endDate = new Date(giveawaySettings.endDate);
    const diff = endDate - now;

    if (diff <= 0) {
        timeDisplay.textContent = 'انتهى!';
        timeDisplay.style.color = '#ef4444';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
        timeDisplay.textContent = `${days} يوم ${hours} ساعة`;
    } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeDisplay.textContent = `${hours} ساعة ${minutes} دقيقة`;
    }
}

// تحديث الوقت المتبقي كل دقيقة
setInterval(updateGiveawayTimeRemaining, 60000);

/**
 * تحميل المشاركين المؤهلين
 */
async function loadGiveawayParticipants() {
    if (!giveawaySettings) return;

    const listContainer = document.getElementById('giveaway-participants-list');
    const countDisplay = document.getElementById('giveaway-participants-display');

    if (listContainer) {
        listContainer.innerHTML = '<p class="text-gray-400 text-center py-4">جاري التحميل...</p>';
    }

    try {
        if (!window.db || !window.firebaseModules) return;

        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const startDate = new Date(giveawaySettings.startDate);

        giveawayParticipants = [];

        // تحميل من جميع مجموعات التقييمات
        const collections = [
            'reviews', 'chatgpt-reviews', 'adobe-reviews', 'gamma-reviews',
            'canva-reviews', 'capcut-reviews', 'netflix-reviews',
            'perplexity-reviews', 'tradingview-reviews', 'cursor-reviews'
        ];

        for (const collName of collections) {
            try {
                const q = query(collection(window.db, collName), orderBy('timestamp', 'desc'));
                const snapshot = await getDocs(q);

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const reviewDate = data.timestamp?.toDate?.() || new Date(data.timestamp);

                    if (reviewDate >= startDate && data.name) {
                        giveawayParticipants.push({
                            id: doc.id,
                            collection: collName,
                            name: data.name,
                            comment: data.comment || '',
                            product: data.product || collName.replace('-reviews', ''),
                            date: reviewDate,
                            rating: data.rating || 5
                        });
                    }
                });
            } catch (err) {
                // تجاهل الأخطاء للمجموعات غير الموجودة
            }
        }

        // ترتيب حسب التاريخ
        giveawayParticipants.sort((a, b) => b.date - a.date);

        // تحديث العدد
        if (countDisplay) {
            countDisplay.textContent = giveawayParticipants.length;
        }

        // عرض القائمة
        if (listContainer) {
            if (giveawayParticipants.length === 0) {
                listContainer.innerHTML = '<p class="text-gray-400 text-center py-4">لا يوجد مشاركين مؤهلين بعد</p>';
            } else {
                listContainer.innerHTML = giveawayParticipants.map((p, index) => `
                    <div class="flex items-center justify-between p-3 rounded-lg" style="background: rgba(255, 255, 255, 0.05);">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-bold" style="color: var(--accent);">#${index + 1}</span>
                            <div>
                                <div class="font-bold">${escapeHtml(p.name)}</div>
                                <div class="text-gray-400 text-sm">${p.product} • ${'⭐'.repeat(p.rating)}</div>
                            </div>
                        </div>
                        <div class="text-gray-400 text-sm">
                            ${p.date.toLocaleDateString('ar-DZ')}
                        </div>
                    </div>
                `).join('');
            }
        }

    } catch (error) {
        console.error('خطأ في تحميل المشاركين:', error);
        if (listContainer) {
            listContainer.innerHTML = '<p class="text-red-400 text-center py-4">خطأ في التحميل</p>';
        }
    }
}

/**
 * تحميل الفائزين السابقين
 */
async function loadGiveawayWinners() {
    const listContainer = document.getElementById('previous-winners-list');

    try {
        if (!window.db) return;

        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, 'giveaway-winners'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);

        giveawayWinners = [];
        snapshot.forEach(doc => {
            giveawayWinners.push({ id: doc.id, ...doc.data() });
        });

        if (listContainer) {
            if (giveawayWinners.length === 0) {
                listContainer.innerHTML = '<p class="text-gray-400 text-center py-4">لا يوجد فائزين سابقين</p>';
            } else {
                listContainer.innerHTML = giveawayWinners.map(w => `
                    <div class="flex items-center justify-between p-4 rounded-lg" style="background: linear-gradient(135deg, rgba(255, 213, 111, 0.1), rgba(16, 163, 127, 0.1)); border: 1px solid rgba(255, 213, 111, 0.3);">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">🏆</span>
                            <div>
                                <div class="font-bold text-lg" style="color: var(--accent);">${escapeHtml(w.name)}</div>
                                <div class="text-gray-400">${w.prize} (${w.duration || '1 شهر'})</div>
                            </div>
                        </div>
                        <div class="text-gray-400 text-sm">
                            ${new Date(w.date).toLocaleDateString('ar-DZ')}
                        </div>
                    </div>
                `).join('');
            }
        }

    } catch (error) {
        console.error('خطأ في تحميل الفائزين:', error);
    }
}

/**
 * اختيار الفائز عشوائياً
 */
async function pickGiveawayWinner() {
    if (!giveawaySettings || !giveawaySettings.active) {
        showToast('المسابقة غير مفعلة!', 'error');
        return;
    }

    if (giveawayParticipants.length === 0) {
        showToast('لا يوجد مشاركين مؤهلين!', 'error');
        return;
    }

    // تأكيد
    if (!confirm(`هل أنت متأكد من اختيار الفائز؟\n\nعدد المشاركين: ${giveawayParticipants.length}\nالجائزة: ${giveawaySettings.prize}`)) {
        return;
    }

    // اختيار عشوائي
    const randomIndex = Math.floor(Math.random() * giveawayParticipants.length);
    const winner = giveawayParticipants[randomIndex];

    // حفظ الفائز
    try {
        const { collection, addDoc } = window.firebaseModules;
        await addDoc(collection(window.db, 'giveaway-winners'), {
            name: winner.name,
            comment: winner.comment,
            product: winner.product,
            prize: giveawaySettings.prize,
            duration: giveawaySettings.duration,
            date: new Date().toISOString(),
            originalReviewId: winner.id,
            originalCollection: winner.collection
        });

        // إيقاف المسابقة
        giveawaySettings.active = false;
        await saveGiveawaySettings(giveawaySettings);

        // عرض الفائز
        showWinnerModal(winner);

        // تحديث القوائم
        loadGiveawayWinners();

    } catch (error) {
        console.error('خطأ في حفظ الفائز:', error);
        showToast('خطأ في حفظ الفائز', 'error');
    }
}

/**
 * عرض نافذة الفائز
 */
function showWinnerModal(winner) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-50';
    modal.style.background = 'rgba(0, 0, 0, 0.9)';
    modal.innerHTML = `
        <div class="rounded-2xl p-8 text-center max-w-md mx-4" style="background: linear-gradient(135deg, var(--card-bg), rgba(16, 163, 127, 0.2)); border: 2px solid var(--accent); animation: winnerPop 0.5s ease-out;">
            <div class="text-6xl mb-4" style="animation: bounce 1s infinite;">🎉🏆🎉</div>
            <h2 class="text-2xl font-bold mb-2">مبروك!</h2>
            <div class="text-3xl font-bold mb-4" style="color: var(--accent);">${escapeHtml(winner.name)}</div>
            <p class="text-gray-300 mb-4">ربح ${giveawaySettings.prize} لمدة ${giveawaySettings.duration}!</p>
            <p class="text-gray-400 text-sm mb-6">"${escapeHtml(winner.comment.substring(0, 100))}${winner.comment.length > 100 ? '...' : ''}"</p>
            <button onclick="this.parentElement.parentElement.remove()" class="px-8 py-3 rounded-lg font-bold" style="background: var(--accent); color: #1b1d32;">
                إغلاق
            </button>
        </div>
    `;

    // إضافة أنيميشن
    const style = document.createElement('style');
    style.textContent = `
        @keyframes winnerPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Confetti
    createConfetti();
}

/**
 * إنشاء تأثير الـ Confetti
 */
function createConfetti() {
    const colors = ['#ffd56f', '#10a37f', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];

    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -20px;
                z-index: 10000;
                animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }

    // إضافة أنيميشن السقوط
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes confettiFall {
                0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * تبديل حالة المسابقة
 */
async function toggleGiveaway() {
    if (!giveawaySettings) return;

    giveawaySettings.active = !giveawaySettings.active;
    await saveGiveawaySettings(giveawaySettings);

    if (giveawaySettings.active) {
        showToast('✅ تم تفعيل المسابقة!', 'success');
    } else {
        showToast('⏸️ تم إيقاف المسابقة', 'info');
    }
}

/**
 * تعيين مدة المسابقة بسرعة
 */
function setGiveawayDuration(days) {
    const now = new Date();
    const startDate = document.getElementById('giveaway-start-date');
    const endDate = document.getElementById('giveaway-end-date');

    if (startDate) {
        startDate.value = now.toISOString().slice(0, 16);
    }

    if (endDate) {
        const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        endDate.value = end.toISOString().slice(0, 16);
    }

    showToast(`✅ تم تعيين المدة: ${days} يوم`, 'success');
}

/**
 * إعادة تعيين نموذج المسابقة
 */
function resetGiveawayForm() {
    document.getElementById('giveaway-form')?.reset();
    showToast('🔄 تم إعادة تعيين النموذج', 'info');
}

/**
 * تهيئة أحداث نموذج المسابقة
 */
function initGiveawayEvents() {
    // نموذج المسابقة
    const form = document.getElementById('giveaway-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const prize = document.getElementById('giveaway-prize').value;
            const duration = document.getElementById('giveaway-duration').value;
            const startDate = document.getElementById('giveaway-start-date').value;
            const endDate = document.getElementById('giveaway-end-date').value;
            const active = document.getElementById('giveaway-active').checked;

            if (!prize) {
                showToast('الرجاء كتابة اسم الجائزة', 'error');
                return;
            }

            if (!startDate || !endDate) {
                showToast('الرجاء تحديد تاريخ البداية والنهاية', 'error');
                return;
            }

            const settings = {
                prize: prize,
                duration: duration || 'شهر',
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                active: active
            };

            await saveGiveawaySettings(settings);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الأسعار المباشرة - Live Pricing Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render Live Pricing Management List
 */
function renderLivePricingList() {
    const container = document.getElementById('live-pricing-list');
    if (!container) return;

    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500">لا توجد منتجات محملة</div>';
        return;
    }

    let html = '';

    allProducts.forEach(product => {
        const productName = typeof product.name === 'object' ? (product.name.ar || product.name.en || product.id) : (product.name || product.id);

        html += `
            <div class="rounded-xl p-6 bg-gray-800 border border-gray-700 shadow-xl product-live-card mb-4" data-product-id="${product.id}">
                <div class="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
                    <div class="w-12 h-12 rounded-lg bg-purple-900/50 flex items-center justify-center text-2xl">📦</div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-bold text-white">${escapeHtml(productName)}</h3>
                            <span class="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-400 uppercase">${product.source || 'db'}</span>
                        </div>
                        <p class="text-xs text-gray-500">ID: <code class="bg-gray-900 px-1 rounded text-purple-400">${product.id}</code></p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Main Price -->
                    <div class="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
                        <label class="block text-sm text-gray-400 mb-2">السعر الأساسي</label>
                        <div class="flex gap-2">
                            <div class="flex-1">
                                <span class="text-xs text-gray-500 mb-1 block">DZD</span>
                                <input type="number" class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-green-500 outline-none text-white live-main-price-dzd" 
                                    value="${product.price_dzd || 0}">
                            </div>
                            <div class="flex-1">
                                <span class="text-xs text-gray-500 mb-1 block">USD</span>
                                <input type="number" class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-green-500 outline-none text-white live-main-price-usd" 
                                    value="${product.price_usd || 0}">
                            </div>
                        </div>
                    </div>

                    <!-- Durations -->
                    <div class="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
                         <label class="block text-sm text-gray-400 mb-2">الخيارات (Durations)</label>
                         ${renderLiveDurations(product)}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderLiveDurations(product) {
    let html = '<div class="space-y-3 live-durations-container" data-product-id="' + product.id + '">';

    if (product.durations && Object.keys(product.durations).length > 0) {
        Object.entries(product.durations).forEach(([key, prices]) => {
            const isAvailable = prices.available !== false;
            html += `
                <div class="p-3 bg-gray-800 rounded border border-gray-700 duration-row group relative" data-duration-id="${key}">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-purple-400">${key.toUpperCase()}</span>
                            <label class="inline-flex items-center cursor-pointer ml-3">
                                <input type="checkbox" class="sr-only peer live-duration-available" ${isAvailable ? 'checked' : ''}>
                                <div class="w-7 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600 relative"></div>
                                <span class="ml-1 text-[10px] text-gray-400 peer-checked:text-green-400">متوفر</span>
                            </label>
                        </div>
                        <button onclick="deleteLiveDuration('${product.id}', '${key}')" 
                            class="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="حذف هذا العرض">
                            🗑️
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <input type="number" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white live-duration-dzd" 
                                placeholder="DZD" value="${prices.dzd || 0}">
                        </div>
                        <div class="flex-1">
                            <input type="number" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white live-duration-usd" 
                                placeholder="USD" value="${prices.usd || 0}">
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p class="text-xs text-gray-500 italic no-durations-msg">لا توجد خيارات إضافية</p>';
    }

    html += `
        <button onclick="addLiveDurationPrompt('${product.id}')" 
            class="w-full py-2 mt-2 bg-purple-600/20 hover:bg-purple-600/40 border border-dashed border-purple-500/50 rounded-lg text-xs text-purple-300 transition-all">
            ➕ إضافة فرع/مدة جديدة
        </button>
    </div>`;
    return html;
}

/**
 * Prompt to add a new duration
 */
function addLiveDurationPrompt(productId) {
    const id = prompt('أدخل معرف الفرع الجديد (مثلاً: plus_3m أو teachers_1y)\n* استخدم أحرف إنجليزية فقط وبدون مسافات');
    if (!id || id.trim() === '') return;

    const dzd = prompt('السعر بالدينار (DZD):', '0');
    const usd = prompt('السعر بالدولار (USD):', '0');

    const product = allProducts.find(p => p.id === productId);
    if (product) {
        if (!product.durations) product.durations = {};
        product.durations[id.toLowerCase().trim()] = {
            dzd: parseFloat(dzd) || 0,
            usd: parseFloat(usd) || 0,
            available: true
        };
        renderLivePricingList();
        showToast('تم إضافة الفرع مؤقتاً، اضغط حفظ للنشر ✅', 'info');
    }
}

/**
 * Delete a duration from local list
 */
function deleteLiveDuration(productId, durationId) {
    if (!confirm(t('msg_confirm_delete_duration') + ` "${durationId}"`)) return;

    const product = allProducts.find(p => p.id === productId);
    if (product && product.durations && product.durations[durationId]) {
        delete product.durations[durationId];
        renderLivePricingList();
        showToast('تم حذف الفرع مؤقتاً، اضغط حفظ للنشر ✅', 'info');
    }
}

/**
 * Save all prices from the live pricing UI to Firebase
 */
async function saveAllLivePrices() {
    if (!window.db || !window.firebaseModules) {
        showToast('Firebase غير متصل', 'error');
        return;
    }

    const { doc, updateDoc } = window.firebaseModules;
    const cards = document.querySelectorAll('.product-live-card');

    showToast('جاري حفظ الأسعار... ⏳', 'info');
    let successCount = 0;

    try {
        for (const card of cards) {
            const productId = card.dataset.productId;
            const mainDzd = card.querySelector('.live-main-price-dzd').value;
            const mainUsd = card.querySelector('.live-main-price-usd').value;

            // Collect durations
            const durations = {};
            card.querySelectorAll('.duration-row').forEach(row => {
                const durId = row.dataset.durationId;
                const durDzd = row.querySelector('.live-duration-dzd').value;
                const durUsd = row.querySelector('.live-duration-usd').value;
                const durAvailable = row.querySelector('.live-duration-available').checked;
                durations[durId] = {
                    dzd: parseFloat(durDzd),
                    usd: parseFloat(durUsd),
                    available: durAvailable
                };
            });

            const updateData = {
                price_dzd: parseFloat(mainDzd),
                price_usd: parseFloat(mainUsd),
                priceDZD: parseFloat(mainDzd),
                priceUSD: parseFloat(mainUsd),
                updatedAt: new Date()
            };

            if (Object.keys(durations).length > 0) {
                updateData.durations = durations;
            }

            await updateDoc(doc(window.db, ADMIN_PRODUCTS_COLLECTION_NAME, productId), updateData);
            await updateDoc(doc(window.db, LEGACY_PRODUCTS_COLLECTION_NAME, productId), updateData);

            // Update local memory
            const prod = allProducts.find(p => p.id === productId);
            if (prod) {
                prod.price_dzd = updateData.price_dzd;
                prod.price_usd = updateData.price_usd;
                prod.priceDZD = updateData.priceDZD;
                prod.priceUSD = updateData.priceUSD;
                if (updateData.durations) prod.durations = updateData.durations;
            }

            successCount++;
        }

        showToast(`تم حفظ وتحديث أسعار ${successCount} منتج بنجاح! ✅`, 'success');
        logActivity('product', 'live_price_update', `Updated ${successCount} product prices live`);

        // Refresh the table in Products tab too
        displayProductsTable();
    } catch (error) {
        console.error('Error saving live prices:', error);
        showToast('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.', 'error');
    }
}

// جعل الوظائف متاحة عالمياً
window.renderLivePricingList = renderLivePricingList;
window.saveAllLivePrices = saveAllLivePrices;
window.addLiveDurationPrompt = addLiveDurationPrompt;
window.deleteLiveDuration = deleteLiveDuration;

// تحميل الميزات عند فتح التبويبات
if (typeof window.originalShowTab === 'undefined') {
    window.originalShowTab = window.showTab;
}
window.showTab = function (tabName) {
    if (typeof window.originalShowTab === 'function') {
        window.originalShowTab(tabName);
    }

    if (tabName === 'giveaway') {
        if (typeof loadGiveawaySettings === 'function') loadGiveawaySettings();
    }

    if (tabName === 'live-pricing') {
        renderLivePricingList();
    }

    if (tabName === 'resellers') {
        // Load transactions for wallet history
        if (typeof loadTransactions === 'function') loadTransactions();
        // Refresh resellers data
        if (typeof loadResellers === 'function') loadResellers();
    }
};

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initGiveawayEvents === 'function') initGiveawayEvents();
});

// ═══════════════════════════════════════════════════════════════════════════
// وظائف الموزعين ونظام المحفظة - Resellers & Wallet System
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل الموزعين
 */
async function loadResellers() {
    try {
        if (!window.db || !window.firebaseModules) return;
        const { collection, getDocs, query, orderBy } = window.firebaseModules;

        const q = query(collection(window.db, 'resellers'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);

        allResellers = [];
        snapshot.forEach(doc => {
            allResellers.push({ id: doc.id, ...doc.data() });
        });

        displayResellersTable();

        // تحديث قائمة الموزعين في نافذة البيع
        updateSaleResellerList();

        // تحديث إحصائيات الخزينة والالتزامات
        updateCapitalDisplay();

    } catch (error) {
        console.error('Error loading resellers:', error);
        showToast(t('err_load_resellers'), 'error');
    }
}

/**
 * عرض جدول الموزعين
 */
function displayResellersTable() {
    const tbody = document.getElementById('resellers-table-body');
    if (!tbody) return;

    if (allResellers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-400">${t('no_resellers')}</td></tr>`;
        return;
    }

    tbody.innerHTML = allResellers.map(reseller => `
        <tr class="border-b border-gray-700/50 hover:bg-gray-800/30">
            <td class="p-4 font-bold text-white">${reseller.name}</td>
            <td class="p-4 text-gray-400">${reseller.email || '-'}</td>
            <td class="p-4 text-gray-400">${reseller.phone || '-'}</td>
            <td class="p-4">
                <span class="font-bold ${(reseller.walletBalance || 0) > 0 ? 'text-green-400' : 'text-red-400'}">
                    ${(reseller.walletBalance || 0).toLocaleString()} د.ج
                </span>
            </td>
            <td class="p-4 text-center">${reseller.totalSales || 0}</td>
            <td class="p-4 text-center">
                <div class="flex gap-2 justify-center flex-wrap">
                    <button onclick="openAddFundsModal('${reseller.id}')" class="px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition">${t('btn_fund')}</button>
                    <button onclick="openResellerModal('${reseller.id}')" class="px-3 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition">${t('btn_edit')}</button>
                    <button onclick="openSaleModalForReseller('${reseller.id}')" class="px-3 py-1 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition">${t('btn_sell')}</button>
                    <button onclick="deleteResellerWithCleanup('${reseller.id}')" class="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * فتح نافذة الموزع (إضافة/تعديل)
 */
function openResellerModal(resellerId = null) {
    const modal = document.getElementById('reseller-modal');
    const form = document.getElementById('reseller-form');
    const title = document.getElementById('reseller-modal-title');

    if (form) form.reset();
    document.getElementById('reseller-id').value = '';

    if (resellerId) {
        const reseller = allResellers.find(r => r.id === resellerId);
        if (reseller) {
            title.textContent = t('modal_title_edit_reseller');
            document.getElementById('reseller-id').value = reseller.id;
            document.getElementById('reseller-name').value = reseller.name;
            document.getElementById('reseller-email').value = reseller.email || '';
            document.getElementById('reseller-phone').value = reseller.phone || '';
            document.getElementById('reseller-notes').value = reseller.notes || '';
        }
    } else {
        title.textContent = t('modal_title_add_reseller');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeResellerModal() {
    const modal = document.getElementById('reseller-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * حفظ الموزع
 */
document.getElementById('reseller-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('reseller-id').value;
    const data = {
        name: document.getElementById('reseller-name').value,
        email: document.getElementById('reseller-email').value,
        phone: document.getElementById('reseller-phone').value,
        notes: document.getElementById('reseller-notes').value,
        updatedAt: new Date().toISOString()
    };

    try {
        const { collection, addDoc, doc, updateDoc } = window.firebaseModules;

        if (id) {
            await updateDoc(doc(window.db, 'resellers', id), data);
            showToast(t('msg_reseller_updated'));
        } else {
            data.walletBalance = 0;
            data.totalSales = 0;
            data.createdAt = new Date().toISOString();
            await addDoc(collection(window.db, 'resellers'), data);
            showToast(t('msg_reseller_added'));
        }
        closeResellerModal();
        loadResellers();
    } catch (error) {
        console.error('Error saving reseller:', error);
        showToast(t('msg_error'), 'error');
    }
});

/**
 * حذف الموزع مع تنظيف كل بياناته (الطلبات والمعاملات)
 */
async function deleteResellerWithCleanup(resellerId) {
    const reseller = allResellers.find(r => r.id === resellerId);
    if (!reseller) return;

    const confirmMsg = `⚠️ هل تريد حذف الموزع "${reseller.name}" نهائياً؟\n\n` +
        `سيتم حذف:\n` +
        `• حسابه\n` +
        `• جميع طلباته\n` +
        `• جميع إيداعاته ومعاملاته\n\n` +
        `رصيده الحالي: ${(reseller.walletBalance || 0).toLocaleString()} د.ج`;

    if (!confirm(confirmMsg)) return;

    try {
        showToast('⏳ جاري حذف الموزع وبياناته...', 'info');

        const { collection, getDocs, deleteDoc, doc, query, where } = window.firebaseModules;

        // 1. حذف جميع طلبات هذا الموزع
        const ordersSnap = await getDocs(query(
            collection(window.db, 'orders'),
            where('resellerId', '==', resellerId)
        ));
        for (const docSnap of ordersSnap.docs) {
            await deleteDoc(doc(window.db, 'orders', docSnap.id));
        }
        console.log(`🗑️ حذف ${ordersSnap.size} طلب للموزع`);

        // 2. حذف جميع معاملات هذا الموزع (إيداعات، استرجاعات، إلخ)
        const transSnap = await getDocs(query(
            collection(window.db, 'transactions'),
            where('resellerId', '==', resellerId)
        ));
        for (const docSnap of transSnap.docs) {
            await deleteDoc(doc(window.db, 'transactions', docSnap.id));
        }
        console.log(`🗑️ حذف ${transSnap.size} معاملة للموزع`);

        // 3. حذف الموزع نفسه
        await deleteDoc(doc(window.db, 'resellers', resellerId));

        showToast(`✅ تم حذف ${reseller.name} وجميع بياناته بنجاح`);

        // تحديث كل البيانات
        await loadResellers();
        await loadOrders();
        await loadTransactions();
        await loadAccountingData();
        updateCapitalDisplay();

    } catch (error) {
        console.error('خطأ في حذف الموزع:', error);
        showToast('❌ خطأ في حذف الموزع: ' + error.message, 'error');
    }
}

// تصدير الدالة
window.deleteResellerWithCleanup = deleteResellerWithCleanup;

/**
 * نافذة شحن الرصيد
 */
function openAddFundsModal(resellerId) {
    const reseller = allResellers.find(r => r.id === resellerId);
    if (!reseller) return;

    document.getElementById('funds-reseller-id').value = reseller.id;
    document.getElementById('funds-reseller-name').textContent = reseller.name;
    document.getElementById('funds-current-balance').textContent = (reseller.walletBalance || 0).toLocaleString() + ' د.ج';
    document.getElementById('funds-amount').value = '';
    document.getElementById('funds-notes').value = '';

    const modal = document.getElementById('add-funds-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeAddFundsModal() {
    const modal = document.getElementById('add-funds-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * تنفيذ شحن الرصيد
 */
document.getElementById('add-funds-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resellerId = document.getElementById('funds-reseller-id').value;
    const amount = parseFloat(document.getElementById('funds-amount').value);
    const notes = document.getElementById('funds-notes').value;

    if (!amount || amount <= 0) {
        showToast('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }

    try {
        const { doc, updateDoc, collection, addDoc, increment, serverTimestamp } = window.firebaseModules;

        // 1. تحديث رصيد الموزع
        await updateDoc(doc(window.db, 'resellers', resellerId), {
            walletBalance: increment(amount),
            walletTransactions: increment(1), // Optional counter
            lastDepositAt: serverTimestamp()
        });

        // 2. تسجيل المعاملة (Capital Injection)
        await addDoc(collection(window.db, 'transactions'), {
            type: 'wallet_deposit',
            resellerId: resellerId,
            resellerName: document.getElementById('funds-reseller-name').textContent,
            amount: amount, // DZD assumed
            notes: notes,
            timestamp: serverTimestamp(),
            createdAt: new Date() // For sorting/filtering locally without conversion
        });

        showToast(`✅ تم شحن ${amount} د.ج بنجاح`);
        closeAddFundsModal();

        // تحديث البيانات
        await loadResellers();
        await loadTransactions();
    } catch (error) {
        console.error('Error adding funds:', error);
        showToast(t('err_funds_failed'), 'error');
    }
});

/**
 * تحميل المعاملات (للخزينة)
 */
async function loadTransactions() {
    try {
        if (!window.db || !window.firebaseModules) return;
        const { collection, getDocs, query, orderBy } = window.firebaseModules;

        // Try to order by timestamp if possible, otherwise just fetch
        const q = collection(window.db, 'transactions');
        const snapshot = await getDocs(q);

        allTransactions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate
                ? data.createdAt.toDate()
                : (data.createdAt ? new Date(data.createdAt) : new Date());
            allTransactions.push({
                id: doc.id,
                ...data,
                createdAt
            });
        });

        // تحديث عرض رأس المال والمحاسبة
        updateCapitalDisplay();

        // If the chart function exists (added in next step), call it
        if (typeof updateProfitSourceChart === 'function') updateProfitSourceChart();

    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

/**
 * Helper: Filter Transactions
 */
function filterTransactionsByDate(transactions, filter) {
    if (filter === 'all') return transactions;

    const now = new Date();
    let startDate = new Date();

    if (filter === 'today') {
        startDate.setHours(0, 0, 0, 0);
        return transactions.filter(t => t.createdAt >= startDate);
    }

    if (filter === 'week') {
        startDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
    } else if (filter === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
    } else {
        return transactions;
    }

    return transactions.filter(t => t.createdAt >= startDate);
}

/**
 * Sale Logic Helpers
 */
function setSaleType(type) {
    const resellerGroup = document.getElementById('sale-reseller-group');
    const contactGroup = document.getElementById('sale-contact-group');
    const btnDirect = document.getElementById('btn-sale-direct');
    const btnWholesale = document.getElementById('btn-sale-wholesale');
    const typeInput = document.getElementById('sale-type');

    if (typeInput) typeInput.value = type;

    if (type === 'wholesale') {
        if (resellerGroup) resellerGroup.classList.remove('hidden');
        if (contactGroup) contactGroup.classList.add('hidden');

        if (btnWholesale) {
            btnWholesale.classList.remove('border-gray-600', 'bg-transparent', 'text-gray-400');
            btnWholesale.classList.add('border-blue-500', 'bg-blue-500/20', 'text-blue-400', 'font-bold');
        }

        if (btnDirect) {
            btnDirect.classList.add('border-gray-600', 'bg-transparent', 'text-gray-400');
            btnDirect.classList.remove('border-green-500', 'bg-green-500/20', 'text-green-400', 'font-bold');
        }

        // تحميل الموزعين إذا لزم
        if (allResellers.length === 0) loadResellers();
        else updateSaleResellerList();

    } else {
        if (resellerGroup) resellerGroup.classList.add('hidden');
        if (contactGroup) contactGroup.classList.remove('hidden');

        if (btnDirect) {
            btnDirect.classList.add('border-green-500', 'bg-green-500/20', 'text-green-400', 'font-bold');
            btnDirect.classList.remove('border-gray-600', 'bg-transparent', 'text-gray-400');
        }

        if (btnWholesale) {
            btnWholesale.classList.add('border-gray-600', 'bg-transparent', 'text-gray-400');
            btnWholesale.classList.remove('border-blue-500', 'bg-blue-500/20', 'text-blue-400', 'font-bold');
        }
    }
}

function updateSaleResellerList() {
    const select = document.getElementById('sale-reseller-select');
    if (!select) return;

    // Save current selection
    const currentVal = select.value;

    select.innerHTML = '<option value="">-- اختر الموزع --</option>';
    allResellers.forEach(r => {
        const option = document.createElement('option');
        option.value = r.id;
        option.textContent = `${r.name}`;
        option.dataset.balance = r.walletBalance || 0;
        select.appendChild(option);
    });

    if (currentVal) select.value = currentVal;

    select.onchange = () => {
        const opt = select.options[select.selectedIndex];
        const display = document.getElementById('sale-reseller-balance-display');
        if (opt && opt.value) {
            display.textContent = `الرصيد المتوفر: ${parseFloat(opt.dataset.balance).toLocaleString()} د.ج`;
            display.className = 'text-xs mt-1 ' + (parseFloat(opt.dataset.balance) > 0 ? 'text-green-400' : 'text-red-400');
        } else {
            display.textContent = 'الرصيد: -';
        }
    };
}

function openSaleModalForReseller(resellerId) {
    if (typeof openSaleModal === 'function') openSaleModal();
    setSaleType('wholesale');

    setTimeout(() => {
        const select = document.getElementById('sale-reseller-select');
        if (select) {
            select.value = resellerId;
            // Trip change event manually
            if (select.onchange) select.onchange();
        }
    }, 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// Initialization Hooks & Charting
// ═══════════════════════════════════════════════════════════════════════════

const originalShowTabForResellers = window.showTab;
window.showTab = function (tabName) {
    originalShowTabForResellers(tabName);

    if (tabName === 'resellers' && allResellers.length === 0) {
        loadResellers();
    }
    if (tabName === 'accounting' && allTransactions.length === 0) {
        loadTransactions();
    }
};

// Initial Load
// Initial Load handled in initAdminPage / showDashboard

// New Chart Function
function updateProfitSourceChart() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );

    let retailProfit = 0;
    let wholesaleProfit = 0;

    filteredOrders.forEach(order => {
        const amount = getOrderRevenueDzd(order);
        const cost = getOrderCostDzd(order);

        const profit = amount - cost;

        if (order.source === 'wholesale') {
            wholesaleProfit += profit;
        } else {
            retailProfit += profit;
        }
    });

    if (window.profitSourceChart) {
        window.profitSourceChart.destroy();
        window.profitSourceChart = null;
    }

    const positiveRetail = Math.max(retailProfit, 0);
    const positiveWholesale = Math.max(wholesaleProfit, 0);
    const positiveTotal = positiveRetail + positiveWholesale;
    const retailPercent = positiveTotal > 0 ? (positiveRetail / positiveTotal) * 100 : 0;
    const wholesalePercent = positiveTotal > 0 ? (positiveWholesale / positiveTotal) * 100 : 0;

    const retailValueEl = document.getElementById('profit-source-retail-value');
    const wholesaleValueEl = document.getElementById('profit-source-wholesale-value');
    const retailPercentEl = document.getElementById('profit-source-retail-percent');
    const wholesalePercentEl = document.getElementById('profit-source-wholesale-percent');
    const retailBarEl = document.getElementById('profit-source-retail-bar');
    const wholesaleBarEl = document.getElementById('profit-source-wholesale-bar');
    const emptyEl = document.getElementById('profit-source-empty');

    if (retailValueEl) retailValueEl.textContent = `${Math.round(retailProfit).toLocaleString()} د.ج`;
    if (wholesaleValueEl) wholesaleValueEl.textContent = `${Math.round(wholesaleProfit).toLocaleString()} د.ج`;
    if (retailPercentEl) retailPercentEl.textContent = `${retailPercent.toFixed(0)}%`;
    if (wholesalePercentEl) wholesalePercentEl.textContent = `${wholesalePercent.toFixed(0)}%`;
    if (retailBarEl) retailBarEl.style.width = `${positiveTotal > 0 ? retailPercent : 50}%`;
    if (wholesaleBarEl) wholesaleBarEl.style.width = `${positiveTotal > 0 ? wholesalePercent : 50}%`;
    if (emptyEl) emptyEl.classList.toggle('hidden', positiveTotal > 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// وظائف سجل مبيعات الجملة - Wholesale Logs Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * عرض تبويب فرعي في صفحة الموزعين
 */
function showResellerSubTab(tabName) {
    // Hide all sub-tab content
    document.getElementById('reseller-subtab-content-list').classList.add('hidden');
    document.getElementById('reseller-subtab-content-wholesale-log').classList.add('hidden');

    // Remove active from all buttons
    document.querySelectorAll('.reseller-subtab-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600/20', 'text-purple-400', 'border-purple-500/50');
        btn.classList.add('bg-gray-700/30', 'text-gray-400', 'border-gray-600/50');
    });

    // Show selected tab
    if (tabName === 'list') {
        document.getElementById('reseller-subtab-content-list').classList.remove('hidden');
        document.getElementById('reseller-subtab-list').classList.add('bg-purple-600/20', 'text-purple-400', 'border-purple-500/50');
        document.getElementById('reseller-subtab-list').classList.remove('bg-gray-700/30', 'text-gray-400', 'border-gray-600/50');
    } else if (tabName === 'wholesale-log') {
        document.getElementById('reseller-subtab-content-wholesale-log').classList.remove('hidden');
        document.getElementById('reseller-subtab-wholesale-log').classList.add('bg-purple-600/20', 'text-purple-400', 'border-purple-500/50');
        document.getElementById('reseller-subtab-wholesale-log').classList.remove('bg-gray-700/30', 'text-gray-400', 'border-gray-600/50');
        loadWholesaleLogs();
    }
}

/**
 * تحميل سجل مبيعات الجملة
 */
async function loadWholesaleLogs() {
    if (!window.firebaseModules) {
        console.log('⏳ Firebase غير جاهز');
        return;
    }

    try {
        // Filter orders where source = 'wholesale'
        const wholesaleOrders = allOrders.filter(order => order.source === 'wholesale');

        // Update reseller filter dropdown
        updateWholesaleResellerFilter();

        // Display and calculate stats
        displayWholesaleLogsTable(wholesaleOrders);
        updateWholesaleStats(wholesaleOrders);

    } catch (error) {
        console.error('خطأ في تحميل سجل الجملة:', error);
    }
}

/**
 * تحديث قائمة الموزعين في فلتر الجملة
 */
function updateWholesaleResellerFilter() {
    const select = document.getElementById('wholesale-reseller-filter');
    if (!select) return;

    // Keep only the "all" option
    select.innerHTML = '<option value="all">كل الموزعين</option>';

    allResellers.forEach(r => {
        const option = document.createElement('option');
        option.value = r.id;
        option.textContent = r.name;
        select.appendChild(option);
    });
}

/**
 * فلترة سجل الجملة
 */
function filterWholesaleLogs() {
    const resellerFilter = document.getElementById('wholesale-reseller-filter')?.value || 'all';
    const dateFilter = document.getElementById('wholesale-date-filter')?.value || 'all';

    let filtered = allOrders.filter(order => order.source === 'wholesale');

    // Filter by reseller
    if (resellerFilter !== 'all') {
        filtered = filtered.filter(order => order.resellerId === resellerFilter);
    }

    // Filter by date
    filtered = filterOrdersByDate(filtered, dateFilter);

    displayWholesaleLogsTable(filtered);
    updateWholesaleStats(filtered);
}

/**
 * عرض جدول سجل الجملة
 */
function displayWholesaleLogsTable(orders) {
    const tbody = document.getElementById('wholesale-log-table-body');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-gray-400">لا توجد مبيعات جملة</td></tr>';
        return;
    }

    // Sort by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = getOrderDate(a);
        const dateB = getOrderDate(b);
        return dateB - dateA;
    });

    tbody.innerHTML = sortedOrders.map(order => {
        // Get reseller name
        const reseller = allResellers.find(r => r.id === order.resellerId);
        const resellerName = reseller?.name || order.customerName || '-';

        // Calculate amounts using the same rules as the accounting tab.
        const soldPrice = getOrderRevenueDzd(order);
        const costPrice = getOrderCostDzd(order);
        const profit = soldPrice - costPrice;

        // Format date
        const orderDate = getOrderDate(order);
        const dateStr = orderDate.toLocaleDateString('fr-DZ', { year: 'numeric', month: 'short', day: 'numeric' });

        return `
            <tr class="wholesale-mobile-row border-b border-gray-700/30 hover:bg-gray-800/30">
                <td class="p-3 text-gray-400" data-label="التاريخ">${dateStr}</td>
                <td class="p-3 text-white font-bold" data-label="الموزع">${resellerName}</td>
                <td class="p-3" data-label="المنتج">${order.productName || '-'}</td>
                <td class="p-3 text-red-400" data-label="التكلفة">${costPrice.toLocaleString()} د.ج</td>
                <td class="p-3 text-blue-400" data-label="سعر البيع">${soldPrice.toLocaleString()} د.ج</td>
                <td class="p-3 font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}" data-label="الربح">${profit.toLocaleString()} د.ج</td>
                <td class="p-3 text-center" data-label="إجراءات">
                    <button onclick="deleteWholesaleOrder('${order.id}', '${order.resellerId}', ${soldPrice}, '${resellerName.replace(/'/g, "\\'")}')" 
                        class="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition" 
                        title="حذف واسترجاع المبلغ">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * تحديث إحصائيات الجملة
 */
function updateWholesaleStats(orders) {
    let totalRevenue = 0;
    let totalCost = 0;

    orders.forEach(order => {
        const soldPrice = getOrderRevenueDzd(order);
        const costPrice = getOrderCostDzd(order);

        totalRevenue += soldPrice;
        totalCost += costPrice;
    });

    const totalProfit = totalRevenue - totalCost;

    const countEl = document.getElementById('stat-wholesale-count');
    const revenueEl = document.getElementById('stat-wholesale-revenue');
    const costEl = document.getElementById('stat-wholesale-cost');
    const profitEl = document.getElementById('stat-wholesale-profit');

    if (countEl) countEl.textContent = orders.length;
    if (revenueEl) revenueEl.textContent = totalRevenue.toLocaleString() + ' د.ج';
    if (costEl) costEl.textContent = totalCost.toLocaleString() + ' د.ج';
    if (profitEl) profitEl.textContent = totalProfit.toLocaleString() + ' د.ج';
}

// ═══════════════════════════════════════════════════════════════════════════
// وظائف سجل الموزع الفردي - Reseller History Modal Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فتح نافذة سجل الموزع
 */
function openResellerHistoryModal(resellerId) {
    const reseller = allResellers.find(r => r.id === resellerId);
    if (!reseller) {
        showToast('الموزع غير موجود', 'error');
        return;
    }

    document.getElementById('history-reseller-id').value = resellerId;
    document.getElementById('history-reseller-name').textContent = reseller.name;
    document.getElementById('history-current-balance').textContent = (reseller.walletBalance || 0).toLocaleString() + ' د.ج';

    // Load history data
    loadResellerHistory(resellerId);

    // Show modal
    const modal = document.getElementById('reseller-history-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Reset to wallet tab
    showHistorySubTab('wallet');
}

/**
 * إغلاق نافذة سجل الموزع
 */
function closeResellerHistoryModal() {
    const modal = document.getElementById('reseller-history-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * عرض تبويب فرعي في سجل الموزع
 */
function showHistorySubTab(tabName) {
    // Hide all sub-tab content
    document.getElementById('history-subtab-content-wallet').classList.add('hidden');
    document.getElementById('history-subtab-content-purchases').classList.add('hidden');

    // Remove active from all buttons
    document.querySelectorAll('.history-subtab-btn').forEach(btn => {
        btn.classList.remove('bg-green-600/20', 'text-green-400', 'border-green-500/50');
        btn.classList.add('bg-gray-700/30', 'text-gray-400', 'border-gray-600/50');
    });

    // Show selected tab
    if (tabName === 'wallet') {
        document.getElementById('history-subtab-content-wallet').classList.remove('hidden');
        document.getElementById('history-subtab-wallet').classList.add('bg-green-600/20', 'text-green-400', 'border-green-500/50');
        document.getElementById('history-subtab-wallet').classList.remove('bg-gray-700/30', 'text-gray-400', 'border-gray-600/50');
    } else if (tabName === 'purchases') {
        document.getElementById('history-subtab-content-purchases').classList.remove('hidden');
        document.getElementById('history-subtab-purchases').classList.add('bg-green-600/20', 'text-green-400', 'border-green-500/50');
        document.getElementById('history-subtab-purchases').classList.remove('bg-gray-700/30', 'text-gray-400', 'border-gray-600/50');
    }
}

/**
 * تحميل سجل الموزع (المحفظة والمشتريات)
 */
async function loadResellerHistory(resellerId) {
    // Load wallet transactions for this reseller
    const walletTransactions = allTransactions.filter(t => t.resellerId === resellerId);
    displayWalletHistory(walletTransactions);

    // Load purchase history (orders where resellerId matches)
    const purchases = allOrders.filter(order => order.resellerId === resellerId);
    displayPurchaseHistory(purchases);

    // Update stats
    let totalDeposits = 0;
    let totalSpent = 0;

    walletTransactions.forEach(t => {
        if (t.type === 'wallet_deposit') {
            totalDeposits += parseFloat(t.amount) || 0;
        }
    });

    purchases.forEach(order => {
        let amount = parseFloat(order.amount) || 0;
        if (order.currency === 'USD') {
            amount = amount * (order.exchangeRate || USD_TO_DZD_RATE);
        }
        totalSpent += amount;
    });

    document.getElementById('history-total-deposits').textContent = totalDeposits.toLocaleString() + ' د.ج';
    document.getElementById('history-total-spent').textContent = totalSpent.toLocaleString() + ' د.ج';
    document.getElementById('history-total-orders').textContent = purchases.length;
}

/**
 * عرض سجل المحفظة
 */
function displayWalletHistory(transactions) {
    const tbody = document.getElementById('history-wallet-table-body');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-gray-400">لا توجد عمليات</td></tr>';
        return;
    }

    // Sort by date (newest first)
    const sorted = [...transactions].sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB - dateA;
    });

    tbody.innerHTML = sorted.map(t => {
        const date = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        const dateStr = date.toLocaleDateString('fr-DZ', { year: 'numeric', month: 'short', day: 'numeric' });

        const isDeposit = t.type === 'wallet_deposit';
        const typeLabel = isDeposit ? '💰 شحن رصيد' : '🛒 خصم مشتريات';
        const amountClass = isDeposit ? 'text-green-400' : 'text-red-400';
        const sign = isDeposit ? '+' : '-';

        return `
            <tr class="border-b border-gray-700/30 hover:bg-gray-800/30">
                <td class="p-3 text-gray-400">${dateStr}</td>
                <td class="p-3">${typeLabel}</td>
                <td class="p-3 font-bold ${amountClass}">${sign}${Math.abs(t.amount).toLocaleString()} د.ج</td>
                <td class="p-3 text-gray-400">${t.notes || '-'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * عرض سجل المشتريات
 */
function displayPurchaseHistory(orders) {
    const tbody = document.getElementById('history-purchases-table-body');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-6 text-gray-400">لا توجد مشتريات</td></tr>';
        return;
    }

    // Sort by date (newest first)
    const sorted = [...orders].sort((a, b) => {
        const dateA = getOrderDate(a);
        const dateB = getOrderDate(b);
        return dateB - dateA;
    });

    tbody.innerHTML = sorted.map(order => {
        const orderDate = getOrderDate(order);
        const dateStr = orderDate.toLocaleDateString('fr-DZ', { year: 'numeric', month: 'short', day: 'numeric' });

        const soldPrice = getOrderRevenueDzd(order);
        const costPrice = getOrderCostDzd(order);
        const profit = soldPrice - costPrice;

        // Get reseller info for delete function
        const reseller = allResellers.find(r => r.id === order.resellerId);
        const resellerName = reseller?.name || order.customerName || '-';

        return `
            <tr class="border-b border-gray-700/30 hover:bg-gray-800/30">
                <td class="p-3 text-gray-400">${dateStr}</td>
                <td class="p-3 text-white">${order.productName || '-'}</td>
                <td class="p-3 text-blue-400">${soldPrice.toLocaleString()} د.ج</td>
                <td class="p-3 text-red-400">${costPrice.toLocaleString()} د.ج</td>
                <td class="p-3 font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}">${profit.toLocaleString()} د.ج</td>
                <td class="p-3 text-center">
                    <button onclick="deleteOrderFromHistory('${order.id}', '${order.resellerId}', ${soldPrice}, '${resellerName.replace(/'/g, "\\'")}')" 
                        class="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition" 
                        title="حذف واسترجاع المبلغ">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// تحديث جدول الموزعين - Updated Resellers Table with History Button
// ═══════════════════════════════════════════════════════════════════════════

// Override the displayResellersTable function to add the history button
const originalDisplayResellersTable = displayResellersTable;
displayResellersTable = function () {
    const tbody = document.getElementById('resellers-table-body');
    if (!tbody) return;

    if (allResellers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-400">${t('no_resellers')}</td></tr>`;
        return;
    }

    tbody.innerHTML = allResellers.map(reseller => `
        <tr class="reseller-mobile-row border-b border-gray-700/50 hover:bg-gray-800/30">
            <td class="p-4" data-label="الموزع">
                <button onclick="openResellerHistoryModal('${reseller.id}')" class="font-bold text-white hover:text-purple-400 transition">
                    ${reseller.name}
                </button>
            </td>
            <td class="p-4 text-gray-400" data-label="البريد">${reseller.email || '-'}</td>
            <td class="p-4 text-gray-400" data-label="الهاتف">${reseller.phone || '-'}</td>
            <td class="p-4" data-label="الرصيد">
                <span class="font-bold ${(reseller.walletBalance || 0) > 0 ? 'text-green-400' : 'text-red-400'}">
                    ${(reseller.walletBalance || 0).toLocaleString()} د.ج
                </span>
            </td>
            <td class="p-4 text-center" data-label="المبيعات">${reseller.totalSales || 0}</td>
            <td class="p-4 text-center" data-label="إجراءات">
                <div class="reseller-mobile-actions flex gap-2 justify-center flex-wrap">
                    <button onclick="openResellerHistoryModal('${reseller.id}')" class="px-3 py-1 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition" title="سجل العمليات">📋</button>
                    <button onclick="openAddFundsModal('${reseller.id}')" class="px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition">${t('btn_fund')}</button>
                    <button onclick="openResellerModal('${reseller.id}')" class="px-3 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition">${t('btn_edit')}</button>
                    <button onclick="openSaleModalForReseller('${reseller.id}')" class="px-3 py-1 bg-orange-600/20 text-orange-400 rounded hover:bg-orange-600 hover:text-white transition">${t('btn_sell')}</button>
                    <button onclick="deleteReseller('${reseller.id}', '${reseller.name.replace(/'/g, "\\'")}', ${reseller.walletBalance || 0})" class="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition" title="حذف الموزع">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
};

// ═══════════════════════════════════════════════════════════════════════════
// وظائف الحذف والاسترجاع - Delete & Refund Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حذف طلب جملة واسترجاع المبلغ للموزع
 * @param {string} orderId - معرف الطلب
 * @param {string} resellerId - معرف الموزع
 * @param {number} amount - المبلغ المراد استرجاعه (بالدينار)
 * @param {string} resellerName - اسم الموزع
 */
async function deleteWholesaleOrder(orderId, resellerId, amount, resellerName) {
    // Confirmation dialog
    const confirmMessage = `⚠️ هل أنت متأكد من حذف هذه العملية؟\n\nسيتم استرجاع ${amount.toLocaleString()} د.ج إلى محفظة الموزع "${resellerName}".`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const { doc, deleteDoc, updateDoc, increment, collection, query, where, getDocs } = window.firebaseModules;

        // Step A & B: Refund - Add amount back to reseller's wallet
        if (resellerId && resellerId !== 'null' && resellerId !== 'undefined') {
            await updateDoc(doc(window.db, 'resellers', resellerId), {
                walletBalance: increment(amount),
                totalSales: increment(-1)
            });
            console.log(`✅ تم استرجاع ${amount} د.ج إلى محفظة ${resellerName}`);
        }

        // Step C: Delete the order from database
        await deleteDoc(doc(window.db, 'orders', orderId));
        console.log(`✅ تم حذف الطلب ${orderId}`);

        // Step D: Try to delete related wallet transaction
        try {
            const transactionsQuery = query(
                collection(window.db, 'transactions'),
                where('resellerId', '==', resellerId)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery);

            // Find and delete the matching transaction (by amount and type)
            for (const transDoc of transactionsSnapshot.docs) {
                const trans = transDoc.data();
                if (trans.type === 'wallet_purchase' && Math.abs(trans.amount) === amount) {
                    await deleteDoc(doc(window.db, 'transactions', transDoc.id));
                    console.log(`✅ تم حذف سجل المعاملة المرتبطة`);
                    break;
                }
            }
        } catch (transError) {
            console.warn('⚠️ لم يتم العثور على سجل معاملة مرتبطة:', transError);
        }

        // Step E: Refresh data and show success
        await loadOrders();
        await loadResellers();
        await loadTransactions();
        loadWholesaleLogs();

        // Update accounting stats
        if (typeof updateAccountingStats === 'function') updateAccountingStats();
        if (typeof displayAccountingTable === 'function') displayAccountingTable();
        if (typeof updateProfitCharts === 'function') updateProfitCharts();

        showToast(`✅ تم حذف الطلب واسترجاع ${amount.toLocaleString()} د.ج إلى محفظة ${resellerName}`);
        logActivity('wholesale_order', 'deleted_refunded', `Refunded ${amount} DZD to ${resellerName}`);

    } catch (error) {
        console.error('خطأ في حذف الطلب:', error);
        showToast('❌ حدث خطأ أثناء حذف الطلب. يرجى المحاولة مرة أخرى.', 'error');
    }
}

/**
 * حذف موزع من قاعدة البيانات
 * @param {string} resellerId - معرف الموزع
 * @param {string} resellerName - اسم الموزع
 * @param {number} walletBalance - رصيد المحفظة الحالي
 */
async function deleteReseller(resellerId, resellerName, walletBalance) {
    // Build warning message
    let warningMessage = `⚠️ تحذير! أنت على وشك حذف الموزع "${resellerName}".\n\nهذا الإجراء لا يمكن التراجع عنه!`;

    if (walletBalance > 0) {
        warningMessage += `\n\n🚨 تحذير: هذا الموزع لديه رصيد متبقي ${walletBalance.toLocaleString()} د.ج في محفظته!`;
    }

    warningMessage += '\n\nهل تريد المتابعة؟';

    if (!confirm(warningMessage)) {
        return;
    }

    // Double confirmation for resellers with balance
    if (walletBalance > 0) {
        const doubleConfirm = confirm(`⚠️ تأكيد نهائي:\nسيتم حذف ${resellerName} وفقدان ${walletBalance.toLocaleString()} د.ج!\n\nاضغط موافق للمتابعة.`);
        if (!doubleConfirm) {
            return;
        }
    }

    try {
        const { doc, deleteDoc, collection, query, where, getDocs } = window.firebaseModules;

        // Delete all transactions related to this reseller
        try {
            const transactionsQuery = query(
                collection(window.db, 'transactions'),
                where('resellerId', '==', resellerId)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery);

            for (const transDoc of transactionsSnapshot.docs) {
                await deleteDoc(doc(window.db, 'transactions', transDoc.id));
            }
            console.log(`✅ تم حذف ${transactionsSnapshot.size} سجل معاملات مرتبطة`);
        } catch (transError) {
            console.warn('⚠️ خطأ في حذف المعاملات المرتبطة:', transError);
        }

        // Delete the reseller document
        await deleteDoc(doc(window.db, 'resellers', resellerId));
        console.log(`✅ تم حذف الموزع ${resellerName}`);

        // Refresh data
        await loadResellers();
        displayResellersTable();

        // Close history modal if open
        closeResellerHistoryModal();

        showToast(`✅ تم حذف الموزع "${resellerName}" بنجاح`);
        logActivity('reseller', 'deleted', `Deleted reseller: ${resellerName}`);

    } catch (error) {
        console.error('خطأ في حذف الموزع:', error);
        showToast('❌ حدث خطأ أثناء حذف الموزع. يرجى المحاولة مرة أخرى.', 'error');
    }
}

/**
 * حذف طلب من سجل مشتريات الموزع (في النافذة المنبثقة)
 * مع استرجاع المبلغ
 */
async function deleteOrderFromHistory(orderId, resellerId, amount, resellerName) {
    await deleteWholesaleOrder(orderId, resellerId, amount, resellerName);

    // Refresh the history modal if still open
    const historyResellerId = document.getElementById('history-reseller-id')?.value;
    if (historyResellerId === resellerId) {
        loadResellerHistory(resellerId);
    }
}

// Export delete functions
window.deleteWholesaleOrder = deleteWholesaleOrder;
window.deleteReseller = deleteReseller;
window.deleteOrderFromHistory = deleteOrderFromHistory;

// Export existing functions
window.showResellerSubTab = showResellerSubTab;
window.loadWholesaleLogs = loadWholesaleLogs;
window.filterWholesaleLogs = filterWholesaleLogs;
window.openResellerHistoryModal = openResellerHistoryModal;
window.closeResellerHistoryModal = closeResellerHistoryModal;
window.showHistorySubTab = showHistorySubTab;

// ═══════════════════════════════════════════════════════════════════════════
// إدارة الزبائن المهتمين - Leads Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحميل بيانات الزبائن من Firebase
 */

/**
 * تحميل بيانات الزبائن من Firebase
 */
async function loadLeads() {
    if (!window.db || !window.firebaseModules) return;
    const tableBody = document.getElementById('leads-table-body');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-slate-500">جاري التحميل...</td></tr>';

    try {
        const { collection, getDocs, query, orderBy } = window.firebaseModules;
        const q = query(collection(window.db, "leads"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        allLeads = [];
        let todayCount = 0;
        let purchasedCount = 0;
        let abandonedCount = 0;
        const todayStr = new Date().toLocaleDateString();
        const productCounts = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const leadDate = data.timestamp ? data.timestamp.toDate() : new Date();
            if (leadDate.toLocaleDateString() === todayStr) todayCount++;

            if (data.status === 'purchased') purchasedCount++;
            if (data.status === 'abandoned') abandonedCount++;

            allLeads.push({
                id: doc.id,
                ...data,
                formattedDate: leadDate.toLocaleString('fr-DZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
            });

            if (data.product) {
                productCounts[data.product] = (productCounts[data.product] || 0) + 1;
            }
        });

        updateLeadStats(allLeads.length, todayCount, purchasedCount, abandonedCount, productCounts);
        applyLeadFilters();
    } catch (error) {
        console.error("Error loading leads:", error);
        showToast('❌ خطأ في تحميل بيانات الزبائن', 'error');
    }
}

/**
 * تحديث إحصائيات الزبائن
 */
function updateLeadStats(total, today, purchased, abandoned, productCounts) {
    const totalEl = document.getElementById('stat-total-leads');
    const todayEl = document.getElementById('stat-today-leads');
    const purchasedEl = document.getElementById('stat-purchased-leads');
    const abandonedEl = document.getElementById('stat-abandoned-leads');
    const topEl = document.getElementById('stat-top-lead-product');

    if (totalEl) totalEl.innerText = total;
    if (todayEl) todayEl.innerText = today;
    if (purchasedEl) purchasedEl.innerText = purchased;
    if (abandonedEl) abandonedEl.innerText = abandoned;

    if (topEl) {
        const topProd = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a])[0];
        topEl.innerText = topProd || '--';
    }
}

/**
 * عرض جدول الزبائن
 */
function renderLeadsTable(leads) {
    const tableBody = document.getElementById('leads-table-body');
    if (!tableBody) return;

    if (leads.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-slate-500">لا يوجد زبائن حالياً.</td></tr>';
        return;
    }

    const statusLabels = {
        'new': '🔵 جديد',
        'contacted': '🟠 جاري التواصل',
        'purchased': '🟢 تم الشراء',
        'abandoned': '🔴 لم يشترِ'
    };

    const statusClasses = {
        'new': 's-new',
        'contacted': 's-contacted',
        'purchased': 's-purchased',
        'abandoned': 's-abandoned'
    };

    tableBody.innerHTML = leads.map(lead => {
        const status = lead.status || 'new';
        return `
        <tr class="hover:bg-gray-700/30 transition border-b border-gray-700">
            <td class="p-4 text-xs text-gray-400">${lead.formattedDate}</td>
            <td class="p-4 font-bold text-gray-200">${lead.name || '---'}</td>
            <td class="p-4 font-mono text-gray-400 text-sm italic">${lead.contact || '---'}</td>
            <td class="p-4">
                <span class="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-yellow-500/30">
                    ${lead.product || 'غير محدد'}
                </span>
            </td>
            <td class="p-4 text-xs text-gray-500 truncate max-w-[120px]" title="${lead.source || '/'}">${lead.source || '/'}</td>
            <td class="p-4 text-center">
                <span onclick="cycleLeadStatus('${lead.id}', '${status}')" 
                    class="status-badge ${statusClasses[status] || 's-new'}">
                    ${statusLabels[status] || statusLabels['new']}
                </span>
            </td>
            <td class="p-4 text-center flex items-center justify-center gap-2">
                <button onclick="contactLead('${lead.name}', '${lead.contact}', '${lead.product ? lead.product.replace(/'/g, "\\'") : ""}')" 
                    class="bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded-lg text-[10px] font-bold transition shadow-lg shadow-green-900/10">
                    واتساب
                </button>
                <button onclick="deleteLead('${lead.id}', '${lead.name ? lead.name.replace(/'/g, "\\'") : ""}')" 
                    class="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-bold transition border border-red-500/20">
                    🗑️
                </button>
            </td>
        </tr>
    `}).join('');
}

/**
 * تغيير حالة الزبون
 */
function leadPriceToUsd(price, currency) {
    const value = parseFloat(price) || 0;
    if ((currency || 'DZD').toUpperCase() === 'USD') return parseFloat(value.toFixed(2));
    return parseFloat((value / 250).toFixed(2));
}

function leadProductPixelId(productName) {
    return String(productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function buildLeadPurchaseUserData(lead) {
    if (!window.metaPixel) return {};
    const contact = lead.contact || '';
    const isEmail = contact.includes('@');
    const nameParts = String(lead.name || '').trim().split(/\s+/).filter(Boolean);
    const userData = await window.metaPixel.buildUserData({
        email: isEmail ? contact : '',
        phone: isEmail ? '' : contact,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' '),
        externalId: lead.fbclid || ''
    });

    if (lead.fbclid && window.metaPixel.fbcFromFbclid) {
        userData.fbc = window.metaPixel.fbcFromFbclid(lead.fbclid);
    }

    return userData;
}

async function sendPurchasePixelForLead(lead) {
    if (!lead || lead.purchasePixelSentAt || lead.purchasePixelEventId) return null;
    if (!window.metaPixel || typeof window.metaPixel.trackServerEvent !== 'function') {
        console.warn('[admin] Meta Pixel bridge is not available; Purchase event skipped.');
        return null;
    }

    const { doc, updateDoc, serverTimestamp } = window.firebaseModules;
    const productName = lead.product || '3Ahub Product';
    const currency = lead.currency || 'DZD';
    const usdValue = leadPriceToUsd(lead.price, currency);
    const eventId = `purchase_lead_${lead.id}`;
    const userData = await buildLeadPurchaseUserData(lead);

    await window.metaPixel.trackServerEvent('Purchase', {
        content_name: productName,
        content_ids: [leadProductPixelId(productName)],
        content_type: 'product',
        value: usdValue,
        currency: 'USD',
        order_id: lead.id,
        original_value: parseFloat(lead.price) || 0,
        original_currency: currency,
        source: 'admin_confirmed_purchase'
    }, userData, {
        eventId,
        eventSourceUrl: lead.source || window.location.href,
        actionSource: 'website',
        requireCapiSuccess: true
    });

    const marker = {
        purchasePixelSentAt: serverTimestamp(),
        purchasePixelEventId: eventId
    };
    await updateDoc(doc(window.db, "leads", lead.id), marker);
    lead.purchasePixelSentAt = new Date().toISOString();
    lead.purchasePixelEventId = eventId;
    return eventId;
}

async function cycleLeadStatus(id, currentStatus) {
    const statuses = ['new', 'contacted', 'purchased', 'abandoned'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
        const { doc, updateDoc } = window.firebaseModules;
        await updateDoc(doc(window.db, "leads", id), { status: nextStatus });

        showToast(`✅ تم تغيير الحالة إلى: ${nextStatus}`);

        // تحديث البيانات محلياً
        const lead = allLeads.find(l => l.id === id);
        if (lead) lead.status = nextStatus;

        if (lead && nextStatus === 'purchased') {
            try {
                const purchaseEventId = await sendPurchasePixelForLead(lead);
                if (purchaseEventId) {
                    showToast('🎯 تم إرسال Purchase إلى Meta Pixel');
                }
            } catch (pixelError) {
                console.error('Error sending Purchase to Meta Pixel:', pixelError);
                showToast('⚠️ تم تحديث الحالة، لكن فشل إرسال Purchase إلى Meta Pixel', 'warning');
            }
        }

        // إعادة حساب الإحصائيات
        recalculateLeadStats();

        // تحديث الجدول
        applyLeadFilters();

    } catch (error) {
        console.error("Error updating lead status:", error);
        showToast('❌ خطأ في تغيير الحالة', 'error');
    }
}

/**
 * إعادة حساب الإحصائيات من البيانات المحلية
 */
function recalculateLeadStats() {
    let todayCount = 0;
    let purchasedCount = 0;
    let abandonedCount = 0;
    const todayStr = new Date().toLocaleDateString();
    const productCounts = {};

    allLeads.forEach(lead => {
        const leadDate = lead.timestamp ? lead.timestamp.toDate() : new Date();
        if (leadDate.toLocaleDateString() === todayStr) todayCount++;

        if (lead.status === 'purchased') purchasedCount++;
        if (lead.status === 'abandoned') abandonedCount++;

        if (lead.product) {
            productCounts[lead.product] = (productCounts[lead.product] || 0) + 1;
        }
    });

    updateLeadStats(allLeads.length, todayCount, purchasedCount, abandonedCount, productCounts);
}

/**
 * تصفية جدول الزبائن
 */
function applyLeadFilters() {
    const statusFilter = document.getElementById('filter-lead-status')?.value || 'all';

    let filtered = allLeads;
    if (statusFilter !== 'all') {
        filtered = allLeads.filter(l => (l.status || 'new') === statusFilter);
    }

    renderLeadsTable(filtered);
}

/**
 * حذف زبون مهتم
 */
async function deleteLead(leadId, leadName) {
    if (!confirm(`⚠️ هل أنت متأكد من حذف الزبون "${leadName}"؟`)) return;

    try {
        const { doc, deleteDoc } = window.firebaseModules;
        await deleteDoc(doc(window.db, "leads", leadId));

        showToast('✅ تم حذف الزبون بنجاح');

        // تحديث القائمة محلياً فوراً
        allLeads = allLeads.filter(l => l.id !== leadId);
        renderLeadsTable(allLeads);

        // تحديث إحصائيات الإجمالي
        const totalEl = document.getElementById('stat-total-leads');
        if (totalEl) totalEl.innerText = allLeads.length;

    } catch (error) {
        console.error("Error deleting lead:", error);
        showToast('❌ خطأ في حذف الزبون', 'error');
    }
}

/**
 * تواصل مع الزبون عبر واتساب
 */
function contactLead(name, contact, product) {
    const cleanPhone = contact.replace(/\D/g, '');
    let phoneNum = cleanPhone;
    if (cleanPhone.length >= 9) {
        phoneNum = cleanPhone.startsWith('213') ? cleanPhone : '213' + (cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone);
    }

    const msg = `مرحباً ${name}، بخصوص طلبك لـ ${product} من موقع 3Ahub. كيف يمكنني مساعدتك؟`;
    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, '_blank');
}

/**
 * تصدير البيانات بصيغة CSV لفيسبوك
 */
function exportLeadsToCSV() {
    if (allLeads.length === 0) {
        showToast('⚠️ لا توجد بيانات للتصدير', 'info');
        return;
    }

    let csv = "email,phone,fn,ln,external_id,product,date\n";
    allLeads.forEach(lead => {
        const isEmail = lead.contact?.includes('@');
        const email = isEmail ? lead.contact : "";
        let phone = "";
        if (!isEmail) {
            phone = lead.contact?.replace(/\D/g, '') || "";
            if (phone.length > 0 && !phone.startsWith('213')) {
                phone = '213' + (phone.startsWith('0') ? phone.slice(1) : phone);
            }
        }
        const names = (lead.name || "").split(' ');
        csv += `${email},${phone},${names[0] || ""},${names.slice(1).join(' ') || ""},${lead.fbclid || ""},${lead.product},${lead.formattedDate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `3Ahub_Leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// تحديث وظيفة showTab لدمج تحميل الزبائن
if (typeof window.originalShowTab === 'undefined') {
    window.originalShowTab = window.showTab;
}
window.showTab = (function (oldShowTab) {
    return function (tabName) {
        if (typeof oldShowTab === 'function') oldShowTab(tabName);
        if (tabName === 'leads') {
            loadLeads();
        }
    };
})(window.showTab);

// جعل الوظائف متاحة عالمياً
window.loadLeads = loadLeads;
window.exportLeadsToCSV = exportLeadsToCSV;
window.contactLead = contactLead;
window.deleteLead = deleteLead;
window.cycleLeadStatus = cycleLeadStatus;
window.applyLeadFilters = applyLeadFilters;
