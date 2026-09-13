<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Discount extends Model { protected $fillable=['name','type','value','starts_at','ends_at','product_id','category_id','is_active']; protected $casts=['value'=>'decimal:2','starts_at'=>'datetime','ends_at'=>'datetime','is_active'=>'boolean']; }
