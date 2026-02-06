function updateCapitalDisplay() {
    const totals = calculateTotalFinancials();
    const totalLiabilities = calculateTotalLiabilities();

    // القاعدة: الربح الصافي هو ما يدخل الخزينة فعلاً
    const netProfit = totals.netProfit || 0;

    // الخزينة (الرقم الكبير) = البداية + الربح الصافي + الأمانات - المصاريف الشخصية (إن وجدت)
    // ملاحظة: totals.netProfit يحسب (المبيعات - التكلفة - مصاريف العمل)
    const currentTreasury = startingCapital + netProfit + totalLiabilities - (totals.personalExpenses || 0);

    // رأس مالك الصافي = الخزينة ناقص الأمانات (يرجع للأصل وهو البداية + الربح)
    const netOwnCapital = currentTreasury - totalLiabilities;

    const balanceEl = document.getElementById('stat-current-balance');
    const startingEl = document.getElementById('stat-starting-capital-display');
    const badgeEl = document.getElementById('capital-performance-badge');
    const liabilitiesEl = document.getElementById('stat-reseller-liabilities');
    const netOwnCapitalEl = document.getElementById('stat-net-own-capital');

    if (balanceEl) {
        // الرقم الكبير سيكون الآن 102,855 كما طلبت بالضبط
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
}
