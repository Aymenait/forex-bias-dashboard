const fs = require('fs');
const path = 'admin.js';

let content = fs.readFileSync(path, 'utf8');

// النسخة البسيطة والمنطقية جداً للعرض
const simpleDisplay = `function updateCapitalDisplay() {
    const totals = calculateTotalFinancials();
    const totalLiabilities = calculateTotalLiabilities();

    // 1. الخزينة (السيولة الفعلية)
    // تشمل كل شيء: رأس مالك + أمانات الموزعين
    const currentTreasury = startingCapital + (totals.cashRevenue + totals.walletDeposits) - (totals.purchasesCost + totals.totalExpenses);

    // 2. رأس مالك الصافي (الذي تملكه أنت حقيقة)
    // هو الخزينة ناقص المسلف للي عندك (الأمانات)
    const netOwnCapital = currentTreasury - totalLiabilities;

    const balanceEl = document.getElementById('stat-current-balance');
    const startingEl = document.getElementById('stat-starting-capital-display');
    const badgeEl = document.getElementById('capital-performance-badge');
    const liabilitiesEl = document.getElementById('stat-reseller-liabilities');
    const netOwnCapitalEl = document.getElementById('stat-net-own-capital');

    if (balanceEl) {
        balanceEl.textContent = Math.round(currentTreasury).toLocaleString() + " د.ج";
        balanceEl.style.color = currentTreasury >= startingCapital ? 'var(--accent)' : '#ef4444';
    }

    if (startingEl) {
        startingEl.textContent = Math.round(startingCapital).toLocaleString() + " د.ج";
    }

    if (liabilitiesEl) {
        liabilitiesEl.textContent = Math.round(totalLiabilities).toLocaleString() + " د.ج";
    }

    if (netOwnCapitalEl) {
        netOwnCapitalEl.textContent = Math.round(netOwnCapital).toLocaleString() + " د.ج";
    }

    if (badgeEl) {
        const performance = startingCapital > 0 ? ((netOwnCapital - startingCapital) / startingCapital * 100) : 0;
        if (performance > 0) {
            badgeEl.textContent = "↑ +" + performance.toFixed(1) + "% ربح";
            badgeEl.className = 'px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400';
        } else if (performance < 0) {
            badgeEl.textContent = "↓ " + performance.toFixed(1) + "% خسارة";
            badgeEl.className = 'px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400';
        } else {
            badgeEl.textContent = '— متعادل';
            badgeEl.className = 'px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400';
        }
    }
}`;

// استبدال الدالة المعقدة بالدالة البسيطة
content = content.replace(/function updateCapitalDisplay\s*\(\)\s*\{[\s\S]*?\n\}/, simpleDisplay);

fs.writeFileSync(path, content, 'utf8');
console.log('Accounting logic simplified: Net Capital = Treasury - Liabilities.');
