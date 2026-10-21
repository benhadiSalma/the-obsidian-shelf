<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    
    public function index(Request $request)
    {
        
        $reservations = $request->user()->reservations()->with('book')->get();
        return response()->json($reservations);
    }

    
    public function store(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:books,id'
        ]);

        $book = Book::findOrFail($request->book_id);

        
        if ($book->stock <= 0) {
            return response()->json(['message' => 'Ce livre est malheureusement en rupture de stock.'], 400);
        }

       
        $book->decrement('stock');

        
        $reservation = Reservation::create([
            'user_id' => $request->user()->id,
            'book_id' => $book->id,
            'status' => 'pending' 
        ]);

        return response()->json([
            'message' => 'Livre réservé avec succès !',
            'reservation' => $reservation
        ], 201);
    }
}