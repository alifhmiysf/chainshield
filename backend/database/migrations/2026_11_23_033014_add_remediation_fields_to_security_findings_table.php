<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('security_findings', function (Blueprint $table) {
            $table->text('remediation_notes')->nullable();
            $table->json('remediation_evidence')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('security_findings', function (Blueprint $table) {
            $table->dropColumn([
                'remediation_notes',
                'remediation_evidence',
            ]);
        });
    }
};