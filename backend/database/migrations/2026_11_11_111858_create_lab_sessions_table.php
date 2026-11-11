<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_sessions', function (Blueprint $table) {
            $table->id();

            // Target yang menjadi objek pengujian.
            $table->foreignId('pentest_target_id')
                ->constrained('pentest_targets')
                ->cascadeOnDelete();

            // Pengguna yang menjalankan sesi.
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('name', 150);
            $table->string('status', 20)->default('pending');

            // Waktu pelaksanaan.
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            // Konfigurasi pengujian dan ringkasan hasil.
            $table->json('configuration')->nullable();
            $table->text('summary')->nullable();

            $table->timestamps();

            $table->index(['pentest_target_id', 'status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_sessions');
    }
};
