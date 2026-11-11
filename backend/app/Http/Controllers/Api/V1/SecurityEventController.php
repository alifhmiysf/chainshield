<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SecurityEvent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SecurityEventController extends Controller
{
    /**
     * Display a paginated list of security events.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'severity' => [
                'sometimes',
                'string',
                Rule::in(['info', 'low', 'medium', 'high', 'critical']),
            ],
            'event_type' => [
                'sometimes',
                'string',
                'max:100',
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        $query = SecurityEvent::query()
            ->with('user:id,name,email');

        if (!empty($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }

        if (!empty($validated['event_type'])) {
            $query->where(
                'event_type',
                $validated['event_type']
            );
        }

        $events = $query
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Security events retrieved successfully.',
            'data' => $events,
        ]);
    }

    /**
     * Display a specific security event.
     */
    public function show(SecurityEvent $securityEvent)
    {
        $securityEvent->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Security event retrieved successfully.',
            'data' => $securityEvent,
        ]);
    }
}
