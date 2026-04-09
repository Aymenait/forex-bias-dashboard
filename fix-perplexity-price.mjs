// Fix Perplexity & Gemini price in BOTH Firebase collections
// ROOT CAUSE: Firebase data overwriting static HTML prices.

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

// Update BOTH collections for Perplexity and Gemini
console.log('🔄 Updating Perplexity to 1800...');
await updatePrice('products', 'perplexity', 1800, 8);
await updatePrice('products_v2', 'perplexity', 1800, 8);

console.log('🔄 Updating Gemini to 1400...');
await updatePrice('products', 'google-ai', 1400, 6);
await updatePrice('products_v2', 'google-ai', 1400, 6);

console.log('🔄 Updating ChatGPT to 1000...');
await updatePrice('products', 'chatgpt', 1000, 4);
await updatePrice('products_v2', 'chatgpt', 1000, 4);

console.log('🎉 All updates completed!');
