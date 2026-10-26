/** Login, user profile, sessions, account-related rendering. */
'use strict';

Object.assign(ArchiveUI, {
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

            const createdAt = new Date(
                reservation.created_at
            ).getTime();

            const canCancel =
                reservation.status === 'confirmed' &&
                Number.isFinite(createdAt) &&
                Date.now() < createdAt + 86400000;

            const status = reservation.status === 'cancelled'
                ? '✕ Reservation cancelled'
                : reservation.status === 'confirmed'
                    ? `✓ Ready for pickup · Pay by ${Store.pickupDate(reservation)}`
                    : reservation.status === 'collected'
                        ? '✓ Collected'
                        : `Status: ${reservation.status}`;

            element.innerHTML = `
                <div class="purchase-info">
                    <h4>${this.escapeHtml(book.title)}</h4>

                    <p class="purchase-meta">
                        <strong>Author:</strong>
                        ${this.escapeHtml(book.author)}

                        · <strong>ISBN:</strong>
                        ${this.escapeHtml(book.isbn)}

                        · <strong>Reserved price:</strong>
                        ${euro.format(
                Number(reservation.price_at_reservation ?? book.price)
            )}
                    </p>

                    <span class="pickup-tag">
                        ${this.escapeHtml(status)}
                    </span>
                </div>

                <div class="reservation-actions">
                    <button
                        class="pill-btn reservation-details-btn"
                        type="button"
                    >
                        ✒️ Details &amp; Review
                    </button>

                    ${canCancel ? `
                        <button
                            class="pill-btn cancel-reservation-btn"
                            type="button"
                        >
                            ✕ Cancel Reservation (24h)
                        </button>
                    ` : ''}
                </div>
            `;

            element
                .querySelector('.reservation-details-btn')
                .addEventListener('click', () => {
                    this.openBookDetail(book.id);
                });

            element
                .querySelector('.cancel-reservation-btn')
                ?.addEventListener('click', () => {
                    this.handleCancellation(reservation.id);
                });

            list.appendChild(element);
        }
        );
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
    }
});
