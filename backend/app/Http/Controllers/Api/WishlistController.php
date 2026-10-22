<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * Return all books in the authenticated
     * user's wishlist.
     */
    public function index(Request $request): JsonResponse
    {
        $wishlist = $request->user()
            ->wishlists()
            ->with('book')
            ->get();

        return response()->json($wishlist);
    }

    /**
     * Add or remove a book from the wishlist.
     */
    public function toggle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'book_id' => [
                'required',
                'integer',
                'exists:books,id',
            ],
        ]);

        $user = $request->user();

        $wishlist = $user->wishlists()
            ->where('book_id', $data['book_id'])
            ->first();

        // Remove the book if it is already saved.
        if ($wishlist) {
            $wishlist->delete();

            return response()->json([
                'message' => 'Book removed from wishlist.',
                'wishlisted' => false,
            ], 200);
        }

        // Otherwise add it to the wishlist.
        $user->wishlists()->create([
            'book_id' => $data['book_id'],
        ]);

        return response()->json([
            'message' => 'Book added to wishlist.',
            'wishlisted' => true,
        ], 201);
    }
}