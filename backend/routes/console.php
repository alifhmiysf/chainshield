<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('chainshield:batch-audits')
    ->everyFiveMinutes()
    ->withoutOverlapping();

Schedule::command('chainshield:recover-transactions')
    ->everyFiveMinutes()
    ->withoutOverlapping();
