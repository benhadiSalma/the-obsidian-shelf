/** Review rendering and form handling. */
'use strict';

Object.assign(ArchiveUI, {
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
    }
});