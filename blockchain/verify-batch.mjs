
import { JsonRpcProvider, Contract, Interface } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const EXPECTED_CHAIN_ID = 11155111n;

const CONTRACT_ADDRESS =
    "0xe9D974Bac52aa0F96E8AD9c254B8F47B69C105E4";

const BATCH_ID = 3n;

const EXPECTED_ROOT =
    "0x60046320373b8bf7432bdb7555b5bd667b0ab9027a8b80d3a6ec86a5a72d0922";

const EXPECTED_TOTAL_RECORDS = 1n;

const EXPECTED_TX_HASH =
    "0x2a8d2e97c040c4a645191cf3d8b7007ed59d8f6d30c764f81314d6797db7161d";

const EXPECTED_BLOCK_NUMBER = 12105530;

const EXPECTED_SUBMITTER =
    "0x6fAe563173A6C38EED6ac14Abc96A37a31A45ffd";

const EXPECTED_TIMESTAMP = 1794324600n;

const ABI = [
    "function owner() view returns (address)",
    "function auditBatches(uint256) view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords, address submitter)",
    "function verifyBatch(uint256,bytes32) view returns (bool)",
    "event BatchAnchored(uint256 indexed batchId,bytes32 merkleRoot,uint256 totalRecords,address indexed submitter,uint256 timestamp)"
];

async function main() {
    const provider = new JsonRpcProvider(RPC_URL);

    try {
        const network = await provider.getNetwork();

        console.log("=== NETWORK CHECK ===");
        console.log("Chain ID:", network.chainId.toString());

        if (network.chainId !== EXPECTED_CHAIN_ID) {
            throw new Error("Wrong blockchain network.");
        }

        const contract = new Contract(
            CONTRACT_ADDRESS,
            ABI,
            provider
        );

        const contractInterface = new Interface(ABI);

        console.log("\n=== TRANSACTION RECEIPT ===");

        const receipt = await provider.getTransactionReceipt(
            EXPECTED_TX_HASH
        );

        if (!receipt) {
            throw new Error("Transaction receipt not found.");
        }

        console.log("Transaction Hash:", receipt.hash);
        console.log("Block Number:", receipt.blockNumber);
        console.log("Status:", receipt.status);
        console.log("Gas Used:", receipt.gasUsed.toString());
        console.log("Contract Address:", receipt.to);
        console.log("Submitter:", receipt.from);

        const receiptValid =
            receipt.status === 1 &&
            receipt.hash.toLowerCase() === EXPECTED_TX_HASH.toLowerCase() &&
            receipt.blockNumber === EXPECTED_BLOCK_NUMBER &&
            receipt.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
            receipt.from.toLowerCase() === EXPECTED_SUBMITTER.toLowerCase();

        console.log(
            receiptValid ? "[PASS] Transaction receipt" : "[FAIL] Transaction receipt"
        );

        console.log("\n=== ON-CHAIN BATCH DATA ===");

        const batch = await contract.auditBatches(BATCH_ID);

        console.log("Batch ID:", BATCH_ID.toString());
        console.log("Merkle Root:", batch.merkleRoot);
        console.log("Timestamp:", batch.timestamp.toString());
        console.log("Total Records:", batch.totalRecords.toString());
        console.log("Submitter:", batch.submitter);

        const batchValid =
            batch.merkleRoot.toLowerCase() === EXPECTED_ROOT.toLowerCase() &&
            batch.timestamp === EXPECTED_TIMESTAMP &&
            batch.totalRecords === EXPECTED_TOTAL_RECORDS &&
            batch.submitter.toLowerCase() === EXPECTED_SUBMITTER.toLowerCase();

        console.log(
            batchValid ? "[PASS] On-chain batch data" : "[FAIL] On-chain batch data"
        );

        console.log("\n=== SMART CONTRACT VERIFICATION ===");

        const verified = await contract.verifyBatch(
            BATCH_ID,
            EXPECTED_ROOT
        );

        console.log("Merkle Root Verified:", verified);

        console.log(
            verified ? "[PASS] Smart contract verification" : "[FAIL] Smart contract verification"
        );

        console.log("\n=== BLOCKCHAIN EVENT VERIFICATION ===");

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
            event.args.batchId === BATCH_ID &&
            event.args.merkleRoot.toLowerCase() === EXPECTED_ROOT.toLowerCase() &&
            event.args.totalRecords === EXPECTED_TOTAL_RECORDS &&
            event.args.submitter.toLowerCase() === EXPECTED_SUBMITTER.toLowerCase() &&
            event.args.timestamp === EXPECTED_TIMESTAMP;

        console.log("BatchAnchored Events:", events.length);

        console.log(
            eventValid ? "[PASS] Blockchain event" : "[FAIL] Blockchain event"
        );

        console.log("\n=== FINAL RESULT ===");

        if (receiptValid && batchValid && verified && eventValid) {
            console.log("BLOCKCHAIN_VERIFICATION_SUCCESS");
        } else {
            console.log("BLOCKCHAIN_VERIFICATION_FAILED");
            process.exitCode = 1;
        }

    } catch (error) {
        console.error("\nBLOCKCHAIN_VERIFICATION_ERROR");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await provider.destroy();
    }
}

main();
