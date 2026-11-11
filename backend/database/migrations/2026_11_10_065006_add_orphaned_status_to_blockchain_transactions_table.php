<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("
            ALTER TABLE blockchain_transactions
            MODIFY status ENUM(
                'pending',
                'confirmed',
                'failed',
                'orphaned'
            ) NOT NULL DEFAULT 'pending'
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("
            ALTER TABLE blockchain_transactions
            MODIFY status ENUM(
                'pending',
                'confirmed',
                'failed'
            ) NOT NULL DEFAULT 'pending'
        ");
    }
};
