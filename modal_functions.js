// Add these copy functions and confirm payment functions
// They should be in the global scope so onclick handlers can access them

function trackMetaEvent(eventName, params) {
    params = params || {};
    if (window.metaPixel && typeof window.metaPixel.trackEvent === 'function') {
        window.metaPixel.trackEvent(eventName, params);
        return;
    }
    if (typeof fbq !== 'undefined') {
        const command = ['CopyPaymentInfo', 'InterestedLead', 'OrderSubmitted', 'DeepScroll', 'CategoryFilter'].includes(eventName)
            ? 'trackCustom'
            : 'track';
        fbq(command, eventName, params);
    }
}

// Copy RedotPay ID function
function copyRedotPayID() {
    const redotpayID = document.getElementById('redotpay-id').textContent;

    // Track Copy Event
    trackMetaEvent('CopyPaymentInfo', {
        content_category: 'RedotPay',
        content_type: 'ID'
    });

    navigator.clipboard.writeText(redotpayID).then(() => {
        const copyBtn = document.querySelector('#redotpay-modal .copy-btn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        copyBtn.style.backgroundColor = '#39ff14';
        copyBtn.style.color = '#000';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Copy Wallet Address function (for crypto modal)
function copyWalletAddress() {
    const walletAddress = document.getElementById('wallet-address').textContent;

    // Track Copy Event
    trackMetaEvent('CopyPaymentInfo', {
        content_category: 'Crypto',
        content_type: 'Wallet Address'
    });

    navigator.clipboard.writeText(walletAddress).then(() => {
        const copyBtn = document.querySelector('#crypto-modal .copy-btn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        copyBtn.style.backgroundColor = '#39ff14';
        copyBtn.style.color = '#000';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Copy BaridiMob RIP function
function copyBaridiMobRIP() {
    const baridimobRIP = document.getElementById('baridimob-rip').textContent;

    // Track Copy Event
    trackMetaEvent('CopyPaymentInfo', {
        content_category: 'BaridiMob',
        content_type: 'RIP'
    });

    navigator.clipboard.writeText(baridimobRIP).then(() => {
        const copyBtn = document.querySelector('#baridimob-modal .copy-btn');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        copyBtn.style.backgroundColor = '#39ff14';
        copyBtn.style.color = '#000';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}

// Confirm payment functions
function confirmRedotPayPayment() {
    const productName = document.getElementById('redotpay-product-name').textContent;
    const priceDZD = document.getElementById('redotpay-price-dzd').textContent;
    const priceUSD = document.getElementById('redotpay-price-usd').textContent;

    const message = `Hello, I have paid via RedotPay:

📦 Product: ${productName}
💰 Amount: ${priceDZD} DZD (${priceUSD} USD)
💳 RedotPay ID: 1117632168

Please verify payment and send the account to:
📧 Email: [Enter your email here]

Thank you!`;

    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const value = currency === 'USD' ? parseFloat(priceUSD) : parseFloat(priceDZD);
    trackMetaEvent('Lead', {
        content_name: productName,
        value: value || 0,
        currency: currency,
        content_category: 'RedotPay'
    });
    const modal = document.getElementById('redotpay-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
}

function confirmCryptoPayment() {
    const productName = document.getElementById('crypto-product-name').textContent;
    const priceDZD = document.getElementById('crypto-price-dzd').textContent;
    const priceUSD = document.getElementById('crypto-price-usd').textContent;
    const network = document.getElementById('selected-network').textContent;

    const message = `Hello, I have paid with Crypto:

📦 Product: ${productName}
💰 Amount: ${priceDZD} DZD (${priceUSD} USDT)
🔗 Network: ${network}

Please verify payment and send the account to:
📧 Email: [Enter your email here]

Thank you!`;

    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    const currency = (window.currencyManager && window.currencyManager.currentCurrency) || 'DZD';
    const value = currency === 'USD' ? parseFloat(priceUSD) : parseFloat(priceDZD);
    trackMetaEvent('Lead', {
        content_name: productName,
        value: value || 0,
        currency: currency,
        content_category: 'Crypto - ' + network
    });
    const modal = document.getElementById('crypto-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
}

function confirmBaridiMobPayment() {
    const productName = document.getElementById('baridimob-product-name').textContent;
    const priceDZD = document.getElementById('baridimob-price-dzd').textContent;

    const message = `Hello, I have paid via BaridiMob:

📦 Product: ${productName}
💰 Amount: ${priceDZD} DZD
💳 RIP: 00799999002787548473

Please verify payment and send the account to:
📧 Email: [Enter your email here]

Thank you!`;

    const whatsappUrl = `https://wa.me/213782125821?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    trackMetaEvent('Lead', {
        content_name: productName,
        value: parseFloat(priceDZD) || 0,
        currency: 'DZD',
        content_category: 'BaridiMob'
    });
    const modal = document.getElementById('baridimob-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
}
