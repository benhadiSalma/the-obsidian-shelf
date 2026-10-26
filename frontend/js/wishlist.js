/** Wishlist interactions. */
'use strict';

Object.assign(ArchiveUI, {
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
    }
});