// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IDMMRouter02.sol";
import "../interfaces/IDMMFactory.sol";

/// @author Matter Labs
/// @notice This smart contract pays the gas fees for accounts with balance of a specific ERC20 token. It makes use of the approval-based flow paymaster.
contract StableBankerPaymaster is IPaymaster, Ownable {
    IDMMRouter02 public dmmRouter;
    IDMMFactory public dmmFactory;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continue execution if called from the bootloader.
        _;
    }

    constructor(IDMMRouter02 _dmmRouter) {
        dmmRouter = _dmmRouter;
        dmmFactory = IDMMFactory(dmmRouter.factory());
    }

    function validateAndPayForPaymasterTransaction(
        bytes32,    
        bytes32,
        Transaction calldata _transaction
    )
        external
        payable
        onlyBootloader
        returns (bytes4 magic, bytes memory context)
    {
        // By default we consider the transaction as accepted.
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0:4]
        );
        if (paymasterInputSelector == IPaymasterFlow.approvalBased.selector) {
            // While the transaction data consists of address, uint256 and bytes data,
            // the data is not needed for this paymaster
            (address token, uint256 amount, bytes memory data) = abi.decode(
                _transaction.paymasterInput[4:],
                (address, uint256, bytes)
            );

            // We verify that the user has provided enough allowance
            address userAddress = address(uint160(_transaction.from));
            address thisAddress = address(this);

            uint256 requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;

            if (thisAddress.balance < requiredETH) {
                  IERC20 tokenIn = IERC20(token);

                  uint256 providedAllowance = IERC20(token).allowance(
                      userAddress,
                      thisAddress
                  );

                  require(
                      providedAllowance > amount,
                      "Min allowance too low"
                  );

                  tokenIn.transferFrom(userAddress, thisAddress,  amount);

                  address poolAddress = dmmFactory.getPools(tokenIn, dmmRouter.weth())[0];
                  address[] memory poolPath = new address[](1);
                  poolPath[0] = poolAddress;

                  IERC20[] memory path = new IERC20[](2);
                  path[0] = tokenIn;
                  path[1] = IERC20(dmmRouter.weth());
                  
                  dmmRouter.swapExactTokensForETH(
                      amount,
                      requiredETH, // should be obtained via a price oracle, either off or on-chain
                      poolPath, // eg. [usdc-wbtc-pool, wbtc-weth-pool]
                      path,
                      thisAddress, // has to be able to receive ETH
                      block.timestamp + 60 * 20
                  );
                }

            // The bootloader never returns any data, so it can safely be ignored here.
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
                value: requiredETH
            }("");
            require(
                success,
                "Failed to transfer tx fee to the bootloader. Paymaster balance might not be enough."
            );
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable override onlyBootloader {
        // Refunds are not supported yet.
    }

    function withdraw(address _to) external onlyOwner {
        // send paymaster funds to the owner
        (bool success, ) = payable(_to).call{value: address(this).balance}("");
        require(success, "Failed to withdraw funds from paymaster.");
    }

    receive() external payable {}    
}
