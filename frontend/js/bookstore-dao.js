/** Central HTTP/data-access layer: API routes, JSON, errors, Bearer token. */
'use strict';

const API_BASE_URL = (
    window.OBSIDIAN_API_BASE_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

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


    cancelReservation: reservationId =>
        BookstoreDAO.request(`/reservations/${reservationId}`, {
            method: 'DELETE'
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