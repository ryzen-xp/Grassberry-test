import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../src/page/Home";
import User from "../src/page/User";
import MerchantApp from "../src/page/Merchant";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user" element={<User />} />
        <Route path="/merchant" element={<MerchantApp />} />
      </Routes>
    </Router>
  );
}

export default App;
