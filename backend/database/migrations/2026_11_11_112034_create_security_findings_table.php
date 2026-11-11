<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_findings', function (Blueprint $table) {
            $table->id();

            // Sesi pengujian yang menghasilkan temuan.
            $table->foreignId('lab_session_id')
                ->constrained('lab_sessions')
                ->cascadeOnDelete();

            // Identitas kerentanan.
            $table->string('title', 200);
            $table->string('vulnerability_type', 100);
            $table->string('severity', 20)->default('medium');

            // Detail hasil pengujian.
            $table->text('description');
            $table->string('affected_endpoint', 2048)->nullable();
            $table->json('evidence')->nullable();
            $table->text('recommendation')->nullable();

            // Penilaian risiko.
            $table->decimal('cvss_score', 3, 1)->nullable();

            // Status penanganan temuan.
            $table->string('status', 30)->default('open');

            $table->timestamps();

            $table->index(['lab_session_id', 'severity']);
            $table->index(['vulnerability_type', 'severity']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_findings');
    }
};
