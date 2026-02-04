// Contract configuration
// Factory contract for creating prediction markets

import deployedContracts from './deployed-contracts.json';
import PredictionMarketFactoryABI from './abis/PredictionMarketFactory.abi.json';
import FakeUSDCABI from './abis/FakeUSDC.abi.json';

export const SEPOLIA_CHAIN_ID = 11155111;

export const contracts = {
  factory: {
    address: deployedContracts.contracts.PredictionMarketFactory.address as `0x${string}`,
    abi: PredictionMarketFactoryABI,
  },
  priceFeed: {
    address: deployedContracts.contracts.ChainlinkPriceFeed.address as `0x${string}`,
    pair: deployedContracts.contracts.ChainlinkPriceFeed.pair,
  },
  fakeUsdc: {
    address: "0xd4B33626446507C2464671155334ee702502BC71" as `0x${string}`,
    abi: FakeUSDCABI,
  }
} as const;

export const deploymentInfo = {
  network: deployedContracts.network,
  chainId: deployedContracts.chainId,
  deployedAt: deployedContracts.deployedAt,
} as const;
