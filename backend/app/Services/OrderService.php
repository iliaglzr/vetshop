<?php
namespace App\Services;
use App\Models\{Cart,Order,OrderItem,Payment,Product,InventoryTransaction,PreInvoice,User};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class OrderService {
 public function create(int $userId,array $data): Order {
  return DB::transaction(function() use($userId,$data){
   $cart=Cart::with('items.product')->where('user_id',$userId)->first();
   if(!$cart || !$cart->items->count()) throw ValidationException::withMessages(['cart'=>'سبد خرید خالی است.']);
   $subtotal=0; $discount=0;
   foreach($cart->items as $item){$p=$item->product; if(!$p->isAllowedFor(User::find($userId))) throw ValidationException::withMessages(['cart'=>"محصول {$p->name} برای Role شما مجاز نیست."]); if(!$p->is_active || $item->quantity<$p->minimum_order_quantity || $item->quantity>$p->stock) throw ValidationException::withMessages(['cart'=>"موجودی یا حداقل سفارش {$p->name} صحیح نیست."]); $unit=$p->final_price; $subtotal += $p->price*$item->quantity; $discount += ($p->price-$unit)*$item->quantity;}
   $order=Order::create(['user_id'=>$userId,'order_number'=>'VS-'.now()->format('YmdHis').'-'.random_int(100,999),'status'=>$data['payment_method']==='online'?'pending':'waiting_for_verification','payment_method'=>$data['payment_method'],'subtotal'=>$subtotal,'discount'=>$discount,'total'=>$subtotal-$discount,'shipping_address'=>$data['shipping_address']]);
   foreach($cart->items as $item){$p=$item->product; $unit=$p->final_price; OrderItem::create(['order_id'=>$order->id,'product_id'=>$p->id,'product_name'=>$p->name,'sku'=>$p->sku,'quantity'=>$item->quantity,'unit_price'=>$unit,'discount'=>($p->price-$unit)*$item->quantity,'total'=>$unit*$item->quantity]);}
   Payment::create(['order_id'=>$order->id,'method'=>$data['payment_method'],'amount'=>$order->total,'status'=>$data['payment_method']==='online'?'pending':'waiting_verification']);
   PreInvoice::create(['order_id'=>$order->id,'invoice_number'=>'PI-'.now()->format('Ymd').'-'.$order->id,'issued_at'=>now()]);
   $cart->items()->delete();
   return $order->load('items','payments');
  });
 }
 public function confirmPayment(Payment $payment,int $operatorId): void {
  DB::transaction(function() use($payment,$operatorId){
   $order=$payment->order()->with('items.product')->lockForUpdate()->first();
   if($payment->status==='paid') return;
   foreach($order->items as $item){$p=Product::lockForUpdate()->find($item->product_id); if(!$p || $p->stock<$item->quantity) throw ValidationException::withMessages(['stock'=>'موجودی کافی نیست.']); $before=$p->stock; $p->decrement('stock',$item->quantity); InventoryTransaction::create(['product_id'=>$p->id,'user_id'=>$operatorId,'type'=>'sale','quantity'=>-$item->quantity,'before_stock'=>$before,'after_stock'=>$before-$item->quantity,'reason'=>'تأیید پرداخت سفارش '.$order->order_number]);}
   $payment->update(['status'=>'paid','verified_by'=>$operatorId,'verified_at'=>now()]); $order->update(['status'=>'confirmed']);
  });
 }
}
