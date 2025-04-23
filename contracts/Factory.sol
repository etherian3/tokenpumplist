// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Token} from "./Token.sol";

contract Factory {
    uint256 public immutable fee;
    address public owner;

    uint256 public totalTokens;
    address[] public tokens;

    constructor(uint256 _fee) {
        fee = _fee;
        owner = msg.sender;
    }

    function create(
        string memory _name, 
        string memory _symbol 
        ) external payable {
        // Create a new token 
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);

        // Save the token for later use
        tokens.push(address(token));

        totalTokens++;

        // List the token for sale
        // Tell people it's live
    }
}
