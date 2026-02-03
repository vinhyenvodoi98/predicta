// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BTCPredictionMarket.sol";

/**
 * @title PredictionMarketFactory
 * @dev Factory contract to create BTC prediction markets using CREATE2
 * Allows deterministic market addresses and easy market discovery
 */
contract PredictionMarketFactory {
    // Array of all created markets
    address[] public markets;

    // Mapping from market address to market index
    mapping(address => uint256) public marketIndex;

    // Mapping from market address to creation timestamp
    mapping(address => uint256) public marketCreationTime;

    // Chainlink BTC/USD price feed address (set in constructor or immutable)
    address public immutable priceFeed;

    // Events
    event MarketCreated(
        address indexed marketAddress,
        uint256 targetPrice,
        uint256 resolutionTime,
        address indexed priceFeed,
        string marketName,
        uint256 indexed marketId
    );

    constructor(address _priceFeed) {
        require(_priceFeed != address(0), "Invalid price feed");
        priceFeed = _priceFeed;
    }

    /**
     * @dev Create a new BTC prediction market using CREATE2
     * @param targetPrice BTC price threshold in USD (e.g., 10000000000000 for $100k with 8 decimals)
     * @param resolutionTime Timestamp when market can be resolved
     * @param marketName Human-readable market name (e.g., "BTC-100K-2026")
     * @param salt Salt for CREATE2 deployment (allows creating same params with different addresses)
     * @return market Address of the newly created market
     */
    function createMarket(
        uint256 targetPrice,
        uint256 resolutionTime,
        string memory marketName,
        bytes32 salt
    ) public returns (address market) {
        // Deploy using CREATE2 for deterministic addresses
        bytes memory bytecode = abi.encodePacked(
            type(BTCPredictionMarket).creationCode,
            abi.encode(targetPrice, resolutionTime, priceFeed, marketName)
        );

        assembly {
            market := create2(0, add(bytecode, 32), mload(bytecode), salt)
            if iszero(extcodesize(market)) {
                revert(0, 0)
            }
        }

        // Store market info
        uint256 marketId = markets.length;
        markets.push(market);
        marketIndex[market] = marketId;
        marketCreationTime[market] = block.timestamp;

        emit MarketCreated(
            market,
            targetPrice,
            resolutionTime,
            priceFeed,
            marketName,
            marketId
        );

        return market;
    }

    /**
     * @dev Compute the address of a market before deployment
     * Useful for deterministic addresses and frontend integration
     */
    function computeMarketAddress(
        uint256 targetPrice,
        uint256 resolutionTime,
        string memory marketName,
        bytes32 salt
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(BTCPredictionMarket).creationCode,
            abi.encode(targetPrice, resolutionTime, priceFeed, marketName)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Get total number of markets created
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }

    /**
     * @dev Get market address by index
     */
    function getMarket(uint256 index) external view returns (address) {
        require(index < markets.length, "Market index out of bounds");
        return markets[index];
    }

    /**
     * @dev Get all markets (paginated)
     */
    function getMarkets(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        require(offset < markets.length, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > markets.length) {
            end = markets.length;
        }

        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = markets[i];
        }

        return result;
    }

    /**
     * @dev Get all active markets (not yet resolved)
     */
    function getActiveMarkets() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // First pass: count active markets
        for (uint256 i = 0; i < markets.length; i++) {
            BTCPredictionMarket market = BTCPredictionMarket(markets[i]);
            if (!market.resolved()) {
                activeCount++;
            }
        }

        // Second pass: collect active markets
        address[] memory activeMarkets = new address[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < markets.length; i++) {
            BTCPredictionMarket market = BTCPredictionMarket(markets[i]);
            if (!market.resolved()) {
                activeMarkets[currentIndex] = markets[i];
                currentIndex++;
            }
        }

        return activeMarkets;
    }

    /**
     * @dev Get markets that can be traded (before resolution time and not resolved)
     */
    function getTradableMarkets() external view returns (address[] memory) {
        uint256 tradableCount = 0;

        // First pass: count tradable markets
        for (uint256 i = 0; i < markets.length; i++) {
            BTCPredictionMarket market = BTCPredictionMarket(markets[i]);
            if (!market.resolved() && block.timestamp < market.resolutionTime()) {
                tradableCount++;
            }
        }

        // Second pass: collect tradable markets
        address[] memory tradableMarkets = new address[](tradableCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < markets.length; i++) {
            BTCPredictionMarket market = BTCPredictionMarket(markets[i]);
            if (!market.resolved() && block.timestamp < market.resolutionTime()) {
                tradableMarkets[currentIndex] = markets[i];
                currentIndex++;
            }
        }

        return tradableMarkets;
    }

    /**
     * @dev Helper to create a simple market with auto-generated salt
     */
    function createSimpleMarket(
        uint256 targetPrice,
        uint256 resolutionTime,
        string memory marketName
    ) external returns (address) {
        // Use market count + timestamp as salt
        bytes32 salt = keccak256(
            abi.encodePacked(markets.length, block.timestamp, msg.sender)
        );

        return createMarket(targetPrice, resolutionTime, marketName, salt);
    }
}
