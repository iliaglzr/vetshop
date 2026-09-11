<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Address extends Model { protected $fillable=['user_id','title','province','city','address','postal_code','phone']; public function user(){return $this->belongsTo(User::class);} }
