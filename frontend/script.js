/**
 * @fileoverview Frontend Application Architecture for The Obsidian Shelf.
 * Implements Separation of Concerns via three distinct modules:
 * 1. BookstoreDAO (Data Access Object for REST API communication)
 * 2. Store (Centralized application state management)
 * 3. ArchiveUI (DOM rendering and event handling)
 * @author Salma Benhadi
 */

const API_BASE_URL = 'http://obsidian-api.test/api';

/**
 * @namespace Store
 * @description Centralized state container holding catalog, authentication, and user records.
 */
const Store = {
    books: [],
    wishlistIds: JSON.parse(localStorage.getItem('obsidian_wishlist') || '[]'),
    reservations: JSON.parse(localStorage.getItem('obsidian_reservations') || '[]'),
    token: localStorage.getItem('obsidian_token') || null,
    user: JSON.parse(localStorage.getItem('obsidian_user') || 'null'),
    activeView: 'catalog',
    activeFilter: 'all',
    selectedBook: null,

    /**
     * Generates a fallback deterministic ISBN-13 if the database record omits one.
     * @param {Object} book - Book entity from the backend.
     * @returns {string} Formatted ISBN-13 code.
     */
    getBookIsbn(book) {
        if (book.isbn) return book.isbn;
        const paddedId = String(book.id || 1).padStart(4, '0');
        return `978-1-4088-${paddedId}-2`;
    },

    /**
     * Calculates the official pickup deadline date (7 days from reservation).
     * @param {string} [isoDate] - Optional starting ISO date string.
     * @returns {string} Formatted pickup date string in English.
     */
    calculatePickupWindow(isoDate) {
        const baseDate = isoDate ? new Date(isoDate) : new Date();
        baseDate.setDate(baseDate.getDate() + 7);
        return baseDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
};

/**
 * @namespace BookstoreDAO
 * @description Data Access Object pattern encapsulating all HTTP REST calls to the Laravel backend.
 */
const BookstoreDAO = {
    /**
     * Builds standard HTTP headers including Bearer token when authenticated.
     * @returns {Object} HTTP headers dictionary.
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (Store.token) {
            headers['Authorization'] = `Bearer ${Store.token}`;
        }
        return headers;
    },

    /**
     * Retrieves the paginated book catalog from GET /api/books.
     * @returns {Promise<Array<Object>>} List of books.
     */
    async fetchBooks() {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        const payload = await response.json();
        return Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    },

    /**
     * Authenticates a user via POST /api/login.
     * @param {string} email - User email address.
     * @param {string} password - User password.
     * @returns {Promise<{ok: boolean, data: Object}>} API response wrapper.
     */
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        return { ok: response.ok, data };
    },

    /**
     * Registers a new user account via POST /api/register.
     * @param {Object} payload - Registration fields (name, email, password, password_confirmation).
     * @returns {Promise<{ok: boolean, data: Object}>} API response wrapper.
     */
    async register(payload) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return { ok: response.ok, data };
    },

    /**
     * Reserves a book in stock via POST /api/reservations.
     * @param {number} bookId - Unique identifier of the book.
     * @returns {Promise<{ok: boolean, data: Object}>} API response wrapper.
     */
    async createReservation(bookId) {
        const response = await fetch(`${API_BASE_URL}/reservations`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ book_id: bookId })
        });
        const data = await response.json();
        return { ok: response.ok, data };
    },

    /**
     * Toggles a book in the authenticated user's wishlist via POST /api/wishlist/toggle.
     * @param {number} bookId - Unique identifier of the book.
     * @returns {Promise<{ok: boolean, data: Object}>} API response wrapper.
     */
    async toggleWishlist(bookId) {
        const response = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ book_id: bookId })
        });
        const data = await response.json();
        return { ok: response.ok, data };
    },

    /**
     * Submits a book review (rating 1-5 and comment) via POST /api/books/{id}/reviews.
     * @param {number} bookId - Unique identifier of the book.
     * @param {number} rating - Score between 1 and 5.
     * @param {string} comment - Review text.
     * @returns {Promise<{ok: boolean, data: Object}>} API response wrapper.
     */
    async submitReview(bookId, rating, comment) {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}/reviews`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ book_id: bookId, rating, comment })
        });
        const data = await response.json();
        return { ok: response.ok, data };
    }
};

/**
 * @namespace ArchiveUI
 * @description Presentation controller managing DOM updates, modals, and user interactions.
 */
const ArchiveUI = {
    /**
     * Initializes the entire frontend application.
     * @returns {Promise<void>}
     */
    async init() {
        this.spawnEmbers();
        this.bindGrimoireGate();
        this.bindNavigation();
        this.bindAuthForms();
        this.bindReviewForm();
        this.updateUserHeader();
        this.updateCounters();
        await this.loadCatalog();
    },

    /**
     * Creates floating ambient golden embers in the background.
     * @returns {void}
     */
    spawnEmbers() {
        const container = document.getElementById('embers-container');
        for (let i = 0; i < 20; i++) {
            const ember = document.createElement('span');
            ember.className = 'ember';
            ember.style.left = `${Math.random() * 100}%`;
            ember.style.animationDuration = `${8 + Math.random() * 10}s`;
            ember.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(ember);
        }
    },

    /**
     * Binds the 3D opening Grimoire cover transition.
     * @returns {void}
     */
    bindGrimoireGate() {
        const gate = document.getElementById('grimoire-gate');
        const hall = document.getElementById('archive-hall');
        const openBtn = document.getElementById('btn-open-archive');
        const reopenBtn = document.getElementById('btn-reopen-book');

        if (sessionStorage.getItem('grimoire_opened') === 'true') {
            gate.classList.add('is-hidden');
            hall.classList.remove('is-hidden');
        }

        openBtn.addEventListener('click', () => {
            gate.classList.add('opening');
            sessionStorage.setItem('grimoire_opened', 'true');
            setTimeout(() => {
                gate.classList.add('is-hidden');
                gate.classList.remove('opening');
                hall.classList.remove('is-hidden');
            }, 700);
        });

        reopenBtn.addEventListener('click', () => {
            hall.classList.add('is-hidden');
            gate.classList.remove('is-hidden');
        });
    },

    /**
     * Fetches the book catalog via BookstoreDAO and renders the shelf.
     * @returns {Promise<void>}
     */
    async loadCatalog() {
        const loading = document.getElementById('loading-state');
        try {
            Store.books = await BookstoreDAO.fetchBooks();
            loading.classList.add('is-hidden');
            this.renderCatalog();
        } catch (error) {
            console.error('Failed to load catalog:', error);
            loading.innerHTML = `<p>⚠️ Connection Error: Ensure Laravel Herd is active at <strong>${API_BASE_URL}</strong>.</p>`;
        }
    },

    /**
     * Renders the filtered grid of books into #books-container.
     * @returns {void}
     */
    renderCatalog() {
        const container = document.getElementById('books-container');
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        container.innerHTML = '';

        const filteredBooks = Store.books.filter(book => {
            const isbn = Store.getBookIsbn(book).toLowerCase();
            const matchesView = Store.activeView === 'wishlist' ? Store.wishlistIds.includes(book.id) : true;
            const matchesStock = Store.activeFilter === 'available' ? Number(book.stock) > 0 : true;
            const text = `${book.title} ${book.author} ${isbn} ${book.tropes || ''} ${book.genre || ''}`.toLowerCase();
            return matchesView && matchesStock && text.includes(query);
        });

        if (filteredBooks.length === 0) {
            container.innerHTML = `
                <div class="loading-scroll" style="grid-column: 1 / -1;">
                    <p>No manuscripts match your search criteria in this wing of the archive.</p>
                </div>`;
            return;
        }

        filteredBooks.forEach(book => {
            const isWishlisted = Store.wishlistIds.includes(book.id);
            const stock = Number(book.stock ?? 0);
            const isbn = Store.getBookIsbn(book);
            const trope = book.tropes || book.genre || 'Romantasy';
            const description = book.description || book.synopsis || `An ancient manuscript preserved within The Obsidian Shelf.`;

            const card = document.createElement('article');
            card.className = 'book-card';
            card.innerHTML = `
                <div class="card-top-meta">
                    <span class="trope-tag">${this.escapeHtml(trope)}</span>
                    <button class="wishlist-heart-btn" type="button" data-wishlist-id="${book.id}" title="Toggle Wishlist">
                        ${isWishlisted ? '❤️' : '🖤'}
                    </button>
                </div>

                <h2>${this.escapeHtml(book.title)}</h2>
                <p class="book-author">By ${this.escapeHtml(book.author)}</p>
                <p class="book-isbn-badge">ISBN: ${this.escapeHtml(isbn)}</p>
                <p class="book-synopsis-preview">${this.escapeHtml(description)}</p>

                <div class="book-stats-row">
                    <span class="price-tag">€${Number(book.price || 19.99).toFixed(2)}</span>
                    <span class="stock-badge ${stock > 0 ? 'in-stock' : 'out-stock'}">
                        ${stock > 0 ? `${stock} in stock` : 'Out of stock'}
                    </span>
                </div>

                <div class="card-actions">
                    <button class="card-btn btn-inspect" type="button" data-inspect-id="${book.id}">
                        ✒️ Details &amp; Reviews
                    </button>
                    <button class="card-btn btn-reserve" type="button" data-reserve-id="${book.id}" ${stock <= 0 ? 'disabled' : ''}>
                        📜 Reserve
                    </button>
                </div>
            `;

            card.querySelector('[data-wishlist-id]').addEventListener('click', () => this.handleWishlistToggle(book.id));
            card.querySelector('[data-inspect-id]').addEventListener('click', () => this.openBookDetail(book.id));
            card.querySelector('[data-reserve-id]').addEventListener('click', () => this.handleReservation(book.id));

            container.appendChild(card);
        });
    },

    /**
     * Renders the user's profile view including their reserved/purchased books and review actions.
     * @returns {void}
     */
    renderProfileView() {
        const nameEl = document.getElementById('profile-username');
        const emailEl = document.getElementById('profile-email');
        const avatarEl = document.getElementById('profile-avatar-letter');
        const listEl = document.getElementById('profile-purchases-list');

        if (!Store.token || !Store.user) {
            nameEl.textContent = 'Wandering Visitor (Not Logged In)';
            emailEl.textContent = 'Please Break the Seal (Login) to view your reserved & acquired manuscripts.';
            avatarEl.textContent = '✧';
            listEl.innerHTML = `
                <div class="loading-scroll">
                    <p>Your personal archive record is sealed. Authenticate to view your books and write reviews.</p>
                </div>`;
            return;
        }

        const displayName = Store.user.name || Store.user.username || 'Scribe';
        nameEl.textContent = `Scribe ${displayName}`;
        emailEl.textContent = Store.user.email || 'Verified Archive Member';
        avatarEl.textContent = displayName.charAt(0).toUpperCase();

        if (Store.reservations.length === 0) {
            listEl.innerHTML = `
                <div class="loading-scroll">
                    <p>You have not reserved or purchased any manuscripts yet. Explore the Bookstore Catalog to claim your first tome.</p>
                </div>`;
            return;
        }

        listEl.innerHTML = '';
        Store.reservations.forEach(record => {
            const book = Store.books.find(b => b.id === record.bookId) || record;
            const item = document.createElement('div');
            item.className = 'purchase-item';
            item.innerHTML = `
                <div class="purchase-info">
                    <h4>${this.escapeHtml(book.title)}</h4>
                    <p class="purchase-meta">
                        <strong>Author:</strong> ${this.escapeHtml(book.author)} | 
                        <strong>ISBN:</strong> ${this.escapeHtml(Store.getBookIsbn(book))} | 
                        <strong>Price to pay at counter:</strong> €${Number(book.price || 19.99).toFixed(2)}
                    </p>
                    <span class="pickup-tag">
                        ✓ Confirmed — Ready for pickup &amp; payment at store counter until ${this.escapeHtml(record.pickupUntil)}
                    </span>
                </div>
                <div>
                    <button class="pill-btn" type="button" data-review-book="${book.id}">
                        ✒️ Write Review / View Details
                    </button>
                </div>
            `;
            item.querySelector('[data-review-book]').addEventListener('click', () => this.openBookDetail(book.id));
            listEl.appendChild(item);
        });
    },

    /**
     * Handles book reservation, updates live catalog stock, and displays pickup/payment confirmation.
     * @param {number} bookId - ID of the book to reserve.
     * @returns {Promise<void>}
     */
    async handleReservation(bookId) {
        if (!Store.token) {
            this.showToast('Authentication Required: Please register or log in to reserve a manuscript.');
            this.openModal('auth-modal');
            return;
        }

        try {
            const { ok, data } = await BookstoreDAO.createReservation(bookId);
            if (ok) {
                const book = Store.books.find(b => b.id === bookId);
                if (book && book.stock > 0) {
                    book.stock -= 1;
                }

                const pickupUntil = Store.calculatePickupWindow();
                Store.reservations.unshift({
                    bookId: book.id,
                    title: book.title,
                    author: book.author,
                    price: book.price,
                    pickupUntil
                });
                localStorage.setItem('obsidian_reservations', JSON.stringify(Store.reservations));

                this.updateCounters();
                this.renderCatalog();

                const confirmationMessage = `Reservation Confirmed! You may pick up and pay (€${Number(book.price).toFixed(2)}) for "${book.title}" at our bookstore counter until ${pickupUntil}.`;
                this.showToast(confirmationMessage);

                if (Store.selectedBook && Store.selectedBook.id === bookId) {
                    this.openBookDetail(bookId, confirmationMessage);
                }
            } else {
                this.showToast(data.message || 'Unable to reserve this manuscript.');
            }
        } catch (error) {
            console.error('Reservation error:', error);
            this.showToast('Network error while confirming reservation.');
        }
    },

    /**
     * Toggles a book in the user's wishlist and syncs with the backend API.
     * @param {number} bookId - ID of the book.
     * @returns {Promise<void>}
     */
    async handleWishlistToggle(bookId) {
        if (!Store.token) {
            this.showToast('Please log in to save manuscripts to your Velvet Wishlist.');
            this.openModal('auth-modal');
            return;
        }

        if (Store.wishlistIds.includes(bookId)) {
            Store.wishlistIds = Store.wishlistIds.filter(id => id !== bookId);
            this.showToast('Removed from your Velvet Wishlist.');
        } else {
            Store.wishlistIds.push(bookId);
            this.showToast('Saved to your Velvet Wishlist! ❤️');
        }

        localStorage.setItem('obsidian_wishlist', JSON.stringify(Store.wishlistIds));
        this.updateCounters();
        this.renderCatalog();

        try {
            await BookstoreDAO.toggleWishlist(bookId);
        } catch (e) {
            console.warn('Wishlist persisted locally:', e);
        }
    },

    /**
     * Opens the book detail modal showing full metadata, ISBN, reviews, and review submission form.
     * @param {number} bookId - ID of the book to inspect.
     * @param {string} [pickupBannerText] - Optional confirmation message after reservation.
     * @returns {void}
     */
    openBookDetail(bookId, pickupBannerText = null) {
        const book = Store.books.find(b => b.id === bookId);
        if (!book) return;
        Store.selectedBook = book;

        document.getElementById('modal-book-tropes').textContent = book.tropes || book.genre || 'Romantasy Edition';
        document.getElementById('modal-book-title').textContent = book.title;
        document.getElementById('modal-book-author').textContent = `By ${book.author}`;
        document.getElementById('modal-book-isbn').textContent = `ISBN: ${Store.getBookIsbn(book)}`;
        document.getElementById('modal-book-synopsis').textContent = book.description || book.synopsis || 'A guarded manuscript in the Obsidian collection.';
        document.getElementById('modal-book-price').textContent = `€${Number(book.price || 19.99).toFixed(2)}`;
        document.getElementById('modal-book-stock').textContent = `${book.stock} in stock`;

        const pickupBox = document.getElementById('modal-pickup-confirmation');
        const existingReservation = Store.reservations.find(r => r.bookId === book.id);
        if (pickupBannerText || existingReservation) {
            const deadline = existingReservation ? existingReservation.pickupUntil : Store.calculatePickupWindow();
            pickupBox.innerHTML = `<strong>📜 Pickup &amp; Payment Confirmation:</strong> Your copy is reserved! Please visit the bookstore counter before <strong>${this.escapeHtml(deadline)}</strong> to pay <strong>€${Number(book.price).toFixed(2)}</strong> and collect your book.`;
            pickupBox.classList.remove('is-hidden');
        } else {
            pickupBox.classList.add('is-hidden');
        }

        const reserveBtn = document.getElementById('modal-reserve-btn');
        reserveBtn.disabled = Number(book.stock) <= 0;
        reserveBtn.onclick = () => this.handleReservation(book.id);

        this.renderReviewsList(book.reviews || []);
        this.openModal('book-modal');
    },

    /**
     * Renders all reviews for the currently selected book.
     * @param {Array<Object>} reviews - Array of review objects.
     * @returns {void}
     */
    renderReviewsList(reviews) {
        const list = document.getElementById('modal-reviews-list');
        if (!reviews || reviews.length === 0) {
            list.innerHTML = `<p style="font-style: italic; color: #6a4a1f;">No reviews yet. Acquire this manuscript and be the first scribe to review it!</p>`;
            return;
        }

        list.innerHTML = reviews.map(r => {
            const score = Math.min(5, Math.max(1, Number(r.rating || 5)));
            return `
                <div class="review-item">
                    <div class="review-stars">${'★'.repeat(score)}${'☆'.repeat(5 - score)} (${score}/5)</div>
                    <p style="margin: 4px 0;">"${this.escapeHtml(r.comment || '')}"</p>
                </div>
            `;
        }).join('');
    },

    /**
     * Binds the review submission form inside the book detail modal.
     * @returns {void}
     */
    bindReviewForm() {
        document.getElementById('review-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!Store.token) {
                this.showToast('Authentication Required: Log in to submit a review.');
                this.closeModal('book-modal');
                this.openModal('auth-modal');
                return;
            }

            const rating = Number(document.getElementById('review-rating').value);
            const comment = document.getElementById('review-comment').value.trim();
            const book = Store.selectedBook;

            try {
                const { ok, data } = await BookstoreDAO.submitReview(book.id, rating, comment);
                if (ok) {
                    if (!book.reviews) book.reviews = [];
                    book.reviews.unshift({ rating, comment });
                    this.renderReviewsList(book.reviews);
                    document.getElementById('review-comment').value = '';
                    this.showToast('Your review has been published on the manuscript detail page! ✒️');
                } else {
                    this.showToast(data.message || 'You have already reviewed this manuscript.');
                }
            } catch (error) {
                console.error('Review submission error:', error);
                this.showToast('Error communicating with the review service.');
            }
        });
    },

    /**
     * Binds navigation tabs, search bar, and stock filter buttons.
     * @returns {void}
     */
    bindNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        const catalogView = document.getElementById('catalog-view');
        const profileView = document.getElementById('profile-view');
        const rulesView = document.getElementById('rules-view');
        const searchControls = document.getElementById('search-controls');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                Store.activeView = tab.dataset.view;

                catalogView.classList.add('is-hidden');
                profileView.classList.add('is-hidden');
                rulesView.classList.add('is-hidden');
                searchControls.classList.add('is-hidden');

                if (Store.activeView === 'rules') {
                    rulesView.classList.remove('is-hidden');
                } else if (Store.activeView === 'profile') {
                    profileView.classList.remove('is-hidden');
                    this.renderProfileView();
                } else {
                    catalogView.classList.remove('is-hidden');
                    searchControls.classList.remove('is-hidden');
                    this.renderCatalog();
                }
            });
        });

        document.getElementById('search-input').addEventListener('input', () => this.renderCatalog());

        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                Store.activeFilter = pill.dataset.filter;
                this.renderCatalog();
            });
        });
    },

    /**
     * Binds Sanctum Login, Registration, and Logout forms.
     * @returns {void}
     */
    bindAuthForms() {
        const switchBtn = document.getElementById('btn-switch-auth');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const title = document.getElementById('auth-modal-title');
        let isLogin = true;

        document.getElementById('btn-open-auth').addEventListener('click', () => this.openModal('auth-modal'));

        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.dataset.closeModal));
        });

        switchBtn.addEventListener('click', () => {
            isLogin = !isLogin;
            loginForm.classList.toggle('is-hidden', !isLogin);
            registerForm.classList.toggle('is-hidden', isLogin);
            title.textContent = isLogin ? 'Break the Seal' : "Reader's Registry";
            switchBtn.textContent = isLogin
                ? 'Unregistered wanderer? Inscribe your name in the Registry.'
                : 'Already registered? Break the seal to enter.';
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { ok, data } = await BookstoreDAO.login(email, password);
            const token = data.token || data.access_token;
            if (ok && token) {
                this.setSession(token, data.user || { name: email.split('@')[0], email });
                this.closeModal('auth-modal');
                this.showToast('Sanctum Seal Broken! Welcome to the Archive. ✦');
            } else {
                this.showToast(data.message || 'Invalid credentials.');
            }
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                password_confirmation: document.getElementById('reg-password-confirm').value
            };

            const { ok, data } = await BookstoreDAO.register(payload);
            const token = data.token || data.access_token;
            if (ok && token) {
                this.setSession(token, data.user || { name: payload.name, email: payload.email });
                this.closeModal('auth-modal');
                this.showToast(`Welcome, Scribe ${payload.name}! Your account is active.`);
            } else {
                this.showToast(data.message || 'Registration failed. Verify your inputs.');
            }
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            localStorage.removeItem('obsidian_token');
            localStorage.removeItem('obsidian_user');
            Store.token = null;
            Store.user = null;
            this.updateUserHeader();
            if (Store.activeView === 'profile') this.renderProfileView();
            this.showToast('You have logged out of the archive.');
        });
    },

    /**
     * Saves the authenticated user session in Store and localStorage.
     * @param {string} token - Sanctum Bearer token.
     * @param {Object} user - User profile object.
     * @returns {void}
     */
    setSession(token, user) {
        Store.token = token;
        Store.user = user;
        localStorage.setItem('obsidian_token', token);
        localStorage.setItem('obsidian_user', JSON.stringify(user));
        this.updateUserHeader();
        if (Store.activeView === 'profile') this.renderProfileView();
    },

    /**
     * Updates the top navigation bar with the user's authentication status.
     * @returns {void}
     */
    updateUserHeader() {
        const badge = document.getElementById('user-badge');
        const loginBtn = document.getElementById('btn-open-auth');
        const logoutBtn = document.getElementById('btn-logout');

        if (Store.token && Store.user) {
            badge.textContent = `✦ Scribe ${Store.user.name || 'Reader'}`;
            loginBtn.classList.add('is-hidden');
            logoutBtn.classList.remove('is-hidden');
        } else {
            badge.textContent = 'Wandering Visitor (Guest)';
            loginBtn.classList.remove('is-hidden');
            logoutBtn.classList.add('is-hidden');
        }
    },

    /**
     * Updates badge counters for Wishlist and Purchases/Reservations.
     * @returns {void}
     */
    updateCounters() {
        document.getElementById('wishlist-count').textContent = Store.wishlistIds.length;
        document.getElementById('purchases-count').textContent = Store.reservations.length;
    },

    /**
     * Opens a modal overlay by element ID.
     * @param {string} id - DOM ID of the modal.
     * @returns {void}
     */
    openModal(id) {
        document.getElementById(id).classList.add('is-open');
    },

    /**
     * Closes a modal overlay by element ID.
     * @param {string} id - DOM ID of the modal.
     * @returns {void}
     */
    closeModal(id) {
        document.getElementById(id).classList.remove('is-open');
    },

    /**
     * Displays a royal toast notification at the bottom right of the screen.
     * @param {string} message - Notification text to display.
     * @returns {void}
     */
    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'royal-toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4500);
    },

    /**
     * Sanitizes dynamic strings against XSS injection before inserting into HTML.
     * @param {string} str - Raw string.
     * @returns {string} Escaped HTML string.
     */
    escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

document.addEventListener('DOMContentLoaded', () => ArchiveUI.init());