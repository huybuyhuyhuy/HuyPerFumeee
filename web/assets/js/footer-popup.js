let currentSlide = 0;
let autoPlayInterval;
let popupTimer;
let popupProducts = [];

function initBannerCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    const slides = document.querySelectorAll('.carousel-slide');
    const slideCount = slides.length;
    if (!track || slideCount === 0) return;

    function updateCarousel() {
        currentSlide = ((currentSlide % slideCount) + slideCount) % slideCount;
        dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
        slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
    }

    window.goToSlide = function(index) {
        currentSlide = index;
        updateCarousel();
        resetAutoPlay();
    };

    window.nextSlide = function() {
        currentSlide = (currentSlide + 1) % slideCount;
        updateCarousel();
    };

    window.prevSlide = function() {
        currentSlide = (currentSlide - 1 + slideCount) % slideCount;
        updateCarousel();
        resetAutoPlay();
    };

    function resetAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => nextSlide(), 5000);
    }

    updateCarousel();
    resetAutoPlay();

    let startX;
    let isDragging = false;
    track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX;
        if (autoPlayInterval) clearInterval(autoPlayInterval);
    });
    track.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const walk = e.pageX - startX;
        if (Math.abs(walk) > 100) {
            if (walk > 0) prevSlide();
            else nextSlide();
            isDragging = false;
        }
    });
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            resetAutoPlay();
        }
    });
}

async function fetchProductsForPopup() {
    const basePath = window.APP_CONTEXT_PATH || '';
    try {
        const response = await fetch(basePath + '/api/products/random');
        if (!response.ok) throw new Error('Network response was not ok');
        popupProducts = await response.json();
        if (popupProducts && popupProducts.length > 0) {
            setTimeout(showRandomSale, 3000);
        }
    } catch (error) {
        console.error('Sales Popup Error:', error);
    }
}

function showRandomSale() {
    const popup = document.getElementById('salesPopup');
    if (!popup || popupProducts.length === 0) return;

    const randomProduct = popupProducts[Math.floor(Math.random() * popupProducts.length)];
    const randomMinutes = Math.floor(Math.random() * 50) + 2;
    const basePath = window.APP_CONTEXT_PATH || '';

    const imgElement = document.getElementById('salesPopupImg');
    const nameElement = document.getElementById('salesPopupName');
    const timeElement = document.getElementById('salesPopupTime');
    const linkElement = document.getElementById('salesPopupLink');

    if (imgElement) {
        if (randomProduct.image && (randomProduct.image.startsWith('http') || randomProduct.image.endsWith('.jpg') || randomProduct.image.endsWith('.jpeg') || randomProduct.image.endsWith('.png') || randomProduct.image.endsWith('.webp') || randomProduct.image.endsWith('.gif'))) {
            imgElement.src = randomProduct.image.startsWith('http') ? randomProduct.image : (basePath + '/assets/images/' + randomProduct.image);
        } else {
            imgElement.src = 'https://loremflickr.com/100/100/perfume,bottle,' + encodeURIComponent(randomProduct.name) + '/all?lock=' + randomProduct.id;
        }
    }
    if (nameElement) nameElement.innerText = randomProduct.name;
    if (timeElement) timeElement.innerText = 'Một khách hàng vừa đặt mua cách đây ' + randomMinutes + ' phút';
    if (linkElement) linkElement.href = basePath + '/product-detail?id=' + randomProduct.id;

    popup.classList.add('active');
    setTimeout(() => {
        closeSalesPopup();
        const nextDelay = Math.floor(Math.random() * 10000) + 15000;
        popupTimer = setTimeout(showRandomSale, nextDelay);
    }, 6000);
}

function closeSalesPopup() {
    const popup = document.getElementById('salesPopup');
    if (popup) popup.classList.remove('active');
}

window.closeSalesPopup = closeSalesPopup;

document.addEventListener('DOMContentLoaded', () => {
    initBannerCarousel();
    fetchProductsForPopup();
});
