# Predicta Smart Contracts

Solidity smart contracts for the Predicta BTC prediction market platform, built with Foundry.

## Quick Start

### 1. Install Dependencies

```bash
forge install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run Tests

```bash
forge test
```

### 4. Deploy to Sepolia

Deploy contracts and automatically export addresses for frontend:

```bash
./script/deploy-and-export.sh
```

This will:
- ✅ Deploy PredictionMarketFactory with Chainlink BTC/USD oracle
- ✅ Export contract addresses to `../src/config/deployed-contracts.json`
- ✅ Export ABIs to `../src/config/abis/`
- ✅ Ready to create markets from your frontend or CLI

## Contract Architecture

### PredictionMarketFactory
Factory contract that deploys BTC prediction markets using CREATE2 for deterministic addresses.
- Creates unlimited prediction markets
- Tracks all markets for easy discovery
- Provides query functions (active markets, tradable markets, etc.)

### BTCPredictionMarket
Individual binary prediction markets for BTC price targets.
- Users lock ETH and receive YES or NO tokens (1:1 ratio)
- Integrates with Chainlink Price Feeds for decentralized oracle
- Permissionless resolution after expiry
- Winners split entire ETH pool proportionally

### PredictionToken
ERC20 tokens (OpenZeppelin) representing YES/NO positions.
- Fully transferable and tradable
- Can be listed on DEXs
- Redeemable for ETH after market resolution

## Development

### Run Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-path test/BTCPredictionMarket.t.sol

# Check coverage
forge coverage

# Gas report
forge test --gas-report
```

### Manual Deployment

```bash
forge script script/DeployFactory.s.sol:DeployFactory \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvv
```

### Export ABIs Manually

```bash
forge inspect PredictionMarketFactory abi > factory-abi.json
forge inspect BTCPredictionMarket abi > market-abi.json
forge inspect PredictionToken abi > token-abi.json
```

## Deployed Contracts

After running `deploy-and-export.sh`, find deployed addresses in:
- JSON: `../src/config/deployed-contracts.json`
- TypeScript: `../src/config/contracts.ts`

## Frontend Integration

Import the auto-generated config:

```typescript
import { contracts } from '@/config/contracts';

// Use with wagmi/viem
const { data } = useReadContract({
  address: contracts.factory.address,
  abi: contracts.factory.abi,
  functionName: 'getMarketCount',
});
```

## Documentation

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Security

⚠️ **These contracts are for educational/testnet purposes**
- Professional audit required before mainnet deployment
- Consider additional security measures (pause, timelock, etc.)
- Test thoroughly on testnet first

## Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
