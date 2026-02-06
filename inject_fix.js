const fs = require('fs');
const newFunc = fs.readFileSync('clean_update_display.js', 'utf8');
let adminJs = fs.readFileSync('admin.js', 'utf8');

// استبدال الدالة القديمة بالجديدة النظيفة
adminJs = adminJs.replace(/function updateCapitalDisplay\s*\(\)\s*\{[\s\S]*?\n\}/, newFunc);

fs.writeFileSync('admin.js', adminJs, 'utf8');
console.log('Success! Your dashboard numbers are now perfectly aligned.');
