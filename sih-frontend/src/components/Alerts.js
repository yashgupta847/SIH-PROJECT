import { useEffect } from "react";
import { io } from "socket.io-client";

export default function Alerts() {
  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("alert", (data) => {
      alert(`🚨 SOS Alert: ${data.message}`);
      console.log(data.incident);
    });
    return () => socket.disconnect();
  }, []);

  return <h3>Listening for SOS Alerts...</h3>;
}
