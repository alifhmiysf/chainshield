<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_alerts', function (Blueprint $table) {
            $table->id();

            // Event yang menyebabkan alert
            $table->foreignId('security_event_id')
                ->nullable()
                ->constrained('security_events')
                ->nullOnDelete();

            // Informasi alert
            $table->string('title', 255);
            $table->text('description')->nullable();

            // Tingkat bahaya
            $table->enum('severity', [
                'low',
                'medium',
                'high',
                'critical',
            ])->default('medium');

            // Status penanganan alert
            $table->enum('status', [
                'open',
                'investigating',
                'resolved',
                'false_positive',
            ])->default('open');

            // Admin atau analyst yang menangani alert
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            // Index untuk pencarian dan filter
            $table->index('severity');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_alerts');
    }
};