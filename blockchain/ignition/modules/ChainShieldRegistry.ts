
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChainShieldRegistryModule = buildModule(
  "ChainShieldRegistryModule",
  (m) => {
    const registry = m.contract("ChainShieldRegistry");

    return { registry };
  }
);

export default ChainShieldRegistryModule;
