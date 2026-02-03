# Smart Contract Deployment Guide

This guide walks you through deploying the Predicta smart contracts to Sepolia testnet using Foundry.

## Contract Overview

This project includes two types of prediction market contracts:

### 1. **PredictionMarket** (Simple)
A basic prediction market where users can bet on binary outcomes and claim proportional winnings.

### 2. **BTC Prediction Market System** (Token-Based with Factory Pattern)
A sophisticated system for Bitcoin price predictions:
- **PredictionMarketFactory**: Factory contract using CREATE2 for deterministic market creation
- **BTCPredictionMarket**: Individual markets where users lock ETH and receive YES/NO tokens
- **PredictionToken**: ERC20 tokens representing YES/NO positions that can be traded
- Users can redeem winning tokens for ETH after market resolution

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
  - [Deploy Simple PredictionMarket](#deploy-simple-predictionmarket)
  - [Deploy BTC Prediction Factory](#deploy-btc-prediction-factory)
- [Contract Verification](#contract-verification)
- [Interacting with Contracts](#interacting-with-contracts)
  - [BTC Prediction Market](#btc-prediction-market)
  - [Simple Prediction Market](#simple-prediction-market)

## Prerequisites

Before you begin, ensure you have:

1. **Foundry installed**: If not, install it:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Sepolia ETH**: Get test ETH from a faucet:
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

3. **RPC URL**: Get a free RPC endpoint from:
   - [Alchemy](https://www.alchemy.com/)
   - [Infura](https://www.infura.io/)

4. **Etherscan API Key**: Get one from [Etherscan](https://etherscan.io/apis)

## Installation

Navigate to the contracts directory:

```bash
cd contracts
```

Install dependencies:

```bash
forge install
```

## Configuration

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your credentials:
   ```bash
   # Your wallet private key (without 0x prefix)
   PRIVATE_KEY=your_private_key_here

   # Sepolia RPC URL
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key_here

   # Etherscan API key for verification
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

   > ⚠️ **Security Warning**: Never commit your `.env` file or share your private key!

3. **Load environment variables**:
   ```bash
   source .env
   ```

## Testing

Run the test suite to ensure everything works:

```bash
forge test
```

Run specific test file:

```bash
forge test --match-path test/BTCPredictionMarket.t.sol -vvv
```

Check test coverage:

```bash
forge coverage
```

Run tests with gas reporting:

```bash
forge test --gas-report
```

## Deployment

### Deploy Simple PredictionMarket

Deploy the basic prediction market contract:

```bash
forge script script/DeployPredictionMarket.s.sol:DeployPredictionMarket \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

### Deploy BTC Prediction Factory

Deploy the factory and an example BTC prediction market:

```bash
forge script script/DeployFactory.s.sol:DeployFactory \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

This will deploy:
1. The PredictionMarketFactory contract

**Save the deployed addresses** from the output:
```
PredictionMarketFactory deployed to: 0x...
Price Feed: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
```

### Deploy and Export for Frontend (Recommended)

For easier frontend integration, use the automated deployment script that exports contract addresses and ABIs:

```bash
./script/deploy-and-export.sh
```

This script will:
1. Deploy the PredictionMarketFactory contract
2. Extract contract addresses from deployment output
3. Export addresses to `../src/config/deployed-contracts.json`
4. Export ABIs to `../src/config/abis/` directory
5. Works with the TypeScript config file at `../src/config/contracts.ts`

**Output structure:**

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "2024-01-01T00:00:00Z",
  "contracts": {
    "PredictionMarketFactory": {
      "address": "0x...",
      "abi": "abis/PredictionMarketFactory.json"
    },
    "ChainlinkPriceFeed": {
      "address": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
      "pair": "BTC/USD"
    }
  }
}
```

**Frontend usage:**

```typescript
// Import the auto-generated config
import { contracts } from '@/config/contracts';

// Use with wagmi/viem
const { data } = useReadContract({
  address: contracts.factory.address,
  abi: contracts.factory.abi,
  functionName: 'getMarketCount',
});
```

**Note:** If you encounter a 401 authentication error during verification:
- Deploy without the `--verify` flag first
- Verify contracts manually after deployment (see Contract Verification section below)
- Or ensure your `ETHERSCAN_API_KEY` is correctly set in `.env`

## Contract Verification

If automatic verification fails, verify manually:

**For Factory:**
```bash
forge verify-contract \
  <FACTORY_ADDRESS> \
  src/PredictionMarketFactory.sol:PredictionMarketFactory \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**For Market:**
```bash
forge verify-contract \
  <MARKET_ADDRESS> \
  src/BTCPredictionMarket.sol:BTCPredictionMarket \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(uint256,uint256,address,string)" 10000000000000 1735689600 <RESOLVER_ADDRESS> "BTC-100K-2027")
```

## Interacting with Contracts

### BTC Prediction Market

#### 1. Create a New Market

```bash
cast send <FACTORY_ADDRESS> \
  "createSimpleMarket(uint256,uint256,address,string)" \
  10000000000000 \
  1735689600 \
  <RESOLVER_ADDRESS> \
  "BTC-100K-2027" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

Parameters:
- `targetPrice`: BTC price in smallest unit (e.g., 10000000000000 = $100k with 8 decimals)
- `resolutionTime`: Unix timestamp when market can be resolved
- `resolver`: Address that can resolve the market (typically your address)
- `marketName`: Human-readable market name

#### 2. Mint YES Tokens (Bet BTC will be >= target)

```bash
cast send <MARKET_ADDRESS> \
  "mintYes()" \
  --value 0.1ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

#### 3. Mint NO Tokens (Bet BTC will be < target)

```bash
cast send <MARKET_ADDRESS> \
  "mintNo()" \
  --value 0.1ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

#### 4. Check Your Token Balance

```bash
# Get YES token address
cast call <MARKET_ADDRESS> "yesToken()" --rpc-url $SEPOLIA_RPC_URL

# Check YES token balance
cast call <YES_TOKEN_ADDRESS> \
  "balanceOf(address)" \
  <YOUR_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL
```

#### 5. Transfer Tokens (Trade Positions)

```bash
cast send <YES_TOKEN_ADDRESS> \
  "transfer(address,uint256)" \
  <RECIPIENT_ADDRESS> \
  100000000000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

#### 6. Get Market Information

```bash
cast call <MARKET_ADDRESS> \
  "getMarketInfo()" \
  --rpc-url $SEPOLIA_RPC_URL
```

#### 7. Check Current Odds

```bash
cast call <MARKET_ADDRESS> \
  "getCurrentOdds()" \
  --rpc-url $SEPOLIA_RPC_URL
```

Returns odds as basis points (e.g., 6000 = 60%)

#### 8. Resolve Market (After Resolution Time)

```bash
cast send <MARKET_ADDRESS> \
  "resolve(uint256)" \
  10500000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

Parameter is the actual BTC price at resolution time.

#### 9. Calculate Your Potential Payout

```bash
cast call <MARKET_ADDRESS> \
  "calculatePayout(address)" \
  <YOUR_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL
```

#### 10. Redeem Winning Tokens

```bash
cast send <MARKET_ADDRESS> \
  "redeem()" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Factory Functions

**Get all markets:**
```bash
cast call <FACTORY_ADDRESS> \
  "getMarketCount()" \
  --rpc-url $SEPOLIA_RPC_URL
```

**Get active markets:**
```bash
cast call <FACTORY_ADDRESS> \
  "getActiveMarkets()" \
  --rpc-url $SEPOLIA_RPC_URL
```

**Get tradable markets:**
```bash
cast call <FACTORY_ADDRESS> \
  "getTradableMarkets()" \
  --rpc-url $SEPOLIA_RPC_URL
```

**Compute market address before deployment:**
```bash
cast call <FACTORY_ADDRESS> \
  "computeMarketAddress(uint256,uint256,address,string,bytes32)" \
  10000000000000 \
  1735689600 \
  <RESOLVER_ADDRESS> \
  "BTC-100K-2027" \
  0x1234... \
  --rpc-url $SEPOLIA_RPC_URL
```

### Simple Prediction Market

See the original guide sections for interacting with the basic PredictionMarket contract.

## Frontend Integration

### Automated Export (Recommended)

Use the `deploy-and-export.sh` script for automatic frontend integration:

```bash
cd contracts
./script/deploy-and-export.sh
```

This automatically creates:
- `../src/config/deployed-contracts.json` - Contract addresses and metadata
- `../src/config/contracts.ts` - TypeScript configuration with type safety
- `../src/config/abis/` - All contract ABIs

Then in your frontend:

```typescript
import { contracts, deploymentInfo } from '@/config/contracts';

// Factory address is ready to use
console.log(contracts.factory.address);

// Create markets using the factory
const { write: createMarket } = useWriteContract({
  address: contracts.factory.address,
  abi: contracts.factory.abi,
  functionName: 'createSimpleMarket',
});
```

### Manual Configuration

Alternatively, manually configure your frontend:

```typescript
// contracts/config.ts
export const PREDICTION_FACTORY_ADDRESS = '0x...' as const;
export const EXAMPLE_MARKET_ADDRESS = '0x...' as const;

// Get ABIs from compiled contracts
export const FACTORY_ABI = [
  // Copy from out/PredictionMarketFactory.sol/PredictionMarketFactory.json
] as const;

export const MARKET_ABI = [
  // Copy from out/BTCPredictionMarket.sol/BTCPredictionMarket.json
] as const;

export const TOKEN_ABI = [
  // Copy from out/PredictionToken.sol/PredictionToken.json
] as const;
```

To manually extract the ABIs:

```bash
forge inspect PredictionMarketFactory abi > factory-abi.json
forge inspect BTCPredictionMarket abi > market-abi.json
forge inspect PredictionToken abi > token-abi.json
```

## Example Frontend Integration (wagmi + viem)

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

// Read market info
const { data: marketInfo } = useReadContract({
  address: MARKET_ADDRESS,
  abi: MARKET_ABI,
  functionName: 'getMarketInfo',
});

// Mint YES tokens
const { writeContract } = useWriteContract();

const mintYes = async () => {
  await writeContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: 'mintYes',
    value: parseEther('0.1'),
  });
};

// Check YES token balance
const { data: yesTokenAddress } = useReadContract({
  address: MARKET_ADDRESS,
  abi: MARKET_ABI,
  functionName: 'yesToken',
});

const { data: balance } = useReadContract({
  address: yesTokenAddress,
  abi: TOKEN_ABI,
  functionName: 'balanceOf',
  args: [userAddress],
});
```

## Architecture Explanation

### Token-Based System Flow

1. **User locks ETH**: Calls `mintYes()` or `mintNo()` with ETH
2. **Receives tokens**: Gets 1:1 ERC20 tokens (YES or NO)
3. **Can trade**: Tokens are transferable, can trade positions
4. **Market resolves**: Resolver provides actual BTC price
5. **Winners redeem**: Users with winning tokens call `redeem()`
6. **Proportional payout**: Winners split entire ETH pool proportionally

### Why Factory Pattern?

- **Scalability**: Create unlimited markets with one factory
- **Gas efficiency**: CREATE2 allows deterministic addresses
- **Discovery**: Easy to query all markets from factory
- **Upgradability**: Can deploy new market versions

### Why ERC20 Tokens?

- **Tradability**: Users can trade positions before resolution
- **Composability**: Tokens can integrate with DEXs, other DeFi
- **Transparency**: Clear on-chain positions
- **Flexibility**: Users can partially exit positions

## Useful Commands

**Check wallet balance:**
```bash
cast balance <YOUR_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
```

**Get transaction receipt:**
```bash
cast receipt <TX_HASH> --rpc-url $SEPOLIA_RPC_URL
```

**Estimate gas:**
```bash
cast estimate <CONTRACT_ADDRESS> \
  "mintYes()" \
  --value 0.1ether \
  --rpc-url $SEPOLIA_RPC_URL
```

**Decode transaction data:**
```bash
cast 4byte-decode <TX_DATA>
```

## Troubleshooting

### Issue: "Market trading has ended"
- **Solution**: Cannot mint new tokens after resolution time. Wait for next market or create a new one.

### Issue: "No winning tokens to redeem"
- **Solution**: You either have no tokens, they're losing tokens, or you already redeemed.

### Issue: "Only resolver can call"
- **Solution**: Only the designated resolver address can resolve markets.

### Issue: "Insufficient funds"
- **Solution**: Get more Sepolia ETH from a faucet.

## Security Considerations

⚠️ **Important Security Notes:**

1. **Oracle risk**: This implementation relies on a trusted resolver for BTC price
2. **Consider using Chainlink**: For production, integrate Chainlink Price Feeds
3. **Test thoroughly**: Always test on testnet before mainnet
4. **Audit contracts**: Get professional audits for production
5. **Time delays**: Consider adding time delays for resolution
6. **Emergency controls**: Consider adding pause functionality
7. **Front-running**: Be aware of MEV risks with token minting

## Production Checklist

Before mainnet deployment:

- [ ] Replace manual resolver with Chainlink oracle
- [ ] Add comprehensive access controls
- [ ] Implement pause functionality
- [ ] Add re-entrancy guards (OpenZeppelin)
- [ ] Professional security audit
- [ ] Extensive testing with edge cases
- [ ] Gas optimization
- [ ] Add events for all state changes
- [ ] Consider proxy patterns for upgradability
- [ ] Set appropriate fees/treasury

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Foundry GitHub](https://github.com/foundry-rs/foundry)
- [Sepolia Testnet Info](https://sepolia.dev/)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Next Steps

1. Deploy factory and create your first market
2. Test minting YES/NO tokens
3. Test token transfers
4. Resolve market after resolution time
5. Test redemption
6. Integrate with frontend
7. Build trading UI
8. Add Chainlink integration for production

For more help, check the main [README.md](../README.md).
