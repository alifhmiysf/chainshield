<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Super Admin memiliki seluruh permission.
        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        // Periksa apakah user mempunyai permission.
        $hasPermission = $user->roles()
            ->whereHas('permissions', function ($query) use ($permission) {
                $query->where('slug', $permission);
            })
            ->exists();

        if (!$hasPermission) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to access this resource.',
                'required_permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}