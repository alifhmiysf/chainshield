<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    // Audit log tidak menggunakan updated_at
    public $timestamps = false;

    protected $fillable = [
        'sequence',
        'actor_id',
        'action',
        'entity_type',
        'entity_id',
        'payload',
        'payload_hash',
        'previous_hash',
        'current_hash',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
