// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ChainShieldRegistry {

    struct AuditBatch {
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 totalRecords;
        address submitter;
    }

    address public owner;

    mapping(uint256 => AuditBatch) public auditBatches;

    event BatchAnchored(
        uint256 indexed batchId,
        bytes32 merkleRoot,
        uint256 totalRecords,
        address indexed submitter,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function anchorBatch(
        uint256 batchId,
        bytes32 merkleRoot,
        uint256 totalRecords
    ) external onlyOwner {

        require(batchId > 0, "Invalid batch ID");
        require(merkleRoot != bytes32(0), "Invalid Merkle Root");
        require(totalRecords > 0, "Invalid record count");
        require(
            auditBatches[batchId].timestamp == 0,
            "Batch already anchored"
        );

        auditBatches[batchId] = AuditBatch({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            totalRecords: totalRecords,
            submitter: msg.sender
        });

        emit BatchAnchored(
            batchId,
            merkleRoot,
            totalRecords,
            msg.sender,
            block.timestamp
        );
    }

    function verifyBatch(
        uint256 batchId,
        bytes32 merkleRoot
    ) external view returns (bool) {

        return auditBatches[batchId].merkleRoot == merkleRoot
            && auditBatches[batchId].timestamp != 0;
    }
}
