
/**
 * The Obsidian Shelf
 * 
 * BookstoreDAO: HTTP and data access.
 * Store: application state.
 * ArchiveUI: DOM rendering and events.
 *
 * Laravel is the source of truth for reservations,
 * accounts, reviews and wishlists.
 */

'use strict';

const API_BASE_URL = (
    window.OBSIDIAN_API_BASE_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

const euro = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR'
});

// APPLICATION STATE

const Store = {
    books: [],
    reservations: [],
    wishlistIds: [],
    user: null,
    token: localStorage.getItem('obsidian_token'),
    activeView: 'catalog',
    activeFilter: 'all',
    selectedBook: null,

    hasReserved(bookId) {
        return this.reservations.some(
            reservation => Number(reservation.book_id) === Number(bookId)
        );
    },

    pickupDate(reservation) {
        const startingDate = reservation.pickup_until || reservation.created_at;

        if (!startingDate) {
            return 'the date shown in your confirmation';
        }

        const date = new Date(startingDate);

        if (!reservation.pickup_until) {
            date.setDate(date.getDate() + 7);
        }

        return Number.isNaN(date.getTime())
            ? 'the date shown in your confirmation'
            : date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
    },

    tropes(book) {
        return Array.isArray(book.tropes)
            ? book.tropes.join(' · ')
            : (book.tropes || 'Romantasy');
    }
};

// API ERROR

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// DATA ACCESS OBJECT

const BookstoreDAO = {
    async request(path, { method = 'GET', body } = {}) {
        const headers = {
            Accept: 'application/json'
        };

        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        if (Store.token) {
            headers.Authorization = `Bearer ${Store.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            ...(body !== undefined
                ? { body: JSON.stringify(body) }
                : {})
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const fieldMessage = data.errors
                && Object.values(data.errors).flat()[0];

            throw new ApiError(
                response.status,
                fieldMessage ||
                data.message ||
                `Request failed (${response.status}).`
            );
        }

        return data;
    },

    async getCatalog() {
        const firstPage = await this.request(
            '/books?per_page=100&page=1'
        );

        if (!Array.isArray(firstPage.data)) {
            throw new Error('Unexpected books API response.');
        }

        const books = [...firstPage.data];
        const pages = Math.max(1, Number(firstPage.last_page) || 1);

        for (let page = 2; page <= pages; page += 1) {
            const response = await this.request(
                `/books?per_page=100&page=${page}`
            );

            books.push(...response.data);
        }

        return books;
    },

    getBook: id =>
        BookstoreDAO.request(`/books/${id}`),

    login: (email, password) =>
        BookstoreDAO.request('/login', {
            method: 'POST',
            body: { email, password }
        }),

    register: values =>
        BookstoreDAO.request('/register', {
            method: 'POST',
            body: values
        }),

    me: () =>
        BookstoreDAO.request('/me'),

    updateProfile: values =>
        BookstoreDAO.request('/me', {
            method: 'PATCH',
            body: values
        }),

    logout: () =>
        BookstoreDAO.request('/logout', {
            method: 'POST'
        }),

    getReservations: () =>
        BookstoreDAO.request('/reservations'),

    reserve: bookId =>
        BookstoreDAO.request('/reservations', {
            method: 'POST',
            body: { book_id: bookId }
        }),

    getWishlist: () =>
        BookstoreDAO.request('/wishlist'),

    toggleWishlist: bookId =>
        BookstoreDAO.request('/wishlist/toggle', {
            method: 'POST',
            body: { book_id: bookId }
        }),

    review: (bookId, score, content) =>
        BookstoreDAO.request(`/books/${bookId}/reviews`, {
            method: 'POST',
            body: { score, content }
        })
};

// USER INTERFACE CONTROLLER

const ArchiveUI = {
    busy: new Set(),
    previousFocus: null,

    async init() {
        // Remove obsolete browser-only records.
        [
            'obsidian_user',
            'obsidian_wishlist',
            'obsidian_reservations'
        ].forEach(key => localStorage.removeItem(key));

        this.bindGrimoireGate();
        this.bindNavigation();
        this.bindAuth();
        this.bindProfileForm();
        this.bindReviewForm();
        this.bindModals();
        this.spawnEmbers();
        this.updateUserHeader();

        await this.loadCatalog();

        if (Store.token) {
            await this.loadAccount();
        }
    },

    // VISUAL EFFECTS

    spawnEmbers() {
        if (
            window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches
        ) {
            return;
        }

        const container = document.getElementById('embers-container');

        for (let index = 0; index < 14; index += 1) {
            const ember = document.createElement('span');

            ember.className = 'ember';
            ember.style.left = `${Math.random() * 100}%`;
            ember.style.animationDuration = `${9 + Math.random() * 9}s`;
            ember.style.animationDelay = `${Math.random() * 6}s`;

            container.appendChild(ember);
        }
    },

    bindGrimoireGate() {
        const gate = document.getElementById('grimoire-gate');
        const hall = document.getElementById('archive-hall');

        if (sessionStorage.getItem('grimoire_opened') === 'true') {
            gate.classList.add('is-hidden');
            hall.classList.remove('is-hidden');
        }

        document.getElementById('btn-open-archive')
            .addEventListener('click', () => {
                sessionStorage.setItem('grimoire_opened', 'true');
                gate.classList.add('opening');

                window.setTimeout(() => {
                    gate.classList.add('is-hidden');
                    gate.classList.remove('opening');
                    hall.classList.remove('is-hidden');
                }, window.matchMedia(
                    '(prefers-reduced-motion: reduce)'
                ).matches ? 0 : 700);
            });

        document.getElementById('btn-reopen-book')
            .addEventListener('click', () => {
                hall.classList.add('is-hidden');
                gate.classList.remove('is-hidden');
            });
    },

    // CATALOG

    async loadCatalog() {
        const loading = document.getElementById('loading-state');

        loading.classList.remove('is-hidden');

        try {
            Store.books = await BookstoreDAO.getCatalog();
            this.renderCatalog();
        } catch (error) {
            this.showToast(`Catalog unavailable: ${error.message}`);

            document.getElementById('books-container').innerHTML =
                '<div class="empty-state">The catalog could not be loaded. Check the Laravel API address in config.js and try Refresh.</div>';

            document.getElementById('catalog-summary').textContent =
                'Could not load books';
        } finally {
            loading.classList.add('is-hidden');
        }
    },

    renderCatalog() {
        const container = document.getElementById('books-container');

        const query = document.getElementById('search-input')
            .value.trim().toLocaleLowerCase();

        container.replaceChildren();

        if (Store.activeView === 'wishlist' && !Store.token) {
            container.innerHTML =
                '<div class="empty-state">Log in to view your saved manuscripts.</div>';

            document.getElementById('catalog-summary').textContent =
                'Private wishlist';

            return;
        }

        const books = Store.books.filter(book => {
            const wishlistMatch =
                Store.activeView !== 'wishlist' ||
                Store.wishlistIds.includes(Number(book.id));

            const stockMatch =
                Store.activeFilter !== 'available' ||
                Number(book.stock) > 0;

            const haystack = [
                book.title,
                book.author,
                book.isbn,
                Store.tropes(book),
                book.description
            ].join(' ').toLocaleLowerCase();

            return wishlistMatch && stockMatch && haystack.includes(query);
        });

        document.getElementById('catalog-summary').textContent =
            `${books.length} manuscript${books.length === 1 ? '' : 's'} shown`;

        if (!books.length) {
            container.innerHTML =
                '<div class="empty-state">No manuscripts match your criteria. Try a different search or filter.</div>';

            return;
        }

        const fragment = document.createDocumentFragment();

        books.forEach(book => {
            const stock = Number(book.stock) || 0;
            const liked = Store.wishlistIds.includes(Number(book.id));

            const article = document.createElement('article');
            article.className = 'book-card';

            article.innerHTML = `
                <div class="card-top-meta">
                    <span class="trope-tag">${this.escapeHtml(Store.tropes(book))}</span>

                    <button
                        class="wishlist-heart-btn"
                        type="button"
                        data-wishlist-id="${Number(book.id)}"
                        aria-label="${liked ? 'Remove from' : 'Add to'} wishlist"
                        aria-pressed="${liked}"
                    >${liked ? '❤️' : '🖤'}</button>
                </div>

                <h2>${this.escapeHtml(book.title)}</h2>

                <p class="book-author">
                    By ${this.escapeHtml(book.author)}
                </p>

                <p class="book-isbn-badge">
                    ISBN: ${this.escapeHtml(book.isbn || 'Not assigned')}
                </p>

                <p class="book-synopsis-preview">
                    ${this.escapeHtml(book.description || 'No description available.')}
                </p>

                <div class="book-stats-row">
                    <span class="price-tag">
                        ${euro.format(Number(book.price) || 0)}
                    </span>

                    <span class="stock-badge ${stock > 0 ? 'in-stock' : 'out-stock'}">
                        ${stock > 0 ? `${stock} in stock` : 'Out of stock'}
                    </span>
                </div>

                <div class="card-actions">
                    <button
                        class="card-btn btn-inspect"
                        type="button"
                        data-inspect-id="${Number(book.id)}"
                    >
                        ✒️ Details &amp; Reviews
                    </button>

                    <button
                        class="card-btn btn-reserve"
                        type="button"
                        data-reserve-id="${Number(book.id)}"
                        ${stock < 1 ? 'disabled' : ''}
                    >
                        📜 Reserve
                    </button>
                </div>
            `;

            article.querySelector('[data-wishlist-id]')
                .addEventListener('click', () => this.handleWishlist(book.id));

            article.querySelector('[data-inspect-id]')
                .addEventListener('click', () => this.openBookDetail(book.id));

            article.querySelector('[data-reserve-id]')
                .addEventListener('click', () => this.handleReservation(book.id));

            fragment.appendChild(article);
        });

        container.appendChild(fragment);
    },

    // NAVIGATION

    bindNavigation() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                Store.activeView = tab.dataset.view;

                document.querySelectorAll('.nav-tab').forEach(item => {
                    item.classList.toggle('active', item === tab);
                    item.setAttribute(
                        'aria-current',
                        item === tab ? 'page' : 'false'
                    );
                });

                document.getElementById('catalog-view').classList.toggle(
                    'is-hidden',
                    !['catalog', 'wishlist'].includes(Store.activeView)
                );

                document.getElementById('profile-view').classList.toggle(
                    'is-hidden',
                    Store.activeView !== 'profile'
                );

                document.getElementById('rules-view').classList.toggle(
                    'is-hidden',
                    Store.activeView !== 'rules'
                );

                document.getElementById('search-controls').classList.toggle(
                    'is-hidden',
                    !['catalog', 'wishlist'].includes(Store.activeView)
                );

                if (Store.activeView === 'profile') {
                    this.renderProfile();
                }

                if (['catalog', 'wishlist'].includes(Store.activeView)) {
                    this.renderCatalog();
                }
            });
        });

        document.getElementById('search-input')
            .addEventListener('input', () => this.renderCatalog());

        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                Store.activeFilter = pill.dataset.filter;

                document.querySelectorAll('.filter-pill').forEach(item => {
                    item.classList.toggle('active', item === pill);
                });

                this.renderCatalog();
            });
        });

        document.getElementById('btn-reload-catalog')
            .addEventListener('click', () => this.loadCatalog());
    },

    // ACCOUNT DATA

    async loadAccount() {
        if (!Store.token) return;

        const token = Store.token;

        try {
            const [identity, reservations, wishlist] = await Promise.all([
                BookstoreDAO.me(),
                BookstoreDAO.getReservations(),
                BookstoreDAO.getWishlist()
            ]);

            if (token !== Store.token) return;

            Store.user = identity.user;
            Store.reservations = reservations;

            Store.wishlistIds = wishlist.map(
                item => Number(item.book_id)
            );

            this.updateUserHeader();
            this.updateCounters();
            this.renderProfile();
            this.renderCatalog();
        } catch (error) {
            this.handleError(
                error,
                'Could not load your personal records.'
            );
        }
    },

    // RESERVATIONS

    async handleReservation(bookId) {
        if (!this.requireLogin('Log in to reserve a book.')) {
            return;
        }

        const busyKey = `reserve-${bookId}`;

        if (this.busy.has(busyKey)) return;

        this.busy.add(busyKey);

        document.querySelectorAll(
            `[data-reserve-id="${Number(bookId)}"]`
        ).forEach(button => {
            button.disabled = true;
        });

        document.getElementById('modal-reserve-btn').disabled = true;

        try {
            const { reservation } = await BookstoreDAO.reserve(bookId);

            await Promise.all([
                this.loadCatalog(),
                this.loadAccount()
            ]);

            this.showToast(
                `Reservation confirmed! Available now; collect and pay by ${Store.pickupDate(reservation)}.`
            );

            if (Store.selectedBook?.id === Number(bookId)) {
                await this.openBookDetail(bookId);
            }
        } catch (error) {
            this.handleError(error, 'Reservation failed.');
            await this.loadCatalog();
        } finally {
            this.busy.delete(busyKey);

            if (Store.selectedBook?.id === Number(bookId)) {
                document.getElementById('modal-reserve-btn').disabled =
                    Number(Store.selectedBook.stock) < 1;
            }
        }
    },

    // WISHLIST

    async handleWishlist(bookId) {
        if (!this.requireLogin('Log in to use your wishlist.')) {
            return;
        }

        const busyKey = `wishlist-${bookId}`;

        if (this.busy.has(busyKey)) return;

        this.busy.add(busyKey);

        try {
            const result = await BookstoreDAO.toggleWishlist(bookId);

            await this.loadAccount();

            this.showToast(result.message);
        } catch (error) {
            this.handleError(error, 'Unable to update wishlist.');
        } finally {
            this.busy.delete(busyKey);
        }
    },

    // BOOK DETAILS

    async openBookDetail(bookId) {
        const localBook = Store.books.find(
            book => Number(book.id) === Number(bookId)
        );

        if (!localBook) return;

        Store.selectedBook = localBook;
        this.renderBookDetail(localBook);

        document.getElementById('modal-reviews-list').innerHTML =
            '<p>Loading verified reviews…</p>';

        this.openModal('book-modal');

        try {
            const detail = await BookstoreDAO.getBook(bookId);

            if (Number(Store.selectedBook?.id) !== Number(bookId)) {
                return;
            }

            Store.selectedBook = detail;
            this.renderBookDetail(detail);
        } catch (error) {
            document.getElementById('modal-reviews-list').textContent =
                'Reviews are temporarily unavailable.';

            this.showToast(error.message);
        }
    },

    renderBookDetail(book) {
        document.getElementById('modal-book-tropes').textContent =
            Store.tropes(book);

        document.getElementById('modal-book-title').textContent =
            book.title;

        document.getElementById('modal-book-author').textContent =
            `By ${book.author}`;

        document.getElementById('modal-book-isbn').textContent =
            `ISBN: ${book.isbn || 'Not assigned'}`;

        document.getElementById('modal-book-synopsis').textContent =
            book.description || 'No synopsis available.';

        document.getElementById('modal-book-price').textContent =
            euro.format(Number(book.price) || 0);

        document.getElementById('modal-book-stock').textContent =
            `${Number(book.stock)} in stock`;

        const reserveButton = document.getElementById('modal-reserve-btn');

        reserveButton.disabled =
            Number(book.stock) < 1 ||
            this.busy.has(`reserve-${book.id}`);

        reserveButton.onclick = () => this.handleReservation(book.id);

        const reservation = Store.reservations.find(
            item => Number(item.book_id) === Number(book.id)
        );

        const confirmation = document.getElementById(
            'modal-pickup-confirmation'
        );

        confirmation.classList.toggle('is-hidden', !reservation);

        if (reservation) {
            confirmation.textContent =
                `✓ Ready for pickup: collect and pay ${euro.format(
                    Number(reservation.price_at_reservation ?? book.price)
                )} at the counter by ${Store.pickupDate(reservation)}.`;
        }

        if (Array.isArray(book.reviews)) {
            this.renderReviews(book.reviews);
        }

        this.updateReviewAccess(book);
    },

    // REVIEWS

    renderReviews(reviews) {
        const list = document.getElementById('modal-reviews-list');

        if (!reviews.length) {
            list.innerHTML =
                '<p>No reviews yet. Readers who reserved this book can share their thoughts.</p>';

            return;
        }

        list.innerHTML = reviews.map(review => {
            const score = Math.max(
                1,
                Math.min(5, Number(review.score) || 1)
            );

            return `
                <article class="review-item">
                    <div class="review-stars"
                         aria-label="${score} out of 5 stars">
                        ${'★'.repeat(score)}${'☆'.repeat(5 - score)}
                        (${score}/5)
                    </div>

                    <strong>
                        ${this.escapeHtml(review.user?.name || 'Reader')}
                    </strong>

                    <p>${this.escapeHtml(review.content)}</p>
                </article>
            `;
        }).join('');
    },

    updateReviewAccess(book) {
        const hint = document.getElementById('review-hint');
        const form = document.getElementById('review-form');

        const reviewed = book.reviews?.some(
            review => Number(review.user_id) === Number(Store.user?.id)
        );

        const allowed = Boolean(
            Store.token &&
            Store.hasReserved(book.id) &&
            !reviewed
        );

        form.classList.toggle('is-hidden', !allowed);

        hint.textContent = !Store.token
            ? 'Log in and reserve this book to write a review.'
            : !Store.hasReserved(book.id)
                ? 'Reserve this book to unlock reviews.'
                : reviewed
                    ? 'You have already submitted a review for this book.'
                    : '';
    },

    bindReviewForm() {
        document.getElementById('review-form')
            .addEventListener('submit', async event => {
                event.preventDefault();

                if (
                    !Store.selectedBook ||
                    !this.requireLogin('Log in to post a review.')
                ) {
                    return;
                }

                const bookId = Store.selectedBook.id;

                const score = Number(
                    document.getElementById('review-rating').value
                );

                const content = document.getElementById(
                    'review-comment'
                ).value.trim();

                this.formMessage('review-error', '');

                if (content.length < 3) {
                    this.formMessage(
                        'review-error',
                        'Please write at least three characters.'
                    );
                    return;
                }

                const button = event.target.querySelector(
                    'button[type="submit"]'
                );

                button.disabled = true;

                try {
                    await BookstoreDAO.review(bookId, score, content);

                    event.target.reset();

                    this.showToast('Your review has been published.');

                    await this.openBookDetail(bookId);
                } catch (error) {
                    this.formMessage('review-error', error.message);

                    this.handleError(error, 'Could not publish review.');
                } finally {
                    button.disabled = false;
                }
            });
    },

    // PROFILE

    renderProfile() {
        const name = document.getElementById('profile-username');
        const email = document.getElementById('profile-email');
        const avatar = document.getElementById('profile-avatar-letter');
        const form = document.getElementById('profile-form');
        const list = document.getElementById('profile-purchases-list');

        if (!Store.user || !Store.token) {
            name.textContent = 'Wandering Visitor';

            email.textContent =
                'Log in to view your account and reservations.';

            avatar.textContent = '✧';
            form.classList.add('is-hidden');

            list.innerHTML =
                '<div class="empty-state">Your personal archive is private. Please log in.</div>';

            return;
        }

        const user = Store.user;

        name.textContent = user.name;
        email.textContent = `${user.username} · ${user.email}`;
        avatar.textContent = user.name.slice(0, 1).toUpperCase();

        form.classList.remove('is-hidden');

        document.getElementById('profile-name').value = user.name;
        document.getElementById('profile-handle').value = user.username;
        document.getElementById('profile-contact').value = user.email;

        if (!Store.reservations.length) {
            list.innerHTML =
                '<div class="empty-state">No reservations yet. Explore the catalog to reserve your first book.</div>';

            return;
        }

        list.replaceChildren();

        Store.reservations.forEach(reservation => {
            const book = reservation.book || Store.books.find(
                item => Number(item.id) === Number(reservation.book_id)
            );

            if (!book) return;

            const element = document.createElement('article');
            element.className = 'purchase-item';

            element.innerHTML = `
                <div class="purchase-info">
                    <h4>${this.escapeHtml(book.title)}</h4>

                    <p class="purchase-meta">
                        <strong>Author:</strong> ${this.escapeHtml(book.author)}
                        · <strong>ISBN:</strong> ${this.escapeHtml(book.isbn)}
                        · <strong>Reserved price:</strong>
                        ${euro.format(
                            Number(reservation.price_at_reservation ?? book.price)
                        )}
                    </p>

                    <span class="pickup-tag">
                        ✓ Ready for pickup · Pay by
                        ${this.escapeHtml(Store.pickupDate(reservation))}
                    </span>
                </div>

                <button class="pill-btn" type="button">
                    ✒️ Details &amp; Review
                </button>
            `;

            element.querySelector('button').addEventListener(
                'click',
                () => this.openBookDetail(book.id)
            );

            list.appendChild(element);
        });
    },

    bindProfileForm() {
        document.getElementById('profile-form')
            .addEventListener('submit', async event => {
                event.preventDefault();

                const body = {
                    name: document.getElementById(
                        'profile-name'
                    ).value.trim(),

                    username: document.getElementById(
                        'profile-handle'
                    ).value.trim(),

                    email: document.getElementById(
                        'profile-contact'
                    ).value.trim()
                };

                const password = document.getElementById(
                    'profile-password'
                ).value;

                if (password) {
                    body.password = password;

                    body.password_confirmation =
                        document.getElementById(
                            'profile-password-confirm'
                        ).value;
                }

                const button = event.target.querySelector(
                    'button[type="submit"]'
                );

                button.disabled = true;

                this.formMessage('profile-error', '');

                try {
                    const { user } = await BookstoreDAO.updateProfile(body);

                    Store.user = user;

                    document.getElementById('profile-password').value = '';
                    document.getElementById(
                        'profile-password-confirm'
                    ).value = '';

                    this.updateUserHeader();
                    this.renderProfile();

                    this.showToast(
                        'Your account details have been saved.'
                    );
                } catch (error) {
                    this.formMessage('profile-error', error.message);
                    this.handleError(error, 'Could not update account.');
                } finally {
                    button.disabled = false;
                }
            });
    },

    // AUTHENTICATION

    bindAuth() {
        const login = document.getElementById('login-form');
        const registration = document.getElementById('register-form');
        const switchButton = document.getElementById('btn-switch-auth');

        document.getElementById('btn-open-auth')
            .addEventListener('click', () => {
                this.openModal('auth-modal');
            });

        switchButton.addEventListener('click', () => {
            const showRegister = registration.classList.contains(
                'is-hidden'
            );

            registration.classList.toggle('is-hidden', !showRegister);
            login.classList.toggle('is-hidden', showRegister);

            document.getElementById('auth-modal-title').textContent =
                showRegister ? "Reader's Registry" : 'Break the Seal';

            switchButton.textContent = showRegister
                ? 'Already registered? Log in.'
                : 'Unregistered wanderer? Create an account.';

            this.formMessage('login-error', '');
            this.formMessage('register-error', '');
        });

        login.addEventListener('submit', async event => {
            event.preventDefault();

            const button = login.querySelector(
                'button[type="submit"]'
            );

            button.disabled = true;
            this.formMessage('login-error', '');

            try {
                const result = await BookstoreDAO.login(
                    document.getElementById('login-email').value.trim(),
                    document.getElementById('login-password').value
                );

                await this.setSession(result);

                login.reset();
                this.closeModal('auth-modal');

                this.showToast(
                    'Welcome back to The Obsidian Shelf!'
                );
            } catch (error) {
                this.formMessage('login-error', error.message);
            } finally {
                button.disabled = false;
            }
        });

        registration.addEventListener('submit', async event => {
            event.preventDefault();

            const values = {
                name: document.getElementById('reg-name').value.trim(),

                username: document.getElementById(
                    'reg-username'
                ).value.trim(),

                email: document.getElementById('reg-email').value.trim(),

                password: document.getElementById(
                    'reg-password'
                ).value,

                password_confirmation: document.getElementById(
                    'reg-password-confirm'
                ).value
            };

            this.formMessage('register-error', '');

            if (values.password !== values.password_confirmation) {
                this.formMessage(
                    'register-error',
                    'Passwords do not match.'
                );
                return;
            }

            const button = registration.querySelector(
                'button[type="submit"]'
            );

            button.disabled = true;

            try {
                const result = await BookstoreDAO.register(values);

                await this.setSession(result);

                registration.reset();
                this.closeModal('auth-modal');

                this.showToast('Account created successfully!');
            } catch (error) {
                this.formMessage('register-error', error.message);
            } finally {
                button.disabled = false;
            }
        });

        document.getElementById('btn-logout')
            .addEventListener('click', async () => {
                try {
                    await BookstoreDAO.logout();
                } catch (error) {
                    console.warn(
                        'Server logout could not be confirmed:',
                        error
                    );
                }

                this.clearSession();
                this.showToast('You have logged out.');
            });
    },

    async setSession(result) {
        if (!result.access_token || !result.user) {
            throw new Error('Unexpected authentication response.');
        }

        Store.token = result.access_token;
        Store.user = result.user;

        localStorage.setItem('obsidian_token', Store.token);

        this.updateUserHeader();

        await this.loadAccount();
    },

    clearSession() {
        localStorage.removeItem('obsidian_token');

        Store.token = null;
        Store.user = null;
        Store.reservations = [];
        Store.wishlistIds = [];

        this.updateUserHeader();
        this.updateCounters();
        this.renderProfile();
        this.renderCatalog();

        if (Store.selectedBook) {
            this.updateReviewAccess(Store.selectedBook);
        }
    },

    requireLogin(message) {
        if (Store.token) return true;

        this.showToast(message);
        this.openModal('auth-modal');

        return false;
    },

    handleError(error, fallback) {
        if (error instanceof ApiError && error.status === 401) {
            this.clearSession();

            this.showToast(
                'Your session has expired. Please log in again.'
            );
        } else {
            this.showToast(error.message || fallback);
        }
    },

    updateUserHeader() {
        const authenticated = Boolean(Store.token && Store.user);

        document.getElementById('user-badge').textContent =
            authenticated
                ? `✦ Scribe ${Store.user.name}`
                : 'Wandering Visitor (Guest)';

        document.getElementById('btn-open-auth')
            .classList.toggle('is-hidden', authenticated);

        document.getElementById('btn-logout')
            .classList.toggle('is-hidden', !authenticated);
    },

    updateCounters() {
        document.getElementById('wishlist-count').textContent =
            Store.wishlistIds.length;

        document.getElementById('purchases-count').textContent =
            Store.reservations.length;
    },

    // MODALS

    bindModals() {
        document.querySelectorAll('[data-close-modal]')
            .forEach(button => {
                button.addEventListener('click', () => {
                    this.closeModal(button.dataset.closeModal);
                });
            });

        document.querySelectorAll('.royal-modal-overlay')
            .forEach(overlay => {
                overlay.addEventListener('click', event => {
                    if (event.target === overlay) {
                        this.closeModal(overlay.id);
                    }
                });
            });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                document.querySelectorAll(
                    '.royal-modal-overlay.is-open'
                ).forEach(overlay => {
                    this.closeModal(overlay.id);
                });
            }
        });
    },

    openModal(id) {
        this.previousFocus = document.activeElement;

        document.getElementById(id).classList.add('is-open');
        document.body.classList.add('modal-open');

        document.getElementById(id)
            .querySelector('button, input')?.focus();
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('is-open');

        if (!document.querySelector('.royal-modal-overlay.is-open')) {
            document.body.classList.remove('modal-open');
        }

        if (id === 'book-modal') {
            Store.selectedBook = null;
        }

        this.previousFocus?.focus?.();
    },

    formMessage(id, message) {
        document.getElementById(id).textContent = message;
    },

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');

        toast.className = 'royal-toast';
        toast.textContent = message;

        container.appendChild(toast);

        window.setTimeout(() => toast.remove(), 5000);
    },

    escapeHtml(value) {
        return String(value ?? '').replace(
            /[&<>"']/g,
            char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]
        );
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ArchiveUI.init();
});
