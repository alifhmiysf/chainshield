<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_events', function (Blueprint $table) {
            $table->id();

            // Pengguna yang melakukan aktivitas.
            // Nullable karena login gagal bisa dilakukan
            // oleh orang yang belum memiliki akun.
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Jenis aktivitas keamanan.
            $table->string('event_type', 100);

            // info, low, medium, high, critical.
            $table->string('severity', 20)->default('info');

            // Informasi asal request.
            $table->string('source_ip', 45)->nullable();
            $table->text('user_agent')->nullable();

            // Penjelasan aktivitas.
            $table->text('description')->nullable();

            // Informasi tambahan dalam format JSON.
            $table->json('metadata')->nullable();

            // Waktu kejadian sebenarnya.
            $table->timestamp('occurred_at')->useCurrent();

            $table->timestamps();

            // Index untuk pencarian dan monitoring.
            $table->index('event_type');
            $table->index('severity');
            $table->index('occurred_at');
            $table->index(['user_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_events');
    }
};
