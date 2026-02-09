// ========================
// CONFIGURATION
// ========================
const API_URL = 'https://script.google.com/macros/s/AKfycbxW6nZZs4KK_0TRZ8DuyeFfez820HGXjy4FSDIgfO4NNl0nxO-qz0go4c5FCAixK2Qg/exec';

// ========================
// STATE MANAGEMENT
// ========================
let menuData = [];
let cart = {};
let currentTrxId = null;

// ========================
// DOM ELEMENTS
// ========================
const elements = {
    namaInput: document.getElementById('nama'),
    waInput: document.getElementById('wa'),
    menuContainer: document.getElementById('menu-container'),
    cartItems: document.getElementById('cart-items'),
    totalPrice: document.getElementById('total-price'),
    orderBtn: document.getElementById('order-btn'),
    qrisModal: document.getElementById('qris-modal'),
    qrisImage: document.getElementById('qris-image'),
    modalTotal: document.getElementById('modal-total'),
    confirmPayment: document.getElementById('confirm-payment'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message')
};

// ========================
// INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Read URL parameters
    readURLParams();
    
    // Load menu from API
    await loadMenu();
    
    // Setup event listeners
    setupEventListeners();
}

// ========================
// URL PARAMETERS
// ========================
function readURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const nama = urlParams.get('nama');
    const wa = urlParams.get('wa');
    
    if (nama) {
        elements.namaInput.value = decodeURIComponent(nama);
    }
    
    if (wa) {
        elements.waInput.value = decodeURIComponent(wa);
    }
}

// ========================
// API FUNCTIONS
// ========================
async function loadMenu() {
    showLoading(true);
    
    try {
        const response = await fetch(API_URL + '?action=get_menu', {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load menu');
        }
        
        menuData = await response.json();
        renderMenu();
    } catch (error) {
        console.error('Error loading menu:', error);
        showError('Gagal memuat menu. Silakan refresh halaman.');
    } finally {
        showLoading(false);
    }
}

async function createQRIS(total) {
    showLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'create_qris',
                total: total
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create QRIS');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            return data;
        } else {
            throw new Error('QRIS creation failed');
        }
    } catch (error) {
        console.error('Error creating QRIS:', error);
        showError('Gagal membuat QRIS. Silakan coba lagi.');
        return null;
    } finally {
        showLoading(false);
    }
}

async function saveOrder(orderData) {
    showLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'save_order',
                ...orderData
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save order');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving order:', error);
        showError('Gagal menyimpan pesanan. Silakan coba lagi.');
        return null;
    } finally {
        showLoading(false);
    }
}

// ========================
// RENDER FUNCTIONS
// ========================
function renderMenu() {
    elements.menuContainer.innerHTML = '';
    
    if (!menuData || menuData.length === 0) {
        elements.menuContainer.innerHTML = '<p class="cart-empty">Menu tidak tersedia</p>';
        return;
    }
    
    menuData.forEach(item => {
        const menuItem = createMenuItemElement(item);
        elements.menuContainer.appendChild(menuItem);
    });
}

function createMenuItemElement(item) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    
    const quantity = cart[item.id] ? cart[item.id].quantity : 0;
    
    div.innerHTML = `
        <img src="${item.gambar || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${item.nama}">
        <div class="menu-item-content">
            <h3>${item.nama}</h3>
            <p>${item.deskripsi}</p>
            <div class="menu-item-price">${formatCurrency(item.harga)}</div>
            <div class="quantity-control">
                <button onclick="decreaseQuantity(${item.id})">-</button>
                <span id="qty-${item.id}">${quantity}</span>
                <button onclick="increaseQuantity(${item.id})">+</button>
            </div>
        </div>
    `;
    
    return div;
}

function renderCart() {
    elements.cartItems.innerHTML = '';
    
    const cartArray = Object.values(cart);
    
    if (cartArray.length === 0) {
        elements.cartItems.innerHTML = '<p class="cart-empty">Keranjang kosong</p>';
        elements.totalPrice.textContent = formatCurrency(0);
        return;
    }
    
    let total = 0;
    
    cartArray.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        const subtotal = item.harga * item.quantity;
        total += subtotal;
        
        cartItem.innerHTML = `
            <div class="cart-item-name">${item.nama}</div>
            <div class="cart-item-details">
                <span class="cart-item-qty">${item.quantity}x</span>
                <span class="cart-item-price">${formatCurrency(subtotal)}</span>
            </div>
        `;
        
        elements.cartItems.appendChild(cartItem);
    });
    
    elements.totalPrice.textContent = formatCurrency(total);
}

// ========================
// CART FUNCTIONS
// ========================
function increaseQuantity(itemId) {
    const item = menuData.find(m => m.id === itemId);
    
    if (!item) return;
    
    if (cart[itemId]) {
        cart[itemId].quantity++;
    } else {
        cart[itemId] = {
            id: item.id,
            nama: item.nama,
            harga: item.harga,
            quantity: 1
        };
    }
    
    updateQuantityDisplay(itemId);
    renderCart();
}

function decreaseQuantity(itemId) {
    if (!cart[itemId]) return;
    
    cart[itemId].quantity--;
    
    if (cart[itemId].quantity <= 0) {
        delete cart[itemId];
    }
    
    updateQuantityDisplay(itemId);
    renderCart();
}

function updateQuantityDisplay(itemId) {
    const qtyElement = document.getElementById(`qty-${itemId}`);
    if (qtyElement) {
        qtyElement.textContent = cart[itemId] ? cart[itemId].quantity : 0;
    }
}

function getCartTotal() {
    return Object.values(cart).reduce((total, item) => {
        return total + (item.harga * item.quantity);
    }, 0);
}

function getCartItems() {
    return Object.values(cart).map(item => ({
        nama: item.nama,
        harga: item.harga,
        qty: item.quantity,
        subtotal: item.harga * item.quantity
    }));
}

// ========================
// EVENT LISTENERS
// ========================
function setupEventListeners() {
    // Order button
    elements.orderBtn.addEventListener('click', handleOrder);
    
    // Modal close button
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', closeModal);
    
    // Confirm payment button
    elements.confirmPayment.addEventListener('click', handleConfirmPayment);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.qrisModal) {
            closeModal();
        }
    });
}

// ========================
// ORDER HANDLING
// ========================
async function handleOrder() {
    // Validation
    const nama = elements.namaInput.value.trim();
    const wa = elements.waInput.value.trim();
    
    if (!nama) {
        showError('Nama harus diisi');
        elements.namaInput.focus();
        return;
    }
    
    if (!wa) {
        showError('Nomor WhatsApp harus diisi');
        elements.waInput.focus();
        return;
    }
    
    const cartArray = Object.values(cart);
    if (cartArray.length === 0) {
        showError('Keranjang masih kosong');
        return;
    }
    
    // Get payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const total = getCartTotal();
    
    if (paymentMethod === 'QRIS') {
        await handleQRISPayment(nama, wa, total);
    } else {
        await handleCODPayment(nama, wa, total);
    }
}

async function handleQRISPayment(nama, wa, total) {
    // Create QRIS
    const qrisData = await createQRIS(total);
    
    if (!qrisData) return;
    
    // Store transaction ID
    currentTrxId = qrisData.trx_id;
    
    // Show QRIS modal
    elements.qrisImage.src = qrisData.qris_url;
    elements.modalTotal.textContent = formatCurrency(total);
    showModal();
}

async function handleCODPayment(nama, wa, total) {
    const orderData = {
        nama: nama,
        whatsapp: wa,
        metode: 'COD',
        status: 'UNPAID',
        ref_id: 'COD-' + Date.now(),
        items: getCartItems(),
        total: total
    };
    
    const result = await saveOrder(orderData);
    
    if (result) {
        showSuccess('Pesanan berhasil! Kami akan segera menghubungi Anda.');
        resetCart();
    }
}

async function handleConfirmPayment() {
    const nama = elements.namaInput.value.trim();
    const wa = elements.waInput.value.trim();
    const total = getCartTotal();
    
    const orderData = {
        nama: nama,
        whatsapp: wa,
        metode: 'QRIS',
        status: 'PAID',
        ref_id: currentTrxId,
        items: getCartItems(),
        total: total
    };
    
    const result = await saveOrder(orderData);
    
    if (result) {
        closeModal();
        showSuccess('Pembayaran berhasil! Terima kasih atas pesanan Anda.');
        resetCart();
    }
}

// ========================
// UTILITY FUNCTIONS
// ========================
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function showLoading(show) {
    if (show) {
        elements.loading.classList.add('show');
    } else {
        elements.loading.classList.remove('show');
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('show');
    
    setTimeout(() => {
        elements.errorMessage.classList.remove('show');
    }, 3000);
}

function showSuccess(message) {
    // Reuse error message element for success
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.background = '#10b981';
    elements.errorMessage.classList.add('show');
    
    setTimeout(() => {
        elements.errorMessage.classList.remove('show');
        elements.errorMessage.style.background = '#ef4444';
    }, 3000);
}

function showModal() {
    elements.qrisModal.classList.add('show');
}

function closeModal() {
    elements.qrisModal.classList.remove('show');
}

function resetCart() {
    cart = {};
    currentTrxId = null;
    renderCart();
    
    // Update all quantity displays
    menuData.forEach(item => {
        updateQuantityDisplay(item.id);
    });
}

// ========================
// GLOBAL FUNCTIONS
// (Needed for inline onclick handlers)
// ========================
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;