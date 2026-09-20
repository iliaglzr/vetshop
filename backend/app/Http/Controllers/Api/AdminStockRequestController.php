<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockRequest;
use Illuminate\Http\Request;

class AdminStockRequestController extends Controller
{
    /**
     * لیست درخواست‌های موجود شدن
     */
    public function index(Request $request)
    {
        $products = \App\Models\Product::query()
            ->whereHas('stockRequests', function ($q) {
                $q->where('status', 'pending');
            })
            ->withCount([
                'stockRequests as pending_stock_requests_count' => function ($q) {
                    $q->where('status', 'pending');
                }
            ])
            ->with([
                'stockRequests' => function ($q) {
                    $q->where('status', 'pending')
                        ->latest()
                        ->with('user:id,name,email,phone');
                }
            ])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;

                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('pending_stock_requests_count')
            ->paginate($request->integer('per_page', 20));

        return response()->json($products);
    }


    /**
     * جزئیات درخواست‌های یک محصول
     */
    public function productRequests(int $productId)
    {
        $requests = StockRequest::with([
            'user:id,name,email,phone',
            'product:id,name,sku,stock',
        ])
            ->where('product_id', $productId)
            ->where('status', 'pending')
            ->latest()
            ->get();

        return response()->json([
            'product' => $requests->first()?->product,
            'count' => $requests->count(),
            'requests' => $requests,
        ]);
    }


    /**
     * علامت‌گذاری درخواست‌ها به عنوان اطلاع‌رسانی‌شده
     */
    public function notify(int $productId)
    {
        $pendingRequests = StockRequest::where('product_id', $productId)
            ->where('status', 'pending')
            ->get();

        $updated = 0;

        foreach ($pendingRequests as $request) {

            // اگر قبلاً همین کاربر برای همین محصول
            // وضعیت notified داشته، رکورد pending را حذف می‌کنیم
            // تا با unique index تداخل ایجاد نشود.
            $alreadyNotified = StockRequest::where('user_id', $request->user_id)
                ->where('product_id', $productId)
                ->where('status', 'notified')
                ->where('id', '!=', $request->id)
                ->exists();

            if ($alreadyNotified) {
                $request->delete();
                continue;
            }

            $request->update([
                'status' => 'notified',
            ]);

            $updated++;
        }

        return response()->json([
            'message' => 'درخواست‌ها به عنوان اطلاع‌رسانی‌شده ثبت شدند.',
            'updated' => $updated,
        ]);
    }


    /**
     * لغو یک درخواست
     */
    public function cancel(int $id)
    {
        $stockRequest = StockRequest::findOrFail($id);

        $stockRequest->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'درخواست لغو شد.',
        ]);
    }
}
