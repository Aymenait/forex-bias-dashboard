const fs = require('fs');
const path = 'admin.js';

let content = fs.readFileSync(path, 'utf8');

// 1. تثبيت مبلغ البداية الصحيح الذي يريده المستخدم لتبدأ الحسبة منه
content = content.replace(/let startingCapital\s*=\s*\d+;/, 'let startingCapital = 102505;');

// 2. تحديث دالة العرض لجعل الرقم الكبير هو "رأس المال الصافي" (البداية + الربح)
const cleanDisplay = `function updateCapitalDisplay() {
    const totals = calculateTotalFinancials();
    const totalLiabilities = calculateTotalLiabilities();

    // رأس مالك الصافي (الذي يهمك) = البداية (102,505) + صافي الأرباح (350 في مثالك)
    const netOwnCapital = startingCapital + (totals.netProfit || 0);

    // الخزينة (الكاش الفعلي) = كل مليم دخل جيبك (600 في مثالك)
    const currentTreasury = startingCapital + (totals.cashRevenue + totals.walletDeposits) - (totals.purchasesCost + totals.totalExpenses);

    const balanceEl = document.getElementById('stat-current-balance');
    const startingEl = document.getElementById('stat-starting-capital-display');
    const badgeEl = document.getElementById('capital-performance-badge');
    const liabilitiesEl = document.getElementById('stat-reseller-liabilities');
    const netOwnCapitalEl = document.getElementById('stat-net-own-capital');

    // الصندوق الكبير سيعرض الآن رأس المال الصافي (102,855) كما طلبت
    if (balanceEl) {
        balanceEl.textContent = Math.round(netOwnCapital).toLocaleString() + " د.ج";
        balanceEl.style.color = netOwnCapital >= startingCapital ? 'var(--accent)' : '#ef4444';
    }

    if (startingEl) startingEl.textContent = Math.round(startingCapital).toLocaleString() + " د.ج";
    
    // الخزينة (الكاش) ستظهر في الأسفل كمعلومة ثانوية
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

content = content.replace(/function updateCapitalDisplay\s*\(\)\s*\{[\s\S]*?\n\}/, cleanDisplay);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed: Net Own Capital (102,855) is now the main display.');
