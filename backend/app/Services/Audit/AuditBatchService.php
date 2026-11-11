<?php

namespace App\Services\Audit;

use App\Models\AuditBatch;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AuditBatchService
{
    public function __construct(
        private MerkleTreeService $merkleTree
    ) {}

    public function createBatch(): ?AuditBatch
    {
        return DB::transaction(function () {

            // Ambil batch terakhir.
            $lastBatch = AuditBatch::query()
                ->orderByDesc('batch_number')
                ->lockForUpdate()
                ->first();

            // Tentukan sequence terakhir yang sudah masuk batch.
            $lastSequence = $lastBatch?->end_sequence ?? 0;

            // Ambil audit log yang belum masuk batch.
            $logs = AuditLog::query()
                ->where('sequence', '>', $lastSequence)
                ->orderBy('sequence')
                ->lockForUpdate()
                ->get();

            // Tidak ada audit log baru.
            if ($logs->isEmpty()) {
                return null;
            }

            // Ambil payload hash setiap audit log.
            $hashes = $logs
                ->pluck('payload_hash')
                ->toArray();

            // Hitung Merkle Root.
            $merkleRoot = $this->merkleTree
                ->generateRoot($hashes);

            if ($merkleRoot === null) {
                throw new RuntimeException(
                    'Failed to generate Merkle Root.'
                );
            }

            // Buat batch baru.
            return AuditBatch::create([
                'batch_number' => ($lastBatch?->batch_number ?? 0) + 1,
                'merkle_root' => $merkleRoot,
                'total_records' => $logs->count(),
                'start_sequence' => $logs->first()->sequence,
                'end_sequence' => $logs->last()->sequence,
                'status' => 'pending',
            ]);
        });
    }
}
