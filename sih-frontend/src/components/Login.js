import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login({ setToken }) {  // <-- receive setToken from App.js
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data && res.data.token) {
        // Save token to localStorage
        localStorage.setItem("token", res.data.token);

        // Update App.js state so that Routes re-render
        if (setToken) setToken(res.data.token);

        alert(`Welcome ${res.data.name}!`);
        navigate("/dashboard"); // redirect to dashboard
      } else {
        alert("Login failed, please try again.");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Invalid Credentials");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2 style={{ marginBottom: "20px" }}>Login</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          style={{
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: "#4f46e5",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Login
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/register")}
          style={{
            background: "transparent",
            border: "none",
            color: "#4f46e5",
            fontWeight: "bold",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}
