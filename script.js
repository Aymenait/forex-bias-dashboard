document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('order-modal');
    const closeBtn = document.querySelector('.close-btn');
    const orderBtns = document.querySelectorAll('.order-btn');
    const productNameInput = document.getElementById('product-name');
    const orderForm = document.getElementById('order-form');

    orderBtns.forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.getAttribute('data-product');
            productNameInput.value = productName;
            modal.style.display = 'flex';
        });
    });

    const hideModal = () => {
        modal.style.display = 'none';
        productNameInput.value = '';
    };

    closeBtn.addEventListener('click', hideModal);

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideModal();
        }
    });

    orderForm.addEventListener('submit', () => {
        setTimeout(() => {
            hideModal();
        }, 1000);
    });

    const hero = document.querySelector('.hero');

    if (hero) {
        const pointerQuery = window.matchMedia('(pointer: coarse)');
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        let spotlightInitialized = false;
        let inactivityTimeoutId;

        const activateSpotlight = () => {
            if (!hero.classList.contains('hero-spotlight-active')) {
                hero.classList.add('hero-spotlight-active');
            }
        };

        const deactivateSpotlight = () => {
            hero.classList.remove('hero-spotlight-active');
            hero.style.setProperty('--spot-x', '50%');
            hero.style.setProperty('--spot-y', '50%');
        };

        const scheduleInactivityReset = () => {
            clearTimeout(inactivityTimeoutId);
            inactivityTimeoutId = setTimeout(() => {
                deactivateSpotlight();
            }, 3500);
        };

        const updateSpotlight = (x, y) => {
            hero.style.setProperty('--spot-x', `${x}%`);
            hero.style.setProperty('--spot-y', `${y}%`);
        };

        const handlePointerMove = (clientX, clientY) => {
            const rect = hero.getBoundingClientRect();
            const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
            const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
            activateSpotlight();
            updateSpotlight(x, y);
            scheduleInactivityReset();
        };

        const attachSpotlightHandlers = () => {
            if (spotlightInitialized) {
                return;
            }

            spotlightInitialized = true;

            hero.addEventListener('mousemove', (event) => {
                handlePointerMove(event.clientX, event.clientY);
            });

            hero.addEventListener('mouseenter', (event) => {
                handlePointerMove(event.clientX, event.clientY);
            });

            hero.addEventListener('mouseleave', () => {
                clearTimeout(inactivityTimeoutId);
                deactivateSpotlight();
            });

            hero.addEventListener('touchstart', (event) => {
                const touch = event.touches[0];
                if (touch) {
                    handlePointerMove(touch.clientX, touch.clientY);
                }
            }, { passive: true });

            hero.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];
                if (touch) {
                    handlePointerMove(touch.clientX, touch.clientY);
                }
            }, { passive: true });

            hero.addEventListener('touchend', () => {
                scheduleInactivityReset();
            });
        };

        const setHeroMode = (isCoarse) => {
            hero.classList.toggle('hero-static', isCoarse);

            if (isCoarse) {
                clearTimeout(inactivityTimeoutId);
                deactivateSpotlight();
            } else {
                attachSpotlightHandlers();
            }
        };

        const handlePointerPreferenceChange = (event) => {
            setHeroMode(event.matches);
        };

        if (typeof pointerQuery.addEventListener === 'function') {
            pointerQuery.addEventListener('change', handlePointerPreferenceChange);
        } else if (typeof pointerQuery.addListener === 'function') {
            pointerQuery.addListener(handlePointerPreferenceChange);
        }

        setHeroMode(pointerQuery.matches);
    }
});
