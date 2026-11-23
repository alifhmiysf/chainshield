<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with('roles:id,name,slug')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->search;

                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'exists:roles,slug'],
        ]);

        if (
            $validated['role'] === 'super-admin' &&
            !$request->user()->hasRole('super-admin')
        ) {
            abort(403, 'Only a super-admin can assign the super-admin role.');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        $user->roles()->sync(
            Role::where('slug', $validated['role'])->pluck('id')
        );

        $user->load('roles:id,name,slug');

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data' => $user,
        ], 201);
    }

    
public function updateRole(Request $request, User $user)
{
    $actor = $request->user();

    // Pengguna tidak boleh mengubah role sendiri.
    if ($actor->id === $user->id) {
        return response()->json([
            'success' => false,
            'message' => 'You cannot change your own role.',
        ], 422);
    }

    // Non-Super Admin tidak boleh mengubah akun Super Admin.
    if (
        $user->hasRole('super-admin') &&
        !$actor->hasRole('super-admin')
    ) {
        abort(403, 'Only a super-admin can modify a super-admin account.');
    }

    $validated = $request->validate([
        'role' => ['required', 'exists:roles,slug'],
    ]);

    // Hanya Super Admin yang boleh memberikan role Super Admin.
    if (
        $validated['role'] === 'super-admin' &&
        !$actor->hasRole('super-admin')
    ) {
        abort(403, 'Only a super-admin can assign the super-admin role.');
    }

    $user->roles()->sync(
        Role::where('slug', $validated['role'])->pluck('id')
    );

    $user->load('roles:id,name,slug');

    return response()->json([
        'success' => true,
        'message' => 'User role updated successfully.',
        'data' => $user,
    ]);
}
}