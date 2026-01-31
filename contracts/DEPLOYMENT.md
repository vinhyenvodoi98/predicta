# Smart Contract Deployment Guide

This guide walks you through deploying the PredictionMarket smart contract to Sepolia testnet using Foundry.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contract Verification](#contract-verification)
- [Interacting with the Contract](#interacting-with-the-contract)

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

Run the test suite to ensure everything works correctly:

```bash
forge test
```

Run tests with verbosity to see detailed output:

```bash
forge test -vvv
```

Run specific test:

```bash
forge test --match-test testCreateMarket -vvv
```

Check test coverage:

```bash
forge coverage
```

## Deployment

### 1. Compile Contracts

```bash
forge build
```

### 2. Deploy to Sepolia

Deploy the PredictionMarket contract:

```bash
forge script script/DeployPredictionMarket.s.sol:DeployPredictionMarket \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

**Flags explanation:**
- `--rpc-url`: RPC endpoint for Sepolia
- `--private-key`: Your wallet private key
- `--broadcast`: Actually send the transaction (omit for dry run)
- `--verify`: Automatically verify on Etherscan
- `-vvvv`: Verbose output

### 3. Dry Run (Simulation)

Test deployment without broadcasting:

```bash
forge script script/DeployPredictionMarket.s.sol:DeployPredictionMarket \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 4. Save Deployment Address

After deployment, the contract address will be displayed in the output. Save it for later use:

```
PredictionMarket deployed to: 0x...
```

## Contract Verification

If automatic verification fails, verify manually:

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/PredictionMarket.sol:PredictionMarket \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Check verification status on [Sepolia Etherscan](https://sepolia.etherscan.io/).

## Interacting with the Contract

### Using Cast (Foundry CLI)

1. **Create a market**:
   ```bash
   cast send <CONTRACT_ADDRESS> \
     "createMarket(string,uint256)" \
     "Will ETH reach $10k by 2026?" 604800 \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

2. **Place a prediction** (send 0.1 ETH on "Yes"):
   ```bash
   cast send <CONTRACT_ADDRESS> \
     "predict(uint256,bool)" 0 true \
     --value 0.1ether \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

3. **Get market details**:
   ```bash
   cast call <CONTRACT_ADDRESS> \
     "getMarket(uint256)" 0 \
     --rpc-url $SEPOLIA_RPC_URL
   ```

4. **Get market count**:
   ```bash
   cast call <CONTRACT_ADDRESS> \
     "getMarketCount()" \
     --rpc-url $SEPOLIA_RPC_URL
   ```

5. **Resolve a market** (after end time):
   ```bash
   cast send <CONTRACT_ADDRESS> \
     "resolveMarket(uint256,bool)" 0 true \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

6. **Claim winnings**:
   ```bash
   cast send <CONTRACT_ADDRESS> \
     "claim(uint256)" 0 \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

### Using Etherscan

Once verified, you can interact with your contract directly on Etherscan:

1. Go to your contract on [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Click on the "Contract" tab
3. Click on "Write Contract"
4. Connect your wallet
5. Call contract functions directly from the UI

## Frontend Integration

After deployment, update your frontend configuration in [src/wagmi.ts](../src/wagmi.ts) or similar:

```typescript
export const PREDICTION_MARKET_ADDRESS = '0x...' as const;

export const PREDICTION_MARKET_ABI = [
  // Copy ABI from contracts/out/PredictionMarket.sol/PredictionMarket.json
] as const;
```

To get the ABI:

```bash
cat out/PredictionMarket.sol/PredictionMarket.json | jq .abi
```

## Useful Commands

**Check wallet balance:**
```bash
cast balance <YOUR_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
```

**Get transaction receipt:**
```bash
cast receipt <TX_HASH> --rpc-url $SEPOLIA_RPC_URL
```

**Get gas price:**
```bash
cast gas-price --rpc-url $SEPOLIA_RPC_URL
```

**Estimate gas:**
```bash
cast estimate <CONTRACT_ADDRESS> \
  "createMarket(string,uint256)" \
  "Test Question" 86400 \
  --rpc-url $SEPOLIA_RPC_URL
```

## Troubleshooting

### Issue: "Nonce too low"
- **Solution**: Your transaction might be pending. Check pending transactions or wait a few minutes.

### Issue: "Insufficient funds"
- **Solution**: Get more Sepolia ETH from a faucet.

### Issue: "Contract verification failed"
- **Solution**: Verify manually using the command in the [Contract Verification](#contract-verification) section.

### Issue: "RPC URL not responding"
- **Solution**: Check your RPC URL is correct and the service is operational.

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Foundry GitHub](https://github.com/foundry-rs/foundry)
- [Sepolia Testnet Info](https://sepolia.dev/)
- [Alchemy Docs](https://docs.alchemy.com/)
- [Etherscan API Docs](https://docs.etherscan.io/)

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit private keys** to version control
2. **Use a test wallet** for testnet deployments
3. **Audit contracts** before mainnet deployment
4. **Test thoroughly** on testnet before mainnet
5. **Consider using a hardware wallet** for mainnet deployments
6. **Implement access controls** for production contracts
7. **Get professional audits** for production contracts handling real funds

## Next Steps

1. Deploy your contract to Sepolia
2. Verify the contract on Etherscan
3. Test all functions using Cast or Etherscan
4. Integrate the contract address and ABI into your frontend
5. Build the UI to interact with your prediction market

For frontend integration examples, check the main [README.md](../README.md).
