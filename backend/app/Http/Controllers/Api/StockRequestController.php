<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockRequest;
use Illuminate\Http\Request;

class StockRequestController extends Controller
{
    /**
     * ثبت درخواست موجود شدن محصول
     */
    public function store(Request $request, Product $product)
    {
        if ($product->stock > 0) {
            return response()->json([
                'message' => 'این محصول در حال حاضر موجود است.'
            ], 422);
        }

        $existing = StockRequest::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'قبلاً برای موجود شدن این محصول درخواست داده‌اید.',
                'requested' => true,
            ]);
        }

        $stockRequest = StockRequest::create([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'درخواست موجود شدن محصول ثبت شد.',
            'requested' => true,
            'data' => $stockRequest,
        ], 201);
    }

    /**
     * بررسی اینکه کاربر برای محصول درخواست فعال دارد یا نه
     */
    public function check(Request $request, Product $product)
    {
        $requested = StockRequest::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->where('status', 'pending')
            ->exists();

        return response()->json([
            'requested' => $requested,
        ]);
    }

    /**
     * لغو درخواست
     */
    public function destroy(Request $request, Product $product)
    {
        $stockRequest = StockRequest::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->where('status', 'pending')
            ->first();

        if (!$stockRequest) {
            return response()->json([
                'message' => 'درخواست فعالی برای این محصول وجود ندارد.'
            ], 404);
        }

        $stockRequest->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'درخواست موجود شدن لغو شد.',
            'requested' => false,
        ]);
    }
}