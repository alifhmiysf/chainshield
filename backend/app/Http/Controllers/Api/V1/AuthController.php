<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Security\SecurityLogger;
use App\Services\Security\BruteForceDetector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected SecurityLogger $securityLogger;

    protected BruteForceDetector $bruteForceDetector;

    public function __construct(
        SecurityLogger $securityLogger,
        BruteForceDetector $bruteForceDetector
    ) {
        $this->securityLogger = $securityLogger;
        $this->bruteForceDetector = $bruteForceDetector;
    }

    /**
     * Load user roles and aggregated permissions.
     */
    private function loadUserAccess(User $user): User
    {
        $user->load('roles.permissions');

        $permissions = $user->roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id')
            ->values();

        $user->setRelation('permissions', $permissions);

        return $user;
    }

    /**
     * Register new user.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user = $this->loadUserAccess($user);

        $token = $user->createToken('chainshield-api')->plainTextToken;

        $this->securityLogger->log(
            eventType: 'auth.register',
            severity: 'info',
            userId: $user->id,
            description: 'New user registered successfully.',
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Account registered successfully.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Login user.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($validated)) {

            $securityEvent = $this->securityLogger->log(
                eventType: 'auth.login_failed',
                severity: 'medium',
                description: 'Login attempt failed.',
                request: $request
            );

            $this->bruteForceDetector->detect($securityEvent);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $validated['email'])
            ->firstOrFail();

        $user = $this->loadUserAccess($user);

        $token = $user->createToken('chainshield-api')->plainTextToken;

        $this->securityLogger->log(
            eventType: 'auth.login',
            severity: 'info',
            userId: $user->id,
            description: 'User logged in successfully.',
            request: $request
        );

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request)
    {
        $user = $this->loadUserAccess($request->user());

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        $this->securityLogger->log(
            eventType: 'auth.logout',
            severity: 'info',
            userId: $user->id,
            description: 'User logged out successfully.',
            request: $request
        );

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful.',
        ]);
    }
}
