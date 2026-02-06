const fs = require('fs');
const path = 'admin.js';

let content = fs.readFileSync(path, 'utf8');

// 1. تثبيت مبلغ البداية الصحيح الذي يريده المستخدم
content = content.replace(/let startingCapital\s*=\s*\d+;/, 'let startingCapital = 102505;');

// 2. إصلاح دالة الحساب للتأكد من حساب الأرباح الصافية بدقة
const cleanCalc = `function calculateTotalFinancials() {
    const dateFilter = document.getElementById('accounting-date-filter')?.value || 'all';
    // نحسب فقط الطلبات الناجحة
    const filteredOrders = filterOrdersByDate(
        allOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed'),
        dateFilter
    );

    let totalRevenue = 0;      
    let totalCost = 0;         
    let cashRevenue = 0;       

    filteredOrders.forEach(order => {
        let amount = parseFloat(order.amount) || 0;
        if (order.currency === 'USD') amount *= (order.exchangeRate || USD_TO_DZD_RATE);
        totalRevenue += amount;
        
        // كاش المبيعات المباشرة (ليس الجملة)
        if (order.source !== 'wholesale') cashRevenue += amount;

        // تكلفة المنتج
        let costPrice = parseFloat(order.cost_price || order.costPrice) || 0;
        if (costPrice === 0) {
            const product = allProducts.find(p => p.name === order.productName || p.id === order.productId);
            costPrice = product?.cost_dzd || 0;
        }
        totalCost += costPrice;
    });

    // إيداعات الموزعين (كاش دخل الخزينة لكنه ليس ربحاً)
    let walletDeposits = 0;
    const filteredTransactions = filterTransactionsByDate(allTransactions, dateFilter);
    filteredTransactions.forEach(t => {
        if (t.type === 'wallet_deposit') walletDeposits += parseFloat(t.amount) || 0;
    });

    // المصاريف (تخصم من الربح)
    const filteredExpenses = filterExpensesByDate(allExpenses, dateFilter);
    let businessExpenses = 0, personalExpenses = 0;
    filteredExpenses.forEach(e => {
        let amount = parseFloat(e.amount) || 0;
        if (e.currency === 'USD') amount *= (e.exchangeRate || USD_TO_DZD_RATE);
        if (e.type === 'business') businessExpenses += amount; else personalExpenses += amount;
    });

    // المشتريات (كاش خرج من الخزينة)
    const filteredPurchases = filterOrdersByDate(allPurchases, dateFilter);
    let purchasesCost = 0;
    filteredPurchases.forEach(p => {
        let amount = parseFloat(p.totalPrice || p.totalCost || p.amount) || 0;
        if (p.currency === 'USD') amount *= (p.exchangeRate || USD_TO_DZD_RATE);
        purchasesCost += amount;
    });

    const netProfit = totalRevenue - totalCost - businessExpenses - personalExpenses;

    return {
        revenue: totalRevenue,
        cashRevenue,
        walletDeposits,
        cost: totalCost,
        purchasesCost,
        businessExpenses,
        personalExpenses,
        totalExpenses: businessExpenses + personalExpenses,
        netProfit
    };
}`;

// 3. إصلاح دالة العرض لتظهر الأرقام كما يتوقع المستخدم تماماً
const cleanDisplay = `function updateCapitalDisplay() {
    const totals = calculateTotalFinancials();
    const totalLiabilities = calculateTotalLiabilities();

    // رأس مالك الصافي = (البداية 102,505) + (صافي الأرباح)
    const netOwnCapital = startingCapital + (totals.netProfit || 0);

    // الخزينة = كل الكاش اللي عندك
    const currentTreasury = startingCapital + (totals.cashRevenue + totals.walletDeposits) - (totals.purchasesCost + totals.totalExpenses);

    const balanceEl = document.getElementById('stat-current-balance');
    const startingEl = document.getElementById('stat-starting-capital-display');
    const badgeEl = document.getElementById('capital-performance-badge');
    const liabilitiesEl = document.getElementById('stat-reseller-liabilities');
    const netOwnCapitalEl = document.getElementById('stat-net-own-capital');

    // الرقم الكبير هو رأس مالك الصافي المتغير (102,855)
    if (balanceEl) {
        balanceEl.textContent = Math.round(netOwnCapital).toLocaleString() + " د.ج";
        balanceEl.style.color = netOwnCapital >= startingCapital ? 'var(--accent)' : '#ef4444';
    }

    if (startingEl) startingEl.textContent = Math.round(startingCapital).toLocaleString() + " د.ج";
    
    // الخزينة تظهر كمعلومة ثانوية مفيدة
    if (netOwnCapitalEl) {
        netOwnCapitalEl.textContent = Math.round(currentTreasury).toLocaleString() + " د.ج";
    }

    if (liabilitiesEl) liabilitiesEl.textContent = Math.round(totalLiabilities).toLocaleString() + " د.ج";

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
}`;

content = content.replace(/function calculateTotalFinancials\s*\(\)\s*\{[\s\S]*?return\s*\{[\s\S]*?\}\s*;\s*\n\}/, cleanCalc);
content = content.replace(/function updateCapitalDisplay\s*\(\)\s*\{[\s\S]*?\n\}/, cleanDisplay);

fs.writeFileSync(path, content, 'utf8');
console.log('Final Fix: Starting capital set to 102,505. Logic corrected to show profits properly.');
