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
        let spotlightEnabled = false;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const updateSpotlight = (x, y) => {
            hero.style.setProperty('--spot-x', `${x}%`);
            hero.style.setProperty('--spot-y', `${y}%`);
        };

        const handlePointerMove = (clientX, clientY) => {
            const rect = hero.getBoundingClientRect();
            const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
            const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
            updateSpotlight(x, y);
        };

        const enableSpotlight = () => {
            if (spotlightEnabled) {
                return;
            }

            spotlightEnabled = true;

            hero.addEventListener('mousemove', (event) => {
                handlePointerMove(event.clientX, event.clientY);
            });

            hero.addEventListener('mouseenter', (event) => {
                handlePointerMove(event.clientX, event.clientY);
            });

            hero.addEventListener('mouseleave', () => {
                updateSpotlight(50, 50);
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
                updateSpotlight(50, 50);
            });
        };

        const setHeroMode = (isCoarse) => {
            if (isCoarse) {
                hero.classList.add('hero-static');
            } else {
                hero.classList.remove('hero-static');
                enableSpotlight();
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

        if (!pointerQuery.matches) {
            enableSpotlight();
        }
    }
});
