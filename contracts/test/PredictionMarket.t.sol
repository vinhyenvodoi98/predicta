// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    address public creator = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        market = new PredictionMarket();
        vm.deal(creator, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testCreateMarket() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 7 days);

        assertEq(marketId, 0);
        assertEq(market.getMarketCount(), 1);

        (
            string memory question,
            uint256 endTime,
            uint256 totalYesAmount,
            uint256 totalNoAmount,
            bool resolved,
            bool outcome,
            address marketCreator
        ) = market.getMarket(0);

        assertEq(question, "Will ETH reach $10k by 2026?");
        assertEq(endTime, block.timestamp + 7 days);
        assertEq(totalYesAmount, 0);
        assertEq(totalNoAmount, 0);
        assertEq(resolved, false);
        assertEq(marketCreator, creator);
    }

    function testPredict() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 7 days);

        vm.prank(user1);
        market.predict{value: 1 ether}(marketId, true);

        vm.prank(user2);
        market.predict{value: 2 ether}(marketId, false);

        (
            ,
            ,
            uint256 totalYesAmount,
            uint256 totalNoAmount,
            ,
            ,
        ) = market.getMarket(marketId);

        assertEq(totalYesAmount, 1 ether);
        assertEq(totalNoAmount, 2 ether);
    }

    function testResolveMarket() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 1 days);

        vm.prank(user1);
        market.predict{value: 1 ether}(marketId, true);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(creator);
        market.resolveMarket(marketId, true);

        (,,,,bool resolved, bool outcome,) = market.getMarket(marketId);
        assertEq(resolved, true);
        assertEq(outcome, true);
    }

    function testClaimWinnings() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 1 days);

        vm.prank(user1);
        market.predict{value: 1 ether}(marketId, true);

        vm.prank(user2);
        market.predict{value: 1 ether}(marketId, false);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(creator);
        market.resolveMarket(marketId, true);

        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        market.claim(marketId);
        uint256 balanceAfter = user1.balance;

        assertEq(balanceAfter - balanceBefore, 2 ether);
    }

    function testCalculatePayout() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 1 days);

        vm.prank(user1);
        market.predict{value: 1 ether}(marketId, true);

        vm.prank(user2);
        market.predict{value: 1 ether}(marketId, false);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(creator);
        market.resolveMarket(marketId, true);

        uint256 payout = market.calculatePayout(marketId, user1);
        assertEq(payout, 2 ether);

        uint256 loserPayout = market.calculatePayout(marketId, user2);
        assertEq(loserPayout, 0);
    }

    function testCannotPredictAfterEnd() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 1 days);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(user1);
        vm.expectRevert("Market has ended");
        market.predict{value: 1 ether}(marketId, true);
    }

    function testCannotResolveBeforeEnd() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 1 days);

        vm.prank(creator);
        vm.expectRevert("Market has not ended");
        market.resolveMarket(marketId, true);
    }

    function testOnlyCreatorCanResolve() public {
        vm.prank(creator);
        uint256 marketId = market.createMarket("Will ETH reach $10k by 2026?", 1 days);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(user1);
        vm.expectRevert("Only creator can resolve");
        market.resolveMarket(marketId, true);
    }
}
