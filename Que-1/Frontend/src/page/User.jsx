import { useState, useEffect } from "react";
import Web3 from "web3";
import PaymentManagerABI from "../PaymentManagerABI.json";
import "./User.css";

const User = () => {
  const [transactionId, setTransactionId] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const [transactionStatus, setTransactionStatus] = useState("");
  const contractAddress = "0xEf10733B04f01D9376d7499F467814866C65444F";

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            const contractInstance = new web3Instance.eth.Contract(
              PaymentManagerABI,
              contractAddress
            );
            setContract(contractInstance);
            await fetchUserTransactions(contractInstance);
          }
        } catch (error) {
          console.error("Error connecting to MetaMask: ", error);
        }
      } else {
        alert("Please install MetaMask to use this dApp!");
      }
    };
    checkMetaMaskConnection();
  }, []);

  const fetchUserTransactions = async (contractInstance) => {
    setLoading(true);
    try {
      const transactionCount = await contractInstance.methods
        .transactionCount()
        .call();

      const transactionPromises = [];
      for (let i = 0; i < transactionCount; i++) {
        transactionPromises.push(
          contractInstance.methods.transactions(i).call()
        );
      }

      const txList = await Promise.all(transactionPromises);
      setTransactions(txList.map((tx, index) => ({ id: index, ...tx })));
    } catch (err) {
      console.log("Failed to fetch transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!account) return alert("Please connect your wallet first.");
    if (!merchantAddress)
      return alert("Please provide a valid merchant address.");
    try {
      const accounts = await web3.eth.getAccounts();
      await contract.methods.initiatePayment(merchantAddress, productId).send({
        from: accounts[0],
        value: web3.utils.toWei(amount, "ether"),
      });
      await fetchUserTransactions(contract);
    } catch (error) {
      console.error("Failed to initiate payment: ", error);
    }
  };

  const getTransactionStatus = async () => {
    if (!transactionId) return alert("Please provide a transaction ID.");
    try {
      const tx = await contract.methods.transactions(transactionId).call();
      setTransactionStatus(tx.state);
    } catch (error) {
      console.error("Error fetching transaction status: ", error);
    }
  };

  const getStatusLabel = (state) => {
    const statusLabels = {
      0: "Initiated",
      1: "Payment Approved",
      2: "Payment Declined",
      3: "Merchant Confirmed",
      4: "Shipped",
      5: "Delivered",
      6: "Failed",
      7: "Cancelled",
      8: "Completed",
    };
    return statusLabels[state] || "Unknown State";
  };

  return (
    <div className="user-container">
      <h2>User Actions</h2>
      {isConnected ? (
        <div>
          <p>Connected Account: {account}</p>
        </div>
      ) : (
        <p>Please connect your wallet to use this dApp.</p>
      )}

      <div className="transaction-section">
        <h3>Your Transactions</h3>
        {transactions.length === 0 ? (
          <p>No transactions found</p>
        ) : (
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Merchant</th>
                <th>Amount (ETH)</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.merchant}</td>
                  <td>{web3.utils.fromWei(tx.amount, "ether")}</td>
                  <td>{getStatusLabel(tx.state)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="initiate-payment-section">
        <h3>Initiate Payment</h3>
        <input
          type="text"
          placeholder="Product ID"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Merchant Address"
          value={merchantAddress}
          onChange={(e) => setMerchantAddress(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Amount in ETH"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field"
        />
        <button className="initiate-button" onClick={initiatePayment}>
          Initiate Payment
        </button>
      </div>

      <div className="check-status-section">
        <h3>Check Transaction Status</h3>
        <input
          type="text"
          placeholder="Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="input-field"
        />
        <button className="check-status-button" onClick={getTransactionStatus}>
          Get Status
        </button>
        {transactionStatus && (
          <p>Status: {getStatusLabel(transactionStatus)}</p>
        )}
      </div>
    </div>
  );
};

export default User;
