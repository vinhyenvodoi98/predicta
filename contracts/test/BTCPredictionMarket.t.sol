// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BTCPredictionMarket} from "../src/BTCPredictionMarket.sol";
import {PredictionToken} from "../src/PredictionToken.sol";
import {MockV3Aggregator} from "./mocks/MockV3Aggregator.sol";

contract BTCPredictionMarketTest is Test {
    BTCPredictionMarket public market;
    MockV3Aggregator public priceFeed;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 constant TARGET_PRICE = 100_000e8; // $100k (8 decimals)
    uint256 constant RESOLUTION_TIME = 365 days;
    int256 constant INITIAL_PRICE = 95_000e8; // $95k initial price

    function setUp() public {
        // Deploy mock price feed with 8 decimals and initial price
        priceFeed = new MockV3Aggregator(8, INITIAL_PRICE);

        // Deploy market
        market = new BTCPredictionMarket(
            TARGET_PRICE,
            block.timestamp + RESOLUTION_TIME,
            address(priceFeed),
            "BTC-100K-2026"
        );

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }

    function testMarketCreation() public {
        assertEq(market.targetPrice(), TARGET_PRICE);
        assertEq(market.resolutionTime(), block.timestamp + RESOLUTION_TIME);
        assertEq(address(market.priceFeed()), address(priceFeed));
        assertEq(market.resolved(), false);
        assertEq(market.totalEthLocked(), 0);
    }

    function testMintYesTokens() public {
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        PredictionToken yesToken = market.yesToken();
        assertEq(yesToken.balanceOf(alice), 1 ether);
        assertEq(market.totalEthLocked(), 1 ether);
    }

    function testMintNoTokens() public {
        vm.prank(bob);
        market.mintNo{value: 2 ether}();

        PredictionToken noToken = market.noToken();
        assertEq(noToken.balanceOf(bob), 2 ether);
        assertEq(market.totalEthLocked(), 2 ether);
    }

    function testCannotMintAfterResolutionTime() public {
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);

        vm.prank(alice);
        vm.expectRevert("Market trading has ended");
        market.mintYes{value: 1 ether}();
    }

    function testResolveYesWins() public {
        // Alice bets YES with 1 ETH
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Bob bets NO with 1 ETH
        vm.prank(bob);
        market.mintNo{value: 1 ether}();

        // Warp to resolution time
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);

        // Update price to above target (YES wins)
        priceFeed.updateAnswer(int256(TARGET_PRICE));

        // Anyone can resolve
        market.resolve();

        assertEq(market.resolved(), true);
        assertEq(market.btcAboveTarget(), true);
        assertEq(market.actualPrice(), TARGET_PRICE);
    }

    function testResolveNoWins() public {
        // Alice bets YES with 1 ETH
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Bob bets NO with 1 ETH
        vm.prank(bob);
        market.mintNo{value: 1 ether}();

        // Warp to resolution time
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);

        // Update price to below target (NO wins)
        priceFeed.updateAnswer(int256(TARGET_PRICE - 1));

        // Anyone can resolve
        market.resolve();

        assertEq(market.resolved(), true);
        assertEq(market.btcAboveTarget(), false);
        assertEq(market.actualPrice(), TARGET_PRICE - 1);
    }

    function testRedeemYesWinner() public {
        // Alice bets YES with 1 ETH
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Bob bets NO with 1 ETH
        vm.prank(bob);
        market.mintNo{value: 1 ether}();

        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));
        market.resolve();

        // Alice redeems her winning YES tokens
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        market.redeem();
        uint256 aliceBalanceAfter = alice.balance;

        // Alice should get all 2 ETH (her 1 ETH + Bob's 1 ETH)
        assertEq(aliceBalanceAfter - aliceBalanceBefore, 2 ether);
        assertEq(market.yesToken().balanceOf(alice), 0); // Tokens burned
    }

    function testRedeemNoWinner() public {
        // Alice bets YES with 1 ETH
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Bob bets NO with 1 ETH
        vm.prank(bob);
        market.mintNo{value: 1 ether}();

        // Warp and resolve (NO wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE - 1));
        market.resolve();

        // Bob redeems his winning NO tokens
        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        market.redeem();
        uint256 bobBalanceAfter = bob.balance;

        // Bob should get all 2 ETH
        assertEq(bobBalanceAfter - bobBalanceBefore, 2 ether);
        assertEq(market.noToken().balanceOf(bob), 0);
    }

    function testProportionalPayout() public {
        // Alice bets YES with 1 ETH
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Bob bets YES with 2 ETH
        vm.prank(bob);
        market.mintYes{value: 2 ether}();

        // Charlie bets NO with 3 ETH
        vm.prank(charlie);
        market.mintNo{value: 3 ether}();

        // Total pool: 6 ETH, YES: 3 ETH, NO: 3 ETH
        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));
        market.resolve();

        // Alice has 1/3 of YES tokens, should get 2 ETH (1/3 of 6 ETH)
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        market.redeem();
        uint256 aliceBalanceAfter = alice.balance;
        assertEq(aliceBalanceAfter - aliceBalanceBefore, 2 ether);

        // Bob has 2/3 of YES tokens, should get 4 ETH (2/3 of 6 ETH)
        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        market.redeem();
        uint256 bobBalanceAfter = bob.balance;
        assertEq(bobBalanceAfter - bobBalanceBefore, 4 ether);
    }

    function testOneSidedMarket() public {
        // Only Alice bets YES with 1 ETH
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // No one bets NO
        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));
        market.resolve();

        // Alice should get her 1 ETH back (1:1 redemption)
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        market.redeem();
        uint256 aliceBalanceAfter = alice.balance;
        assertEq(aliceBalanceAfter - aliceBalanceBefore, 1 ether);
    }

    function testCannotRedeemLosingTokens() public {
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        vm.prank(bob);
        market.mintNo{value: 1 ether}();

        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE)); // YES wins
        market.resolve();

        // Bob (NO holder) cannot redeem
        vm.prank(bob);
        vm.expectRevert("No winning tokens to redeem");
        market.redeem();
    }

    function testCannotResolveBeforeTime() public {
        vm.expectRevert("Cannot resolve before resolution time");
        market.resolve();
    }

    function testAnyoneCanResolve() public {
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));

        // Charlie (random user) can resolve
        vm.prank(charlie);
        market.resolve();

        assertEq(market.resolved(), true);
    }

    function testTokenTransfer() public {
        // Alice mints YES tokens
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Get the YES token
        PredictionToken yesToken = market.yesToken();

        // Alice transfers to Bob
        vm.prank(alice);
        yesToken.transfer(bob, 0.5 ether);

        assertEq(yesToken.balanceOf(alice), 0.5 ether);
        assertEq(yesToken.balanceOf(bob), 0.5 ether);
    }

    function testCalculatePayout() public {
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        vm.prank(bob);
        market.mintNo{value: 1 ether}();

        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE)); // YES wins
        market.resolve();

        uint256 alicePayout = market.calculatePayout(alice);
        assertEq(alicePayout, 2 ether);

        uint256 bobPayout = market.calculatePayout(bob);
        assertEq(bobPayout, 0);
    }

    function testGetCurrentOdds() public {
        // Initially 50/50
        (uint256 yesOdds, uint256 noOdds) = market.getCurrentOdds();
        assertEq(yesOdds, 5000);
        assertEq(noOdds, 5000);

        // Alice bets 1 ETH YES
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        // Bob bets 3 ETH NO
        vm.prank(bob);
        market.mintNo{value: 3 ether}();

        // Odds should be 25% YES, 75% NO
        (yesOdds, noOdds) = market.getCurrentOdds();
        assertEq(yesOdds, 2500);
        assertEq(noOdds, 7500);
    }

    function testGetLatestPrice() public {
        uint256 latestPrice = market.getLatestPrice();
        assertEq(latestPrice, uint256(INITIAL_PRICE));

        // Update price
        priceFeed.updateAnswer(110_000e8);
        latestPrice = market.getLatestPrice();
        assertEq(latestPrice, 110_000e8);
    }

    function testGetMarketInfo() public {
        (
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
        ) = market.getMarketInfo();

        assertEq(_targetPrice, TARGET_PRICE);
        assertEq(_resolutionTime, block.timestamp + RESOLUTION_TIME);
        assertEq(_resolved, false);
        assertEq(_actualPrice, 0);
        assertEq(_totalEthLocked, 0);
        assertEq(_yesTokenSupply, 0);
        assertEq(_noTokenSupply, 0);
        assertTrue(_yesToken != address(0));
        assertTrue(_noToken != address(0));
        assertEq(_priceFeed, address(priceFeed));
    }
}
