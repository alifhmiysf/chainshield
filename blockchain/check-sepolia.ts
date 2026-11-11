import { network } from "hardhat";
import { formatEther } from "ethers";

const connection = await network.connect("sepolia");
const ethers = connection.ethers;

const provider = ethers.provider;
const signers = await ethers.getSigners();
const wallet = signers[0];

const address = await wallet.getAddress();
const chain = await provider.getNetwork();
const balance = await provider.getBalance(address);

console.log("\n=== SEPOLIA CONNECTION ===");
console.log("Chain ID:", chain.chainId.toString());
console.log("Wallet:", address);
console.log("Balance:", formatEther(balance), "ETH");

if (chain.chainId !== 11155111n) {
    throw new Error("Wrong network! Expected Ethereum Sepolia.");
}

console.log("\nNETWORK_CHECK_SUCCESS");
