<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Order extends Model { protected $fillable=['user_id','order_number','status','payment_method','subtotal','discount','total','shipping_address','rejection_reason','tracking_code','carrier','shipped_at','delivered_at']; protected $casts=['subtotal'=>'decimal:2','discount'=>'decimal:2','total'=>'decimal:2','shipping_address'=>'array','shipped_at'=>'datetime','delivered_at'=>'datetime']; public function user(){return $this->belongsTo(User::class);} public function items(){return $this->hasMany(OrderItem::class);} public function payments(){return $this->hasMany(Payment::class);} public function preInvoice(){return $this->hasOne(PreInvoice::class);} }
