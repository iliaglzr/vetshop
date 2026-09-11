<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PreInvoice extends Model { protected $fillable=['order_id','invoice_number','issued_at','pdf_path']; protected $casts=['issued_at'=>'datetime']; public function order(){return $this->belongsTo(Order::class);} }
