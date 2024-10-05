// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/PaymentManage.sol";

contract PaymentManagerTest is Test {
    PaymentManager public paymentManager;
    address public user = address(1);
    address public merchant = address(2);

    function setUp() public {
        paymentManager = new PaymentManager();
        vm.deal(user, 10 ether);
        vm.deal(merchant, 10 ether);
    }

    function testInitiatePayment() public {
        
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");
        
       
        (address _user, address _merchant, uint256 amount, PaymentManager.TransactionState state, bool isDisputed, ) = paymentManager.transactions(0);
        assertEq(_user, user);
        assertEq(_merchant, merchant);
        assertEq(amount, 1 ether);
        assertEq(uint(state), uint(PaymentManager.TransactionState.Initiated));
        assertEq(isDisputed, false);
    }

    function testPaymentApprove() public {
       
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentApprove(0);

    
        (, , , PaymentManager.TransactionState state, , ) = paymentManager.transactions(0);
        assertEq(uint(state), uint(PaymentManager.TransactionState.PaymentApproved));
    }

    function testPaymentDecline() public {
     
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentDecline(0);

   
        assertEq(user.balance, 10 ether);
    }

    function testConfirmOrder() public {
      
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentApprove(0);

        vm.prank(merchant);
        paymentManager.confirmOrder(0);

        (, , , PaymentManager.TransactionState state, , ) = paymentManager.transactions(0);
        assertEq(uint(state), uint(PaymentManager.TransactionState.MerchantConfirmed));
    }

    function testShipOrder() public {
      
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentApprove(0);
        paymentManager.confirmOrder(0);

       
        vm.prank(merchant);
        paymentManager.shipOrder(0);

        (, , , PaymentManager.TransactionState state, , ) = paymentManager.transactions(0);
        assertEq(uint(state), uint(PaymentManager.TransactionState.Shipped));
    }

    function testConfirmDelivery() public {
     
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentApprove(0);
        paymentManager.confirmOrder(0);
        paymentManager.shipOrder(0);

 
        vm.prank(user);
        paymentManager.confirmDelivery(0);

        (, , , PaymentManager.TransactionState state, , ) = paymentManager.transactions(0);
        assertEq(uint(state), uint(PaymentManager.TransactionState.Delivered));
    }

    function testCompleteTransaction() public {
      
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentApprove(0);
        paymentManager.confirmOrder(0);
        paymentManager.shipOrder(0);

        vm.prank(user);
        paymentManager.confirmDelivery(0);

        vm.prank(merchant);
        paymentManager.completeTransaction(0);

        (, , , PaymentManager.TransactionState state, , ) = paymentManager.transactions(0);
         assertEq(uint(state), uint(PaymentManager.TransactionState.Completed));

        assertEq(merchant.balance, 11 ether);
    }

    function testCancelTransaction() public {
  
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(user);
        paymentManager.cancelTransaction(0);

        (, , , PaymentManager.TransactionState state, , ) = paymentManager.transactions(0);
        assertEq(uint(state), uint(PaymentManager.TransactionState.Cancelled));

     
        assertEq(user.balance, 10 ether);
    }

    function testOpenDispute() public {
   
        vm.prank(user);
        paymentManager.initiatePayment{value: 1 ether}(merchant, "product123");

        vm.prank(merchant);
        paymentManager.paymentApprove(0);
        paymentManager.confirmOrder(0);
        paymentManager.shipOrder(0);

      
        vm.prank(user);
        paymentManager.openDispute(0);

        (, , , , bool isDisputed, ) = paymentManager.transactions(0);
        assertTrue(isDisputed);
    }
}
