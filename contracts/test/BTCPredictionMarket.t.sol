// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BTCPredictionMarket} from "../src/BTCPredictionMarket.sol";
import {PredictionToken} from "../src/PredictionToken.sol";
import {MockV3Aggregator} from "./mocks/MockV3Aggregator.sol";
import {FakeUSDC} from "../src/FakeUSDC.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract BTCPredictionMarketTest is Test {
    BTCPredictionMarket public market;
    MockV3Aggregator public priceFeed;
    FakeUSDC public usdc;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    uint256 constant TARGET_PRICE = 100_000e8; // $100k (8 decimals)
    uint256 constant RESOLUTION_TIME = 365 days;
    int256 constant INITIAL_PRICE = 95_000e8; // $95k initial price
    uint256 constant INITIAL_USDC = 100_000 * 10**6; // 100k USDC per user

    function setUp() public {
        // Deploy mock USDC at the expected address
        vm.etch(0xd4B33626446507C2464671155334ee702502BC71, address(new FakeUSDC()).code);
        usdc = FakeUSDC(0xd4B33626446507C2464671155334ee702502BC71);

        // Deploy mock price feed with 8 decimals and initial price
        priceFeed = new MockV3Aggregator(8, INITIAL_PRICE);

        // Deploy market
        market = new BTCPredictionMarket(
            TARGET_PRICE,
            block.timestamp + RESOLUTION_TIME,
            address(priceFeed),
            "BTC-100K-2026"
        );

        // Mint USDC to test users
        usdc.mint(INITIAL_USDC);
        usdc.transfer(alice, INITIAL_USDC);
        usdc.mint(INITIAL_USDC);
        usdc.transfer(bob, INITIAL_USDC);
        usdc.mint(INITIAL_USDC);
        usdc.transfer(charlie, INITIAL_USDC);
    }

    function testMarketCreation() public {
        assertEq(market.targetPrice(), TARGET_PRICE);
        assertEq(market.resolutionTime(), block.timestamp + RESOLUTION_TIME);
        assertEq(address(market.priceFeed()), address(priceFeed));
        assertEq(market.resolved(), false);
        assertEq(market.totalUsdcLocked(), 0);
        assertEq(address(market.usdc()), address(usdc));
    }

    function testMintYesTokens() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        PredictionToken yesToken = market.yesToken();
        assertEq(yesToken.balanceOf(alice), amount);
        assertEq(market.totalUsdcLocked(), amount);
    }

    function testMintNoTokens() public {
        uint256 amount = 2000 * 10**6; // 2000 USDC

        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

        PredictionToken noToken = market.noToken();
        assertEq(noToken.balanceOf(bob), amount);
        assertEq(market.totalUsdcLocked(), amount);
    }

    function testCannotMintAfterResolutionTime() public {
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);

        uint256 amount = 1000 * 10**6;
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        vm.expectRevert("Market trading has ended");
        market.mintYes(amount);
        vm.stopPrank();
    }

    function testResolveYesWins() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Alice bets YES
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        // Bob bets NO
        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

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
        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Alice bets YES
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        // Bob bets NO
        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

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
        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Alice bets YES
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        // Bob bets NO
        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));
        market.resolve();

        // Alice redeems her winning YES tokens
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        market.redeem();
        uint256 aliceUsdcAfter = usdc.balanceOf(alice);

        // Alice should get all 2000 USDC (her 1000 + Bob's 1000)
        assertEq(aliceUsdcAfter - aliceUsdcBefore, amount * 2);
        assertEq(market.yesToken().balanceOf(alice), 0); // Tokens burned
    }

    function testRedeemNoWinner() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Alice bets YES
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        // Bob bets NO
        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

        // Warp and resolve (NO wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE - 1));
        market.resolve();

        // Bob redeems his winning NO tokens
        uint256 bobUsdcBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        market.redeem();
        uint256 bobUsdcAfter = usdc.balanceOf(bob);

        // Bob should get all 2000 USDC
        assertEq(bobUsdcAfter - bobUsdcBefore, amount * 2);
        assertEq(market.noToken().balanceOf(bob), 0);
    }

    function testProportionalPayout() public {
        uint256 amount1 = 1000 * 10**6; // 1000 USDC
        uint256 amount2 = 2000 * 10**6; // 2000 USDC
        uint256 amount3 = 3000 * 10**6; // 3000 USDC

        // Alice bets YES with 1000 USDC
        vm.startPrank(alice);
        usdc.approve(address(market), amount1);
        market.mintYes(amount1);
        vm.stopPrank();

        // Bob bets YES with 2000 USDC
        vm.startPrank(bob);
        usdc.approve(address(market), amount2);
        market.mintYes(amount2);
        vm.stopPrank();

        // Charlie bets NO with 3000 USDC
        vm.startPrank(charlie);
        usdc.approve(address(market), amount3);
        market.mintNo(amount3);
        vm.stopPrank();

        // Total pool: 6000 USDC, YES: 3000, NO: 3000
        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));
        market.resolve();

        // Alice has 1/3 of YES tokens, should get 2000 USDC (1/3 of 6000)
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        market.redeem();
        uint256 aliceUsdcAfter = usdc.balanceOf(alice);
        assertEq(aliceUsdcAfter - aliceUsdcBefore, 2000 * 10**6);

        // Bob has 2/3 of YES tokens, should get 4000 USDC (2/3 of 6000)
        uint256 bobUsdcBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        market.redeem();
        uint256 bobUsdcAfter = usdc.balanceOf(bob);
        assertEq(bobUsdcAfter - bobUsdcBefore, 4000 * 10**6);
    }

    function testOneSidedMarket() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Only Alice bets YES
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        // No one bets NO
        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE));
        market.resolve();

        // Alice should get her 1000 USDC back (1:1 redemption)
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        market.redeem();
        uint256 aliceUsdcAfter = usdc.balanceOf(alice);
        assertEq(aliceUsdcAfter - aliceUsdcBefore, amount);
    }

    function testCannotRedeemLosingTokens() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

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
        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Alice mints YES tokens
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        // Get the YES token
        PredictionToken yesToken = market.yesToken();

        // Alice transfers half to Bob
        vm.prank(alice);
        yesToken.transfer(bob, amount / 2);

        assertEq(yesToken.balanceOf(alice), amount / 2);
        assertEq(yesToken.balanceOf(bob), amount / 2);
    }

    function testCalculatePayout() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(market), amount);
        market.mintNo(amount);
        vm.stopPrank();

        vm.warp(block.timestamp + RESOLUTION_TIME + 1);
        priceFeed.updateAnswer(int256(TARGET_PRICE)); // YES wins
        market.resolve();

        uint256 alicePayout = market.calculatePayout(alice);
        assertEq(alicePayout, amount * 2);

        uint256 bobPayout = market.calculatePayout(bob);
        assertEq(bobPayout, 0);
    }

    function testGetCurrentOdds() public {
        // Initially 50/50
        (uint256 yesOdds, uint256 noOdds) = market.getCurrentOdds();
        assertEq(yesOdds, 5000);
        assertEq(noOdds, 5000);

        uint256 amount1 = 1000 * 10**6; // 1000 USDC
        uint256 amount3 = 3000 * 10**6; // 3000 USDC

        // Alice bets 1000 USDC YES
        vm.startPrank(alice);
        usdc.approve(address(market), amount1);
        market.mintYes(amount1);
        vm.stopPrank();

        // Bob bets 3000 USDC NO
        vm.startPrank(bob);
        usdc.approve(address(market), amount3);
        market.mintNo(amount3);
        vm.stopPrank();

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
            uint256 _totalUsdcLocked,
            uint256 _yesTokenSupply,
            uint256 _noTokenSupply,
            address _yesToken,
            address _noToken,
            address _priceFeed,
            address _usdc
        ) = market.getMarketInfo();

        assertEq(_targetPrice, TARGET_PRICE);
        assertEq(_resolutionTime, block.timestamp + RESOLUTION_TIME);
        assertEq(_resolved, false);
        assertEq(_actualPrice, 0);
        assertEq(_totalUsdcLocked, 0);
        assertEq(_yesTokenSupply, 0);
        assertEq(_noTokenSupply, 0);
        assertTrue(_yesToken != address(0));
        assertTrue(_noToken != address(0));
        assertEq(_priceFeed, address(priceFeed));
        assertEq(_usdc, address(usdc));
    }
}
