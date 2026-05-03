// Fix Perplexity price in BOTH Firebase collections
// ROOT CAUSE: `products` collection has price_dzd=1200 while `products_v2` has 800!

const PROJECT_ID = 'the-real-world-review';
const API_KEY = 'AIzaSyCqOSFzxOVrVraBv4QtZMnVMCh1xVqZ8fw';

async function updatePrice(collection, docId, priceDZD, priceUSD) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${API_KEY}&updateMask.fieldPaths=price_dzd&updateMask.fieldPaths=price_usd&updateMask.fieldPaths=priceDZD&updateMask.fieldPaths=priceUSD`;

    const body = {
        fields: {
            price_dzd: { integerValue: String(priceDZD) },
            price_usd: { doubleValue: priceUSD },
            priceDZD: { doubleValue: priceDZD },
            priceUSD: { doubleValue: priceUSD }
        }
    };

    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
        console.log(`✅ ${collection}/${docId}: price_dzd=${priceDZD}, price_usd=${priceUSD}`);
    } else {
        console.error(`❌ Failed ${collection}/${docId}:`, data.error?.message || JSON.stringify(data));
    }
}

// Update BOTH collections!
await updatePrice('products', 'perplexity', 800, 3);
await updatePrice('products_v2', 'perplexity', 800, 3);
console.log('🎉 Done!');
