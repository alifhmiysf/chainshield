
import { network } from "hardhat";

const { ethers } = await network.connect();

const contractAddress =
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const registry = await ethers.getContractAt(
  "ChainShieldRegistry",
  contractAddress
);

console.log("=== ChainShield Local Verification ===");

const owner = await registry.owner();
console.log("Contract Owner:", owner);

const batch = await registry.auditBatches(1);

console.log("Batch 1:");
console.log("Merkle Root:", batch.merkleRoot);
console.log("Timestamp:", batch.timestamp.toString());
console.log("Total Records:", batch.totalRecords.toString());
console.log("Submitter:", batch.submitter);
