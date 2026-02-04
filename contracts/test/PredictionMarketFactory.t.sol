// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {BTCPredictionMarket} from "../src/BTCPredictionMarket.sol";
import {MockV3Aggregator} from "./mocks/MockV3Aggregator.sol";
import {FakeUSDC} from "../src/FakeUSDC.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract PredictionMarketFactoryTest is Test {
    PredictionMarketFactory public factory;
    MockV3Aggregator public priceFeed;
    FakeUSDC public usdc;
    address public alice = makeAddr("alice");

    function setUp() public {
        // Deploy mock USDC at the expected address
        vm.etch(0xd4B33626446507C2464671155334ee702502BC71, address(new FakeUSDC()).code);
        usdc = FakeUSDC(0xd4B33626446507C2464671155334ee702502BC71);

        priceFeed = new MockV3Aggregator(8, 95_000e8);
        factory = new PredictionMarketFactory(address(priceFeed));
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

        // Get USDC instance
        IERC20 usdc = market.usdc();

        // Mint USDC to alice
        FakeUSDC(address(usdc)).mintTo(alice, 10000 * 10**6);

        uint256 amount = 1000 * 10**6; // 1000 USDC

        // Alice can mint YES tokens
        vm.startPrank(alice);
        usdc.approve(address(market), amount);
        market.mintYes(amount);
        vm.stopPrank();

        assertEq(market.yesToken().balanceOf(alice), amount);
        assertEq(market.totalUsdcLocked(), amount);
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
