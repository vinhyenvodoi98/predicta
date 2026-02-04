// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title PredictionToken
 * @dev OpenZeppelin ERC20 token for YES/NO positions in prediction markets
 * Only the market contract can mint/burn tokens
 */
contract PredictionToken is ERC20 {
    address public immutable market;

    modifier onlyMarket() {
        require(msg.sender == market, "Only market can call");
        _;
    }

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        market = msg.sender;
    }

    /**
     * @dev Override decimals to match USDC (6 decimals instead of default 18)
     * This ensures 1:1 ratio between USDC locked and tokens minted
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mint tokens to an address (only callable by market)
     */
    function mint(address to, uint256 amount) external onlyMarket {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from an address (only callable by market)
     */
    function burn(address from, uint256 amount) external onlyMarket {
        _burn(from, amount);
    }
}
