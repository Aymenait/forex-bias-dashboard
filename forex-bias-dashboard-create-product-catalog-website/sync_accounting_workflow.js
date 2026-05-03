const fs = require('fs');
const path = 'admin.js';

let content = fs.readFileSync(path, 'utf8');

// 1. New calculation logic for financials 
const cleanCalc = `function calculateTotalFinancials() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );

    let totalRevenue = 0;      // إجمالي قيمة المبيعات (Selling Price)
    let cashRevenue = 0;       // الكاش الداخل (فقط من غير الموزعين)
    let totalCogs = 0;         // إجمالي التكاليف (Cost Price)

    filteredOrders.forEach(order => {
        let amount = parseFloat(order.amount) || 0;
        if (order.currency === 'USD') amount *= (order.exchangeRate || USD_TO_DZD_RATE);
        totalRevenue += amount;
        
        // إذا كان البيع مباشراً (وليس لموزع بالواليت)، يزيد الكاش
        if (order.source !== 'wholesale' && order.type !== 'wallet_purchase') {
            cashRevenue += amount;
        }

        // حساب تكلفة المنتج المباع
        let costPrice = parseFloat(order.cost_price || order.costPrice) || 0;
        if (costPrice === 0) {
            const product = allProducts.find(p => p.name === order.productName || p.id === order.productId);
            costPrice = product?.cost_dzd || 0;
        }
        totalCogs += costPrice;
    });

    // إيداعات الموزعين (تزيد الخزينة)
    let walletDeposits = 0;
    const filteredTransactions = filterTransactionsByDate(allTransactions, dateFilter);
    filteredTransactions.forEach(t => {
        if (t.type === 'wallet_deposit' || t.type === 'deposit') {
            walletDeposits += parseFloat(t.amount) || 0;
        }
    });

    // المصاريف والمشتريات اليدوية
    const filteredExpenses = filterExpensesByDate(allExpenses, dateFilter);
    let totalExpenses = 0;
    filteredExpenses.forEach(e => {
        let amount = parseFloat(e.amount) || 0;
        if (e.currency === 'USD') amount *= (e.exchangeRate || USD_TO_DZD_RATE);
        totalExpenses += amount;
    });

    const filteredPurchases = filterOrdersByDate(allPurchases, dateFilter);
    let manualPurchasesCost = 0;
    filteredPurchases.forEach(p => {
        let amount = parseFloat(p.totalPrice || p.totalCost || p.amount) || 0;
        if (p.currency === 'USD') amount *= (p.exchangeRate || USD_TO_DZD_RATE);
        manualPurchasesCost += amount;
    });

    return {
        cashRevenue,
        walletDeposits,
        totalCogs,           // تكلفة المنتجات المباعة (التي تخرج للمورد عند كل بيعة)
        manualPurchasesCost, // مشتريات يدوية (مثل شحن أرصدة خارجية)
        totalExpenses
    };
}`;

// 2. New display logic matching user formula
const cleanDisplay = `function updateCapitalDisplay() {
    const totals = calculateTotalFinancials();
    const totalLiabilities = calculateTotalLiabilities();

    // القاعدة الذهبية للمستخدم:
    // الخزينة = (البداية + كاش المبيعات المباشرة + إيداعات الموزعين) - (المشتريات اليدوية + المصاريف + تكلفة كل المنتجات اللي تباعت)
    const currentTreasury = startingCapital + 
                           (totals.cashRevenue + totals.walletDeposits) - 
                           (totals.manualPurchasesCost + totals.totalExpenses + totals.totalCogs);

    // رأس المال الصافي = الخزينة - أرصدة الموزعين (الأمانات)
    const netOwnCapital = currentTreasury - totalLiabilities;

    const balanceEl = document.getElementById('stat-current-balance');
    const startingEl = document.getElementById('stat-starting-capital-display');
    const badgeEl = document.getElementById('capital-performance-badge');
    const liabilitiesEl = document.getElementById('stat-reseller-liabilities');
    const netOwnCapitalEl = document.getElementById('stat-net-own-capital');

    if (balanceEl) {
        // الرقم الكبير يمثل السيولة الكلية (الخزينة) كما هو متعارف عليه
        balanceEl.textContent = Math.round(currentTreasury).toLocaleString() + " د.ج";
        balanceEl.style.color = currentTreasury >= startingCapital ? 'var(--accent)' : '#ef4444';
    }

    if (startingEl) startingEl.textContent = Math.round(startingCapital).toLocaleString() + " د.ج";
    if (liabilitiesEl) liabilitiesEl.textContent = Math.round(totalLiabilities).toLocaleString() + " د.ج";
    if (netOwnCapitalEl) netOwnCapitalEl.textContent = Math.round(netOwnCapital).toLocaleString() + " د.ج";

    if (badgeEl) {
        const perf = startingCapital > 0 ? ((netOwnCapital - startingCapital) / startingCapital * 100) : 0;
        badgeEl.textContent = perf >= 0 ? "↑ +" + perf.toFixed(1) + "% ربح" : "↓ " + perf.toFixed(1) + "% خسارة";
        badgeEl.className = perf >= 0 ? 'px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400' : 'px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400';
    }
}`;

content = content.replace(/function calculateTotalFinancials\s*\(\)\s*\{[\s\S]*?return\s*\{[\s\S]*?\}\s*;\s*\n\}/, cleanCalc);
content = content.replace(/function updateCapitalDisplay\s*\(\)\s*\{[\s\S]*?\n\}/, cleanDisplay);

fs.writeFileSync(path, content, 'utf8');
console.log('Accounting Logic Synchronized with User Workflow.');
