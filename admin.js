// ===========================
// ADMIN CREDENTIALS
// ===========================
const ADMIN_USER = 'elshaar';
const ADMIN_PASS = 'elshaar010@elshaar010';

// ملحوظة: defaultProducts, getProducts, getOrders, saveOrders
// معرّفين بالفعل في ZON Store.js اللي بيتحمّل قبل السكريبت ده في نفس الصفحة

function saveProducts(products){
    localStorage.setItem('zonProducts', JSON.stringify(products));
}

// استخراج قائمة العملاء من الأوردرات الحقيقية (بدل بيانات وهمية منفصلة)
function getCustomersFromOrders(){
    const orders = getOrders();
    const map = {};

    orders.forEach(o => {
        const key = o.phone || o.customer;
        if (!map[key]){
            map[key] = { name:o.customer, phone:o.phone, orders:0, spent:0 };
        }
        map[key].orders++;
        map[key].spent += o.total;
    });

    return Object.values(map);
}

// ===========================
// LOGIN
// ===========================
const loginScreen = document.getElementById('loginScreen');
const adminWrap = document.getElementById('adminWrap');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function checkSession(){
    if (sessionStorage.getItem('zonAdminLoggedIn') === 'true'){
        loginScreen.style.display = 'none';
        adminWrap.classList.add('active');
        renderAll();
    }
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === ADMIN_USER && pass === ADMIN_PASS){
        sessionStorage.setItem('zonAdminLoggedIn', 'true');
        loginError.classList.remove('show');
        loginScreen.style.display = 'none';
        adminWrap.classList.add('active');
        renderAll();
    } else {
        loginError.classList.add('show');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('zonAdminLoggedIn');
    adminWrap.classList.remove('active');
    loginScreen.style.display = 'flex';
    loginForm.reset();
});

checkSession();

// لو حد فتح صفحة المتجر وعمل أوردر في تاب تاني، الأدمن يتحدث تلقائي من غير ريفريش
window.addEventListener('storage', (e) => {
    if (['zonOrders', 'zonProducts'].includes(e.key) && adminWrap.classList.contains('active')){
        renderAll();
    }
});

// ===========================
// SIDEBAR NAVIGATION
// ===========================
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.dataset.target;

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');

        pageTitle.textContent = link.textContent.trim();
        document.querySelector('.sidebar').classList.remove('open');

        renderAll();   // تحديث البيانات كل مرة يتنقل بين الصفحات
    });
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ===========================
// TOAST
// ===========================
const adminToast = document.getElementById('adminToast');
let adminToastTimer = null;

function showAdminToast(message){
    adminToast.textContent = message;
    adminToast.classList.add('show');

    clearTimeout(adminToastTimer);
    adminToastTimer = setTimeout(() => {
        adminToast.classList.remove('show');
    }, 2200);
}

// ===========================
// RENDER: OVERVIEW
// ===========================
const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function statusBadge(status){
    return `<span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function renderOverview(){
    const products = getProducts();
    const orders = getOrders();
    const customers = getCustomersFromOrders();

    const totalSales = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0);

    document.getElementById('statSales').textContent = totalSales.toLocaleString() + ' EGP';
    document.getElementById('statOrders').textContent = orders.length;
    document.getElementById('statProducts').textContent = products.length;
    document.getElementById('statCustomers').textContent = customers.length;

    const tbody = document.querySelector('#recentOrdersTable tbody');

    if (orders.length === 0){
        tbody.innerHTML = '<tr><td colspan="4" style="color:#666;text-align:center;">No orders yet</td></tr>';
    } else {
        tbody.innerHTML = [...orders].reverse().slice(0, 5).map(o => `
            <tr>
                <td>${o.id}</td>
                <td>${o.customer}</td>
                <td>${o.total} EGP</td>
                <td>${statusBadge(o.status)}</td>
            </tr>
        `).join('');
    }
}

// ===========================
// RENDER: PRODUCTS (تحكم كامل في المنتجات والأسعار)
// ===========================
function renderAdminProducts(){
    const products = getProducts();
    const tbody = document.getElementById('productsTable');

    if (products.length === 0){
        tbody.innerHTML = '<tr><td colspan="6" style="color:#666;text-align:center;">No products yet</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image}" alt="${p.name}" onerror="this.src='img/751111322_18121986478726335_2278087493976543914_n.jpg'"></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${p.price} EGP</td>
            <td>${p.stock}</td>
            <td>
                <div class="table-actions">
                    <button class="edit-btn" data-id="${p.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openProductModal(Number(btn.dataset.id)));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(Number(btn.dataset.id)));
    });
}

// ===========================
// RENDER: ORDERS (حقيقية جاية من صفحة المتجر + تغيير الحالة)
// ===========================
function renderOrders(){
    const orders = getOrders();
    const tbody = document.getElementById('ordersTable');

    if (orders.length === 0){
        tbody.innerHTML = '<tr><td colspan="5" style="color:#666;text-align:center;">No orders yet — orders placed on the store will show up here</td></tr>';
        return;
    }

    tbody.innerHTML = [...orders].reverse().map(o => `
        <tr>
            <td>${o.id}</td>
            <td>${o.customer}<br><span style="color:#666;font-size:12px;">${o.phone || ''}</span></td>
            <td>${o.products}</td>
            <td>${o.total} EGP</td>
            <td>
                <select class="order-status-select" data-id="${o.id}">
                    ${statusOptions.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
                </select>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', () => {
            const orders = getOrders();
            const order = orders.find(o => o.id === select.dataset.id);
            if (order){
                order.status = select.value;
                saveOrders(orders);
                showAdminToast(`Order ${order.id} marked as ${order.status}`);
                renderOverview();
            }
        });
    });
}

// ===========================
// RENDER: CUSTOMERS (مستخرجة من الأوردرات الحقيقية)
// ===========================
function renderCustomers(){
    const customers = getCustomersFromOrders();
    const tbody = document.getElementById('customersTable');

    if (customers.length === 0){
        tbody.innerHTML = '<tr><td colspan="4" style="color:#666;text-align:center;">No customers yet</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.orders}</td>
            <td>${c.spent} EGP</td>
        </tr>
    `).join('');
}

function renderAll(){
    renderOverview();
    renderAdminProducts();
    renderOrders();
    renderCustomers();
}

// ===========================
// PRODUCT MODAL (Add / Edit / التحكم في السعر + رفع صورة حقيقي)
// ===========================
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');

function openProductModal(id = null){
    productForm.reset();
    document.getElementById('productImagePreview').style.display = 'none';
    document.getElementById('productImagePreview').src = '';
    document.getElementById('productImage').value = '';

    if (id){
        const product = getProducts().find(p => p.id === id);
        modalTitle.textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productImage').value = product.image;   // الصورة الحالية بتفضل محفوظة لحد ما يرفع صورة جديدة

        const preview = document.getElementById('productImagePreview');
        preview.src = product.image;
        preview.style.display = 'block';
    } else {
        modalTitle.textContent = 'Add Product';
        document.getElementById('productId').value = '';
    }

    productModal.classList.add('active');
}

function closeProductModal(){
    productModal.classList.remove('active');
}

document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeProductModal);

// معاينة الصورة فور اختيارها + تحويلها لـ base64 عشان تتخزن كصورة حقيقية مش مجرد اسم ملف
document.getElementById('productImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('productImage').value = reader.result;   // base64 data URL

        const preview = document.getElementById('productImagePreview');
        preview.src = reader.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const products = getProducts();
    const id = document.getElementById('productId').value;

    const productData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        price: Number(document.getElementById('productPrice').value),
        stock: Number(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value || 'img/751111322_18121986478726335_2278087493976543914_n.jpg'
    };

    if (id){
        const index = products.findIndex(p => p.id === Number(id));
        products[index] = { ...products[index], ...productData };
        showAdminToast('Product updated — changes are live on the store');
    } else {
        const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id:newId, ...productData });
        showAdminToast('Product added — now visible on the store');
    }

    saveProducts(products);
    closeProductModal();
    renderAdminProducts();
    renderOverview();
});

function deleteProduct(id){
    if (!confirm('Delete this product? It will disappear from the store too.')) return;

    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderAdminProducts();
    renderOverview();
    showAdminToast('Product deleted');
}

// ===========================
// SETTINGS
// ===========================
document.getElementById('saveSettingsBtn').addEventListener('click', (e) => {
    e.preventDefault();
    showAdminToast('Settings saved');
});
