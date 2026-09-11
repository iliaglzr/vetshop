<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class User extends Authenticatable {
 use HasApiTokens, HasFactory, Notifiable;
 protected $fillable=['name','email','phone','password','role'];
 protected $hidden=['password','remember_token'];
 protected function casts(): array { return ['email_verified_at'=>'datetime','password'=>'hashed']; }
 public function addresses(){return $this->hasMany(Address::class);}
 public function orders(){return $this->hasMany(Order::class);}
 public function isAdmin(){return in_array($this->role,['super_admin','admin','operator'],true);}
}
