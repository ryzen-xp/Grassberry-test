import { useState, useMemo, useEffect } from "react";
import Web3 from "web3";
import PaymentManagerABI from "../PaymentManagerABI.json";

function MerchantApp() {
  const [transactionId, setTransactionId] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contractAddress = "0xEf10733B04f01D9376d7499F467814866C65444F";

  useEffect(() => {
    const initializeWeb3 = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          setWeb3(web3Instance);
          setAccount(accounts[0]);

          const contractInstance = new web3Instance.eth.Contract(
            PaymentManagerABI,
            contractAddress
          );
          setContract(contractInstance);

          await fetchTransactions(contractInstance);
        } catch (error) {
          console.error("Failed to connect wallet:", error);
        }
      } else {
        alert("Please install MetaMask to use this dApp!");
      }
    };

    initializeWeb3();
  }, []);

  const fetchTransactions = async (contractInstance) => {
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
      setError("Failed to fetch transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async () => {
    await handleTransaction("paymentApprove");
  };

  const declinePayment = async () => {
    await handleTransaction("paymentDecline");
  };

  const confirmOrder = async () => {
    await handleTransaction("confirmOrder");
  };

  const shipOrder = async () => {
    await handleTransaction("shipOrder");
  };

  const completeTransaction = async () => {
    await handleTransaction("completeTransaction");
  };

  const handleTransaction = async (method) => {
    if (!web3 || !contract) return;
    const accounts = await web3.eth.getAccounts();
    await contract.methods[method](transactionId).send({ from: accounts[0] });
  };

  const transactionDisplay = useMemo(() => {
    if (loading) return <p>Loading transactions...</p>;
    if (error) return <p>{error}</p>;
    if (transactions.length === 0) return <p>No transactions found</p>;

    return (
      <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Customer Address</th>
            <th>Product ID</th>
            <th>Amount (ETH)</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.user}</td>
              <td>{tx.productId}</td>
              <td>{web3.utils.fromWei(tx.amount, "ether")}</td>
              <td>{getStatusLabel(tx.state)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [transactions, loading, error, web3]);

  return (
    <div className="merchant">
      <h2>Merchant Interface</h2>
      {account ? (
        <div>
          <h3>Connected Account: {account}</h3>
        </div>
      ) : (
        <h3>Connecting to MetaMask...</h3>
      )}
      <div>
        <h3>Transaction Requests</h3>
        {transactionDisplay}
      </div>
      <div>
        <h3>Transaction ID</h3>
        <input
          type="text"
          placeholder="Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
      </div>
      <div>
        <button onClick={approvePayment}>Approve Payment</button>
        <button onClick={declinePayment}>Decline Payment</button>
        <button onClick={confirmOrder}>Confirm Order</button>
        <button onClick={shipOrder}>Ship Order</button>
        <button onClick={completeTransaction}>Complete Transaction</button>
      </div>
    </div>
  );
}

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

export default MerchantApp;
