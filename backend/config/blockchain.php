<?php

return [
    'network' => env('BLOCKCHAIN_NETWORK', 'localhost'),

    'chain_id' => (int) env('BLOCKCHAIN_CHAIN_ID', 31337),

    'rpc_url' => env('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545'),

    'contract_address' => env('BLOCKCHAIN_CONTRACT_ADDRESS'),
];