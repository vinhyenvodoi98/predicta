// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {BTCPredictionMarket} from "../src/BTCPredictionMarket.sol";
import {MockV3Aggregator} from "./mocks/MockV3Aggregator.sol";

contract PredictionMarketFactoryTest is Test {
    PredictionMarketFactory public factory;
    MockV3Aggregator public priceFeed;
    address public alice = makeAddr("alice");

    function setUp() public {
        priceFeed = new MockV3Aggregator(8, 95_000e8);
        factory = new PredictionMarketFactory(address(priceFeed));
        vm.deal(alice, 100 ether);
    }

    function testCreateMarket() public {
        uint256 targetPrice = 100_000e8;
        uint256 resolutionTime = block.timestamp + 365 days;
        bytes32 salt = keccak256("market1");

        address marketAddress = factory.createMarket(
            targetPrice,
            resolutionTime,
            "BTC-100K-2026",
            salt
        );

        assertEq(factory.getMarketCount(), 1);
        assertEq(factory.getMarket(0), marketAddress);

        BTCPredictionMarket market = BTCPredictionMarket(marketAddress);
        assertEq(market.targetPrice(), targetPrice);
        assertEq(market.resolutionTime(), resolutionTime);
        assertEq(address(market.priceFeed()), address(priceFeed));
    }

    function testCreateMultipleMarkets() public {
        factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "BTC-100K-2026",
            keccak256("market1")
        );

        factory.createMarket(
            150_000e8,
            block.timestamp + 730 days,
            "BTC-150K-2027",
            keccak256("market2")
        );

        assertEq(factory.getMarketCount(), 2);
    }

    function testComputeMarketAddress() public {
        uint256 targetPrice = 100_000e8;
        uint256 resolutionTime = block.timestamp + 365 days;
        bytes32 salt = keccak256("market1");

        address computedAddress = factory.computeMarketAddress(
            targetPrice,
            resolutionTime,
            "BTC-100K-2026",
            salt
        );

        address actualAddress = factory.createMarket(
            targetPrice,
            resolutionTime,
            "BTC-100K-2026",
            salt
        );

        assertEq(computedAddress, actualAddress);
    }

    function testGetMarkets() public {
        for (uint256 i = 0; i < 5; i++) {
            factory.createMarket(
                100_000e8 + i,
                block.timestamp + 365 days,
                string(abi.encodePacked("Market", i)),
                keccak256(abi.encodePacked(i))
            );
        }

        address[] memory markets = factory.getMarkets(0, 3);
        assertEq(markets.length, 3);
        assertEq(markets[0], factory.getMarket(0));
        assertEq(markets[2], factory.getMarket(2));
    }

    function testGetActiveMarkets() public {
        // Create 3 markets
        address market1 = factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market1",
            keccak256("m1")
        );

        address market2 = factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market2",
            keccak256("m2")
        );

        factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market3",
            keccak256("m3")
        );

        // Resolve market2
        vm.warp(block.timestamp + 365 days + 1);
        priceFeed.updateAnswer(100_000e8);
        BTCPredictionMarket(market2).resolve();

        // Get active markets (should be market1 and market3)
        address[] memory activeMarkets = factory.getActiveMarkets();
        assertEq(activeMarkets.length, 2);
    }

    function testGetTradableMarkets() public {
        // Create markets with different resolution times
        factory.createMarket(
            100_000e8,
            block.timestamp + 100 days,
            "Market1",
            keccak256("m1")
        );

        factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market2",
            keccak256("m2")
        );

        factory.createMarket(
            100_000e8,
            block.timestamp + 500 days,
            "Market3",
            keccak256("m3")
        );

        // Warp past market1's resolution time
        vm.warp(block.timestamp + 150 days);

        // market2 and market3 should be tradable
        address[] memory tradableMarkets = factory.getTradableMarkets();
        assertEq(tradableMarkets.length, 2);
    }

    function testCreateSimpleMarket() public {
        address market = factory.createSimpleMarket(
            100_000e8,
            block.timestamp + 365 days,
            "BTC-100K-2026"
        );

        assertEq(factory.getMarketCount(), 1);
        assertTrue(market != address(0));
    }

    function testInteractWithCreatedMarket() public {
        address marketAddress = factory.createSimpleMarket(
            100_000e8,
            block.timestamp + 365 days,
            "BTC-100K-2026"
        );

        BTCPredictionMarket market = BTCPredictionMarket(marketAddress);

        // Alice can mint YES tokens
        vm.prank(alice);
        market.mintYes{value: 1 ether}();

        assertEq(market.yesToken().balanceOf(alice), 1 ether);
        assertEq(market.totalEthLocked(), 1 ether);
    }

    function testCannotCreateSameMarketWithSameSalt() public {
        bytes32 salt = keccak256("duplicate");

        factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market1",
            salt
        );

        // Should fail with same parameters and salt
        vm.expectRevert();
        factory.createMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market1",
            salt
        );
    }

    function testMarketIndexTracking() public {
        address market1 = factory.createSimpleMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market1"
        );

        address market2 = factory.createSimpleMarket(
            150_000e8,
            block.timestamp + 365 days,
            "Market2"
        );

        assertEq(factory.marketIndex(market1), 0);
        assertEq(factory.marketIndex(market2), 1);
    }

    function testMarketCreationTime() public {
        uint256 beforeTime = block.timestamp;

        address market = factory.createSimpleMarket(
            100_000e8,
            block.timestamp + 365 days,
            "Market1"
        );

        uint256 afterTime = block.timestamp;

        uint256 creationTime = factory.marketCreationTime(market);
        assertGe(creationTime, beforeTime);
        assertLe(creationTime, afterTime);
    }
}
