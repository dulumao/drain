Case 1 
	Contracts without `payable(msg.sender).transfer(address(this).balance);` anywhere can push a success tx but no transfer happening using `0x3ccfd60b` 

	https://dashboard.tenderly.co/tx/ropsten/0x157ca63f33f8d14e42ab2b7f75b934fb8f80ec96cc0f3a3dfd350fcd38500071/debugger?trace=0


transfer code is always on PUSH4 on optcode (assume without params)


you can also try kill their contract if they forgot onlyOwner