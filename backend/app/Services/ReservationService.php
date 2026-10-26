<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class ReservationService
{
    /**
     * Create a reservation and decrease stock.
     */
    public function reserve(User $user, int $bookId): ?Reservation
    {
        return DB::transaction(function () use ($user, $bookId) {

            $updated = Book::where('id', $bookId)
                ->where('stock', '>', 0)
                ->decrement('stock');

            if ($updated === 0) {
                return null;
            }

            $book = Book::findOrFail($bookId);

            return Reservation::create([
                'user_id' => $user->id,
                'book_id' => $book->id,
                'status' => 'confirmed',
                'price_at_reservation' => $book->price,
                'pickup_until' => now()->addDays(7),
            ])->load('book');
        });
    }

    /**
     * Cancel a reservation within 24 hours.
     */
    public function cancel(User $user, int $reservationId): array
    {
        return DB::transaction(function () use ($user, $reservationId) {

            // Only the owner can cancel the reservation.
            $reservation = Reservation::query()
                ->where('user_id', $user->id)
                ->whereKey($reservationId)
                ->lockForUpdate()
                ->firstOrFail();

            // Only confirmed reservations can be cancelled.
            if ($reservation->status !== 'confirmed') {
                return [
                    'success' => false,
                    'message' => 'This reservation cannot be cancelled.',
                    'reservation' => null,
                ];
            }

            // Cancellation deadline: 24 hours after creation.
            $deadline = $reservation->created_at
                ->copy()
                ->addHours(24);

            if (now()->greaterThanOrEqualTo($deadline)) {
                return [
                    'success' => false,
                    'message' => 'The 24-hour cancellation window has expired.',
                    'reservation' => null,
                ];
            }

            // Update the reservation status.
            $updated = Reservation::query()
                ->whereKey($reservation->id)
                ->where('status', 'confirmed')
                ->update([
                    'status' => 'cancelled',
                ]);

            if ($updated !== 1) {
                return [
                    'success' => false,
                    'message' => 'Reservation already processed.',
                    'reservation' => null,
                ];
            }

            // Return the book to stock.
            Book::query()
                ->whereKey($reservation->book_id)
                ->increment('stock');

            // A review remains allowed only if another valid reservation exists.
            $hasOtherValidReservation = Reservation::query()
                ->where('user_id', $user->id)
                ->where('book_id', $reservation->book_id)
                ->whereIn('status', ['confirmed', 'collected'])
                ->exists();

            if (! $hasOtherValidReservation) {
                Review::query()
                    ->where('user_id', $user->id)
                    ->where('book_id', $reservation->book_id)
                    ->delete();
            }

            return [
                'success' => true,
                'message' => 'Reservation cancelled successfully.',
                'reservation' => $reservation
                    ->fresh()
                    ->load('book'),
            ];
        });
    }
}
