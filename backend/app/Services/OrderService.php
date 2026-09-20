<?php

namespace App\Services;

use App\Models\{
    Cart,
    Order,
    OrderItem,
    Payment,
    Product,
    InventoryTransaction,
    PreInvoice,
    User
};

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    private function freeQuantity(Product $product, int $quantity): int
    {
        if (
            $product->discount_type !== 'gift' ||
            !$product->discount_percentage ||
            $product->discount_percentage <= 0
        ) {
            return 0;
        }

        return intdiv(
            $quantity * (int) $product->discount_percentage,
            100
        );
    }

    public function create(int $userId, array $data): Order
    {
        return DB::transaction(function () use ($userId, $data) {

            $user = User::findOrFail($userId);

            $cart = Cart::with('items.product')
                ->where('user_id', $userId)
                ->first();

            if (!$cart || !$cart->items->count()) {
                throw ValidationException::withMessages([
                    'cart' => 'سبد خرید خالی است.'
                ]);
            }

            $subtotal = 0;
            $discount = 0;

            foreach ($cart->items as $item) {

                $p = $item->product;

                if (!$p->isAllowedFor($user)) {
                    throw ValidationException::withMessages([
                        'cart' =>
                            "محصول {$p->name} برای Role شما مجاز نیست."
                    ]);
                }

                if (!$p->is_active) {
                    throw ValidationException::withMessages([
                        'cart' =>
                            "محصول {$p->name} غیرفعال است."
                    ]);
                }

                if (
                    $item->quantity <
                    $p->minimum_order_quantity
                ) {
                    throw ValidationException::withMessages([
                        'cart' =>
                            "حداقل سفارش محصول {$p->name} رعایت نشده است."
                    ]);
                }

                /*
                 * تعداد رایگان تخفیف جنسی
                 */
                $freeQuantity = $this->freeQuantity(
                    $p,
                    (int) $item->quantity
                );

                /*
                 * کل تعداد واقعی که باید تحویل داده شود
                 */
                $totalQuantity =
                    $item->quantity + $freeQuantity;

                /*
                 * بررسی موجودی واقعی
                 */
                if ($totalQuantity > $p->stock) {
                    throw ValidationException::withMessages([
                        'cart' =>
                            "موجودی محصول {$p->name} برای این سفارش کافی نیست."
                    ]);
                }

                /*
                 * قیمت واحد
                 *
                 * percentage:
                 * قیمت تخفیف‌خورده
                 *
                 * gift:
                 * قیمت کامل
                 */
                $unit = $p->final_price;

                /*
                 * مبلغ فقط برای تعداد پولی محاسبه می‌شود.
                 */
                $subtotal +=
                    (float) $p->price *
                    (int) $item->quantity;

                /*
                 * تخفیف مالی فقط برای discount_type = percentage
                 */
                if ($p->discount_type === 'percentage') {

                    $discount +=
                        ((float) $p->price - (float) $unit)
                        * (int) $item->quantity;
                }
            }

            $total = max(
                0,
                $subtotal - $discount
            );

            $order = Order::create([
                'user_id' => $userId,

                'order_number' =>
                    'VS-' .
                    now()->format('YmdHis') .
                    '-' .
                    random_int(100, 999),

                'status' =>
                    $data['payment_method'] === 'online'
                        ? 'pending'
                        : 'waiting_for_verification',

                'payment_method' =>
                    $data['payment_method'],

                'subtotal' => $subtotal,

                'discount' => $discount,

                'total' => $total,

                'shipping_address' =>
                    $data['shipping_address'],
            ]);

            foreach ($cart->items as $item) {

                $p = $item->product;

                $quantity = (int) $item->quantity;

                $freeQuantity = $this->freeQuantity(
                    $p,
                    $quantity
                );

                $unit = $p->final_price;

                /*
                 * تخفیف مالی هر آیتم
                 */
                $itemDiscount = 0;

                if ($p->discount_type === 'percentage') {
                    $itemDiscount =
                        ((float) $p->price - (float) $unit)
                        * $quantity;
                }

                OrderItem::create([
                    'order_id' => $order->id,

                    'product_id' => $p->id,

                    'product_name' => $p->name,

                    'sku' => $p->sku,

                    /*
                     * تعداد پولی
                     */
                    'quantity' => $quantity,

                    /*
                     * تعداد رایگان
                     */
                    'free_quantity' => $freeQuantity,

                    /*
                     * قیمت واحد
                     */
                    'unit_price' => $unit,

                    /*
                     * تخفیف مالی
                     */
                    'discount' => $itemDiscount,

                    /*
                     * مبلغ فقط تعداد پولی
                     */
                    'total' =>
                        $unit * $quantity,
                ]);
            }

            Payment::create([
                'order_id' => $order->id,

                'method' =>
                    $data['payment_method'],

                'amount' => $order->total,

                'status' =>
                    $data['payment_method'] === 'online'
                        ? 'pending'
                        : 'waiting_verification',
            ]);

            PreInvoice::create([
                'order_id' => $order->id,

                'invoice_number' =>
                    'PI-' .
                    now()->format('Ymd') .
                    '-' .
                    $order->id,

                'issued_at' => now(),
            ]);

            /*
             * بعد از ایجاد سفارش، سبد خرید خالی می‌شود.
             */
            $cart->items()->delete();

            return $order->load([
                'items',
                'payments'
            ]);
        });
    }

    public function confirmPayment(
        Payment $payment,
        int $operatorId
    ): void {

        DB::transaction(function () use (
            $payment,
            $operatorId
        ) {

            $order = $payment
                ->order()
                ->with('items.product')
                ->lockForUpdate()
                ->first();

            if ($payment->status === 'paid') {
                return;
            }

            foreach ($order->items as $item) {

                $p = Product::lockForUpdate()
                    ->find($item->product_id);

                if (!$p) {
                    throw ValidationException::withMessages([
                        'stock' =>
                            "محصول {$item->product_name} پیدا نشد."
                    ]);
                }

                /*
                 * تعداد واقعی تحویل:
                 *
                 * 5 خریداری شده
                 * + 1 رایگان
                 * = 6 عدد
                 */
                $totalQuantity =
                    (int) $item->quantity +
                    (int) $item->free_quantity;

                if ($p->stock < $totalQuantity) {
                    throw ValidationException::withMessages([
                        'stock' =>
                            "موجودی محصول {$p->name} کافی نیست."
                    ]);
                }

                $before = $p->stock;

                $p->decrement(
                    'stock',
                    $totalQuantity
                );

                InventoryTransaction::create([
                    'product_id' => $p->id,

                    'user_id' => $operatorId,

                    'type' => 'sale',

                    /*
                     * کاهش واقعی موجودی
                     */
                    'quantity' => -$totalQuantity,

                    'before_stock' => $before,

                    'after_stock' =>
                        $before - $totalQuantity,

                    'reason' =>
                        'تأیید پرداخت سفارش ' .
                        $order->order_number,
                ]);
            }

            $payment->update([
                'status' => 'paid',
                'verified_by' => $operatorId,
                'verified_at' => now(),
            ]);

            $order->update([
                'status' => 'confirmed'
            ]);
        });
    }
}