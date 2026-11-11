
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("ChainShieldRegistry", async function () {

  const { ethers } = await network.connect();

  async function deployContract() {
    const registry = await ethers.deployContract(
      "ChainShieldRegistry"
    );

    await registry.waitForDeployment();

    return registry;
  }

  it("Should set deployer as owner", async function () {
    const registry = await deployContract();
    const [owner] = await ethers.getSigners();

    assert.equal(
      await registry.owner(),
      owner.address
    );
  });

  it("Should allow owner to anchor an audit batch", async function () {
    const registry = await deployContract();

    const batchId = 1;
    const merkleRoot = ethers.keccak256(
      ethers.toUtf8Bytes("chainshield-batch-1")
    );
    const totalRecords = 2;

    await registry.anchorBatch(
      batchId,
      merkleRoot,
      totalRecords
    );

    const batch = await registry.auditBatches(batchId);

    assert.equal(batch.merkleRoot, merkleRoot);
    assert.equal(batch.totalRecords, BigInt(totalRecords));
  });

  it("Should reject non-owner anchoring", async function () {
    const registry = await deployContract();
    const [, attacker] = await ethers.getSigners();

    const merkleRoot = ethers.keccak256(
      ethers.toUtf8Bytes("unauthorized-batch")
    );

    await assert.rejects(
      registry.connect(attacker).anchorBatch(
        1,
        merkleRoot,
        2
      )
    );
  });

  it("Should reject duplicate batch IDs", async function () {
    const registry = await deployContract();

    const merkleRoot = ethers.keccak256(
      ethers.toUtf8Bytes("chainshield-batch-1")
    );

    await registry.anchorBatch(1, merkleRoot, 2);

    await assert.rejects(
      registry.anchorBatch(1, merkleRoot, 2)
    );
  });

  it("Should verify the correct Merkle Root", async function () {
    const registry = await deployContract();

    const merkleRoot = ethers.keccak256(
      ethers.toUtf8Bytes("chainshield-batch-1")
    );

    await registry.anchorBatch(1, merkleRoot, 2);

    assert.equal(
      await registry.verifyBatch(1, merkleRoot),
      true
    );
  });

  it("Should reject an incorrect Merkle Root", async function () {
    const registry = await deployContract();

    const correctRoot = ethers.keccak256(
      ethers.toUtf8Bytes("correct-root")
    );

    const incorrectRoot = ethers.keccak256(
      ethers.toUtf8Bytes("incorrect-root")
    );

    await registry.anchorBatch(1, correctRoot, 2);

    assert.equal(
      await registry.verifyBatch(1, incorrectRoot),
      false
    );
  });

});
