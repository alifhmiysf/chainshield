<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class SecurityEvent extends Model
{
    protected $fillable = [
        'user_id',
        'event_type',
        'severity',
        'source_ip',
        'user_agent',
        'description',
        'metadata',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function alerts(): HasMany
    {
        return $this->hasMany(SecurityAlert::class);
    }
}
