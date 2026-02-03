// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {BTCPredictionMarket} from "../src/BTCPredictionMarket.sol";

contract DeployFactory is Script {
    // Chainlink BTC/USD Price Feed on Sepolia
    // https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1#sepolia-testnet
    address constant SEPOLIA_BTC_USD_FEED = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;

    function run() external returns (PredictionMarketFactory factory, address exampleMarket) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Using Chainlink BTC/USD Feed:", SEPOLIA_BTC_USD_FEED);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the factory with Chainlink price feed
        factory = new PredictionMarketFactory(SEPOLIA_BTC_USD_FEED);
        console.log("PredictionMarketFactory deployed to:", address(factory));

        // Optionally create an example market
        // BTC will reach $100k by end of 2026?
        uint256 targetPrice = 100_000e8; // $100,000 (8 decimals)
        uint256 resolutionTime = 1735689600; // Jan 1, 2027 00:00:00 UTC
        string memory marketName = "BTC-100K-2027";

        exampleMarket = factory.createSimpleMarket(
            targetPrice,
            resolutionTime,
            marketName
        );

        console.log("Example market created at:", exampleMarket);
        console.log("Market details:");
        console.log("  Target Price: $100,000");
        console.log("  Resolution Time:", resolutionTime);
        console.log("  Price Feed:", SEPOLIA_BTC_USD_FEED);

        BTCPredictionMarket market = BTCPredictionMarket(exampleMarket);
        console.log("  YES Token:", address(market.yesToken()));
        console.log("  NO Token:", address(market.noToken()));

        vm.stopBroadcast();

        return (factory, exampleMarket);
    }
}
