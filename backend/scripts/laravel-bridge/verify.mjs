
import {
    JsonRpcProvider,
    Contract,
    Interface,
    isHexString
} from "ethers";

const [
    rpcUrl,
    chainIdArg,
    contractAddress,
    batchIdArg,
    expectedRoot,
    totalRecordsArg,
    transactionHash,
    expectedBlockArg
] = process.argv.slice(2);

const ABI = [
    "function auditBatches(uint256) view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords, address submitter)",
    "function verifyBatch(uint256,bytes32) view returns (bool)",
    "event BatchAnchored(uint256 indexed batchId,bytes32 merkleRoot,uint256 totalRecords,address indexed submitter,uint256 timestamp)"
];

async function main() {
    if (
        !rpcUrl ||
        !chainIdArg ||
        !contractAddress ||
        !batchIdArg ||
        !expectedRoot ||
        !totalRecordsArg ||
        !transactionHash ||
        !expectedBlockArg
    ) {
        throw new Error("Missing verification arguments.");
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        throw new Error("Invalid contract address.");
    }

    if (!isHexString(expectedRoot, 32)) {
        throw new Error("Invalid Merkle Root.");
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
        throw new Error("Invalid transaction hash.");
    }

    const expectedChainId = BigInt(chainIdArg);
    const batchId = BigInt(batchIdArg);
    const totalRecords = BigInt(totalRecordsArg);
    const expectedBlock = Number(expectedBlockArg);

    if (
        batchId <= 0n ||
        totalRecords <= 0n ||
        !Number.isSafeInteger(expectedBlock) ||
        expectedBlock <= 0
    ) {
        throw new Error("Invalid batch verification parameters.");
    }

    const provider = new JsonRpcProvider(rpcUrl);

    try {
        const network = await provider.getNetwork();

        if (network.chainId !== expectedChainId) {
            throw new Error("Unexpected blockchain network.");
        }

        const contract = new Contract(
            contractAddress,
            ABI,
            provider
        );

        const contractInterface = new Interface(ABI);

        // 1. Periksa transaction receipt.
        const receipt = await provider.getTransactionReceipt(
            transactionHash
        );

        if (!receipt) {
            throw new Error("Transaction receipt not found.");
        }

        const receiptValid =
            receipt.status === 1 &&
            receipt.to?.toLowerCase() === contractAddress.toLowerCase() &&
            receipt.blockNumber === expectedBlock;

        // 2. Ambil data batch langsung dari smart contract.
        const batch = await contract.auditBatches(batchId);

        const batchValid =
            batch.merkleRoot.toLowerCase() === expectedRoot.toLowerCase() &&
            batch.timestamp > 0n &&
            batch.totalRecords === totalRecords;

        // 3. Jalankan fungsi verifyBatch dari smart contract.
        const contractVerified = await contract.verifyBatch(
            batchId,
            expectedRoot
        );

        // 4. Periksa event BatchAnchored pada receipt.
        const events = receipt.logs
            .map((log) => {
                try {
                    return contractInterface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                } catch {
                    return null;
                }
            })
            .filter((event) => event?.name === "BatchAnchored");

        const event = events[0];

        const eventValid =
            events.length === 1 &&
            event.args.batchId === batchId &&
            event.args.merkleRoot.toLowerCase() === expectedRoot.toLowerCase() &&
            event.args.totalRecords === totalRecords &&
            event.args.submitter.toLowerCase() === batch.submitter.toLowerCase() &&
            event.args.timestamp === batch.timestamp;

        const success =
            receiptValid &&
            batchValid &&
            contractVerified &&
            eventValid;

        console.log(JSON.stringify({
            success,
            network: network.name,
            chain_id: network.chainId.toString(),
            batch_id: batchId.toString(),
            transaction_hash: receipt.hash,
            block_number: receipt.blockNumber,
            receipt_valid: receiptValid,
            on_chain_batch_valid: batchValid,
            contract_verified: contractVerified,
            event_valid: eventValid,
            event_count: events.length,
            on_chain: {
                merkle_root: batch.merkleRoot,
                timestamp: batch.timestamp.toString(),
                total_records: batch.totalRecords.toString(),
                submitter: batch.submitter
            }
        }));

        if (!success) {
            process.exitCode = 1;
        }

    } finally {
        await provider.destroy();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
