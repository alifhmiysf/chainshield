
import { network } from "hardhat";

const { ethers } = await network.connect();

const contractAddress =
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const registry = await ethers.getContractAt(
  "ChainShieldRegistry",
  contractAddress
);

const batchId = 1;

const merkleRoot =
  "0xe7de35856fd93efc22eb41883364e61efdf9f71b80cf4ac3313f91e004fd654c";

const totalRecords = 2;

console.log("Anchoring Audit Batch #1...");

const tx = await registry.anchorBatch(
  batchId,
  merkleRoot,
  totalRecords
);

console.log("Transaction Hash:", tx.hash);

await tx.wait();

console.log("Batch successfully anchored!");

const result = await registry.auditBatches(batchId);

console.log("Merkle Root:", result.merkleRoot);
console.log("Total Records:", result.totalRecords.toString());
console.log("Submitter:", result.submitter);
