//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract StakingProxy is TransparentUpgradeableProxy {

    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) public {

    }

}
