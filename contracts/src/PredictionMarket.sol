// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title PredictionMarket
 * @dev A simple binary prediction market contract for Sepolia testnet
 */
contract PredictionMarket {
    struct Market {
        string question;
        uint256 endTime;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        bool resolved;
        bool outcome;
        address creator;
    }

    struct Position {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
    }

    Market[] public markets;
    mapping(uint256 => mapping(address => Position)) public positions;

    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime, address creator);
    event PositionTaken(uint256 indexed marketId, address indexed user, bool predictedYes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);

    /**
     * @dev Create a new prediction market
     * @param _question The question to predict on
     * @param _duration Duration in seconds until market closes
     */
    function createMarket(string memory _question, uint256 _duration) external returns (uint256) {
        require(_duration > 0, "Duration must be positive");
        require(bytes(_question).length > 0, "Question cannot be empty");

        uint256 marketId = markets.length;
        markets.push(Market({
            question: _question,
            endTime: block.timestamp + _duration,
            totalYesAmount: 0,
            totalNoAmount: 0,
            resolved: false,
            outcome: false,
            creator: msg.sender
        }));

        emit MarketCreated(marketId, _question, block.timestamp + _duration, msg.sender);
        return marketId;
    }

    /**
     * @dev Place a bet on a market
     * @param _marketId The market to bet on
     * @param _predictYes True for yes, false for no
     */
    function predict(uint256 _marketId, bool _predictYes) external payable {
        require(_marketId < markets.length, "Market does not exist");
        require(msg.value > 0, "Must send ETH to predict");
        Market storage market = markets[_marketId];
        require(block.timestamp < market.endTime, "Market has ended");
        require(!market.resolved, "Market already resolved");

        Position storage position = positions[_marketId][msg.sender];

        if (_predictYes) {
            position.yesAmount += msg.value;
            market.totalYesAmount += msg.value;
        } else {
            position.noAmount += msg.value;
            market.totalNoAmount += msg.value;
        }

        emit PositionTaken(_marketId, msg.sender, _predictYes, msg.value);
    }

    /**
     * @dev Resolve a market (only creator can resolve)
     * @param _marketId The market to resolve
     * @param _outcome The outcome (true = yes won, false = no won)
     */
    function resolveMarket(uint256 _marketId, bool _outcome) external {
        require(_marketId < markets.length, "Market does not exist");
        Market storage market = markets[_marketId];
        require(msg.sender == market.creator, "Only creator can resolve");
        require(block.timestamp >= market.endTime, "Market has not ended");
        require(!market.resolved, "Market already resolved");

        market.resolved = true;
        market.outcome = _outcome;

        emit MarketResolved(_marketId, _outcome);
    }

    /**
     * @dev Claim winnings from a resolved market
     * @param _marketId The market to claim from
     */
    function claim(uint256 _marketId) external {
        require(_marketId < markets.length, "Market does not exist");
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");

        Position storage position = positions[_marketId][msg.sender];
        require(!position.claimed, "Already claimed");

        uint256 payout = calculatePayout(_marketId, msg.sender);
        require(payout > 0, "No payout available");

        position.claimed = true;
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit Claimed(_marketId, msg.sender, payout);
    }

    /**
     * @dev Calculate potential payout for a user
     * @param _marketId The market ID
     * @param _user The user address
     * @return The payout amount
     */
    function calculatePayout(uint256 _marketId, address _user) public view returns (uint256) {
        require(_marketId < markets.length, "Market does not exist");
        Market storage market = markets[_marketId];
        if (!market.resolved) return 0;

        Position storage position = positions[_marketId][_user];
        if (position.claimed) return 0;

        uint256 winningAmount = market.outcome ? position.yesAmount : position.noAmount;
        if (winningAmount == 0) return 0;

        uint256 totalWinningAmount = market.outcome ? market.totalYesAmount : market.totalNoAmount;
        uint256 totalPool = market.totalYesAmount + market.totalNoAmount;

        return (winningAmount * totalPool) / totalWinningAmount;
    }

    /**
     * @dev Get market details
     */
    function getMarket(uint256 _marketId) external view returns (
        string memory question,
        uint256 endTime,
        uint256 totalYesAmount,
        uint256 totalNoAmount,
        bool resolved,
        bool outcome,
        address creator
    ) {
        require(_marketId < markets.length, "Market does not exist");
        Market storage market = markets[_marketId];
        return (
            market.question,
            market.endTime,
            market.totalYesAmount,
            market.totalNoAmount,
            market.resolved,
            market.outcome,
            market.creator
        );
    }

    /**
     * @dev Get user position in a market
     */
    function getPosition(uint256 _marketId, address _user) external view returns (
        uint256 yesAmount,
        uint256 noAmount,
        bool claimed
    ) {
        require(_marketId < markets.length, "Market does not exist");
        Position storage position = positions[_marketId][_user];
        return (position.yesAmount, position.noAmount, position.claimed);
    }

    /**
     * @dev Get total number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
}
