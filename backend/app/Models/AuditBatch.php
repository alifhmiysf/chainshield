<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class AuditBatch extends Model
{
    protected $fillable = [
        'batch_number',
        'merkle_root',
        'total_records',
        'start_sequence',
        'end_sequence',
        'status',
        'anchored_at',
    ];
    public function blockchainTransactions(): HasMany
{
    return $this->hasMany(BlockchainTransaction::class);
}

    protected function casts(): array
    {
        return [
            'anchored_at' => 'datetime',
        ];
    }
}
