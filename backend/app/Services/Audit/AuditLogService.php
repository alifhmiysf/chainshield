<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AuditLogService
{
    /**
     * Genesis hash: nilai awal sebelum audit record pertama.
     */
    private const GENESIS_HASH =
        '0000000000000000000000000000000000000000000000000000000000000000';

    /**
     * Create a new audit log with hash chaining.
     */
    public function record(
        string $action,
        array $payload,
        ?User $actor = null,
        ?string $entityType = null,
        ?string $entityId = null
    ): AuditLog {
        return DB::transaction(function () use (
            $action,
            $payload,
            $actor,
            $entityType,
            $entityId
        ) {
            // Ambil audit record terakhir.
            $lastLog = AuditLog::query()
                ->orderByDesc('sequence')
                ->lockForUpdate()
                ->first();

            // Tentukan sequence berikutnya.
            $sequence = $lastLog
                ? $lastLog->sequence + 1
                : 1;

            // Tentukan hash sebelumnya.
            $previousHash = $lastLog
                ? $lastLog->current_hash
                : self::GENESIS_HASH;

            // Ubah payload menjadi JSON secara konsisten.
            $payloadJson = json_encode(
                $payload,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES |
                JSON_THROW_ON_ERROR
            );

            // Hitung SHA-256 dari payload.
            $payloadHash = hash('sha256', $payloadJson);

            // Gabungkan hash sebelumnya, payload hash,
            // dan sequence untuk menghasilkan current hash.
            $currentHash = hash(
                'sha256',
                $previousHash . $payloadHash . $sequence
            );

            // Simpan audit record.
            return AuditLog::create([
                'sequence' => $sequence,
                'actor_id' => $actor?->id,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'payload' => $payload,
                'payload_hash' => $payloadHash,
                'previous_hash' => $previousHash,
                'current_hash' => $currentHash,
                'created_at' => now(),
            ]);
        });
    }
}
