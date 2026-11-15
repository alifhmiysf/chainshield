import {
    JsonRpcProvider,
    Contract,
    isHexString,
} from "ethers";

const RPC_URL =
    "https://ethereum-sepolia-rpc.publicnode.com";

const EXPECTED_CHAIN_ID = 11155111n;

const CONTRACT_ADDRESS =
    "0xe9D974Bac52aa0F96E8AD9c254B8F47B69C105E4";

const MAX_BLOCK_RANGE = 50000;

const ABI = [
    "function auditBatches(uint256) view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords, address submitter)",
    "function verifyBatch(uint256,bytes32) view returns (bool)",
    "event BatchAnchored(uint256 indexed batchId,bytes32 merkleRoot,uint256 totalRecords,address indexed submitter,uint256 timestamp)",
];

async function findBatchEvents(
    contract,
    provider,
    batchId
) {
    const latestBlock = await provider.getBlockNumber();

    const allEvents = [];

    for (
        let fromBlock = 0;
        fromBlock <= latestBlock;
        fromBlock += MAX_BLOCK_RANGE
    ) {
        const toBlock = Math.min(
            fromBlock + MAX_BLOCK_RANGE - 1,
            latestBlock
        );

        const events = await contract.queryFilter(
            contract.filters.BatchAnchored(batchId),
            fromBlock,
            toBlock
        );

        allEvents.push(...events);
    }

    return allEvents;
}

async function main() {
    const [
        batchIdArg,
        expectedRootArg,
        expectedRecordsArg,
        transactionHashArg,
    ] = process.argv.slice(2);

    // 1. Validasi parameter.
    if (
        !batchIdArg ||
        !expectedRootArg ||
        !expectedRecordsArg
    ) {
        throw new Error("Missing recovery parameters.");
    }

    if (!/^[1-9]\d*$/.test(batchIdArg)) {
        throw new Error("Invalid batch ID.");
    }

    if (!/^[1-9]\d*$/.test(expectedRecordsArg)) {
        throw new Error("Invalid total records.");
    }

    const batchId = BigInt(batchIdArg);
    const expectedRecords = BigInt(expectedRecordsArg);

    const expectedRoot = expectedRootArg.startsWith("0x")
        ? expectedRootArg
        : `0x${expectedRootArg}`;

    if (!isHexString(expectedRoot, 32)) {
        throw new Error("Invalid Merkle Root.");
    }

    if (
        transactionHashArg &&
        !isHexString(transactionHashArg, 32)
    ) {
        throw new Error("Invalid transaction hash.");
    }

    // 2. Hubungkan ke Sepolia.
    const provider = new JsonRpcProvider(RPC_URL);

    const network = await provider.getNetwork();

    if (network.chainId !== EXPECTED_CHAIN_ID) {
        throw new Error("Unexpected blockchain network.");
    }

    // 3. Hubungkan ke smart contract.
    const contract = new Contract(
        CONTRACT_ADDRESS,
        ABI,
        provider
    );

    // 4. Periksa data batch pada blockchain.
    const onChainBatch = await contract.auditBatches(batchId);

    if (onChainBatch.timestamp === 0n) {
        console.log(JSON.stringify({
            success: true,
            state: "not_anchored",
            batch_id: batchId.toString(),
            chain_id: network.chainId.toString(),
        }));

        return;
    }

    // 5. Cocokkan data lokal dengan data blockchain.
    const rootMatches =
        onChainBatch.merkleRoot.toLowerCase() ===
        expectedRoot.toLowerCase();

    const recordsMatch =
        onChainBatch.totalRecords === expectedRecords;

    const contractVerified = await contract.verifyBatch(
        batchId,
        expectedRoot
    );

    if (
        !rootMatches ||
        !recordsMatch ||
        !contractVerified
    ) {
        console.log(JSON.stringify({
            success: false,
            state: "conflict",
            batch_id: batchId.toString(),
            root_matches: rootMatches,
            records_match: recordsMatch,
            contract_verified: contractVerified,
        }));

        process.exitCode = 2;
        return;
    }

    let transactionHash = null;
    let blockNumber = null;
    let gasUsed = null;

    // 6. Jika hash tersedia, periksa receipt.
    if (transactionHashArg) {
        const receipt = await provider.getTransactionReceipt(
            transactionHashArg
        );

        if (receipt) {
            if (
                receipt.status !== 1 ||
                receipt.to?.toLowerCase() !==
                    CONTRACT_ADDRESS.toLowerCase()
            ) {
                throw new Error(
                    "Transaction receipt is invalid."
                );
            }

            const iface = contract.interface;

            const matchingEvents = receipt.logs
                .filter(log =>
                    log.address.toLowerCase() ===
                    CONTRACT_ADDRESS.toLowerCase()
                )
                .map(log => {
                    try {
                        return iface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .filter(event =>
                    event &&
                    event.name === "BatchAnchored" &&
                    event.args.batchId === batchId &&
                    event.args.merkleRoot.toLowerCase() ===
                        expectedRoot.toLowerCase() &&
                    event.args.totalRecords === expectedRecords
                );

            if (matchingEvents.length !== 1) {
                throw new Error(
                    "Matching BatchAnchored event not found."
                );
            }

            transactionHash = receipt.hash;
            blockNumber = receipt.blockNumber;
            gasUsed = receipt.gasUsed.toString();
        }
    }

    // 7. Jika hash tidak tersedia atau receipt belum ditemukan,
    // cari event BatchAnchored secara bertahap.
    if (!transactionHash) {
        const events = await findBatchEvents(
            contract,
            provider,
            batchId
        );

        const matching = events.filter(event =>
            event.args.merkleRoot.toLowerCase() ===
                expectedRoot.toLowerCase() &&
            event.args.totalRecords === expectedRecords
        );

        if (matching.length !== 1) {
            console.log(JSON.stringify({
                success: true,
                state: "anchored_hash_unavailable",
                batch_id: batchId.toString(),
                chain_id: network.chainId.toString(),
                warning:
                    "On-chain batch exists but its transaction event could not be uniquely identified.",
            }));

            return;
        }

        transactionHash = matching[0].transactionHash;
        blockNumber = matching[0].blockNumber;

        const receipt = await provider.getTransactionReceipt(
            transactionHash
        );

        if (
            !receipt ||
            receipt.status !== 1 ||
            receipt.to?.toLowerCase() !==
                CONTRACT_ADDRESS.toLowerCase()
        ) {
            throw new Error(
                "Anchoring event receipt is invalid or unavailable."
            );
        }

        gasUsed = receipt.gasUsed.toString();
    }

    // 8. Keluarkan hasil recovery.
    console.log(JSON.stringify({
        success: true,
        state: "confirmed",
        batch_id: batchId.toString(),
        transaction_hash: transactionHash,
        block_number: blockNumber,
        gas_used: gasUsed,
        contract_address: CONTRACT_ADDRESS,
        chain_id: network.chainId.toString(),
        verified: true,
    }));
}

main().catch(error => {
    console.error("[ERROR]", error.message);
    process.exitCode = 1;
});
