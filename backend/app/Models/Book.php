<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'isbn', 
        'title', 
        'author', 
        'description', 
        'price', 
        'cover_image', 
        'stock', 
        'tropes'
    ];

    protected $casts = [
        'tropes' => 'array',
    ];

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}