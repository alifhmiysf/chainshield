<?php

namespace App\Services\Audit;

class MerkleTreeService
{
    /**
     * Menghasilkan Merkle Root dari sekumpulan hash.
     */
    public function generateRoot(array $hashes): ?string
    {
        // Tidak ada data untuk diproses.
        if (empty($hashes)) {
            return null;
        }

        // Setiap hash menjadi leaf pada Merkle Tree.
        $level = array_values($hashes);

        // Proses hingga hanya tersisa satu hash.
        while (count($level) > 1) {
            $nextLevel = [];

            for ($i = 0; $i < count($level); $i += 2) {

                $left = $level[$i];

                // Jika jumlah hash ganjil,
                // duplikasikan hash terakhir.
                $right = $level[$i + 1] ?? $left;

                // Gabungkan dua hash lalu SHA-256.
                $parentHash = hash(
                    'sha256',
                    $left . $right
                );

                $nextLevel[] = $parentHash;
            }

            $level = $nextLevel;
        }

        return $level[0];
    }
}
