import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <h1>Welcome to Payment Manager</h1>
      <p>Select your role:</p>
      <button style={buttonStyle} onClick={() => navigate("/user")}>
        User
      </button>
      <button style={buttonStyle} onClick={() => navigate("/merchant")}>
        Merchant
      </button>
    </div>
  );
}

const containerStyle = {
  textAlign: "center",
  marginTop: "50px",
};

const buttonStyle = {
  margin: "10px",
  padding: "15px 30px",
  fontSize: "16px",
  cursor: "pointer",
};
