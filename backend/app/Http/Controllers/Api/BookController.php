<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookController extends Controller
{
    /**
     * Get the catalog with search and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'sometimes|nullable|string|max:100',
            'in_stock' => 'sometimes|boolean',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = Book::query();

        if (!empty($validated['search'])) {
            $search = trim($validated['search']);

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%")
                  ->orWhere('tropes', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
        }

        return response()->json(
            $query
                ->orderBy('title')
                ->paginate($validated['per_page'] ?? 20)
        );
    }

    /**
     * Get a book and its reviews.
     */
    public function show(Book $book): JsonResponse
    {
        $book->load([
            'reviews.user',
        ]);

        return response()->json($book);
    }
}