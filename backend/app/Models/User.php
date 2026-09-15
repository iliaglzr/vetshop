<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name','email','phone','password','role','is_active'];
    protected $hidden = ['password','remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at'=>'datetime','password'=>'hashed','is_active'=>'boolean'];
    }

    public function addresses(){ return $this->hasMany(Address::class); }
    public function orders(){ return $this->hasMany(Order::class); }

    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isPetShop(): bool { return $this->role === 'pet_shop'; }
    public function isPharmacy(): bool { return $this->role === 'pharmacy'; }
    public function isVaccination(): bool { return $this->role === 'vaccination'; }
    public function isNormalUser(): bool { return $this->role === 'user'; }

    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles, true);
    }

    public function roleName(): string
    {
        return match ($this->role) {
            'admin' => 'مدیر سیستم',
            'pet_shop' => 'پت‌شاپ',
            'pharmacy' => 'داروخانه',
            'vaccination' => 'مرکز واکسیناسیون',
            default => 'کاربر عادی',
        };
    }
}
