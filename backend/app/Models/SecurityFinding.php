<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityFinding extends Model
{
    protected $fillable = [
        'lab_session_id',
        'title',
        'vulnerability_type',
        'severity',
        'description',
        'affected_endpoint',
        'evidence',
        'recommendation',
        'cvss_score',
        'status',
        'remediation_notes',
        'remediation_evidence',
    ];

    protected function casts(): array
    {
        return [
            'evidence' => 'array',
            'remediation_evidence' => 'array',
            'cvss_score' => 'decimal:1',
        ];
    }

    /**
     * Sesi pengujian yang menghasilkan temuan.
     */
    public function labSession(): BelongsTo
    {
        return $this->belongsTo(LabSession::class);
    }
}
