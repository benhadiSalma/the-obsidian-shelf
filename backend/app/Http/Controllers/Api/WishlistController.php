<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    
    public function index(Request $request)
    {
        return response()->json($request->user()->wishlists()->with('book')->get());
    }

    
    public function toggle(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:books,id'
        ]);

        $user = $request->user();
        
        
        $wishlist = Wishlist::where('user_id', $user->id)
                            ->where('book_id', $request->book_id)
                            ->first();

        if ($wishlist) {
            $wishlist->delete(); 
            return response()->json(['message' => 'Livre retiré de la liste d\'envies.']);
        } else {
            Wishlist::create([ 
                'user_id' => $user->id,
                'book_id' => $request->book_id
            ]);
            return response()->json(['message' => 'Livre ajouté à la liste d\'envies !'], 201);
        }
    }
}