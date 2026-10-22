<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Publish a review for a reserved book.
     *
     * Only authenticated users who have reserved
     * the book are allowed to submit a review.
     * Each user can review a book only once.
     */
    public function store(
        Request $request,
        Book $book
    ): JsonResponse {
        $data = $request->validate([
            'score' => [
                'required',
                'integer',
                'min:1',
                'max:5',
            ],
            'content' => [
                'required',
                'string',
                'min:3',
                'max:1000',
            ],
        ]);

        $user = $request->user();

        // Check if the user has reserved this book.

        $hasReserved = $user->reservations()
            ->where('book_id', $book->id)
            ->whereIn('status', ['confirmed', 'collected'])
            ->exists();


        if (!$hasReserved) {
            return response()->json([
                'message' => 'You must reserve this book before reviewing it.',
            ], 403);
        }

        // Prevent multiple reviews from the same user.
        $existingReview = $user->reviews()
            ->where('book_id', $book->id)
            ->exists();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this book.',
            ], 409);
        }

        // Save the review in the database.
        $review = $user->reviews()->create([
            'book_id' => $book->id,
            'score' => $data['score'],
            'content' => $data['content'],
        ]);

        return response()->json([
            'message' => 'Review published successfully.',
            'review' => $review->load(
                'user:id,name,username'
            ),
        ], 201);
    }
}

