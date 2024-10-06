// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract PaymentManager {
    enum TransactionState {
        Initiated,
        PaymentApproved,
        PaymentDeclined,
        MerchantConfirmed,
        Shipped,
        Delivered,
        Failed,
        Cancelled,
        Completed
    }

    struct Transaction {
        address user;
        address merchant;
        uint256 amount;
        TransactionState state;
        bool isDisputed;
        string productId;
    }

    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;

    // Event declarations
    event TransactionInitiated(uint256 tCount, address indexed user, address indexed merchant, uint256 amount);
    event PaymentApproved(uint256 tCount);
    event PaymentDeclined(uint256 tCount);
    event ConfirmOrder(uint256 tCount);
    event ShippedOrder(uint256 tCount);
    event ConfirmDelivery(uint256 tCount);
    event CompleteTransaction(uint256 tCount, address indexed user, address indexed merchant, uint256 _amount);
    event TransactionCancelled(uint256 tCount);
    event DisputeOpened(uint256 tCount);

    // Function Modifiers
    modifier onlyUser(uint256 transactionId) {
        require(transactions[transactionId].user == msg.sender, "Only the user can perform this action.");
        _;
    }

    modifier onlyMerchant(uint256 transactionId) {
        require(transactions[transactionId].merchant == msg.sender, "Only the merchant can access this.");
        _;
    }

    // Initiate Payment function to send Ether to escrow to hold Ether
    function initiatePayment(address _merchant, string memory productId) external payable {
        require(msg.value > 0, "Amount must be greater than zero.");
        transactions[transactionCount] =
            Transaction(msg.sender, _merchant, msg.value, TransactionState.Initiated, false, productId);
        emit TransactionInitiated(transactionCount, msg.sender, _merchant, msg.value);
        transactionCount++;
    }

    // Merchant confirm payment
    function paymentApprove(uint256 _id) external onlyMerchant(_id) {
        require(transactions[_id].state == TransactionState.Initiated, "Payment already initiated.");
        transactions[_id].state = TransactionState.PaymentApproved;
        emit PaymentApproved(_id);
    }

    // Merchant decline payment
    function paymentDecline(uint256 id) external onlyMerchant(id) {
        require(transactions[id].state == TransactionState.Initiated, "Payment already initiated.");
        transactions[id].state = TransactionState.PaymentDeclined;
        (bool success,) = transactions[id].user.call{value: transactions[id].amount}("");
        require(success, "Refund failed");
        emit PaymentDeclined(id);
    }

    // Merchant confirm order
    function confirmOrder(uint256 id) external onlyMerchant(id) {
        require(transactions[id].state == TransactionState.PaymentApproved, "Payment not approved yet.");
        transactions[id].state = TransactionState.MerchantConfirmed;
        emit ConfirmOrder(id);
    }

    // Merchant shipped the order to user
    function shipOrder(uint256 id) external onlyMerchant(id) {
        require(
            transactions[id].state == TransactionState.MerchantConfirmed, "Merchant has not confirmed the order yet."
        );
        transactions[id].state = TransactionState.Shipped;
        emit ShippedOrder(id);
    }

    // If user receives order, then confirm that the order is delivered
    function confirmDelivery(uint256 id) external onlyUser(id) {
        require(transactions[id].state == TransactionState.Shipped, "Order has not been shipped yet.");
        transactions[id].state = TransactionState.Delivered;
        emit ConfirmDelivery(id);
    }

    // Complete Transaction (after delivery confirmation)
    function completeTransaction(uint256 id) external onlyMerchant(id) {
        require(transactions[id].state == TransactionState.Delivered, "Order not delivered yet.");
        transactions[id].state = TransactionState.Completed;
        payable(transactions[id].merchant).transfer(transactions[id].amount);
        emit CompleteTransaction(id, transactions[id].user, msg.sender, transactions[id].amount);
    }

    // Cancel transaction
    function cancelTransaction(uint256 id) external onlyUser(id) {
        require(transactions[id].state == TransactionState.Initiated, "Cannot cancel transaction at this stage.");
        transactions[id].state = TransactionState.Cancelled;
        (bool success,) = (transactions[id].user).call{value: transactions[id].amount}("");
        require(success, "failed call");
        emit TransactionCancelled(id);
    }

    // Open dispute
    function openDispute(uint256 id) external onlyUser(id) {
        require(transactions[id].state == TransactionState.Shipped, "Dispute can only be opened in shipped state.");
        transactions[id].isDisputed = true;
        emit DisputeOpened(id);
    }

    // Get product info
    function getProductInfo(uint256 transactionId) external view returns (string memory) {
        return transactions[transactionId].productId;
    }
}
