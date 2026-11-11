<?php

namespace App\Services\Security;

use App\Models\SecurityEvent;
use Illuminate\Http\Request;

class SecurityLogger
{
    public function log(
        string $eventType,
        string $severity = 'info',
        ?int $userId = null,
        ?string $description = null,
        array $metadata = [],
        ?Request $request = null
    ): SecurityEvent {
        return SecurityEvent::create([
            'user_id' => $userId,
            'event_type' => $eventType,
            'severity' => $severity,
            'source_ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'description' => $description,
            'metadata' => $metadata,
            'occurred_at' => now(),
        ]);
    }
}
