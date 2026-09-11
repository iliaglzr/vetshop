<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Payment extends Model { protected $fillable=['order_id','method','amount','status','receipt_path','transaction_id','verified_by','verified_at','rejection_reason']; protected $casts=['amount'=>'decimal:2','verified_at'=>'datetime']; public function order(){return $this->belongsTo(Order::class);} public function verifier(){return $this->belongsTo(User::class,'verified_by');} }
