const fs = require('fs');
const path = 'admin.js';
let content = fs.readFileSync(path, 'utf8');

// تعديل معادلة الخزينة لتخصم تكلفة المنتجات المباعة (الـ 250 في مثالك)
// هذا سيجعل الزيادة في الخزينة تساوي 'الربح الصافي' فقط
const newLogic = `    // 1. الخزينة: (البداية + مبيعات الكاش + الإيداعات) - (المشتريات + المصاريف + تكلفة البضاعة المباعة)
    const currentTreasury = startingCapital + (totals.cashRevenue + totals.walletDeposits) - (totals.purchasesCost + totals.totalExpenses + totals.cost);

    // 2. رأس مالك الصافي: الخزينة ناقص أمانات الموزعين
    const netOwnCapital = currentTreasury - totalLiabilities;`;

content = content.replace(/\/\/ 1\. Ø§Ù„Ø®Ø²ÙŠÙ†Ø©[\s\S]*?const netOwnCapital = currentTreasury - totalLiabilities;/, newLogic);
// OR replace the plain version if the encryption/encoding fix worked
content = content.replace(/\/\/ 1\. الخزينة[\s\S]*?const netOwnCapital = currentTreasury - totalLiabilities;/, newLogic);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Cash Flow: Treasury now deducts cost of goods sold.');
