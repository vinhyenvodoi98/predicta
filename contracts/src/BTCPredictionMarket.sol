// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PredictionToken.sol";
import "chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title BTCPredictionMarket
 * @dev Binary prediction market for BTC price with YES/NO tokens
 * Uses Chainlink Price Feed for decentralized price oracle
 * Users lock ETH and receive YES or NO tokens (1:1 with ETH)
 * After resolution, winning tokens can be redeemed for ETH from the pool
 */
contract BTCPredictionMarket {
    // Market parameters
    uint256 public immutable targetPrice;      // BTC price threshold in USD (e.g., 10000000000000 for $100k with 8 decimals)
    uint256 public immutable resolutionTime;   // Timestamp when market can be resolved
    AggregatorV3Interface public immutable priceFeed; // Chainlink BTC/USD price feed

    // Market state
    bool public resolved;
    bool public btcAboveTarget;                // true if BTC >= targetPrice, false otherwise
    uint256 public actualPrice;                // Actual BTC price at resolution

    // Tokens
    PredictionToken public immutable yesToken;
    PredictionToken public immutable noToken;

    // Total ETH locked
    uint256 public totalEthLocked;

    event PositionMinted(address indexed user, bool isYes, uint256 amount);
    event MarketResolved(bool btcAboveTarget, uint256 actualPrice);
    event TokensRedeemed(address indexed user, bool isYes, uint256 tokenAmount, uint256 ethAmount);

    modifier onlyBeforeResolution() {
        require(block.timestamp < resolutionTime, "Market trading has ended");
        require(!resolved, "Market already resolved");
        _;
    }

    modifier onlyAfterResolution() {
        require(resolved, "Market not resolved yet");
        _;
    }

    constructor(
        uint256 _targetPrice,
        uint256 _resolutionTime,
        address _priceFeed,
        string memory _marketName
    ) {
        require(_resolutionTime > block.timestamp, "Resolution time must be in future");
        require(_targetPrice > 0, "Target price must be positive");
        require(_priceFeed != address(0), "Invalid price feed address");

        targetPrice = _targetPrice;
        resolutionTime = _resolutionTime;
        priceFeed = AggregatorV3Interface(_priceFeed);

        // Create YES and NO tokens
        yesToken = new PredictionToken(
            string(abi.encodePacked("YES-", _marketName)),
            string(abi.encodePacked("YES-", _marketName))
        );
        noToken = new PredictionToken(
            string(abi.encodePacked("NO-", _marketName)),
            string(abi.encodePacked("NO-", _marketName))
        );
    }

    /**
     * @dev Mint YES tokens by locking ETH
     * Mints 1 YES token per 1 ETH locked
     */
    function mintYes() external payable onlyBeforeResolution {
        require(msg.value > 0, "Must send ETH");

        totalEthLocked += msg.value;
        yesToken.mint(msg.sender, msg.value);

        emit PositionMinted(msg.sender, true, msg.value);
    }

    /**
     * @dev Mint NO tokens by locking ETH
     * Mints 1 NO token per 1 ETH locked
     */
    function mintNo() external payable onlyBeforeResolution {
        require(msg.value > 0, "Must send ETH");

        totalEthLocked += msg.value;
        noToken.mint(msg.sender, msg.value);

        emit PositionMinted(msg.sender, false, msg.value);
    }

    /**
     * @dev Resolve the market using Chainlink price feed
     * Can be called by anyone after resolution time
     * Automatically fetches BTC price from Chainlink oracle
     */
    function resolve() external {
        require(block.timestamp >= resolutionTime, "Cannot resolve before resolution time");
        require(!resolved, "Already resolved");

        // Get latest BTC price from Chainlink
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from oracle");

        actualPrice = uint256(price);
        resolved = true;
        btcAboveTarget = actualPrice >= targetPrice;

        emit MarketResolved(btcAboveTarget, actualPrice);
    }

    /**
     * @dev Redeem winning tokens for ETH
     * If BTC >= target, YES tokens win. Otherwise NO tokens win.
     * Each winning token redeems proportionally from total pool
     */
    function redeem() external onlyAfterResolution {
        PredictionToken winningToken = btcAboveTarget ? yesToken : noToken;
        PredictionToken losingToken = btcAboveTarget ? noToken : yesToken;

        uint256 userWinningTokens = winningToken.balanceOf(msg.sender);
        require(userWinningTokens > 0, "No winning tokens to redeem");

        uint256 totalWinningTokens = winningToken.totalSupply();
        uint256 totalLosingTokens = losingToken.totalSupply();

        // Calculate payout: user's share of total pool
        // If only winning side exists, they get 1:1
        // If both sides exist, winners split the entire pool proportionally
        uint256 payout;
        if (totalLosingTokens == 0) {
            // No losing side, 1:1 redemption
            payout = userWinningTokens;
        } else {
            // Winners split entire pool proportionally
            payout = (userWinningTokens * totalEthLocked) / totalWinningTokens;
        }

        // Burn the tokens
        winningToken.burn(msg.sender, userWinningTokens);
        totalEthLocked -= payout;

        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "ETH transfer failed");

        emit TokensRedeemed(msg.sender, btcAboveTarget, userWinningTokens, payout);
    }

    /**
     * @dev Get market info
     */
    function getMarketInfo() external view returns (
        uint256 _targetPrice,
        uint256 _resolutionTime,
        bool _resolved,
        bool _btcAboveTarget,
        uint256 _actualPrice,
        uint256 _totalEthLocked,
        uint256 _yesTokenSupply,
        uint256 _noTokenSupply,
        address _yesToken,
        address _noToken,
        address _priceFeed
    ) {
        return (
            targetPrice,
            resolutionTime,
            resolved,
            btcAboveTarget,
            actualPrice,
            totalEthLocked,
            yesToken.totalSupply(),
            noToken.totalSupply(),
            address(yesToken),
            address(noToken),
            address(priceFeed)
        );
    }

    /**
     * @dev Calculate potential payout for a user
     */
    function calculatePayout(address user) external view returns (uint256) {
        if (!resolved) return 0;

        PredictionToken winningToken = btcAboveTarget ? yesToken : noToken;
        PredictionToken losingToken = btcAboveTarget ? noToken : yesToken;

        uint256 userWinningTokens = winningToken.balanceOf(user);
        if (userWinningTokens == 0) return 0;

        uint256 totalWinningTokens = winningToken.totalSupply();
        uint256 totalLosingTokens = losingToken.totalSupply();

        if (totalLosingTokens == 0) {
            return userWinningTokens;
        } else {
            return (userWinningTokens * totalEthLocked) / totalWinningTokens;
        }
    }

    /**
     * @dev Get current market odds based on token supplies
     * Returns (yesOdds, noOdds) as percentages (e.g., 6000 = 60%)
     */
    function getCurrentOdds() external view returns (uint256 yesOdds, uint256 noOdds) {
        uint256 yesSupply = yesToken.totalSupply();
        uint256 noSupply = noToken.totalSupply();

        if (yesSupply == 0 && noSupply == 0) {
            return (5000, 5000); // 50/50 if no positions
        }

        uint256 total = yesSupply + noSupply;
        yesOdds = (yesSupply * 10000) / total;
        noOdds = (noSupply * 10000) / total;
    }

    /**
     * @dev Get latest BTC price from Chainlink (view function)
     * Useful for users to see current price before resolution
     */
    function getLatestPrice() external view returns (uint256) {
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from oracle");
        return uint256(price);
    }
}
