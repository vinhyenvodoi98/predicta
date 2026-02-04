// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FakeUSDC.sol";

contract FakeUSDCTest is Test {
    FakeUSDC public usdc;
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        usdc = new FakeUSDC();
    }

    function testTokenDetails() public view {
        assertEq(usdc.name(), "Fake USDC");
        assertEq(usdc.symbol(), "fUSDC");
        assertEq(usdc.decimals(), 6);
    }

    function testMint() public {
        uint256 amount = 1000 * 10**6; // 1000 USDC

        vm.prank(user1);
        usdc.mint(amount);

        assertEq(usdc.balanceOf(user1), amount);
        assertEq(usdc.totalSupply(), amount);
    }

    function testMintTo() public {
        uint256 amount = 500 * 10**6; // 500 USDC

        vm.prank(user1);
        usdc.mintTo(user2, amount);

        assertEq(usdc.balanceOf(user2), amount);
        assertEq(usdc.balanceOf(user1), 0);
    }

    function testAnyoneCanMint() public {
        uint256 amount1 = 100 * 10**6; // 100 USDC
        uint256 amount2 = 200 * 10**6; // 200 USDC

        // User1 mints
        vm.prank(user1);
        usdc.mint(amount1);

        // User2 mints
        vm.prank(user2);
        usdc.mint(amount2);

        assertEq(usdc.balanceOf(user1), amount1);
        assertEq(usdc.balanceOf(user2), amount2);
        assertEq(usdc.totalSupply(), amount1 + amount2);
    }

    function testTransfer() public {
        uint256 mintAmount = 1000 * 10**6; // 1000 USDC
        uint256 transferAmount = 250 * 10**6; // 250 USDC

        // User1 mints
        vm.prank(user1);
        usdc.mint(mintAmount);

        // User1 transfers to user2
        vm.prank(user1);
        usdc.transfer(user2, transferAmount);

        assertEq(usdc.balanceOf(user1), mintAmount - transferAmount);
        assertEq(usdc.balanceOf(user2), transferAmount);
    }
}
