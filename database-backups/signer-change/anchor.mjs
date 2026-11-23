import {
    JsonRpcProvider,
    Wallet,
    Contract,
    isHexString,
} from "ethers";

const RPC_URL = process.env.CHAINSHIELD_RPC_URL;
const PRIVATE_KEY = process.env.CHAINSHIELD_PRIVATE_KEY;
const CHAIN_ID_VALUE = process.env.CHAINSHIELD_CHAIN_ID;
const CONTRACT_ADDRESS = process.env.CHAINSHIELD_CONTRACT_ADDRESS;

const EXPECTED_CHAIN_ID = BigInt(CHAIN_ID_VALUE || "0");

const ABI = [
    "function owner() view returns (address)",
    "function auditBatches(uint256) view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords, address submitter)",
    "function anchorBatch(uint256,bytes32,uint256)",
    "function verifyBatch(uint256,bytes32) view returns (bool)",
    "event BatchAnchored(uint256 indexed batchId,bytes32 merkleRoot,uint256 totalRecords,address indexed submitter,uint256 timestamp)",
];

async function main() {
    // 1. Validasi environment.
    if (!RPC_URL) {
        throw new Error("Blockchain RPC URL is unavailable.");
    }

    if (EXPECTED_CHAIN_ID <= 0n) {
        throw new Error("Blockchain chain ID is unavailable or invalid.");
    }

    if (!CONTRACT_ADDRESS || !/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
        throw new Error("Blockchain contract address is unavailable or invalid.");
    }

    if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
        throw new Error("Blockchain private key is unavailable or invalid.");
    }

    // 2. Validasi parameter dari Laravel.
    const [batchIdArg, rootArg, totalRecordsArg] =
        process.argv.slice(2);

    if (!batchIdArg || !rootArg || !totalRecordsArg) {
        throw new Error("Missing batch ID, Merkle Root, or total records.");
    }

    if (!/^[1-9]\d*$/.test(batchIdArg)) {
        throw new Error("Invalid batch ID.");
    }

    if (!/^[1-9]\d*$/.test(totalRecordsArg)) {
        throw new Error("Invalid total records.");
    }

    const batchId = BigInt(batchIdArg);
    const totalRecords = BigInt(totalRecordsArg);

    const merkleRoot = rootArg.startsWith("0x")
        ? rootArg
        : `0x${rootArg}`;

    if (!isHexString(merkleRoot, 32)) {
        throw new Error("Invalid Merkle Root. Expected 32 bytes.");
    }

    // 3. Koneksi ke Sepolia.
    const provider = new JsonRpcProvider(RPC_URL);

    try {
        const network = await provider.getNetwork();

        if (network.chainId !== EXPECTED_CHAIN_ID) {
            throw new Error(
                `Unexpected network. Expected ${EXPECTED_CHAIN_ID}, received ${network.chainId}.`
            );
        }

        // 4. Pastikan smart contract tersedia.
        const contractCode = await provider.getCode(CONTRACT_ADDRESS);

        if (!contractCode || contractCode === "0x") {
            throw new Error("Smart contract not found at configured address.");
        }

        // 5. Buat signer.
        const signer = new Wallet(PRIVATE_KEY, provider);
        const signerAddress = await signer.getAddress();

        const contract = new Contract(
            CONTRACT_ADDRESS,
            ABI,
            signer
        );

        // 6. Pastikan signer merupakan owner kontrak.
        const owner = await contract.owner();

        if (signerAddress.toLowerCase() !== owner.toLowerCase()) {
            throw new Error(
                `Signer is not contract owner. Signer: ${signerAddress}, Owner: ${owner}.`
            );
        }

        // 7. Pastikan batch belum pernah di-anchor.
        const existingBatch = await contract.auditBatches(batchId);

        if (existingBatch.timestamp !== 0n) {
            throw new Error("Batch has already been anchored.");
        }

        // 8. Mode precheck: hanya membaca blockchain.
        if (process.env.CHAINSHIELD_PRECHECK === "1") {
            console.log("PRECHECK_OK");
            console.log("Batch ID:", batchId.toString());
            console.log("Merkle Root:", merkleRoot);
            console.log("Total Records:", totalRecords.toString());
            console.log("Signer:", signerAddress);
            console.log("Owner:", owner);
            console.log("Chain ID:", network.chainId.toString());

            return;
        }

        // 9. Estimasi gas.
        console.error("[DEBUG] Starting gas estimation.");

        const gasEstimate = await contract.anchorBatch.estimateGas(
            batchId,
            merkleRoot,
            totalRecords
        );

        console.error("[DEBUG] Gas estimation successful.");
        console.error("[DEBUG] Estimated gas:", gasEstimate.toString());

        if (process.env.CHAINSHIELD_GAS_CHECK === "1") {
            console.log("GAS_CHECK_OK");
            console.log("Batch ID:", batchId.toString());
            console.log("Estimated Gas:", gasEstimate.toString());
            console.log("Signer:", signerAddress);

            return;
        }

        // 10. Mode signing: tidak melakukan broadcast.
        if (process.env.CHAINSHIELD_SIGN_CHECK === "1") {
            const unsignedTx =
                await contract.anchorBatch.populateTransaction(
                    batchId,
                    merkleRoot,
                    totalRecords
                );

            const populatedTx = await signer.populateTransaction({
                ...unsignedTx,
                gasLimit: gasEstimate,
            });

            const signedTx =
                await signer.signTransaction(populatedTx);

            console.log("SIGN_CHECK_OK");
            console.log("Batch ID:", batchId.toString());
            console.log("Signed transaction length:", signedTx.length);
            console.log("Broadcast:", false);

            return;
        }

        // 11. Kirim transaksi.
        console.error("[DEBUG] Starting transaction submission.");

        const tx = await contract.anchorBatch(
            batchId,
            merkleRoot,
            totalRecords
        );

        console.error("[DEBUG] Transaction submitted.");
        console.error("[DEBUG] Transaction hash:", tx.hash);

        // Kirim hash transaksi ke Laravel.
        process.stdout.write(
            JSON.stringify({
                event: "transaction_submitted",
                batch_id: batchId.toString(),
                transaction_hash: tx.hash,
                contract_address: CONTRACT_ADDRESS,
                chain_id: network.chainId.toString(),
            }) + "\n"
        );

        // 12. Tunggu konfirmasi.
        const receipt = await tx.wait();

        if (!receipt || receipt.status !== 1) {
            throw new Error("Blockchain transaction failed.");
        }

        // 13. Verifikasi hasil anchoring.
        const verified = await contract.verifyBatch(
            batchId,
            merkleRoot
        );

        if (!verified) {
            throw new Error("On-chain verification failed.");
        }

        console.log(JSON.stringify({
            success: true,
            batch_id: batchId.toString(),
            transaction_hash: receipt.hash,
            block_number: receipt.blockNumber,
            gas_used: receipt.gasUsed.toString(),
            contract_address: CONTRACT_ADDRESS,
            chain_id: network.chainId.toString(),
            submitter: signerAddress,
            status: "confirmed",
            verified: true,
        }));

    } finally {
        provider.destroy();
    }
}

main().catch((error) => {
    console.error("[ERROR]", error.shortMessage || error.message);
    process.exitCode = 1;
});
