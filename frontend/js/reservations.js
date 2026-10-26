/** Reservation and cancellation UI workflows. */
'use strict';

Object.assign(ArchiveUI, {
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

    async handleCancellation(reservationId) {

        const reservation = Store.reservations.find(
            item => Number(item.id) === Number(reservationId)
        );


        if (!reservation || reservation.status !== 'confirmed') {
            return;
        }

        const key = `cancel-${reservationId}`;

        if (this.busy.has(key)) {
            return;
        }

        const createdAt = new Date(reservation.created_at).getTime();

        if (
            !Number.isFinite(createdAt) ||
            Date.now() >= createdAt + 86400000
        ) {
            this.showToast(
                'The 24-hour cancellation period has expired.'
            );

            this.renderProfile();
            return;
        }

        const confirmed = window.confirm(
            'Are you sure you want to cancel this reservation? The book will return to stock.'
        );

        if (!confirmed) {
            return;
        }

        this.busy.add(key);

        try {
            const result = await BookstoreDAO.cancelReservation(
                reservationId
            );

            if (!result.success) {
                throw new Error(
                    result.message || 'Cancellation refused.'
                );
            }

            Object.assign(
                reservation,
                result.reservation || { status: 'cancelled' }
            );

            const book = Store.books.find(
                item => Number(item.id) === Number(reservation.book_id)
            );

            if (book) {
                book.stock = Number(
                    result.reservation?.book?.stock ??
                    (Number(book.stock) + 1)
                );
            }

            if (
                Number(Store.selectedBook?.id) ===
                Number(reservation.book_id)
            ) {
                Store.selectedBook = {
                    ...Store.selectedBook,
                    stock: book
                        ? book.stock
                        : Store.selectedBook.stock
                };

                this.renderBookDetail(Store.selectedBook);
            }

            this.updateCounters();
            this.renderCatalog();

            this.showToast(
                'Reservation cancelled. The book is back in stock.'
            );
        } catch (error) {
            this.handleError(error, 'Cancellation failed.');
        } finally {
            this.busy.delete(key);
            this.renderProfile();
        }
    }
});
