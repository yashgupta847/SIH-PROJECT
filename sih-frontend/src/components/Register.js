import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      alert("Registered Successfully!");
      navigate("/dashboard"); // redirect to dashboard
    } catch (err) {
      console.error(err);
      alert("Error registering");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2 style={{ marginBottom: "20px" }}>Sign Up</h2>
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
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
          Register
        </button>
      </form>

      {/* Login Button */}
      <p style={{ marginTop: "20px" }}>
        Already have an account?{" "}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "#4f46e5",
            fontWeight: "bold",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          Login
        </button>
      </p>
    </div>
  );
}
