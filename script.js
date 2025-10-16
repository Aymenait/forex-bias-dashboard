document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('order-modal');
    const closeBtn = document.querySelector('.close-btn');
    const orderBtns = document.querySelectorAll('.order-btn');
    const productNameInput = document.getElementById('product-name');
    const orderForm = document.getElementById('order-form');

    // Show modal when any "Order Now" button is clicked
    orderBtns.forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.getAttribute('data-product');
            productNameInput.value = productName;
            modal.style.display = 'block';
        });
    });

    // Hide modal when the close button is clicked
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Hide modal when clicking outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Optional: Thank you message after form submission
    orderForm.addEventListener('submit', () => {
        setTimeout(() => {
            modal.style.display = 'none';
            // You can add a more sophisticated "thank you" message here if you want
        }, 1000); // Give a 1-second delay for the form to submit
    });
});