<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabSession extends Model
{
    protected $fillable = [
        'pentest_target_id',
        'user_id',
        'name',
        'status',
        'started_at',
        'completed_at',
        'configuration',
        'summary',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'configuration' => 'array',
        ];
    }

    // Target yang diuji dalam sesi ini.
    public function target(): BelongsTo
    {
        return $this->belongsTo(PentestTarget::class, 'pentest_target_id');
    }

    // Pengguna yang menjalankan sesi.
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Temuan keamanan dari sesi ini.
    public function findings(): HasMany
    {
        return $this->hasMany(SecurityFinding::class);
    }
}
