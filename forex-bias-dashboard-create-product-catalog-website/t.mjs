const url = 'https://firestore.googleapis.com/v1/projects/the-real-world-review/databases/(default)/documents/products_v2/perplexity?updateMask.fieldPaths=priceDZD&updateMask.fieldPaths=priceUSD&key=AIzaSyCqOSFzxOVrVraBv4QtZMnVMCh1xVqZ8fw';
fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { priceDZD: { doubleValue: 800 }, priceUSD: { doubleValue: 3 } } }) })
    .then(r => r.json()).then(d => d.error ? console.error('fail', d.error.message) : console.log('ok 800'));
