// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface IERC20 {
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function allowance(address _owner, address _spender) external view returns (uint256);

    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
}

contract BadContract {

    constructor() {}
    receive() external payable {}
    fallback() external payable {}

    modifier onlyOwner {
        require(msg.sender == address(0x)); // your wallet here
        _;
    }

    function runawaywitherc20(address tokenAddress, uint amount) external onlyOwner {
        IERC20(tokenAddress).transfer(msg.sender, amount);
    }

	function iamgoingtojailforrobbery() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

}