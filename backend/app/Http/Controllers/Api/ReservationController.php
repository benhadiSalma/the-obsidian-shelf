<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()
                ->reservations()
                ->with('book')
                ->latest()
                ->get()
        );
    }

    public function store(
        Request $request,
        ReservationService $service
    ): JsonResponse {
        $data = $request->validate([
            'book_id' => [
                'required',
                'integer',
                'exists:books,id',
            ],
        ]);

        $reservation = $service->reserve(
            $request->user(),
            (int) $data['book_id']
        );

        if ($reservation === null) {
            return response()->json([
                'message' => 'This book is out of stock.',
            ], 409);
        }

        return response()->json([
            'message' => 'Reservation confirmed. Pay when collecting your book within seven days.',
            'reservation' => $reservation,
        ], 201);
    }
}