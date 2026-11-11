<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockchainTransaction extends Model
{
    protected $fillable = [
        'audit_batch_id',
        'network',
        'chain_id',
        'contract_address',
        'transaction_hash',
        'block_number',
        'gas_used',
        'status',
        'error_message',
        'confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'chain_id' => 'integer',
            'block_number' => 'integer',
            'gas_used' => 'integer',
            'confirmed_at' => 'datetime',
        ];
    }

    public function auditBatch(): BelongsTo
    {
        return $this->belongsTo(AuditBatch::class);
    }
}