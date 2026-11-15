import {
    JsonRpcProvider,
    Wallet,
    Contract,
    isHexString,
} from "ethers";

const RPC_URL =
    "https://ethereum-sepolia-rpc.publicnode.com";

const EXPECTED_CHAIN_ID = 11155111n;

const CONTRACT_ADDRESS =
    "0xe9D974Bac52aa0F96E8AD9c254B8F47B69C105E4";

const ABI = [
    "function owner() view returns (address)",
    "function auditBatches(uint256) view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords, address submitter)",
    "function anchorBatch(uint256,bytes32,uint256)",
    "function verifyBatch(uint256,bytes32) view returns (bool)",
    "event BatchAnchored(uint256 indexed batchId,bytes32 merkleRoot,uint256 totalRecords,address indexed submitter,uint256 timestamp)",
];

async function main() {
    // 1. Ambil parameter dari Laravel.
    const [batchIdArg, rootArg, totalRecordsArg] =
        process.argv.slice(2);

    if (!batchIdArg || !rootArg || !totalRecordsArg) {
        throw new Error(
            "Missing batchId, merkleRoot, or totalRecords."
        );
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
        throw new Error("Invalid Merkle Root.");
    }

    // 2. Hubungkan ke Sepolia.
    const provider = new JsonRpcProvider(RPC_URL);

    const network = await provider.getNetwork();

    if (network.chainId !== EXPECTED_CHAIN_ID) {
        throw new Error("Unexpected blockchain network.");
    }

    // 3. Ambil private key dari environment variable.
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (
        !privateKey ||
        !/^0x[0-9a-fA-F]{64}$/.test(privateKey)
    ) {
        throw new Error(
            "Sepolia signer key is unavailable or invalid."
        );
    }

    // 4. Buat wallet signer.
    const signer = new Wallet(privateKey, provider);

    const signerAddress = await signer.getAddress();

    // 5. Hubungkan signer ke smart contract.
    const contract = new Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
    );

    const owner = await contract.owner();

    if (
        signerAddress.toLowerCase() !== owner.toLowerCase()
    ) {
        throw new Error(
            "Signer is not the contract owner."
        );
    }

    // 6. Pastikan batch belum pernah di-anchor.
    const existingBatch = await contract.auditBatches(batchId);

    if (existingBatch.timestamp !== 0n) {
        throw new Error("Batch has already been anchored.");
    }

    // 7. Mode precheck: tidak mengirim transaksi.
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

    // 8. Estimasi gas.
    console.error("[DEBUG] Starting gas estimation.");

    const gasEstimate = await contract.anchorBatch.estimateGas(
        batchId,
        merkleRoot,
        totalRecords
    );

    console.error("[DEBUG] Gas estimation successful.");
    console.error(
        "[DEBUG] Estimated gas:",
        gasEstimate.toString()
    );

    // Mode pemeriksaan gas: berhenti sebelum mengirim transaksi.
    if (process.env.CHAINSHIELD_GAS_CHECK === "1") {
        console.log("GAS_CHECK_OK");
        console.log("Batch ID:", batchId.toString());
        console.log("Estimated Gas:", gasEstimate.toString());
        console.log("Signer:", signerAddress);

        return;
    }

    // 9. Mode pemeriksaan signing: tidak melakukan broadcast.
    if (process.env.CHAINSHIELD_SIGN_CHECK === "1") {
        console.error("[DEBUG] Starting transaction preparation.");

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

        console.error(
            "[DEBUG] Transaction preparation successful."
        );

        const signedTx =
            await signer.signTransaction(populatedTx);

        console.error(
            "[DEBUG] Transaction signing successful."
        );

        console.log("SIGN_CHECK_OK");
        console.log("Batch ID:", batchId.toString());
        console.log("Signed transaction length:", signedTx.length);
        console.log("Broadcast:", false);

        return;
    }

    // 10. Kirim transaksi ke Sepolia.
    console.error("[DEBUG] Starting transaction submission.");

    const tx = await contract.anchorBatch(
        batchId,
        merkleRoot,
        totalRecords
    );

    console.error("[DEBUG] Transaction submitted.");
    console.error("[DEBUG] Transaction hash:", tx.hash);

    // Kirim hash ke Laravel segera setelah broadcast.
    // Laravel akan menyimpannya sebelum menunggu receipt.
    await new Promise((resolve, reject) => {
        process.stdout.write(
            JSON.stringify({
                event: "transaction_submitted",
                batch_id: batchId.toString(),
                transaction_hash: tx.hash,
                contract_address: CONTRACT_ADDRESS,
                chain_id: network.chainId.toString(),
            }) + "\n",
            (error) => error ? reject(error) : resolve()
        );
    });

    // 11. Tunggu konfirmasi blockchain.
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
        throw new Error("Blockchain transaction failed.");
    }

    // 12. Verifikasi hasil anchoring.
    const verified = await contract.verifyBatch(
        batchId,
        merkleRoot
    );

    if (!verified) {
        throw new Error("On-chain verification failed.");
    }

    // 13. Output hasil akhir untuk Laravel.
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
}

main().catch((error) => {
    console.error("[ERROR]", error.message);
    process.exitCode = 1;
});
