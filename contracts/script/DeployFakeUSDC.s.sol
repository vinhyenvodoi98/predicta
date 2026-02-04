// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FakeUSDC.sol";

contract DeployFakeUSDC is Script {
    function run() external returns (FakeUSDC) {
        vm.startBroadcast();

        FakeUSDC usdc = new FakeUSDC();

        console.log("FakeUSDC deployed at:", address(usdc));
        console.log("Anyone can mint tokens by calling mint(amount)");

        vm.stopBroadcast();

        return usdc;
    }
}
