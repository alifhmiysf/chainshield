<?php

namespace App\Services\Audit;

use App\Models\AuditLog;

class AuditVerificationService
{
    private const GENESIS_HASH =
        '0000000000000000000000000000000000000000000000000000000000000000';

    public function verify(): array
    {
        $logs = AuditLog::query()
            ->orderBy('sequence')
            ->get();

        $errors = [];

        $expectedSequence = 1;
        $previousHash = self::GENESIS_HASH;

        foreach ($logs as $log) {
            $payloadJson = json_encode(
                $log->payload,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES |
                JSON_THROW_ON_ERROR
            );

            $calculatedPayloadHash = hash(
                'sha256',
                $payloadJson
            );

            $calculatedCurrentHash = hash(
                'sha256',
                $previousHash .
                $calculatedPayloadHash .
                $log->sequence
            );

            // Periksa urutan record.
            if ((int) $log->sequence !== $expectedSequence) {
                $errors[] = [
                    'sequence' => $log->sequence,
                    'error' => 'Invalid sequence.',
                ];
            }

            // Periksa hash payload.
            if (! hash_equals(
                $log->payload_hash,
                $calculatedPayloadHash
            )) {
                $errors[] = [
                    'sequence' => $log->sequence,
                    'error' => 'Payload hash mismatch.',
                ];
            }

            // Periksa hubungan dengan record sebelumnya.
            if (! hash_equals(
                $previousHash,
                $log->previous_hash
            )) {
                $errors[] = [
                    'sequence' => $log->sequence,
                    'error' => 'Previous hash mismatch.',
                ];
            }

            // Periksa current hash.
            if (! hash_equals(
                $log->current_hash,
                $calculatedCurrentHash
            )) {
                $errors[] = [
                    'sequence' => $log->sequence,
                    'error' => 'Current hash mismatch.',
                ];
            }

            $previousHash = $log->current_hash;
            $expectedSequence++;
        }

        return [
            'valid' => count($errors) === 0,
            'checked_records' => $logs->count(),
            'errors' => $errors,
        ];
    }
}
