<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Cart, CartItem, Product};
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function cart(int $uid){ return Cart::firstOrCreate(['user_id'=>$uid]); }

    public function show(Request $r){ return $this->cart($r->user()->id)->load('items.product'); }

    private function assertAllowed(Product $p, Request $r): void
    {
        abort_unless($p->is_active && $p->isAllowedFor($r->user()), 403, 'این محصول برای Role شما قابل خرید نیست.');
    }

    public function add(Request $r)
    {
        $d=$r->validate(['product_id'=>'required|exists:products,id','quantity'=>'required|integer|min:1']);
        $p=Product::findOrFail($d['product_id']); $this->assertAllowed($p,$r);
        $cart=$this->cart($r->user()->id); $item=$cart->items()->firstOrNew(['product_id'=>$p->id]);
        $qty=($item->quantity??0)+$d['quantity'];
        abort_if($qty>$p->stock,422,'موجودی کافی نیست.'); abort_if($qty<$p->minimum_order_quantity,422,'حداقل تعداد سفارش رعایت نشده است.');
        $item->quantity=$qty; $item->unit_price=$p->final_price; $item->save(); return $this->show($r);
    }

    public function update(Request $r,CartItem $item)
    {
        abort_unless($item->cart->user_id===$r->user()->id,403); $p=$item->product; $this->assertAllowed($p,$r);
        $d=$r->validate(['quantity'=>'required|integer|min:1']); abort_if($d['quantity']>$p->stock,422,'موجودی کافی نیست.'); abort_if($d['quantity']<$p->minimum_order_quantity,422,'حداقل تعداد سفارش رعایت نشده است.');
        $item->update(['quantity'=>$d['quantity'],'unit_price'=>$p->final_price]); return $this->show($r);
    }

    public function remove(Request $r,CartItem $item){abort_unless($item->cart->user_id===$r->user()->id,403);$item->delete();return $this->show($r);}
}
