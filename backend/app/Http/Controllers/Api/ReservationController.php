<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    /**
     * List the authenticated user's reservations.
     */
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

    /**
     * Create a new reservation.
     */
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

    /**
     * Cancel a reservation within 24 hours.
     */
    public function cancel(
        Request $request,
        ReservationService $service,
        int $reservation
    ): JsonResponse {
        $result = $service->cancel(
            $request->user(),
            $reservation
        );

        return response()->json(
            $result,
            $result['success'] ? 200 : 409
        );
    }
}