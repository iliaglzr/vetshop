<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CheckPayment extends Model { protected $fillable=['payment_id','check_number','amount','due_date','image_path','notes']; protected $casts=['amount'=>'decimal:2','due_date'=>'date']; public function payment(){return $this->belongsTo(Payment::class);} }
