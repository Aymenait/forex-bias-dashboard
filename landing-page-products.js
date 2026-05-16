const LANDING_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCqOSFzxOVrVraBv4QtZMnVMCh1xVqZ8fw",
    authDomain: "the-real-world-review.firebaseapp.com",
    projectId: "the-real-world-review",
    storageBucket: "the-real-world-review.firebasestorage.app",
    messagingSenderId: "324349726142",
    appId: "1:324349726142:web:eff2cde07b569ed0a3bdef",
    measurementId: "G-5FPYPJDSF4"
};

function normalizeLandingOffer(offer = {}) {
    return {
        id: offer.id || '',
        dzd: Number(offer.priceDZD ?? offer.price_dzd ?? 0),
        usd: Number(offer.priceUSD ?? offer.price_usd ?? 0),
        availability: offer.availability || 'available'
    };
}

function normalizeLandingProduct(id, data = {}) {
    return {
        id,
        priceDZD: Number(data.priceDZD ?? data.price_dzd ?? 0),
        priceUSD: Number(data.priceUSD ?? data.price_usd ?? 0),
        availability: data.availability || data.status || (data.available === false ? 'unavailable' : 'available'),
        subOffers: Array.isArray(data.subOffers) ? data.subOffers.map(normalizeLandingOffer) : []
    };
}

async function loadLandingProduct(productId) {
    const [{ initializeApp, getApps }, { getFirestore, doc, getDoc }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
    ]);

    const app = getApps()[0] || initializeApp(LANDING_FIREBASE_CONFIG);
    const db = getFirestore(app);
    const snapshot = await getDoc(doc(db, 'products_v2', productId));

    if (!snapshot.exists()) return null;
    return normalizeLandingProduct(snapshot.id, snapshot.data());
}

window.LandingProductSync = {
    loadProduct: loadLandingProduct,
    syncSimplePagePrice(product, options = {}) {
        if (!product) return;

        const dzd = Number(product.priceDZD || 0);
        const usd = Number(product.priceUSD || 0);
        if (!dzd && !usd) return;

        document.querySelectorAll('[data-price]').forEach(el => el.setAttribute('data-price', dzd));
        document.querySelectorAll('[data-price-usd]').forEach(el => el.setAttribute('data-price-usd', usd));

        ['baridimob-price-dzd', 'baridimob-price', 'crypto-price-dzd'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(dzd);
        });
        ['crypto-price-usd', 'redotpay-price-usd'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(usd);
        });

        document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data?.offers) {
                    data.offers.price = String(dzd);
                    script.textContent = JSON.stringify(data);
                }
            } catch (_) {
                // Ignore malformed structured data blocks.
            }
        });

        const heroText = options.heroText?.(dzd, usd);
        if (heroText) {
            document.querySelectorAll('[data-i18n=\"hero.price\"]').forEach(el => el.textContent = heroText);
        }

        const pricingText = options.pricingText?.(dzd, usd);
        if (pricingText) {
            document.querySelectorAll('[data-i18n=\"pricing.dzd\"]').forEach(el => el.textContent = pricingText);
        }

        if (options.mainPriceSelector) {
            document.querySelectorAll(options.mainPriceSelector).forEach(el => {
                el.textContent = options.mainPriceText ? options.mainPriceText(dzd, usd) : String(dzd);
            });
        }

        if (Array.isArray(options.replaceAmounts) && options.replaceAmounts.length > 0) {
            const applyReplacements = () => {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                    let text = walker.currentNode.nodeValue;
                    options.replaceAmounts.forEach(({ from, to }) => {
                        text = text.replaceAll(String(from), String(typeof to === 'function' ? to(dzd, usd) : to));
                    });
                    walker.currentNode.nodeValue = text;
                }
            };

            applyReplacements();
            const observer = new MutationObserver(() => applyReplacements());
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        }
    }
};
