/** Shared application state and display helpers. */
'use strict';

const euro = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR'
});


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
            reservation =>
                Number(reservation.book_id) === Number(bookId) &&
                ['confirmed', 'collected'].includes(reservation.status)
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