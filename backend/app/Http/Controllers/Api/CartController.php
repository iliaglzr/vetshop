<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Cart, CartItem, Product};
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function cart(int $uid)
    {
        return Cart::firstOrCreate([
            'user_id' => $uid
        ]);
    }

    /**
     * محاسبه تعداد رایگان برای تخفیف جنسی
     *
     * مثال:
     * 5 عدد با تخفیف جنسی 20٪ => 1 عدد رایگان
     * 10 عدد => 2 عدد رایگان
     * 12 عدد => 2 عدد رایگان
     */
    private function freeQuantity(Product $p, int $quantity): int
    {
        if (
            ($p->discount_type ?? 'percentage') !== 'gift' ||
            !$p->discount_percentage ||
            $p->discount_percentage <= 0
        ) {
            return 0;
        }

        return intdiv(
            $quantity * (int) $p->discount_percentage,
            100
        );
    }

    /**
     * نمایش سبد خرید
     */
    public function show(Request $r)
    {
        $cart = $this->cart($r->user()->id);

        $cart->load('items.product');

        $cart->items->each(function ($item) {
            $item->free_quantity = $this->freeQuantity(
                $item->product,
                (int) $item->quantity
            );

            $item->total_quantity =
                $item->quantity + $item->free_quantity;

            $item->line_total =
                (float) $item->unit_price * $item->quantity;
        });

        return $cart;
    }

    private function assertAllowed(Product $p, Request $r): void
    {
        abort_unless(
            $p->is_active && $p->isAllowedFor($r->user()),
            403,
            'این محصول برای Role شما قابل خرید نیست.'
        );
    }

    /**
     * بررسی موجودی واقعی
     *
     * quantity = تعداد پرداختی
     * free_quantity = تعداد رایگان
     * total_quantity = تعداد واقعی تحویل داده شده
     */
    private function assertStock(
        Product $p,
        int $quantity
    ): void {
        $freeQuantity = $this->freeQuantity(
            $p,
            $quantity
        );

        $totalQuantity = $quantity + $freeQuantity;

        abort_if(
            $totalQuantity > $p->stock,
            422,
            'موجودی کافی نیست.'
        );
    }

    public function add(Request $r)
    {
        $d = $r->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $p = Product::findOrFail($d['product_id']);

        $this->assertAllowed($p, $r);

        $cart = $this->cart($r->user()->id);

        $item = $cart->items()->firstOrNew([
            'product_id' => $p->id
        ]);

        $qty = ($item->quantity ?? 0) + $d['quantity'];

        abort_if(
            $qty < $p->minimum_order_quantity,
            422,
            'حداقل تعداد سفارش رعایت نشده است.'
        );

        $this->assertStock($p, $qty);

        $item->quantity = $qty;
        $item->unit_price = $p->final_price;
        $item->save();

        return $this->show($r);
    }

    public function update(Request $r, CartItem $item)
    {
        abort_unless(
            $item->cart->user_id === $r->user()->id,
            403
        );

        $p = $item->product;

        $this->assertAllowed($p, $r);

        $d = $r->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        abort_if(
            $d['quantity'] < $p->minimum_order_quantity,
            422,
            'حداقل تعداد سفارش رعایت نشده است.'
        );

        $this->assertStock(
            $p,
            (int) $d['quantity']
        );

        $item->update([
            'quantity' => $d['quantity'],
            'unit_price' => $p->final_price
        ]);

        return $this->show($r);
    }

    public function remove(
        Request $r,
        CartItem $item
    ) {
        abort_unless(
            $item->cart->user_id === $r->user()->id,
            403
        );

        $item->delete();

        return $this->show($r);
    }
}