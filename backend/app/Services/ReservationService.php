<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class ReservationService
{
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
}
