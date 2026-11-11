<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SecurityAlert;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\User;
use Illuminate\Validation\ValidationException;
class SecurityAlertController extends Controller
{
    /**
     * Display a list of security alerts.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'severity' => [
                'sometimes',
                'string',
                Rule::in(['low', 'medium', 'high', 'critical']),
            ],
            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'open',
                    'investigating',
                    'resolved',
                    'false_positive',
                ]),
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        $query = SecurityAlert::query()
            ->with([
                'securityEvent',
                'assignedUser:id,name,email',
            ]);

        // Filter berdasarkan severity.
        if (!empty($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }

        // Filter berdasarkan status.
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $alerts = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'message' => 'Security alerts retrieved successfully.',
            'data' => $alerts,
        ]);
    }
    /**
 * Update a security alert.
 */
public function update(Request $request, SecurityAlert $securityAlert)
{
    $validated = $request->validate([
        'status' => [
            'sometimes',
            'required',
            'string',
            Rule::in([
                'open',
                'investigating',
                'resolved',
                'false_positive',
            ]),
        ],

        'assigned_to' => [
            'sometimes',
            'nullable',
            'integer',
            'exists:users,id',
        ],
    ]);

    if (empty($validated)) {
        throw ValidationException::withMessages([
            'alert' => ['At least one field must be provided.'],
        ]);
    }

    if (isset($validated['status'])) {
        $securityAlert->status = $validated['status'];

        $securityAlert->resolved_at =
            $validated['status'] === 'resolved'
                ? ($securityAlert->resolved_at ?? now())
                : null;
    }

    if (array_key_exists('assigned_to', $validated)) {
        $securityAlert->assigned_to = $validated['assigned_to'];
    }

    $securityAlert->save();

    $securityAlert->load([
        'securityEvent',
        'assignedUser:id,name,email',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Security alert updated successfully.',
        'data' => $securityAlert,
    ]);
}

    /**
     * Display a specific security alert.
     */
    public function show(SecurityAlert $securityAlert)
    {
        $securityAlert->load([
            'securityEvent',
            'assignedUser:id,name,email',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Security alert retrieved successfully.',
            'data' => $securityAlert,
        ]);
    }
}
