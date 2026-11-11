<?php

return [
    'python' => env('CHAINSHIELD_PYTHON'),
    'runner_path' => env('CHAINSHIELD_RUNNER_PATH'),
    'timeout' => (int) env('CHAINSHIELD_RUNNER_TIMEOUT', 120),
    'runner_secret' => env('CHAINSHIELD_RUNNER_SECRET'),
];