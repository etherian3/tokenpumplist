// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Token} from "./Token.sol";

contract Factory {
    uint256 public immutable fee;
    address public owner;

    uint256 public totalTokens;
    address[] public tokens;
    mapping (address => TokenSale) public tokenToSale;

    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    event Created(address indexed token);
    event Buy(address indexed token, uint256 amount);

    constructor(uint256 _fee) {
        fee = _fee;
        owner = msg.sender;
    }

    function getTokenSale(uint256 _index) public view returns(TokenSale memory) {
        return tokenToSale[tokens[_index]];
    }



    function create(
        string memory _name, 
        string memory _symbol 
        ) external payable {
        // Make sure that the fee is correct
        require(msg.value >= fee, "Not enough ether!");

        // Create a new token 
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);

        // Save the token for later use
        tokens.push(address(token));

        totalTokens++;

        // List the token for sale
        TokenSale memory sale = TokenSale(
            address(token),
            _name,
            msg.sender,
            0,
            0,
            true
        );

        tokenToSale[address(token)] = sale;

        // Tell people it's live
        emit Created(address(token));
    }

    function buy(address _token, uint256 _amount) external payable {
        TokenSale storage sale = tokenToSale[_token];
        // Check conditions

        // Update the sale
        sale.sold += _amount;

        // Make sure fund raising goal isn't met


        Token(_token).transfer(msg.sender, _amount);
        
        // Emit an event
        emit Buy(_token, _amount);
    }
}
