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
     * Register new user.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('chainshield-api')->plainTextToken;

        // Catat registrasi berhasil.
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

        // Periksa kredensial pengguna.
        if (!Auth::attempt($validated)) {

            // 1. Catat aktivitas login gagal.
            $securityEvent = $this->securityLogger->log(
                eventType: 'auth.login_failed',
                severity: 'medium',
                description: 'Login attempt failed.',
                request: $request
            );

            // 2. Periksa apakah pola login gagal
            //    memenuhi kriteria brute force.
            $this->bruteForceDetector->detect($securityEvent);

            // 3. Tolak proses login.
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $validated['email'])
            ->firstOrFail();

        $token = $user->createToken('chainshield-api')->plainTextToken;

        // Catat login berhasil.
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
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        // Catat logout sebelum token dihapus.
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
