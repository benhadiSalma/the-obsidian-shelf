<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'book_id',
        'status',
        'price_at_reservation',
        'pickup_until',
    ];

    protected function casts(): array
    {
        return [
            'price_at_reservation' => 'decimal:2',
            'pickup_until' => 'datetime',
        ];
    }

    /**
     * A reservation belongs to one user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * A reservation belongs to one book.
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}