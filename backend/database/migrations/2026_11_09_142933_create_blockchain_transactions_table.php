<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blockchain_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('audit_batch_id')
                ->constrained('audit_batches')
                ->restrictOnDelete();

            $table->string('network', 50);
            $table->unsignedBigInteger('chain_id');

            $table->string('contract_address', 42);

            $table->string('transaction_hash', 66)
                ->nullable()
                ->unique();

            $table->unsignedBigInteger('block_number')->nullable();
            $table->unsignedBigInteger('gas_used')->nullable();

            $table->enum('status', [
                'pending',
                'confirmed',
                'failed',
                'orphaned',
            ])->default('pending');

            $table->text('error_message')->nullable();
            $table->timestamp('confirmed_at')->nullable();

            $table->timestamps();

            $table->index(['audit_batch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blockchain_transactions');
    }
};
