/** Shared DOM helpers, dialog management, notifications and visual effects. */
'use strict';

Object.assign(ArchiveUI, {
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

    updateCounters() {
        document.getElementById('wishlist-count').textContent =
            Store.wishlistIds.length;

        document.getElementById('purchases-count').textContent =
            Store.reservations.filter(
                reservation => ['confirmed', 'collected'].includes(reservation.status)
            ).length;
    },

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
});