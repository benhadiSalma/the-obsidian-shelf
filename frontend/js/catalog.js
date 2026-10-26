/** Catalog, filters, book-details UI and navigation. */
'use strict';

Object.assign(ArchiveUI, {
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
            item =>
                Number(item.book_id) === Number(book.id) &&
                item.status === 'confirmed'
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
    }
});