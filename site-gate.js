document.addEventListener('DOMContentLoaded', () => {
    const gate = document.querySelector('.site-gate');
    const enterButton = document.querySelector('.site-gate-enter');

    if (!gate || !enterButton) return;

    const gateAlreadyPassed = sessionStorage.getItem('siteGatePassed') === 'true';
    const directSectionVisit = Boolean(window.location.hash);

    if (gateAlreadyPassed || directSectionVisit) {
        gate.remove();
        document.body.classList.add('gate-passed');
        return;
    }

    document.documentElement.classList.add('gate-open');
    document.body.classList.add('gate-open');

    const passGate = () => {
        sessionStorage.setItem('siteGatePassed', 'true');
        document.documentElement.classList.remove('gate-open');
        document.body.classList.remove('gate-open');
        document.body.classList.add('gate-passed');
        window.setTimeout(() => gate.remove(), 720);
    };

    enterButton.addEventListener('click', passGate);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') passGate();
    });
});
