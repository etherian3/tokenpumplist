// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Token} from "./Token.sol";

contract Factory {
    uint256 public immutable fee;
    address public owner;

    constructor(uint256 _fee) {
        fee = _fee;
        owner = msg.sender;
    }

    function create() {
        // Create a new token 
        // Save the token for later use
        // List the token for sale
        // Tell people it's live
    }
}
