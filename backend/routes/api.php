<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookController;


Route::get('/books', [BookController::class, 'index']);
Route::get('/books/{book}', [BookController::class, 'show']);
