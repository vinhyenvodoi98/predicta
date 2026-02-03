#!/bin/bash

# Deploy contracts and export addresses to JSON file for frontend

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Load environment variables
source .env

# Build contracts first
echo -e "${BLUE}Building contracts...${NC}"
forge build
echo -e "${GREEN}✓ Contracts built${NC}"

# Run the deployment script and capture output
DEPLOY_OUTPUT=$(forge script script/DeployFactory.s.sol:DeployFactory \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvv 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract addresses from the output
FACTORY_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "PredictionMarketFactory deployed to:" | awk '{print $NF}')
PRICE_FEED=$(echo "$DEPLOY_OUTPUT" | grep "Price Feed:" | awk '{print $NF}')

# Verify addresses were extracted
if [ -z "$FACTORY_ADDRESS" ]; then
    echo "Error: Failed to extract factory address from deployment output"
    exit 1
fi

echo -e "${GREEN}✓ Deployment successful!${NC}"
echo "Factory Address: $FACTORY_ADDRESS"
echo "Price Feed: $PRICE_FEED"

# Create src directory if it doesn't exist
mkdir -p ../src/config

# Create JSON file with deployed addresses
cat > ../src/config/deployed-contracts.json << EOF
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {
    "PredictionMarketFactory": {
      "address": "$FACTORY_ADDRESS",
      "abi": "abis/PredictionMarketFactory.json"
    },
    "ChainlinkPriceFeed": {
      "address": "$PRICE_FEED",
      "pair": "BTC/USD"
    }
  }
}
EOF

echo -e "${GREEN}✓ Contract addresses exported to ../src/config/deployed-contracts.json${NC}"

# Also export ABIs
echo -e "${BLUE}Exporting ABIs...${NC}"
mkdir -p ../src/config/abis

# Export Factory ABI
cat out/PredictionMarketFactory.sol/PredictionMarketFactory.json | jq '.abi' > ../src/config/abis/PredictionMarketFactory.abi.json
echo -e "${GREEN}✓ Exported PredictionMarketFactory ABI${NC}"

# Export Market ABI (for reference when creating markets)
cat out/BTCPredictionMarket.sol/BTCPredictionMarket.json | jq '.abi' > ../src/config/abis/BTCPredictionMarket.abi.json
echo -e "${GREEN}✓ Exported BTCPredictionMarket ABI${NC}"

# Export Token ABI (for reference when interacting with tokens)
cat out/PredictionToken.sol/PredictionToken.json | jq '.abi' > ../src/config/abis/PredictionToken.abi.json
echo -e "${GREEN}✓ Exported PredictionToken ABI${NC}"

echo -e "${GREEN}✓ All done! Frontend can now import from:${NC}"
echo "  - Contract addresses: src/config/deployed-contracts.json"
echo "  - ABIs: src/config/abis/*.abi.json"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  - Create markets using the factory contract"
echo "  - Update your frontend to use: import { contracts } from '@/config/contracts'"
