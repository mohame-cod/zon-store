// ===========================
// SHARED DATA (نفس المصدر اللي بيقرأه admin.js)
// ===========================
const defaultProducts = [
    { id:1, name:'Walk With God', category:'Box Fit', price:490, stock:25, image:'img/WhatsApp Image 2026-07-27 at 9.26.07 AM.jpeg' },
    { id:2, name:'London City - Black', category:'Oversized', price:460, stock:18, image:'img/WhatsApp Image 2026-07-27 at 9.26.10 AM (1).jpeg' },
    { id:3, name:'London City - Green', category:'Oversized', price:460, stock:14, image:'img/WhatsApp Image 2026-07-27 at 9.26.10 AM.jpeg' },
    { id:4, name:'London City - Maroon', category:'Oversized', price:460, stock:9, image:'img/WhatsApp Image 2026-07-27 at 9.26.10 AM (2).jpeg' }
];

function getProducts(){
     const saved = localStorage.getItem('zonProducts');
    return saved ? JSON.parse(saved) : defaultProducts;
}

function getOrders(){
    const saved = localStorage.getItem('zonOrders');
    return saved ? JSON.parse(saved) : [];
}

function saveOrders(orders){
    localStorage.setItem('zonOrders', JSON.stringify(orders));
}

// ===========================
// AOS (Animate On Scroll)
// ===========================
AOS.init({
    once:true,
    offset:80
});

// ===========================
// RENDER PRODUCTS (من نفس بيانات الأدمن)
// ===========================
const productsGrid = document.getElementById('productsGrid');

function renderProducts(){
    const products = getProducts();

    productsGrid.innerHTML = products.map((p, i) => `
        <div class="card" data-id="${p.id}" data-aos="fade-up" data-aos-delay="${i * 100}">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='img/751111322_18121986478726335_2278087493976543914_n.jpg'">
            <h3>${p.name}</h3>
            <p>${p.category}${p.stock === 0 ? ' — Out of stock' : ''}</p>
            <h4>${p.price} EGP</h4>
            <button class="add-cart" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? 'Out of Stock' : 'Add To Cart'}</button>
        </div>
    `).join('');

    document.querySelectorAll('.add-cart').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            addToCart(Number(card.dataset.id));
        });
    });

    if (window.AOS) AOS.refreshHard();   // يخلي AOS يلاقي العناصر الجديدة اللي اتولدت بالجافاسكريبت
}

renderProducts();

// ===========================
// MENU TOGGLE (الهامبرغر)
// ===========================
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
});

navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

// ===========================
// HEADER SCROLLED STATE
// ===========================
const siteHeader = document.getElementById('siteHeader');

window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 30);
});

// ===========================
// SEARCH OVERLAY
// ===========================
const searchIcon = document.getElementById('searchIcon');
const searchOverlay = document.getElementById('searchOverlay');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');

searchIcon.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    searchInput.focus();
});

searchClose.addEventListener('click', () => {
    searchOverlay.classList.remove('active');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchOverlay.classList.remove('active');
        closeCart();
        closeCheckout();
    }
});

// ===========================
// WISHLIST TOGGLE
// ===========================
const wishlistIcon = document.getElementById('wishlistIcon');

wishlistIcon.addEventListener('click', () => {
    wishlistIcon.classList.toggle('active');
});

// ===========================
// TOAST
// ===========================
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(message){
    toast.textContent = message;
    toast.classList.remove('animate__animated', 'animate__rotateOut');
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add('animate__animated', 'animate__rotateOut');
        setTimeout(() => {
            toast.classList.remove('show', 'animate__animated', 'animate__rotateOut');
        }, 600);
    }, 2500);
}

// ===========================
// CART (متجمع من localStorage عشان يفضل موجود بعد الريفريش)
// ===========================
let cart = JSON.parse(localStorage.getItem('zonCart') || '[]');

const cartCount = document.getElementById('cartCount');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const cartIcon = document.getElementById('cartIcon');

function persistCart(){
    localStorage.setItem('zonCart', JSON.stringify(cart));
}

function addToCart(productId){
    const product = getProducts().find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    const existing = cart.find(item => item.id === productId);

    if (existing){
        existing.qty++;
    } else {
        cart.push({ id:product.id, name:product.name, price:product.price, image:product.image, qty:1 });
    }

    persistCart();
    renderCart();
    showToast(`${product.name} added to cart`);
}

function changeQty(productId, delta){
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0){
        cart = cart.filter(i => i.id !== productId);
    }

    persistCart();
    renderCart();
}

function removeFromCart(productId){
    cart = cart.filter(i => i.id !== productId);
    persistCart();
    renderCart();
}

function cartTotal(){
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function renderCart(){
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalQty;

    if (cart.length === 0){
        cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    } else {
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='img/751111322_18121986478726335_2278087493976543914_n.jpg'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>${item.price} EGP</span>
                    <div class="cart-item-qty">
                        <button class="qty-minus" data-id="${item.id}">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <i class="fa-solid fa-trash cart-item-remove" data-id="${item.id}"></i>
            </div>
        `).join('');

        cartItemsEl.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => changeQty(Number(btn.dataset.id), 1));
        });
        cartItemsEl.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => changeQty(Number(btn.dataset.id), -1));
        });
        cartItemsEl.querySelectorAll('.cart-item-remove').forEach(icon => {
            icon.addEventListener('click', () => removeFromCart(Number(icon.dataset.id)));
        });
    }

    cartTotalPrice.textContent = cartTotal().toLocaleString() + ' EGP';
}

function openCart(){
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('active');
}

function closeCart(){
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('active');
}

cartIcon.addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

renderCart();

// ===========================
// CHECKOUT -> بيبعت الأوردر لـ localStorage عشان يظهر في صفحة الأدمن
// ===========================
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutSummary = document.getElementById('checkoutSummary');

function openCheckout(){
    if (cart.length === 0){
        showToast('Your cart is empty');
        return;
    }

    checkoutSummary.innerHTML = cart.map(item => `
        <div><span>${item.name} x${item.qty}</span><span>${item.price * item.qty} EGP</span></div>
    `).join('') + `<div><strong>Total</strong><strong>${cartTotal()} EGP</strong></div>`;

    closeCart();
    checkoutOverlay.classList.add('active');
}

function closeCheckout(){
    checkoutOverlay.classList.remove('active');
}

document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
document.getElementById('checkoutCancel').addEventListener('click', closeCheckout);

checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const orders = getOrders();
    const nextNum = 1001 + orders.length;

    const newOrder = {
        id: '#' + nextNum,
        customer: document.getElementById('checkoutName').value.trim(),
        phone: document.getElementById('checkoutPhone').value.trim(),
        address: document.getElementById('checkoutAddress').value.trim(),
        products: cart.map(i => `${i.name} x${i.qty}`).join(', '),
        total: cartTotal(),
        status: 'pending',
        date: new Date().toISOString()
    };

    orders.push(newOrder);
    saveOrders(orders);   // ده اللي بيوصل الأوردر لصفحة الأدمن

    // تحديث المخزون بناءً على الطلب
    const products = getProducts();
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) product.stock = Math.max(0, product.stock - item.qty);
    });
    localStorage.setItem('zonProducts', JSON.stringify(products));

    cart = [];
    persistCart();
    renderCart();
    renderProducts();

    checkoutForm.reset();
    closeCheckout();
    showToast(`Order ${newOrder.id} placed successfully!`);
});
