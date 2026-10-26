/** UI coordinator; feature-specific behavior is attached by separate files. */
'use strict';

// Composition root: connect the independent DAO to the session state.
BookstoreDAO.configure({ tokenProvider: () => Store.token });

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
    }
};
