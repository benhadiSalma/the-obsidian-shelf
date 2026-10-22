
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add reservation details and unique constraints.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->decimal(
                'price_at_reservation',
                8,
                2
            )->nullable();

            $table->timestamp('pickup_until')->nullable();
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->unique([
                'user_id',
                'book_id',
            ]);
        });

        Schema::table('wishlists', function (Blueprint $table) {
            $table->unique([
                'user_id',
                'book_id',
            ]);
        });
    }

    /**
     * Reverse the database changes.
     */
    public function down(): void
    {
        Schema::table('wishlists', function (Blueprint $table) {
            $table->dropUnique([
                'user_id',
                'book_id',
            ]);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique([
                'user_id',
                'book_id',
            ]);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'price_at_reservation',
                'pickup_until',
            ]);
        });
    }
};
