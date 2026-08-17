/* ============================================
   GAMEVAULT - Main JavaScript
   ============================================ */

// State Management
const state = {
    cart: JSON.parse(localStorage.getItem('gamevault_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('gamevault_wishlist')) || [],
    currentFilter: 'all',
    currentSort: 'featured',
    searchQuery: ''
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1800);

    initNavigation();
    initHeroStats();
    renderGames();
    renderDeals();
    initFilters();
    initSorting();
    initCart();
    initAuth();
    initSearch();
    initCountdown();
    initModals();
    initSellForm();
    initScrollEffects();
    updateCartUI();
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
    });

    // Active link on click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (window.innerWidth <= 768) {
                navMenu.classList.remove('active');
                mobileToggle.textContent = '☰';
            }
        });
    });

    // Active section on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// ============================================
// HERO STATS COUNTER
// ============================================
function initHeroStats() {
    const statNums = document.querySelectorAll('.stat-num');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNums.forEach(num => observer.observe(num));
}

function animateCounter(el, target) {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);
        el.textContent = current.toLocaleString() + '+';
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ============================================
// RENDER GAMES
// ============================================
function renderGames() {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;

    let games = [...gamesData];

    // Filter
    if (state.currentFilter !== 'all') {
        games = games.filter(g => g.category === state.currentFilter);
    }

    // Search
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        games = games.filter(g =>
            g.title.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q)
        );
    }

    // Sort
    switch (state.currentSort) {
        case 'price-low':
            games.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            games.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            games.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            games.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
            break;
    }

    if (games.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; margin-bottom: 15px;">🎮</div>
                <h3 style="margin-bottom: 10px;">No games found</h3>
                <p style="color: var(--text-secondary);">Try a different search or filter</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = games.map((game, idx) => `
        <div class="game-card" data-id="${game.id}" style="animation-delay: ${idx * 0.05}s">
            <div class="game-image" style="background: ${game.color}">
                ${game.badge ? `<span class="game-badge ${game.badge}">${game.badge}</span>` : ''}
                <button class="game-wishlist ${state.wishlist.includes(game.id) ? 'active' : ''}" data-id="${game.id}" title="Add to wishlist">
                    ${state.wishlist.includes(game.id) ? '❤️' : '🤍'}
                </button>
                <span>${game.emoji}</span>
            </div>
            <div class="game-info">
                <div class="game-category">${game.category}</div>
                <h3 class="game-title">${game.title}</h3>
                <div class="game-meta">
                    <span class="game-rating">★ ${game.rating}</span>
                    <span>•</span>
                    <span>${(game.reviews / 1000).toFixed(1)}k reviews</span>
                </div>
                <div class="game-footer">
                    <div class="game-price">
                        <span class="price-current">$${game.price.toFixed(2)}</span>
                        ${game.oldPrice ? `<span class="price-old">$${game.oldPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="add-cart-btn" data-id="${game.id}" title="Add to cart">+</button>
                </div>
            </div>
        </div>
    `).join('');

    // Attach event listeners
    grid.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });

    grid.querySelectorAll('.game-wishlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleWishlist(id, btn);
        });
    });

    grid.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            openGameModal(id);
        });
    });
}

// ============================================
// RENDER DEALS
// ============================================
function renderDeals() {
    const grid = document.getElementById('dealsGrid');
    if (!grid) return;

    const deals = gamesData.filter(g => g.badge === 'sale' || g.badge === 'hot').slice(0, 4);
    grid.innerHTML = deals.map(game => `
        <div class="game-card" data-id="${game.id}">
            <div class="game-image" style="background: ${game.color}">
                <span class="game-badge ${game.badge}">${game.badge === 'sale' ? '🔥 SALE' : '⚡ HOT'}</span>
                <span>${game.emoji}</span>
            </div>
            <div class="game-info">
                <div class="game-category">${game.category}</div>
                <h3 class="game-title">${game.title}</h3>
                <div class="game-meta">
                    <span class="game-rating">★ ${game.rating}</span>
                    <span>•</span>
                    <span>${(game.reviews / 1000).toFixed(1)}k reviews</span>
                </div>
                <div class="game-footer">
                    <div class="game-price">
                        <span class="price-current">$${game.price.toFixed(2)}</span>
                        ${game.oldPrice ? `<span class="price-old">$${game.oldPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="add-cart-btn" data-id="${game.id}">+</button>
                </div>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(parseInt(btn.dataset.id));
        });
    });

    grid.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            openGameModal(parseInt(card.dataset.id));
        });
    });
}

// ============================================
// FILTERS & SORTING
// ============================================
function initFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentFilter = tab.dataset.filter;
            renderGames();
        });
    });

    // Category cards filter
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category;
            state.currentFilter = cat;
            tabs.forEach(t => {
                t.classList.remove('active');
                if (t.dataset.filter === cat) t.classList.add('active');
            });
            document.getElementById('store').scrollIntoView({ behavior: 'smooth' });
            setTimeout(renderGames, 500);
        });
    });
}

function initSorting() {
    const select = document.getElementById('sortSelect');
    if (!select) return;
    select.addEventListener('change', () => {
        state.currentSort = select.value;
        renderGames();
    });
}

// ============================================
// SEARCH
// ============================================
function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let timeout;
    input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            state.searchQuery = input.value;
            renderGames();
        }, 300);
    });
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function initCountdown() {
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    if (!hoursEl) return;

    let totalSeconds = 23 * 3600 + 59 * 60 + 59;

    function tick() {
        if (totalSeconds <= 0) totalSeconds = 24 * 3600;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        hoursEl.textContent = String(h).padStart(2, '0');
        minutesEl.textContent = String(m).padStart(2, '0');
        secondsEl.textContent = String(s).padStart(2, '0');
        totalSeconds--;
    }
    tick();
    setInterval(tick, 1000);
}

// ============================================
// CART FUNCTIONS
// ============================================
function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });

    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }

    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    clearCartBtn.addEventListener('click', () => {
        if (state.cart.length === 0) return;
        if (confirm('Clear all items from cart?')) {
            state.cart = [];
            saveCart();
            updateCartUI();
            showToast('Cart cleared');
        }
    });

    checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        alert(`🎉 Order Placed Successfully!\n\nTotal: $${total.toFixed(2)}\n\nThank you for shopping with GameVault!`);
        state.cart = [];
        saveCart();
        updateCartUI();
        closeCart();
    });
}

function addToCart(id) {
    const game = gamesData.find(g => g.id === id);
    if (!game) return;

    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ ...game, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast(`${game.title} added to cart!`);
}

function removeFromCart(id) {
    state.cart = state.cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function updateQty(id, change) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += change;
    if (item.qty <= 0) {
        removeFromCart(id);
        return;
    }
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('gamevault_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    const totalCountEl = document.getElementById('cartTotalCount');
    const itemsEl = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');

    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    countEl.textContent = totalItems;
    countEl.classList.add('bounce');
    setTimeout(() => countEl.classList.remove('bounce'), 400);
    totalCountEl.textContent = `(${totalItems})`;

    if (state.cart.length === 0) {
        itemsEl.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <p>Your cart is empty</p>
                <span>Add some games to get started!</span>
            </div>
        `;
    } else {
        itemsEl.innerHTML = state.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-img" style="background: ${item.color}">
                    <span>${item.emoji}</span>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-cat">${item.category}</div>
                    <div class="cart-item-bottom">
                        <div class="cart-qty">
                            <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                            <span class="qty-num">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                        </div>
                        <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove">🗑</button>
            </div>
        `).join('');
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

// ============================================
// WISHLIST
// ============================================
function toggleWishlist(id, btn) {
    const idx = state.wishlist.indexOf(id);
    if (idx > -1) {
        state.wishlist.splice(idx, 1);
        btn.textContent = '🤍';
        btn.classList.remove('active');
        showToast('Removed from wishlist');
    } else {
        state.wishlist.push(id);
        btn.textContent = '❤️';
        btn.classList.add('active');
        showToast('Added to wishlist ❤️');
    }
    localStorage.setItem('gamevault_wishlist', JSON.stringify(state.wishlist));
}

// ============================================
// MODALS
// ============================================
function initModals() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

function openGameModal(id) {
    const game = gamesData.find(g => g.id === id);
    if (!game) return;

    const modal = document.getElementById('gameModal');
    const content = document.getElementById('modalContent');
    const inCart = state.cart.find(item => item.id === id);

    content.innerHTML = `
        <div class="modal-game-hero" style="background: ${game.color}">
            <span>${game.emoji}</span>
        </div>
        <div class="modal-body">
            <div class="modal-category">${game.category}</div>
            <h2 class="modal-title">${game.title}</h2>
            <div class="modal-stats">
                <div class="modal-stat">
                    <span class="modal-stat-label">Rating</span>
                    <span class="modal-stat-value rating">★ ${game.rating} / 5.0</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-label">Reviews</span>
                    <span class="modal-stat-value">${game.reviews.toLocaleString()}</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-label">Developer</span>
                    <span class="modal-stat-value">${game.developer}</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-label">Released</span>
                    <span class="modal-stat-value">${new Date(game.releaseDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                </div>
            </div>
            <p class="modal-description">${game.description}</p>
            <div class="modal-features">
                ${game.features.map(f => `<div class="feature"><span class="feature-icon">✓</span>${f}</div>`).join('')}
            </div>
            <div class="modal-footer">
                <div class="modal-price">
                    ${game.oldPrice ? `<span class="price-old">$${game.oldPrice.toFixed(2)}</span>` : ''}
                    <span class="price-current">$${game.price.toFixed(2)}</span>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="toggleWishlistFromModal(${game.id})">
                        ${state.wishlist.includes(game.id) ? '❤️ Saved' : '🤍 Wishlist'}
                    </button>
                    <button class="btn btn-primary" onclick="addToCart(${game.id}); closeModal();">
                        ${inCart ? '✓ In Cart' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleWishlistFromModal(id) {
    const game = gamesData.find(g => g.id === id);
    const idx = state.wishlist.indexOf(id);
    if (idx > -1) {
        state.wishlist.splice(idx, 1);
        showToast('Removed from wishlist');
    } else {
        state.wishlist.push(id);
        showToast(`${game.title} added to wishlist ❤️`);
    }
    localStorage.setItem('gamevault_wishlist', JSON.stringify(state.wishlist));
    openGameModal(id); // Re-render
}

// ============================================
// AUTH MODAL
// ============================================
function initAuth() {
    const userBtn = document.getElementById('userBtn');
    const authOverlay = document.getElementById('authOverlay');
    const authClose = document.getElementById('authClose');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');

    userBtn.addEventListener('click', () => {
        authOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    authClose.addEventListener('click', () => {
        authOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    authOverlay.addEventListener('click', (e) => {
        if (e.target === authOverlay) {
            authOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Welcome back, gamer! 🎮');
        authOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// ============================================
// SELL FORM
// ============================================
function initSellForm() {
    const form = document.getElementById('sellForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = form.querySelectorAll('input, select');
        const data = Array.from(inputs).map(i => i.value).filter(v => v);
        if (data.length < 5) {
            showToast('Please fill all fields');
            return;
        }
        const price = parseFloat(form.querySelector('input[type="number"]').value) || 25;
        const offerPrice = (price * 0.7).toFixed(2);
        showToast(`Great! Our offer: $${offerPrice} 🎉`);
        form.reset();
    });
}

// ============================================
// SCROLL EFFECTS
// ============================================
function initScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.category-card, .step, .testimonial').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ============================================
// TOAST
// ============================================
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = toast.querySelector('.toast-message');
    msgEl.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expose functions globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQty = updateQty;
window.closeModal = closeModal;
window.toggleWishlistFromModal = toggleWishlistFromModal;
window.openGameModal = openGameModal;

// Load more
document.getElementById('loadMore')?.addEventListener('click', () => {
    showToast('Showing all available games');
});
