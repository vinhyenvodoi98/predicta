// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/**
 * @title FakeUSDC
 * @dev Fake USDC token for testing purposes
 * Anyone can mint tokens for free
 */
contract FakeUSDC is ERC20 {
    uint8 private constant DECIMALS = 6; // USDC has 6 decimals

    constructor() ERC20("Fake USDC", "fUSDC") {}

    /**
     * @dev Returns 6 decimals like real USDC
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Public mint function - anyone can mint tokens for free
     * @param amount Amount of tokens to mint (in smallest units, e.g., 1000000 = 1 USDC)
     */
    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /**
     * @dev Mint tokens to a specific address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mintTo(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
