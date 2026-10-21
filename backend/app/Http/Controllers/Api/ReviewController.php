<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    
    public function store(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:books,id',
            'score' => 'required|integer|min:1|max:5',
            'content' => 'required|string|max:1000'
        ]);

        $user = $request->user();

        
        $existingReview = Review::where('user_id', $user->id)
                                ->where('book_id', $request->book_id)
                                ->first();

        if ($existingReview) {
            return response()->json(['message' => 'Tu as déjà laissé un avis pour ce manuscrit.'], 403);
        }

        $review = Review::create([
            'user_id' => $user->id,
            'book_id' => $request->input('book_id'),
            'score' => $request->input('score'),
            'content' => $request->input('content')
        ]);

        return response()->json([
            'message' => 'Ton avis a été gravé avec succès !',
            'review' => $review
        ], 201);
    }
};