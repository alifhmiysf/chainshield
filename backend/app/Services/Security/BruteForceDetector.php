<?php

namespace App\Services\Security;

use App\Models\SecurityAlert;
use App\Models\SecurityEvent;

class BruteForceDetector
{
    public function detect(SecurityEvent $event): ?SecurityAlert
    {
        // Hanya memproses login yang gagal
        if ($event->event_type !== 'auth.login_failed') {
            return null;
        }

        // IP diperlukan untuk mengelompokkan percobaan
        if (!$event->source_ip) {
            return null;
        }

        // Hitung kegagalan login dari IP yang sama
        // dalam rentang waktu 5 menit.
        $failedAttempts = SecurityEvent::query()
            ->where('event_type', 'auth.login_failed')
            ->where('source_ip', $event->source_ip)
            ->where('occurred_at', '>=', now()->subMinutes(5))
            ->count();

        // Belum mencapai batas deteksi
        if ($failedAttempts < 5) {
            return null;
        }

        // Periksa apakah sudah ada alert aktif
        // dari IP yang sama.
        $existingAlert = SecurityAlert::query()
            ->whereIn('status', ['open', 'investigating'])
            ->whereHas('securityEvent', function ($query) use ($event) {
                $query->where('source_ip', $event->source_ip);
            })
            ->exists();

        if ($existingAlert) {
            return null;
        }

        // Buat Security Alert
        return SecurityAlert::create([
            'security_event_id' => $event->id,
            'title' => 'Possible Brute Force Attack',
            'description' => sprintf(
                'Detected %d failed login attempts from IP address %s within 5 minutes.',
                $failedAttempts,
                $event->source_ip
            ),
            'severity' => 'high',
            'status' => 'open',
        ]);
    }
}