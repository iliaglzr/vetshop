<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(){ return User::latest()->paginate(20); }

    public function updateRole(Request $r, User $user)
    {
        $d=$r->validate(['role'=>['required',Rule::in(['user','pet_shop','pharmacy','vaccination','admin'])]]);
        if($user->id === $r->user()->id && $d['role'] !== 'admin') abort(422,'نمی‌توانید Role ادمین فعلی خودتان را حذف کنید.');
        $user->update(['role'=>$d['role']]);
        return ['message'=>'Role با موفقیت تغییر کرد.','user'=>$user->fresh()];
    }
}
