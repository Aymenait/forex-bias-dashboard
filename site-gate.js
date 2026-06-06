document.addEventListener('DOMContentLoaded', () => {
    const gate = document.querySelector('.site-gate');
    const enterButton = document.querySelector('.site-gate-enter');
    const choiceButtons = Array.from(document.querySelectorAll('.site-gate-choice'));
    const subtitle = document.querySelector('.site-gate-subtitle');

    if (!gate || !enterButton || choiceButtons.length === 0) return;

    const gateAlreadyPassed = sessionStorage.getItem('siteGatePassed') === 'true';
    const directSectionVisit = Boolean(window.location.hash);

    if (gateAlreadyPassed || directSectionVisit) {
        document.documentElement.classList.remove('gate-open');
        document.body.classList.remove('gate-open');
        gate.remove();
        document.body.classList.add('gate-passed');
        return;
    }

    document.documentElement.classList.add('gate-open');
    document.body.classList.add('gate-open');
    choiceButtons.forEach(button => {
        button.disabled = true;
    });
    gate.classList.add('is-loading');

    let gateReady = false;

    const markReady = () => {
        if (gateReady) return;
        gateReady = true;
        gate.classList.remove('is-loading');
        gate.classList.add('is-ready');
        choiceButtons.forEach(button => {
            button.disabled = false;
        });
        if (subtitle) subtitle.textContent = 'Choose your section';
    };

    const waitForFonts = document.fonts?.ready || Promise.resolve();
    const productsReady = new Promise(resolve => {
        if (Array.isArray(window.__firebaseRenderedProducts) && window.__firebaseRenderedProducts.length > 0) {
            resolve();
            return;
        }
        window.addEventListener('productsRendered', resolve, { once: true });
    });

    Promise.race([
        Promise.allSettled([waitForFonts, productsReady]),
        new Promise(resolve => window.setTimeout(resolve, 2400))
    ]).then(markReady);

    // If the static HTML is all we have, still let the visitor through quickly.
    window.setTimeout(markReady, 2800);

    const passGate = (target = 'products') => {
        if (!gateReady) return;
        sessionStorage.setItem('siteGatePassed', 'true');

        if (target === 'games') {
            window.location.href = 'games_landing.html';
            return;
        }

        document.documentElement.classList.remove('gate-open');
        document.body.classList.remove('gate-open');
        document.body.classList.add('gate-passed');
        window.setTimeout(() => gate.remove(), 720);
    };

    choiceButtons.forEach(button => {
        button.addEventListener('click', () => passGate(button.dataset.gateTarget || 'products'));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') passGate('products');
    });
});
