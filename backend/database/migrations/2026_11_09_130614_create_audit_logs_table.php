<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Urutan setiap audit record
            $table->unsignedBigInteger('sequence')->unique();

            // Pengguna yang melakukan aktivitas
            $table->foreignId('actor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Jenis aktivitas
            $table->string('action', 100);

            // Data objek yang mengalami aktivitas
            $table->string('entity_type', 100)->nullable();
            $table->string('entity_id', 100)->nullable();

            // Data aktivitas yang sudah disanitasi
            $table->json('payload');

            // Hash dari payload
            $table->char('payload_hash', 64);

            // Hash record sebelumnya
            $table->char('previous_hash', 64);

            // Hash record saat ini
            $table->char('current_hash', 64)->unique();

            // Waktu pencatatan
            $table->timestamp('created_at')->useCurrent();

            $table->index('actor_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
