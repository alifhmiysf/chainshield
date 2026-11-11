<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityAlert extends Model
{
    protected $fillable = [
        'security_event_id',
        'title',
        'description',
        'severity',
        'status',
        'assigned_to',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    // Alert berasal dari security event
    public function securityEvent(): BelongsTo
    {
        return $this->belongsTo(SecurityEvent::class);
    }

    // User yang ditugaskan menangani alert
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}