// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface IKSCallee {
    function ksSwapCall(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external;
}
