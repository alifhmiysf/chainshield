<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;
use JsonException;
use stdClass;

class PythonSecurityRunnerService
{
    /**
     * Menjalankan Python security scanner dengan konfigurasi
     * yang dibuat dan ditandatangani oleh Laravel.
     *
     * @throws RuntimeException
     * @throws JsonException
     */
    public function execute(
        string $scannerType,
        string $targetUrl,
        array $options = []
    ): array {
        $python = config('chainshield.python');
        $runnerPath = config('chainshield.runner_path');
        $secret = config('chainshield.runner_secret');
        $timeout = (int) config('chainshield.timeout', 120);

        // ======================================
        // VALIDASI KONFIGURASI
        // ======================================

        if (!is_string($python) || !is_file($python)) {
            throw new RuntimeException(
                'Python executable tidak ditemukan.'
            );
        }

        if (!is_string($runnerPath) || !is_dir($runnerPath)) {
            throw new RuntimeException(
                'Direktori Python runner tidak ditemukan.'
            );
        }

        if (
            !is_string($secret) ||
            strlen($secret) !== 64 ||
            !ctype_xdigit($secret)
        ) {
            throw new RuntimeException(
                'Secret autentikasi Python runner tidak valid.'
            );
        }

        if ($timeout < 1 || $timeout > 600) {
            throw new RuntimeException(
                'Timeout Python runner tidak valid.'
            );
        }

        // ======================================
        // MEMBUAT PAYLOAD
        // ======================================

        $payload = [
            'scanner_type' => $scannerType,
            'target_url' => $targetUrl,
            'options' => (object) $options,
            'issued_at' => time(),
        ];

        $payload['signature'] = hash_hmac(
            'sha256',
            $this->canonicalJson($payload),
            hex2bin($secret)
        );

        $json = json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_PRESERVE_ZERO_FRACTION |
            JSON_THROW_ON_ERROR
        );

        // ======================================
        // FILE KONFIGURASI SEMENTARA
        // ======================================

        $directory = storage_path(
            'app/private/chainshield-scans'
        );

        File::ensureDirectoryExists(
            $directory,
            0700,
            true
        );

        $configPath = $directory . DIRECTORY_SEPARATOR
            . bin2hex(random_bytes(16)) . '.json';

        try {
            if (
                file_put_contents(
                    $configPath,
                    $json,
                    LOCK_EX
                ) === false
            ) {
                throw new RuntimeException(
                    'Gagal membuat konfigurasi scan sementara.'
                );
            }

            // ======================================
            // ENVIRONMENT PROSES PYTHON
            // ======================================

            $processEnvironment = [
                'CHAINSHIELD_RUNNER_SECRET' => $secret,
                'PYTHONIOENCODING' => 'utf-8',
            ];

            if (PHP_OS_FAMILY === 'Windows') {
                $requiredWindowsVariables = [
                    'systemroot',
                    'windir',
                    'path',
                    'pathext',
                    'comspec',
                    'temp',
                    'tmp',
                ];

                foreach (getenv() as $name => $value) {
                    if (
                        in_array(
                            strtolower($name),
                            $requiredWindowsVariables,
                            true
                        )
                    ) {
                        $processEnvironment[$name] = $value;
                    }
                }
            }

            // ======================================
            // MENJALANKAN PYTHON SECURITY RUNNER
            // ======================================

            $process = new Process(
                [
                    $python,
                    '-m',
                    'app.main',
                    '--input',
                    $configPath,
                ],
                $runnerPath,
                $processEnvironment,
                null,
                $timeout
            );

            $process->run();

            // ======================================
            // VALIDASI HASIL PROSES
            // ======================================

            if (!$process->isSuccessful()) {
                $errorOutput = trim(
                    $process->getErrorOutput()
                );

                throw new RuntimeException(
                    $errorOutput !== ''
                        ? $errorOutput
                        : 'Python security runner gagal dijalankan.'
                );
            }

            // ======================================
            // DECODE HASIL PYTHON
            // ======================================

            $result = json_decode(
                $process->getOutput(),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            if (!is_array($result)) {
                throw new RuntimeException(
                    'Format hasil Python runner tidak valid.'
                );
            }

            return $result;

        } finally {

            // ======================================
            // HAPUS FILE KONFIGURASI SEMENTARA
            // ======================================

            if (is_file($configPath)) {
                @unlink($configPath);
            }
        }
    }

    /**
     * Membuat JSON canonical yang kompatibel dengan Python.
     */
    private function canonicalJson(array $data): string
    {
        return json_encode(
            $this->sortRecursively($data),
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_PRESERVE_ZERO_FRACTION |
            JSON_THROW_ON_ERROR
        );
    }

    /**
     * Mengurutkan key object secara rekursif.
     * Urutan elemen array tetap dipertahankan.
     */
    private function sortRecursively(mixed $value): mixed
    {
        if ($value instanceof stdClass) {
            $properties = get_object_vars($value);

            ksort($properties, SORT_STRING);

            foreach ($properties as $key => $item) {
                $properties[$key] = $this->sortRecursively($item);
            }

            return (object) $properties;
        }

        if (is_array($value)) {
            if (!array_is_list($value)) {
                ksort($value, SORT_STRING);
            }

            foreach ($value as $key => $item) {
                $value[$key] = $this->sortRecursively($item);
            }
        }

        return $value;
    }
}
