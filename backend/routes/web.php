<?php
use Illuminate\Support\Facades\Route;
Route::get('/', fn () => response()->json(['name'=>'VetShop API','status'=>'ok']));
