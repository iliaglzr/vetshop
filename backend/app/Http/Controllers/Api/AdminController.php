<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Order, Payment, Product, InventoryTransaction};
use App\Services\OrderService;
use Illuminate\Http\Request;
use App\Models\User;

class AdminController extends Controller
{
    public function __construct(private OrderService $service) {}

    public function dashboard()
    {
        return [
            'users' => \App\Models\User::count(),
            'products' => Product::count(),
            'orders' => Order::count(),
            'pending_orders' => Order::whereIn('status', [
                'waiting_for_verification',
                'waiting_for_check_verification'
            ])->count(),
            'low_stock' => Product::whereColumn('stock', '<=', 'minimum_stock')->count(),
            'near_expiry' => Product::whereNotNull('expiration_date')
                ->whereDate('expiration_date', '>=', now()->toDateString())
                ->whereDate('expiration_date', '<=', now()->addDays(30)->toDateString())
                ->count(),
            'expired' => Product::whereNotNull('expiration_date')
                ->whereDate('expiration_date', '<', now()->toDateString())
                ->count(),
            'sales' => Order::whereIn('status', [
                'confirmed',
                'processing',
                'preparing',
                'shipped',
                'delivered'
            ])->sum('total'),
        ];
    }

    public function users()
    {
        return \App\Models\User::withCount('orders')->latest()->paginate(20);
    }

    public function products(Request $r)
    {
        $q = Product::with(['category', 'brand', 'images', 'roles']);

        if ($r->filled('search')) {
            $search = str_replace(['ي', 'ى', 'ك'], ['ی', 'ی', 'ک'], $r->get('search'));
            $q->where(function ($query) use ($search) {
                $query->whereRaw("REPLACE(REPLACE(REPLACE(name, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(sku, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?", ["%{$search}%"]);
            });
        }

        if ($r->get('filter') === 'low_stock') {
            $q->whereColumn('stock', '<=', 'minimum_stock');
        }

        if ($r->get('filter') === 'near_expiry') {
            $q->whereNotNull('expiration_date')
                ->whereDate('expiration_date', '>=', now()->toDateString())
                ->whereDate('expiration_date', '<=', now()->addDays(30)->toDateString());
        }

        if ($r->get('filter') === 'expired') {
            $q->whereNotNull('expiration_date')
                ->whereDate('expiration_date', '<', now()->toDateString());
        }

        return $q->latest()->paginate(20);
    }

    public function orders(Request $r)
    {
        $q = Order::with(['user', 'items.product', 'payments']);
        if ($r->boolean('pending_only')) {
            $q->whereIn('status', [
                'waiting_for_verification',
                'waiting_for_check_verification'
            ]);
        }
        return $q->latest()->paginate(20);
    }

    public function pendingPayments()
    {
        return Payment::with('order.user')
            ->where('status', 'waiting_verification')
            ->latest()
            ->paginate(20);
    }

    public function approvePayment(Request $r, Payment $payment)
    {
        $this->service->confirmPayment($payment, $r->user()->id);
        return ['message' => 'پرداخت تأیید و موجودی کسر شد.'];
    }

    public function rejectPayment(Request $r, Payment $payment)
    {
        $d = $r->validate(['reason' => 'required|string']);
        $payment->update([
            'status' => 'rejected',
            'rejection_reason' => $d['reason'],
            'verified_by' => $r->user()->id,
            'verified_at' => now(),
        ]);
        $payment->order->update([
            'status' => 'rejected',
            'rejection_reason' => $d['reason'],
        ]);
        return ['message' => 'پرداخت رد شد.'];
    }

    public function updateOrder(Request $r, Order $order)
    {
        $d = $r->validate([
            'status' => 'required|in:pending,waiting_for_verification,waiting_for_check_verification,confirmed,processing,preparing,shipped,delivered,cancelled,rejected',
            'tracking_code' => 'nullable',
            'carrier' => 'nullable',
        ]);
        $order->update($d);
        return $order->fresh();
    }

    public function adjustInventory(Request $r, Product $product)
    {
        $d = $r->validate([
            'quantity' => 'required|integer',
            'reason' => 'required',
        ]);
        $before = $product->stock;
        $after = $before + $d['quantity'];
        abort_if($after < 0, 422, 'موجودی نمی‌تواند منفی باشد.');
        $product->update(['stock' => $after]);
        InventoryTransaction::create([
            'product_id' => $product->id,
            'user_id' => $r->user()->id,
            'type' => 'adjustment',
            'quantity' => $d['quantity'],
            'before_stock' => $before,
            'after_stock' => $after,
            'reason' => $d['reason'],
        ]);
        return $product->fresh();
    }
    public function deleteUser(Request $request, User $user)
    {
        // ادمین اجازه حذف خودش را ندارد
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'شما نمی‌توانید حساب کاربری خودتان را حذف کنید.'
            ], 422);
        }

        // حذف توکن‌های کاربر
        $user->tokens()->delete();

        // حذف کاربر
        $user->delete();

        return response()->json([
            'message' => 'کاربر با موفقیت حذف شد.'
        ]);
    }
}
