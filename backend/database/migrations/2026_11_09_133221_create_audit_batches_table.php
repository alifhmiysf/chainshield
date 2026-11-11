<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_batches', function (Blueprint $table) {
            $table->id();

            // Nomor batch yang dibuat secara berurutan.
            $table->unsignedBigInteger('batch_number')->unique();

            // Merkle Root yang mewakili kumpulan audit log.
            $table->char('merkle_root', 64);

            // Jumlah audit log dalam batch.
            $table->unsignedInteger('total_records');

            // Rentang sequence audit log.
            $table->unsignedBigInteger('start_sequence');
            $table->unsignedBigInteger('end_sequence');

            // Status proses blockchain.
            $table->enum('status', [
                'pending',
                'anchored',
                'failed',
            ])->default('pending');

            // Waktu batch berhasil dicatat ke blockchain.
            $table->timestamp('anchored_at')->nullable();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_batches');
    }
};
