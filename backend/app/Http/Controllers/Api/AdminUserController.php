<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(){ return User::withCount('orders')->latest()->paginate(20); }

    public function updateRole(Request $r, User $user)
    {
        $d=$r->validate(['role'=>['required',Rule::in(['user','pet_shop','pharmacy','vaccination','admin'])]]);
        if($user->id === $r->user()->id && $d['role'] !== 'admin') abort(422,'نمی‌توانید Role ادمین فعلی خودتان را حذف کنید.');
        $user->update(['role'=>$d['role']]);
        return ['message'=>'Role با موفقیت تغییر کرد.','user'=>$user->fresh()];
    }

    public function updateStatus(Request $r, User $user)
    {
        if ($user->id === $r->user()->id && !$r->boolean('is_active')) {
            abort(422, 'نمی‌توانید حساب ادمین فعلی خودتان را غیرفعال کنید.');
        }

        $d = $r->validate(['is_active' => 'required|boolean']);
        $user->update(['is_active' => $d['is_active']]);
        return ['message' => 'وضعیت کاربر تغییر کرد.', 'user' => $user->fresh()];
    }
}
